import { Update, Ctx, Start, On, Hears } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuthService } from '../auth/service/auth.service';
import { NotificationService } from '../notification/notification.service';
import { UserLocationService } from '../location/location.service';
import { RoomService } from '../room/room.service';
import { translations, Language } from './bot.i18n';

// Extend Context to include our session/user data types if needed
interface BotContext extends Context {
  session: {
    waitingForPin?: boolean;
  };
}

@Update()
@Injectable()
export class BotUpdate {
  private readonly logger = new Logger(BotUpdate.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly notificationService: NotificationService,
    private readonly locationService: UserLocationService,
    private readonly roomService: RoomService,
  ) {}

  // -------------------------------------------------------
  // START & LANGUAGE SELECTION
  // -------------------------------------------------------

  @Start()
  async onStart(@Ctx() ctx: BotContext) {
    const telegramId = ctx.from.id.toString();
    const user = await this.prisma.user.findUnique({ where: { telegramId } });

    if (user) {
      // User exists, show main menu in their language
      const lang = (user.language as Language) || 'en';
      await ctx.reply(translations[lang].menu_main, this.getMainKeyboard(lang));
    } else {
      // New user, ask for language first
      // Detect from Telegram client if possible, else English
      const clientLang = ctx.from.language_code; // e.g. 'ru', 'en', 'kk'
      let defaultLang: Language = 'en';
      if (clientLang === 'ru') defaultLang = 'ru';
      if (clientLang === 'kk' || clientLang === 'kz') defaultLang = 'kz';

      await ctx.reply(
        translations[defaultLang].select_lang,
        Markup.keyboard([['🇬🇧 English', '🇷🇺 Русский', '🇰🇿 Қазақша']])
          .oneTime()
          .resize(),
      );
    }
  }

  @Hears(['🇬🇧 English', '🇷🇺 Русский', '🇰🇿 Қазақша'])
  async onLanguageSelect(@Ctx() ctx: BotContext) {
    const text = (ctx.message as any).text;
    let lang: Language = 'en';
    if (text.includes('Русский')) lang = 'ru';
    if (text.includes('Қазақша')) lang = 'kz';

    // Save language temporarily or prompt for phone immediately
    await ctx.reply(
      translations[lang].auth_required,
      Markup.keyboard([
        Markup.button.contactRequest(translations[lang].share_phone),
      ])
        .oneTime()
        .resize(),
    );
    
    // We can't save to DB yet because we don't have a User record, 
    // but we can pass the language in the "contact" handler logic conceptually,
    // or better, we just infer it from the text flow. 
    // *Hack:* For statelessness, we will rely on the phone handler to check previous message or just re-ask/default.
    // Actually, let's create a temporary session or just upsert the user with just telegramID and language first?
    // Let's strictly wait for phone number to create the user to ensure we link phone + telegramId.
    // For now, we assume the user presses the contact button next.
    (ctx as any).session = { tempLang: lang }; 
  }

  // -------------------------------------------------------
  // AUTHENTICATION (Phone Contact)
  // -------------------------------------------------------

  @On('contact')
  async onContact(@Ctx() ctx: BotContext) {
    const contact = (ctx.message as any).contact;
    const telegramId = ctx.from.id.toString();
    const phone = contact.phone_number.startsWith('+')
      ? contact.phone_number
      : `+${contact.phone_number}`;
    
    // Retrieve selected language from session or default
    const lang = ((ctx as any).session?.tempLang as Language) || 'en';

    // Upsert User: Link Telegram ID to Phone
    // If user with phone exists, update telegramId. If not, create.
    let user = await this.prisma.user.findUnique({ where: { phone } });

    if (user) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { telegramId, language: lang },
      });
    } else {
      // Auto-register
      user = await this.prisma.user.create({
        data: {
          username: `tg_${telegramId}`,
          phone: phone,
          telegramId: telegramId,
          language: lang,
          displayName: contact.first_name,
        },
      });
    }

    await ctx.reply(
      `${translations[lang].registered} ${user.displayName}!`,
      this.getMainKeyboard(lang),
    );
  }

  // -------------------------------------------------------
  // MENU HANDLERS
  // -------------------------------------------------------

  @Hears(['🚨 SOS', '🚨 SOS', '🚨 SOS']) // Matches all langs if text is same, but they differ in const
  async onSos(@Ctx() ctx: BotContext) {
    const user = await this.getUser(ctx);
    if (!user) return;

    const lang = (user.language as Language) || 'en';
    
    try {
      await this.notificationService.sendSosSignal(user.id);
      await ctx.reply(translations[lang].sos_sent);
    } catch (e) {
      await ctx.reply(translations[lang].error + ` (${e.message})`);
    }
  }

  @Hears(['🏠 My Room', '🏠 Моя комната', '🏠 Менің бөлмем'])
  async onMyRoom(@Ctx() ctx: BotContext) {
    const user = await this.getUser(ctx);
    if (!user) return;
    const lang = (user.language as Language) || 'en';

    const room = await this.roomService.getMyRoom(user.id);
    if (!room) {
      return ctx.reply(translations[lang].not_in_room);
    }
    
    await ctx.reply(`🏠 Room: ${room.name}\n📌 PIN: ${room.pin}\n👥 Members: ${room.members.length}`);
  }

  @Hears(['🚪 Leave Room', '🚪 Выйти из комнаты', '🚪 Бөлмеден шығу'])
  async onLeaveRoom(@Ctx() ctx: BotContext) {
    const user = await this.getUser(ctx);
    if (!user) return;
    const lang = (user.language as Language) || 'en';

    try {
      await this.roomService.leaveRoom(user.id);
      await ctx.reply(translations[lang].room_left);
    } catch (e) {
      await ctx.reply(translations[lang].not_in_room);
    }
  }

  // -------------------------------------------------------
  // LOCATION HANDLER
  // -------------------------------------------------------

  @On('location')
  async onLocation(@Ctx() ctx: BotContext) {
    const user = await this.getUser(ctx);
    if (!user) return;
    const lang = (user.language as Language) || 'en';

    const loc = (ctx.message as any).location;

    await this.locationService.create(user.id, {
      latitude: loc.latitude,
      longitude: loc.longitude,
      accuracy: loc.horizontal_accuracy,
    });

    await ctx.reply(translations[lang].location_updated);
  }

  // -------------------------------------------------------
  // JOIN ROOM FLOW
  // -------------------------------------------------------

  @Hears(['🔑 Join Room (PIN)', '🔑 Войти по PIN', '🔑 PIN арқылы кіру'])
  async onJoinRequest(@Ctx() ctx: BotContext) {
    const user = await this.getUser(ctx);
    if (!user) return;
    const lang = (user.language as Language) || 'en';

    // Set state to waiting for PIN
    (ctx as any).session = { waitingForPin: true };
    await ctx.reply(translations[lang].enter_pin);
  }

  @On('text')
  async onText(@Ctx() ctx: BotContext) {
    const user = await this.getUser(ctx);
    if (!user) return; // Should be caught by start
    const lang = (user.language as Language) || 'en';

    if ((ctx as any).session?.waitingForPin) {
      const pin = (ctx.message as any).text.trim();
      try {
        await this.roomService.joinRoomByPin(user.id, { pin });
        await ctx.reply(translations[lang].room_joined + ` ${pin}`);
        (ctx as any).session = { waitingForPin: false };
      } catch (e) {
        await ctx.reply(e.message || translations[lang].error);
      }
      return;
    }

    // If text doesn't match any command
    // Check if it is a language selection update (optional)
  }

  // -------------------------------------------------------
  // HELPERS
  // -------------------------------------------------------

  private getMainKeyboard(lang: Language) {
    const t = translations[lang];
    return Markup.keyboard([
      [t.btn_sos],
      [t.btn_loc],
      [t.btn_my_room, t.btn_join],
      [t.btn_leave]
    ]).resize();
  }

  private async getUser(ctx: Context) {
    const telegramId = ctx.from.id.toString();
    return this.prisma.user.findUnique({ where: { telegramId } });
  }
}
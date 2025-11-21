import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Telegraf, Markup, session } from 'telegraf';
import { PrismaService } from '../../database/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { UserLocationService } from '../location/location.service';
import { RoomService } from '../room/room.service';
import { translations, resolveUILang, Language } from './bot.i18n';
import { BotContext } from './bot.types';

@Injectable()
export class BotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BotService.name);
  private readonly bot: Telegraf<BotContext>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly locationService: UserLocationService,
    private readonly roomService: RoomService,
  ) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set');

    this.bot = new Telegraf<BotContext>(token);
    
    // Initialize session
    this.bot.use(session({ defaultSession: () => ({}) }));
    
    // Middleware to ensure DB user exists for non-auth actions
    this.bot.use(async (ctx, next) => {
      // Skip middleware for start/contact/language handlers
      if (ctx.message && 'text' in ctx.message) {
        const text = ctx.message.text;
        if (text === '/start' || text.includes('English') || text.includes('Русский') || text.includes('Қазақша')) {
          return next();
        }
      }
      if (ctx.message && 'contact' in ctx.message) return next();

      // For other actions, verify user exists
      const tgId = ctx.from?.id.toString();
      if (tgId) {
        const user = await this.prisma.user.findUnique({ where: { telegramId: tgId } });
        if (user) {
          // Inject user language into session for this request context if needed
          // Or just rely on DB language
          ctx.session.tempLang = (user.language as Language) || 'en';
        }
      }
      return next();
    });

    this.registerHandlers();
  }

  onModuleInit() {
    this.bot.launch();
    this.logger.log('Telegram Bot started');
  }

  onModuleDestroy() {
    this.bot.stop('SIGINT');
  }

  // -------------------------------------------------------
  // HANDLERS REGISTRATION
  // -------------------------------------------------------
  private registerHandlers() {
    
    // --- START ---
    this.bot.start(async (ctx) => {
      const tgId = ctx.from.id.toString();
      let user = await this.prisma.user.findUnique({ where: { telegramId: tgId } });

      if (user) {
        // User exists -> Show Menu
        const lang = (user.language as Language) || 'en';
        const T = translations[lang];
        await ctx.reply(T.welcome(user.displayName || user.username), this.getMainKeyboard(lang));
      } else {
        // New User -> Register partial user or ask lang
        const lang = resolveUILang(ctx);
        const T = translations[lang];
        
        await ctx.reply(
          T.select_lang,
          Markup.keyboard([['🇬🇧 English', '🇷🇺 Русский', '🇰🇿 Қазақша']])
            .oneTime()
            .resize(),
        );
      }
    });

    // --- LANGUAGE SELECTION ---
    this.bot.hears(['🇬🇧 English', '🇷🇺 Русский', '🇰🇿 Қазақша'], async (ctx) => {
      const text = ctx.message.text;
      let lang: Language = 'en';
      if (text.includes('Русский')) lang = 'ru';
      if (text.includes('Қазақша')) lang = 'kz';

      ctx.session.tempLang = lang;
      const T = translations[lang];

      // Ask for Phone
      await ctx.reply(
        T.auth_required,
        Markup.keyboard([
          Markup.button.contactRequest(T.share_phone),
        ])
          .oneTime()
          .resize(),
      );
      ctx.session.step = 'waiting_for_phone';
    });

    // --- CONTACT (AUTH) ---
    this.bot.on('contact', async (ctx) => {
      const contact = ctx.message.contact;
      const tgId = ctx.from.id.toString();
      const phone = contact.phone_number.startsWith('+')
        ? contact.phone_number
        : `+${contact.phone_number}`;
      
      const lang = resolveUILang(ctx);
      const T = translations[lang];

      // Upsert Logic
      // 1. Find by phone
      let user = await this.prisma.user.findUnique({ where: { phone } });

      if (user) {
        // Update existing user with Telegram ID
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { telegramId: tgId, language: lang },
        });
      } else {
        // Create new user
        // Check if tgId is taken (edge case: re-registering with diff phone?)
        const existingTg = await this.prisma.user.findUnique({ where: { telegramId: tgId } });
        if (existingTg) {
            // Maybe update phone? For now, we assume strict 1-to-1. 
            // We'll just update the existing TG user.
            user = await this.prisma.user.update({
                where: { id: existingTg.id },
                data: { phone, language: lang }
            });
        } else {
            user = await this.prisma.user.create({
                data: {
                  username: `tg_${tgId}`,
                  phone: phone,
                  telegramId: tgId,
                  language: lang,
                  displayName: contact.first_name,
                },
            });
        }
      }

      await ctx.reply(T.registered, this.getMainKeyboard(lang));
      ctx.session.step = undefined;
    });

    // --- SOS ---
    this.bot.hears(['🚨 SOS', 'SOS'], async (ctx) => {
      const user = await this.getUser(ctx);
      if (!user) return;
      const lang = resolveUILang(ctx);
      const T = translations[lang];

      try {
        await this.notificationService.sendSosSignal(user.id);
        await ctx.reply(T.sos_sent);
      } catch (e) {
        await ctx.reply(`${T.error} (${e.message})`);
      }
    });

    // --- MY ROOM ---
    this.bot.hears(['🏠 My Room', '🏠 Моя комната', '🏠 Менің бөлмем'], async (ctx) => {
      const user = await this.getUser(ctx);
      if (!user) return;
      const lang = resolveUILang(ctx);
      const T = translations[lang];

const room = await this.roomService.getMyRoom(user.id);
if (!room) return ctx.reply(T.not_in_room);

// Format Date
const createdAt = new Date(room.createdAt).toLocaleDateString();

// Format Host Name (safely fallback if null)
const hostName = room.createdBy?.displayName || room.createdBy?.username || 'Unknown';

// Format Member List (Limit to 10 names)
const membersList = room.members
  .slice(0, 10)
  .map((m) => `• ${m.user.displayName || m.user.username}`)
  .join('\n');

const moreCount = room.members.length > 10 ? `\n...and ${room.members.length - 10} more` : '';

// Construct Message
const message = `
🏠 *${room.name}*
📌 PIN: \`${room.pin}\`
📝 *Desc:* ${room.description || 'N/A'}
👑 *Host:* ${hostName}
📅 *Created:* ${createdAt}

👥 *Members (${room.members.length}):*
${membersList}${moreCount}
`.trim();

await ctx.reply(message, { parse_mode: 'Markdown' });
    });

    // --- LEAVE ROOM ---
    this.bot.hears(['🚪 Leave Room', '🚪 Выйти', '🚪 Шығу'], async (ctx) => {
        const user = await this.getUser(ctx);
        if (!user) return;
        const lang = resolveUILang(ctx);
        const T = translations[lang];

        try {
            await this.roomService.leaveRoom(user.id);
            await ctx.reply(T.room_left, this.getMainKeyboard(lang));
        } catch (e) {
            await ctx.reply(T.not_in_room);
        }
    });

    // --- LOCATION ---
    this.bot.on('location', async (ctx) => {
        const user = await this.getUser(ctx);
        if (!user) return;
        const lang = resolveUILang(ctx);
        const T = translations[lang];

        const { latitude, longitude, horizontal_accuracy } = ctx.message.location;
        
        await this.locationService.create(user.id, {
            latitude,
            longitude,
            accuracy: horizontal_accuracy
        });

        await ctx.reply(T.location_updated);
    });

    // --- JOIN ROOM (Request) ---
    this.bot.hears(['🔑 Join Room', '🔑 Войти в комнату', '🔑 Бөлмеге кіру'], async (ctx) => {
        const lang = resolveUILang(ctx);
        const T = translations[lang];
        ctx.session.step = 'waiting_for_pin';
        await ctx.reply(T.enter_pin, Markup.removeKeyboard());
    });

    // --- TEXT HANDLER (Dynamic flows) ---
    this.bot.on('text', async (ctx) => {
        const user = await this.getUser(ctx);
        if (!user) return; 
        const lang = resolveUILang(ctx);
        const T = translations[lang];
        const text = ctx.message.text.trim();

        if (ctx.session.step === 'waiting_for_pin') {
            try {
                await this.roomService.joinRoomByPin(user.id, { pin: text });
                await ctx.reply(`${T.room_joined} ${text}`, this.getMainKeyboard(lang));
            } catch (e) {
                await ctx.reply(e.message || T.error, this.getMainKeyboard(lang));
            }
            ctx.session.step = undefined;
            return;
        }
    });
  }

  // -------------------------------------------------------
  // HELPERS
  // -------------------------------------------------------
  
  private getMainKeyboard(lang: Language) {
    const T = translations[lang];
    return Markup.keyboard([
      [T.btn_sos],
      [Markup.button.locationRequest(T.btn_loc)], // Native Location Button
      [T.btn_my_room, T.btn_join],
      [T.btn_leave]
    ]).resize();
  }

  private async getUser(ctx: BotContext) {
    const tgId = ctx.from?.id.toString();
    if (!tgId) return null;
    return this.prisma.user.findUnique({ where: { telegramId: tgId } });
  }
}
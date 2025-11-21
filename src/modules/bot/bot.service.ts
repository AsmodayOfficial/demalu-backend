import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Telegraf, Markup, session, Context } from 'telegraf';
import * as bcrypt from 'bcryptjs';
import { BotContext } from './bot.types';
import { PrismaService } from 'src/database/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { UserLocationService } from '../location/location.service';
import { RoomService } from '../room/room.service';
import { Language, resolveUILang, translations } from './bot.i18n';
// Confirmed correct relative path based on file names:
import { WeatherProposalService } from '../proposal/gemini.service';

@Injectable()
export class BotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BotService.name);
  private readonly bot: Telegraf<BotContext>; 

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly locationService: UserLocationService,
    private readonly roomService: RoomService,
    // 1. INJECT WeatherProposalService
    private readonly weatherProposalService: WeatherProposalService,
  ) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set');

    // FIX: Instantiation moved to the constructor body
    this.bot = new Telegraf<BotContext>(token);
    
    // Initialize session
    this.bot.use(session({ defaultSession: () => ({}) }));
    
    // Middleware to ensure DB user exists for non-auth actions
    this.bot.use(async (ctx, next) => {
      // Skip middleware for start/contact/language handlers
      if (ctx.message && 'text' in ctx.message) {
        const text = ctx.message.text;
        const isAuthFlow = text === '/start' || ['🇬🇧 English', '🇷🇺 Русский', '🇰🇿 Қазақша'].includes(text);
        if (isAuthFlow) {
          return next();
        }
      }
      if (ctx.message && 'contact' in ctx.message) return next();

      // For other actions, verify user exists
      const tgId = ctx.from?.id.toString();
      if (tgId) {
        const user = await this.prisma.user.findUnique({ where: { telegramId: tgId } });
        if (user) {
          ctx.session.tempLang = (user.language as Language) || 'en';
        } else if (!ctx.session.step) {
           // User not found and not in a flow, prompt restart
           const T = translations[resolveUILang(ctx)];
           await ctx.reply(T.user_not_found);
           return;
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
  // HELPERS
  // -------------------------------------------------------
  
  private getMainKeyboard(lang: Language) {
    const T = translations[lang];
    // 2. ADD Budget Variants button
    // T.btn_budget is now guaranteed to exist
    return Markup.keyboard([
      [T.btn_sos, T.btn_budget],
      [Markup.button.locationRequest(T.btn_loc)], // Native Location Button
      [T.btn_my_room, T.btn_join],
      [T.btn_leave]
    ]).resize();
  }

  private async getUser(ctx: BotContext) {
    const tgId = ctx.from?.id.toString();
    if (!tgId) return null;
    
    const user = await this.prisma.user.findUnique({ where: { telegramId: tgId } });
    if (!user) {
        const T = translations[resolveUILang(ctx)];
        await ctx.reply(T.user_not_found);
    }
    return user;
  }
  
  // Helper function to handle password hashing
  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
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
      
      // Determine desired username: TG username or phone
      const telegramUsername = ctx.from.username;
      // Prioritize TG username, fall back to phone number
      const desiredUsername = telegramUsername || phone; 

      // Upsert Logic (Partial: no password hash yet)
      // 1. Find by phone
      let user = await this.prisma.user.findUnique({ where: { phone } });

      if (user) {
        // Update existing user with Telegram ID, language, and username
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { 
            telegramId: tgId, 
            language: lang,
            username: desiredUsername, 
            displayName: user.displayName || contact.first_name,
          },
        });
      } else {
        // Create new user or update existing TG user
        const existingTg = await this.prisma.user.findUnique({ where: { telegramId: tgId } });
        if (existingTg) {
            user = await this.prisma.user.update({
                where: { id: existingTg.id },
                data: { phone, language: lang, username: desiredUsername }
            });
        } else {
            user = await this.prisma.user.create({
                data: {
                  username: desiredUsername,
                  phone: phone,
                  telegramId: tgId,
                  language: lang,
                  displayName: contact.first_name,
                },
            });
        }
      }

      // Transition to password step
      await ctx.reply(T.enter_password, Markup.removeKeyboard());
      ctx.session.step = 'waiting_for_password';
    });

    // --- SOS ---
    this.bot.hears(translations.en.btn_sos, async (ctx) => {
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
    this.bot.hears(translations.en.btn_my_room, async (ctx) => {
      const user = await this.getUser(ctx);
      if (!user) return;
      const lang = resolveUILang(ctx);
      const T = translations[lang];

      // Note: Assumes getMyRoom returns room including { createdBy: true, members: { include: { user: true } } }
      const room = await this.roomService.getMyRoom(user.id);
      if (!room) return ctx.reply(T.not_in_room);

      // Format Date
      const createdAt = new Date(room.createdAt).toLocaleDateString();

      // Format Host Name (Using 'createdBy' as per the user's snippet)
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
    this.bot.hears(translations.en.btn_leave, async (ctx) => {
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
const joinKeys = [
    translations.en.btn_join,
    translations.ru.btn_join,
    translations.kz.btn_join,
];

// Use the array of keys in the handler registration
this.bot.hears(joinKeys, async (ctx) => {
    // Check if the user is authenticated first (good practice)
    const user = await this.getUser(ctx);
    if (!user) return; 
    
    const lang = resolveUILang(ctx);
    const T = translations[lang];    
    ctx.session.step = 'waiting_for_pin';
    // Use the resolved/translated text T.enter_pin
    await ctx.reply(T.enter_pin, Markup.removeKeyboard());
});
    // --- START BUDGET FLOW ---
    // FIX: Match on ALL language keys to ensure the handler is triggered regardless of user language.
    const budgetKeys = [
        translations.en.btn_budget,
        translations.ru.btn_budget,
        translations.kz.btn_budget,
    ];

    this.bot.hears(budgetKeys, async (ctx) => {
        const user = await this.getUser(ctx);
        if (!user) return;
        const lang = resolveUILang(ctx);
        const T = translations[lang];

        ctx.session.step = 'waiting_for_budget';
        ctx.session.budgetData = {}; // Initialize data storage
        // Use the translated key
        await ctx.reply(T.enter_budget, Markup.removeKeyboard());
    });


    // --- TEXT HANDLER (Dynamic flows) ---
    this.bot.on('text', async (ctx) => {
        const lang = resolveUILang(ctx);
        const T = translations[lang];
        const text = ctx.message.text.trim();
        
        // --- 1. Handle Password Input ---
        if (ctx.session.step === 'waiting_for_password') {
            const password = text;

            if (password.length < 6) {
                return ctx.reply('Password must be at least 6 characters long. Please try again.');
            }

            const tgId = ctx.from?.id.toString();
            if (!tgId) return;

            const currentUser = await this.prisma.user.findUnique({ where: { telegramId: tgId } });

            if (currentUser) {
                const passwordHash = await this.hashPassword(password);
                
                await this.prisma.user.update({
                    where: { id: currentUser.id },
                    data: { 
                        passwordHash: passwordHash,
                        // Clear phone number if it was temporarily used as the username
                        username: currentUser.username.startsWith('+') && tgId ? ctx.from.username || currentUser.username : currentUser.username
                    },
                });
                
                await ctx.reply(T.registered, this.getMainKeyboard(lang));
                ctx.session.step = undefined;
                return;
            } else {
                this.logger.error(`User not found by TG ID during password step: ${tgId}`);
                await ctx.reply(T.user_not_found);
                ctx.session.step = undefined;
                return;
            }
        }
        
        // --- Remaining handlers require authenticated user ---
        const user = await this.getUser(ctx);
        if (!user) return; 

        // --- 2. Handle PIN Input ---
        // --- 2. Handle PIN Input ---
if (ctx.session.step === 'waiting_for_pin') {
    // TEMPORARY DEBUGGING BLOCK:
    const result = await this.roomService.joinRoomByPin(user.id, { pin: text })
        .then(() => 'Success')
        .catch(err => {
            // If this logs, the service is correctly throwing a promise rejection.
            console.error('Service threw error:', err.message); 
            return { error: err.message };
        });

    if (result === 'Success') {
        // Your success logic here
        await ctx.reply(`${T.room_joined} ${text}`, this.getMainKeyboard(lang));
        ctx.session.step = undefined; 
    } else {
        // Your error logic here
        await ctx.reply(T.enter_pin);
    }
    return;
}

        // --- 3. Handle Budget Flow Steps ---
        if (ctx.session.step === 'waiting_for_budget') {
            ctx.session.budgetData.budget = text;
            ctx.session.step = 'waiting_for_city';
            // Use translated key
            await ctx.reply(T.enter_city);
            return;
        }

        if (ctx.session.step === 'waiting_for_city') {
            ctx.session.budgetData.city = text;
            ctx.session.step = 'waiting_for_action_type';
            // Use translated key
            await ctx.reply(T.enter_action_type);
            return;
        }

        if (ctx.session.step === 'waiting_for_action_type') {
            ctx.session.budgetData.actionType = text;
            ctx.session.step = undefined; // End flow
            
            const { budget, city, actionType } = ctx.session.budgetData;

            // Notify user while processing
            // Use translated key
            const processingMessage = await ctx.reply(T.processing);

            try {
                const result = await this.weatherProposalService.getBudgetVariants(
                    budget,
                    city,
                    actionType
                );
                
                const variantsList = result.variants.map((v, i) => `${i + 1}. ${v}`).join('\n');
                
                // Use translated keys (fallbacks removed as keys are guaranteed)
                const message = `
*${T.budget_result_title}*

${T.budget_summary}
${result.summary}

${T.budget_variants}
${variantsList}

${T.budget_maps} [Google Maps Link](${result.mapsLink})
                `.trim();

                // FIX: Instead of trying to pass ReplyKeyboardMarkup to editMessageText, 
                // we edit the message text, and then send a separate message with the keyboard.
                
                // 1. Edit the loading message to the final result text
                await ctx.telegram.editMessageText(
                    processingMessage.chat.id, 
                    processingMessage.message_id, 
                    undefined, 
                    message, 
                    { 
                        parse_mode: 'Markdown',
                        // IMPORTANT: DO NOT include reply_markup here
                    }
                );
                
                // 2. Send a new message to display the main keyboard again
                await ctx.reply(T.menu_main, this.getMainKeyboard(lang));

            } catch (error) {
                this.logger.error('Error in getBudgetVariants flow:', error.stack);
                
                // FIX: Edit the message to show the error, and send a separate message with the keyboard.
                
                // 1. Edit the loading message to the error text
                 await ctx.telegram.editMessageText(
                    processingMessage.chat.id, 
                    processingMessage.message_id, 
                    undefined, 
                    T.budget_error, // Use translated error key
                );
                
                // 2. Send a new message to display the main keyboard again
                await ctx.reply(T.menu_main, this.getMainKeyboard(lang));
            }
            
            ctx.session.budgetData = {}; // Clear temporary data
            return;
        }
    });
  }
}
import { Context } from 'telegraf';
import { Language } from './bot.i18n';

export interface BotSession {
  step?: 'waiting_for_phone' | 'waiting_for_pin';
  tempLang?: Language;
}

export interface BotContext extends Context {
  session: BotSession;
}
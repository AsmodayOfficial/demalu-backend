import { Context } from 'telegraf';
import { Language } from './bot.i18n';

/**
 * Defines the structure of the session object used by the bot.
 */
export interface BotSession {
  // Current step in a multi-step conversation flow
  step?: 'waiting_for_phone' | 'waiting_for_pin' | 'waiting_for_password' | 'waiting_for_budget' | 'waiting_for_city' | 'waiting_for_action_type';
  // Temporary storage for language selection during registration
  tempLang?: Language;
  // Temporary storage for budget flow inputs
  budgetData?: {
    budget?: string;
    city?: string;
    actionType?: string;
  }
}

/**
 * Extends the base Telegraf Context to include the typed session object.
 */
export interface BotContext extends Context {
  session: BotSession;
}
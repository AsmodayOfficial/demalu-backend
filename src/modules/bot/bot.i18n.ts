import { BotContext } from './bot.types';

export type Language = 'en' | 'ru' | 'kz';

export const translations = {
  en: {
    welcome: (name: string) => `Welcome, ${name}! 🌍`,
    select_lang: 'Please select your language:',
    share_phone: '📱 Share Phone Number',
    auth_required: 'Please share your phone number to complete registration.',
    registered: 'Registration complete!',
    menu_main: 'Main Menu',
    btn_sos: '🚨 SOS',
    btn_my_room: '🏠 My Room',
    btn_join: '🔑 Join Room',
    btn_leave: '🚪 Leave Room',
    btn_loc: '📍 Share Location',
    sos_sent: 'SOS Signal sent to room members! 🚑',
    not_in_room: 'You are not in a room.',
    location_updated: 'Location updated successfully.',
    enter_pin: 'Please enter the 6-digit Room PIN:',
    room_joined: 'Successfully joined room:',
    room_left: 'You have left the room.',
    error: 'An error occurred.',
    user_not_found: 'User not found. Please /start to register.',
  },
  ru: {
    welcome: (name: string) => `Добро пожаловать, ${name}! 🌍`,
    select_lang: 'Пожалуйста, выберите язык:',
    share_phone: '📱 Отправить номер',
    auth_required: 'Пожалуйста, отправьте номер телефона для завершения регистрации.',
    registered: 'Регистрация завершена!',
    menu_main: 'Главное меню',
    btn_sos: '🚨 SOS',
    btn_my_room: '🏠 Моя комната',
    btn_join: '🔑 Войти в комнату',
    btn_leave: '🚪 Выйти',
    btn_loc: '📍 Геолокация',
    sos_sent: 'Сигнал SOS отправлен! 🚑',
    not_in_room: 'Вы не состоите в комнате.',
    location_updated: 'Геолокация обновлена.',
    enter_pin: 'Введите 6-значный PIN комнаты:',
    room_joined: 'Вы успешно вошли в комнату:',
    room_left: 'Вы покинули комнату.',
    error: 'Произошла ошибка.',
    user_not_found: 'Пользователь не найден. Нажмите /start.',
  },
  kz: {
    welcome: (name: string) => `Қош келдіңіз, ${name}! 🌍`,
    select_lang: 'Тілді таңдаңыз:',
    share_phone: '📱 Нөмірмен бөлісу',
    auth_required: 'Тіркелуді аяқтау үшін нөміріңізбен бөлісіңіз.',
    registered: 'Тіркелу аяқталды!',
    menu_main: 'Басты мәзір',
    btn_sos: '🚨 SOS',
    btn_my_room: '🏠 Менің бөлмем',
    btn_join: '🔑 Бөлмеге кіру',
    btn_leave: '🚪 Шығу',
    btn_loc: '📍 Орналасқан жер',
    sos_sent: 'SOS сигналы жіберілді! 🚑',
    not_in_room: 'Сіз бөлмеде емессіз.',
    location_updated: 'Жаңартылды.',
    enter_pin: '6 таңбалы PIN кодты енгізіңіз:',
    room_joined: 'Бөлмеге қосылдыңыз:',
    room_left: 'Сіз бөлмеден шықтыңыз.',
    error: 'Қате орын алды.',
    user_not_found: 'Пайдаланушы табылмады. /start басыңыз.',
  },
};

export function resolveUILang(ctx: BotContext): Language {
  // 1. Check session temp lang (during auth flow)
  if (ctx.session?.tempLang) return ctx.session.tempLang;
  
  // 2. Check telegram client language
  const lc = ctx.from?.language_code?.toLowerCase();
  if (lc === 'ru') return 'ru';
  if (lc === 'kk' || lc === 'kz') return 'kz';
  
  // 3. Default
  return 'en';
}
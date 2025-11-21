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
    enter_password: 'Please enter password:',
    room_joined: 'Successfully joined room:',
    room_left: 'You have left the room.',
    error: 'An error occurred.',
    user_not_found: 'User not found. Please /start to register.',
    // --- New Budget Keys (EN) ---
    btn_budget: '💰 Budget Variants',
    enter_budget: 'Please enter your approximate budget (e.g., 5000 KZT or 100 USD):',
    enter_city: 'Thank you! Now, which city are you planning this activity in?',
    enter_action_type: 'Great! What type of activity are you looking for? (e.g., "restaurant", "museum", "active rest"):',
    processing: 'Processing your request, please wait...',
    budget_result_title: '✅ Budget Variants Found',
    budget_summary: 'Summary:',
    budget_variants: 'Suggestions:',
    budget_maps: 'Find on Map:',
    budget_error: 'Sorry, I couldn\'t get budget variants right now. Please try again.',
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
    enter_password: 'Создайте пароль',
    room_joined: 'Вы успешно вошли в комнату:',
    room_left: 'Вы покинули комнату.',
    error: 'Произошла ошибка.',
    user_not_found: 'Пользователь не найден. Нажмите /start.',
    // --- New Budget Keys (RU) ---
    btn_budget: '💰 Варианты по бюджету',
    enter_budget: 'Пожалуйста, введите ваш приблизительный бюджет (например, 5000 KZT или 100 USD):',
    enter_city: 'Спасибо! В каком городе вы планируете это мероприятие?',
    enter_action_type: 'Отлично! Какой тип активности вы ищете? (например, "ресторан", "музей", "активный отдых"):',
    processing: 'Обрабатываем ваш запрос, пожалуйста, подождите...',
    budget_result_title: '✅ Найдены бюджетные варианты',
    budget_summary: 'Краткое описание:',
    budget_variants: 'Предложения:',
    budget_maps: 'Найти на карте:',
    budget_error: 'К сожалению, сейчас не удалось получить бюджетные варианты. Попробуйте еще раз.',
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
    enter_password: 'Құпиясөз енгізіңіз',
    room_joined: 'Бөлмеге қосылдыңыз:',
    room_left: 'Сіз бөлмеден шықтыңыз.',
    error: 'Қате орын алды.',
    user_not_found: 'Пайдаланушы табылмады. /start басыңыз.',
    // --- New Budget Keys (KZ) ---
    btn_budget: '💰 Бюджеттік нұсқалар',
    enter_budget: 'Шамамен бюджетіңізді енгізіңіз (мысалы, 5000 KZT немесе 100 USD):',
    enter_city: 'Рахмет! Бұл іс-шараны қай қалада жоспарлап отырсыз?',
    enter_action_type: 'Керемет! Сіз қандай әрекет түрін іздеп жүрсіз? (мысалы, "мейрамхана", "музей", "белсенді демалыс"):',
    processing: 'Сұранысыңыз өңделуде, күте тұрыңыз...',
    budget_result_title: '✅ Бюджеттік нұсқалар табылды',
    budget_summary: 'Қорытынды:',
    budget_variants: 'Ұсыныстар:',
    budget_maps: 'Картадан табу:',
    budget_error: 'Өкінішке орай, бюджеттік нұсқаларды қазір ала алмадым. Қайталап көріңіз.',
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
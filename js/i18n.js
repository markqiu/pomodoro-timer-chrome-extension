// Internationalization (i18n) support
// 国际化支持
const I18n = {
    currentLang: 'en',
    translations: {
        en: {
            // App title
            appTitle: 'Minimal Pomodoro Timer',
            // Timer labels
            readyToStart: 'Ready to Start',
            focusWork: 'Focus Work',
            shortBreak: 'Short Break',
            longBreak: 'Long Break',
            // Buttons
            start: 'Start',
            startNext: 'Start Next',
            pause: 'Pause',
            reset: 'Reset',
            settings: 'Settings',
            save: 'Save',
            cancel: 'Cancel',
            // Menu items
            startPomodoro: 'Start Pomodoro',
            startShortBreak: 'Start Short Break',
            startLongBreak: 'Start Long Break',
            // Settings
            pomodoroDuration: 'Pomodoro Duration (minutes)',
            shortBreakDuration: 'Short Break Duration (minutes)',
            longBreakDuration: 'Long Break Duration (minutes)',
            cyclesBeforeLongBreak: 'Cycles Before Long Break',
            enableSoundAlert: 'Enable Sound Alert',
            enableNotificationAlert: 'Enable Notification Alert',
            // Progress info
            currentCycle: 'Current Cycle',
            // Notifications
            pomodoroComplete: 'Pomodoro Complete!',
            timeForBreak: 'Time for a break!',
            shortBreakOver: 'Short Break Over!',
            longBreakOver: 'Long Break Over!',
            readyToWork: 'Ready to work',
            timesUp: 'Time\'s Up!'
        },
        zh: {
            // App title
            appTitle: '极简番茄钟',
            // Timer labels
            readyToStart: '准备开始',
            focusWork: '专注工作',
            shortBreak: '小休',
            longBreak: '大休',
            // Buttons
            start: '开始',
            startNext: '开始下一个',
            pause: '暂停',
            reset: '重置',
            settings: '设置',
            save: '保存',
            cancel: '取消',
            // Menu items
            startPomodoro: '开始番茄钟',
            startShortBreak: '开始小休',
            startLongBreak: '开始大休',
            // Settings
            pomodoroDuration: '番茄钟时长（分钟）',
            shortBreakDuration: '小休时长（分钟）',
            longBreakDuration: '大休时长（分钟）',
            cyclesBeforeLongBreak: '持续次数（大休前）',
            enableSoundAlert: '启用声音提醒',
            enableNotificationAlert: '启用通知提醒',
            // Progress info
            currentCycle: '当前循环',
            // Notifications
            pomodoroComplete: '番茄钟完成！',
            timeForBreak: '休息时间到！',
            shortBreakOver: '小休结束！',
            longBreakOver: '大休结束！',
            readyToWork: '准备开始工作',
            timesUp: '时间到！'
        }
    },

    // Detect system language
    // 检测系统语言
    detectLanguage() {
        // Try to get language from Chrome API first
        // 首先尝试从Chrome API获取语言
        if (typeof chrome !== 'undefined' && chrome.i18n) {
            const uiLang = chrome.i18n.getUILanguage();
            if (uiLang.startsWith('zh')) {
                return 'zh';
            }
            return 'en';
        }
        
        // Fallback to browser language
        // 回退到浏览器语言
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang.startsWith('zh')) {
            return 'zh';
        }
        return 'en';
    },

    // Initialize i18n
    // 初始化国际化
    init() {
        this.currentLang = this.detectLanguage();
        console.log('I18n initialized with language:', this.currentLang);
    },

    // Get translation
    // 获取翻译
    t(key, defaultValue = '') {
        const translation = this.translations[this.currentLang];
        if (translation && translation[key]) {
            return translation[key];
        }
        // Fallback to English
        // 回退到英文
        const enTranslation = this.translations.en;
        if (enTranslation && enTranslation[key]) {
            return enTranslation[key];
        }
        return defaultValue || key;
    },

    // Set language
    // 设置语言
    setLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLang = lang;
            return true;
        }
        return false;
    },

    // Get current language
    // 获取当前语言
    getLanguage() {
        return this.currentLang;
    }
};

// Ensure I18n is available in global scope
// 确保 I18n 在全局作用域中可用
if (typeof window !== 'undefined') {
    window.I18n = I18n;
}


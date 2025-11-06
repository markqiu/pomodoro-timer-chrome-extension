// 本地存储管理
const Storage = {
    // 默认设置
    defaultSettings: {
        pomodoroTime: 25,
        shortBreakTime: 5,
        longBreakTime: 15,
        cyclesBeforeLongBreak: 4,
        enableSound: true,
        enableNotification: true
    },

    // 判断是否为Chrome插件环境
    isChromeExtension() {
        return typeof chrome !== 'undefined' && chrome.storage;
    },

    // 获取设置
    getSettings(callback) {
        if (this.isChromeExtension()) {
            // Chrome插件环境
            chrome.storage.local.get('pomodoroSettings', (result) => {
                if (result.pomodoroSettings) {
                    try {
                        const settings = { ...this.defaultSettings, ...result.pomodoroSettings };
                        if (callback) callback(settings);
                    } catch (e) {
                        console.error('Failed to parse settings:', e);
                        if (callback) callback(this.defaultSettings);
                    }
                } else {
                    if (callback) callback(this.defaultSettings);
                }
            });
        } else {
            // 普通网页环境
            const stored = localStorage.getItem('pomodoroSettings');
            let settings = this.defaultSettings;
            if (stored) {
                try {
                    settings = { ...this.defaultSettings, ...JSON.parse(stored) };
                } catch (e) {
                    console.error('Failed to parse settings:', e);
                }
            }
            if (callback) {
                callback(settings);
            } else {
                return settings;
            }
        }
    },

    // 保存设置
    saveSettings(settings, callback) {
        try {
            if (this.isChromeExtension()) {
                // Chrome插件环境
                chrome.storage.local.set({ pomodoroSettings: settings }, () => {
                    if (callback) callback(true);
                });
            } else {
                // 普通网页环境
                localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
                if (callback) callback(true);
                return true;
            }
        } catch (e) {
            console.error('Failed to save settings:', e);
            if (callback) callback(false);
            return false;
        }
    },

    // 清除所有数据
    clearAll(callback) {
        if (this.isChromeExtension()) {
            chrome.storage.local.remove('pomodoroSettings', () => {
                if (callback) callback();
            });
        } else {
            localStorage.removeItem('pomodoroSettings');
            if (callback) callback();
        }
    },

    // 保存计时器状态
    saveTimerState(state, callback) {
        try {
            if (this.isChromeExtension()) {
                chrome.storage.local.set({ pomodoroTimerState: state }, () => {
                    if (callback) callback(true);
                });
            } else {
                localStorage.setItem('pomodoroTimerState', JSON.stringify(state));
                if (callback) callback(true);
                return true;
            }
        } catch (e) {
            console.error('Failed to save timer state:', e);
            if (callback) callback(false);
            return false;
        }
    },

    // 获取计时器状态
    getTimerState(callback) {
        if (this.isChromeExtension()) {
            chrome.storage.local.get('pomodoroTimerState', (result) => {
                if (callback) callback(result.pomodoroTimerState || null);
            });
        } else {
            const stored = localStorage.getItem('pomodoroTimerState');
            let state = null;
            if (stored) {
                try {
                    state = JSON.parse(stored);
                } catch (e) {
                    console.error('Failed to parse timer state:', e);
                }
            }
            if (callback) {
                callback(state);
            } else {
                return state;
            }
        }
    },

    // 清除计时器状态
    clearTimerState(callback) {
        if (this.isChromeExtension()) {
            chrome.storage.local.remove('pomodoroTimerState', () => {
                if (callback) callback();
            });
        } else {
            localStorage.removeItem('pomodoroTimerState');
            if (callback) callback();
        }
    }
};


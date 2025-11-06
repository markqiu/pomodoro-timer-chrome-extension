// 设置管理
const SettingsManager = {
    currentSettings: null,

    init() {
        Storage.getSettings((settings) => {
            this.currentSettings = settings;
            this.loadSettingsToUI();
            this.bindEvents();
        });
    },

    loadSettingsToUI() {
        document.getElementById('pomodoroTime').value = this.currentSettings.pomodoroTime;
        document.getElementById('shortBreakTime').value = this.currentSettings.shortBreakTime;
        document.getElementById('longBreakTime').value = this.currentSettings.longBreakTime;
        document.getElementById('cyclesBeforeLongBreak').value = this.currentSettings.cyclesBeforeLongBreak;
        document.getElementById('enableSound').checked = this.currentSettings.enableSound;
        document.getElementById('enableNotification').checked = this.currentSettings.enableNotification;
    },

    getSettingsFromUI() {
        return {
            pomodoroTime: parseInt(document.getElementById('pomodoroTime').value) || 25,
            shortBreakTime: parseInt(document.getElementById('shortBreakTime').value) || 5,
            longBreakTime: parseInt(document.getElementById('longBreakTime').value) || 15,
            cyclesBeforeLongBreak: parseInt(document.getElementById('cyclesBeforeLongBreak').value) || 4,
            enableSound: document.getElementById('enableSound').checked,
            enableNotification: document.getElementById('enableNotification').checked
        };
    },

    bindEvents() {
        const settingsBtn = document.getElementById('settingsBtn');
        const settingsModal = document.getElementById('settingsModal');
        const closeSettings = document.getElementById('closeSettings');
        const saveSettings = document.getElementById('saveSettings');
        const cancelSettings = document.getElementById('cancelSettings');

        settingsBtn.addEventListener('click', () => {
            this.loadSettingsToUI();
            settingsModal.classList.add('show');
        });

        closeSettings.addEventListener('click', () => {
            settingsModal.classList.remove('show');
        });

        cancelSettings.addEventListener('click', () => {
            settingsModal.classList.remove('show');
        });

        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                settingsModal.classList.remove('show');
            }
        });

        saveSettings.addEventListener('click', () => {
            const newSettings = this.getSettingsFromUI();
            
            // 验证输入
            if (newSettings.pomodoroTime < 1 || newSettings.pomodoroTime > 60) {
                alert('番茄钟时长必须在1-60分钟之间');
                return;
            }
            if (newSettings.shortBreakTime < 1 || newSettings.shortBreakTime > 30) {
                alert('小休时长必须在1-30分钟之间');
                return;
            }
            if (newSettings.longBreakTime < 1 || newSettings.longBreakTime > 60) {
                alert('大休时长必须在1-60分钟之间');
                return;
            }
            if (newSettings.cyclesBeforeLongBreak < 2 || newSettings.cyclesBeforeLongBreak > 10) {
                alert('持续次数必须在2-10之间');
                return;
            }

            this.currentSettings = newSettings;
            Storage.saveSettings(newSettings, (success) => {
                if (success) {
                    settingsModal.classList.remove('show');
                    
                    // 通知番茄钟更新设置
                    if (window.pomodoro) {
                        window.pomodoro.updateSettings(newSettings);
                    }
                } else {
                    alert('保存设置失败，请重试');
                }
            });
        });
    },

    getSettings(callback) {
        if (this.currentSettings) {
            if (callback) {
                callback(this.currentSettings);
            } else {
                return this.currentSettings;
            }
        } else {
            Storage.getSettings((settings) => {
                this.currentSettings = settings;
                if (callback) {
                    callback(settings);
                }
            });
        }
    }
};


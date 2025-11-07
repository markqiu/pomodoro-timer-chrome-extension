// Settings management
// 设置管理
const SettingsManager = {
    currentSettings: null,

    init() {
        // Initialize i18n if not already initialized
        // 如果尚未初始化，初始化国际化
        if (typeof I18n !== 'undefined') {
            I18n.init();
            this.updateSettingsUITexts();
        }
        
        Storage.getSettings((settings) => {
            this.currentSettings = settings;
            this.loadSettingsToUI();
            this.bindEvents();
        });
    },
    
    // Update settings UI texts with i18n
    // 使用国际化更新设置UI文本
    updateSettingsUITexts() {
        if (typeof I18n === 'undefined') return;
        
        // Update labels
        // 更新标签
        const labels = document.querySelectorAll('.setting-item label');
        labels.forEach(label => {
            const text = label.textContent.trim();
            if (text.includes('Pomodoro Duration') || text.includes('番茄钟时长')) {
                label.innerHTML = `<label for="pomodoroTime">${I18n.t('pomodoroDuration')}</label>`;
            } else if (text.includes('Short Break Duration') || text.includes('小休时长')) {
                label.innerHTML = `<label for="shortBreakTime">${I18n.t('shortBreakDuration')}</label>`;
            } else if (text.includes('Long Break Duration') || text.includes('大休时长')) {
                label.innerHTML = `<label for="longBreakTime">${I18n.t('longBreakDuration')}</label>`;
            } else if (text.includes('Cycles Before Long Break') || text.includes('持续次数')) {
                label.innerHTML = `<label for="cyclesBeforeLongBreak">${I18n.t('cyclesBeforeLongBreak')}</label>`;
            } else if (text.includes('Enable Sound Alert') || text.includes('启用声音提醒')) {
                label.innerHTML = `<label><input type="checkbox" id="enableSound"> ${I18n.t('enableSoundAlert')}</label>`;
            } else if (text.includes('Enable Notification Alert') || text.includes('启用通知提醒')) {
                label.innerHTML = `<label><input type="checkbox" id="enableNotification"> ${I18n.t('enableNotificationAlert')}</label>`;
            }
        });
        
        // Update modal title and buttons
        // 更新模态框标题和按钮
        const modalTitle = document.querySelector('#settingsModal h2');
        if (modalTitle) {
            modalTitle.textContent = I18n.t('settings');
        }
        const saveBtn = document.getElementById('saveSettings');
        if (saveBtn) {
            saveBtn.textContent = I18n.t('save');
        }
        const cancelBtn = document.getElementById('cancelSettings');
        if (cancelBtn) {
            cancelBtn.textContent = I18n.t('cancel');
        }
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
            
            // Validate input
            // 验证输入
            if (newSettings.pomodoroTime < 1 || newSettings.pomodoroTime > 60) {
                alert('Pomodoro duration must be between 1-60 minutes');
                // 番茄钟时长必须在1-60分钟之间
                return;
            }
            if (newSettings.shortBreakTime < 1 || newSettings.shortBreakTime > 30) {
                alert('Short break duration must be between 1-30 minutes');
                // 小休时长必须在1-30分钟之间
                return;
            }
            if (newSettings.longBreakTime < 1 || newSettings.longBreakTime > 60) {
                alert('Long break duration must be between 1-60 minutes');
                // 大休时长必须在1-60分钟之间
                return;
            }
            if (newSettings.cyclesBeforeLongBreak < 2 || newSettings.cyclesBeforeLongBreak > 10) {
                alert('Cycles must be between 2-10');
                // 持续次数必须在2-10之间
                return;
            }

            this.currentSettings = newSettings;
            Storage.saveSettings(newSettings, (success) => {
                if (success) {
                    settingsModal.classList.remove('show');
                    
                    // Notify pomodoro to update settings
                    // 通知番茄钟更新设置
                    if (window.pomodoro) {
                        window.pomodoro.updateSettings(newSettings);
                    }
                } else {
                    alert('Failed to save settings, please try again');
                    // 保存设置失败，请重试
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


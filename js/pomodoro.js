// Pomodoro UI logic - communicates with background via messages
// 番茄钟UI逻辑 - 通过消息与background通信
const Pomodoro = {
    remainingTime: 0,
    isRunning: false,
    isPaused: false,
    currentPhase: 'pomodoro',
    currentCycle: 0,
    settings: null,
    // Alert related
    // 闹钟相关
    alertAudioContext: null,
    alertOscillators: [],
    alertInterval: null,
    isAlertPlaying: false,
    // UI update timer (for smooth display)
    // UI更新定时器（用于平滑显示）
    uiUpdateTimer: null,
    // Phase completion state
    // 阶段完成状态
    phaseJustCompleted: false,
    
    // Phase constants
    // 状态常量
    PHASES: {
        POMODORO: 'pomodoro',
        SHORT_BREAK: 'shortBreak',
        LONG_BREAK: 'longBreak'
    },

    init() {
        console.log('Pomodoro.init called');
        // Initialize i18n first (check if it exists)
        // 首先初始化国际化（检查是否存在）
        if (typeof I18n !== 'undefined') {
            I18n.init();
        } else {
            console.error('I18n is not defined! Make sure i18n.js is loaded before pomodoro.js');
            // 创建临时的 I18n 对象以避免错误
            // Create temporary I18n object to avoid errors
            window.I18n = {
                t: (key) => key,
                init: () => {},
                getLanguage: () => 'en'
            };
        }
        
        // Ensure start button is visible immediately
        // 立即确保开始按钮可见
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.style.display = 'inline-block';
            console.log('Start button made visible in init');
        }
        
        this.updateUITexts();
        
        SettingsManager.getSettings((settings) => {
            console.log('Settings loaded:', settings);
            this.settings = settings;
            this.bindEvents();
            this.setupMessageListener();
            
            // Get current state from background
            // 从background获取当前状态
            this.getStateFromBackground();
            
            // Request notification permission (if not yet requested)
            // 请求通知权限（如果尚未请求）
            if (this.settings.enableNotification && 'Notification' in window) {
                if (Notification.permission === 'default') {
                    Notification.requestPermission().catch(err => {
                        console.log('Failed to request notification permission:', err);
                        // 通知权限请求失败
                    });
                }
            }
        });
    },

    // Setup message listener
    // 设置消息监听器
    setupMessageListener() {
        console.log('Setting up message listener');
        if (typeof chrome === 'undefined' || !chrome.runtime) {
            console.error('Chrome runtime not available for message listener');
            return;
        }
        
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            console.log('Message received in popup:', message);
            switch (message.action) {
                case 'timerUpdate':
                    this.updateFromBackground(message.data);
                    this.updateDisplay();
                    this.updateProgressRing();
                    break;
                case 'timerStarted':
                    console.log('Timer started message received');
                    this.updateFromBackground(message.data);
                    this.onTimerStarted();
                    break;
                case 'timerPaused':
                    this.updateFromBackground(message.data);
                    this.onTimerPaused();
                    break;
                case 'timerReset':
                    this.updateFromBackground(message.data);
                    this.onTimerReset();
                    break;
                case 'phaseComplete':
                    console.log('phaseComplete message received, data:', message.data);
                    this.updateFromBackground(message.data);
                    console.log('After updateFromBackground, currentPhase:', this.currentPhase, 'currentCycle:', this.currentCycle);
                    this.onPhaseComplete();
                    break;
            }
        });
    },

    // Get state from background
    // 从background获取状态
    getStateFromBackground() {
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.sendMessage({ action: 'getState' }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('Failed to get state:', chrome.runtime.lastError);
                    // 获取状态失败
                    return;
                }
                if (response) {
                    this.updateFromBackground(response);
                    this.updateDisplay();
                    this.updateProgressRing();
                    this.updateUIState();
                }
            });
        }
    },

    // Update state from background
    // 从background更新状态
    updateFromBackground(data) {
        if (data.remainingTime !== undefined) {
            this.remainingTime = data.remainingTime;
        }
        if (data.currentPhase !== undefined) {
            const oldPhase = this.currentPhase;
            this.currentPhase = data.currentPhase;
            if (oldPhase !== this.currentPhase) {
                console.log('Phase updated from', oldPhase, 'to', this.currentPhase);
            }
        }
        if (data.currentCycle !== undefined) {
            const oldCycle = this.currentCycle;
            this.currentCycle = data.currentCycle;
            if (oldCycle !== this.currentCycle) {
                console.log('Cycle updated from', oldCycle, 'to', this.currentCycle);
            }
        }
        if (data.isRunning !== undefined) {
            this.isRunning = data.isRunning;
        }
        if (data.isPaused !== undefined) {
            this.isPaused = data.isPaused;
        }
        if (data.settings !== undefined) {
            this.settings = data.settings;
        }
    },

    // Start UI update timer (for smooth display)
    // 开始UI更新定时器（用于平滑显示）
    startUIUpdateTimer() {
        if (this.uiUpdateTimer) {
            clearInterval(this.uiUpdateTimer);
        }
        // Update UI every 500ms (background sends updates every 100ms, so this is mainly for synchronization)
        // 每500ms更新一次UI（background会每100ms发送一次更新，所以这里主要是为了同步）
        this.uiUpdateTimer = setInterval(() => {
            if (this.isRunning && !this.isPaused) {
                // Get latest state from background
                // 从background获取最新状态
                this.getStateFromBackground();
            }
        }, 500);
    },

    // Stop UI update timer
    // 停止UI更新定时器
    stopUIUpdateTimer() {
        if (this.uiUpdateTimer) {
            clearInterval(this.uiUpdateTimer);
            this.uiUpdateTimer = null;
        }
    },

    bindEvents() {
        const startBtn = document.getElementById('startBtn');
        const startMenu = document.getElementById('startMenu');
        const menuItems = startMenu.querySelectorAll('.menu-item');
        
        // Click start button to show/hide menu
        // 点击开始按钮显示/隐藏菜单
        startBtn.addEventListener('click', (e) => {
            console.log('Start button clicked, isRunning:', this.isRunning, 'isPaused:', this.isPaused, 'phaseJustCompleted:', this.phaseJustCompleted);
            e.stopPropagation();
            
            if (!this.isRunning && !this.isPaused) {
                // When a phase just completed, simply toggle the menu to let user choose manually
                // 当阶段刚完成时，仅显示菜单让用户手动选择
                if (this.phaseJustCompleted) {
                    if (startMenu.classList.contains('show')) {
                        startMenu.classList.remove('show');
                    } else {
                        startMenu.classList.add('show');
                    }
                    return;
                }

                // Normal state: show/hide menu
                // 正常状态：显示/隐藏菜单
                if (startMenu.classList.contains('show')) {
                    // If menu is already shown, close it (user clicked start button again)
                    // 如果菜单已经显示，关闭它（用户再次点击开始按钮）
                    startMenu.classList.remove('show');
                } else {
                    // Show menu to allow user to choose phase
                    // 显示菜单让用户选择阶段
                    startMenu.classList.add('show');
                }
            } else {
                // If running or paused, start/resume directly
                // 如果正在运行或暂停，直接开始/恢复
                this.start();
            }
        });
        
        // Click menu item to start corresponding phase
        // 点击菜单项开始对应阶段
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const phase = item.dataset.phase;
                console.log('Menu item clicked, phase:', phase);
                this.phaseJustCompleted = false; // Reset flag when user chooses manually
                // 用户手动选择时重置标志
                this.startWithPhase(phase);
                startMenu.classList.remove('show');
            });
        });
        
        // Click elsewhere to close menu
        // 点击其他地方关闭菜单
        document.addEventListener('click', (e) => {
            if (!startBtn.contains(e.target) && !startMenu.contains(e.target)) {
                startMenu.classList.remove('show');
            }
        });
        
        document.getElementById('pauseBtn').addEventListener('click', () => this.pause());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
    },

    // Send message to background
    // 发送消息到background
    sendMessage(action, data = {}) {
        console.log('sendMessage called:', action, data);
        if (typeof chrome === 'undefined' || !chrome.runtime) {
            console.error('Chrome runtime not available');
            return;
        }
        
        try {
            chrome.runtime.sendMessage({ action, ...data }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('Failed to send message:', chrome.runtime.lastError);
                    // 发送消息失败
                    return;
                }
                console.log('Message sent successfully, response:', response);
                // If message succeeds but UI doesn't update, background might not have sent update message
                // Manually trigger state fetch once
                // 如果消息成功但UI没有更新，可能是background没有发送更新消息
                // 这里手动触发一次状态获取
                if (action === 'start' || action === 'pause' || action === 'reset') {
                    setTimeout(() => {
                        this.getStateFromBackground();
                    }, 100);
                }
            });
        } catch (error) {
            console.error('Error sending message:', error);
        }
    },

    start(phase = null) {
        console.log('Pomodoro.start called, phase:', phase);
        if (phase) {
            this.startWithPhase(phase);
            return;
        }
        
        // Stop alert if it's playing
        // 如果闹钟正在响，先停止
        if (this.isAlertPlaying) {
            this.stopAlert();
        }
        
        console.log('Sending start message to background');
        this.sendMessage('start');
        this.startUIUpdateTimer();
    },

    startWithPhase(phase) {
        console.log('startWithPhase called, phase:', phase);
        // Stop alert if it's playing
        // 如果闹钟正在响，先停止
        if (this.isAlertPlaying) {
            this.stopAlert();
        }
        
        console.log('Sending start message with phase to background');
        this.sendMessage('start', { phase });
        this.startUIUpdateTimer();
    },

    pause() {
        this.sendMessage('pause');
        this.stopUIUpdateTimer();
    },

    reset() {
        this.sendMessage('reset');
        this.stopAlert();
        this.stopUIUpdateTimer();
    },

    // Callback when timer starts
    // 计时器开始时的回调
    onTimerStarted() {
        const startBtn = document.getElementById('startBtn');
        startBtn.style.display = 'none';
        startBtn.textContent = I18n.t('start');
        this.phaseJustCompleted = false;
        document.getElementById('pauseBtn').style.display = 'inline-block';
        document.getElementById('startMenu').classList.remove('show');
        this.updateDisplay();
        this.updateProgressRing(0);
        document.body.classList.add('timer-running');
        document.body.classList.remove('timer-paused');
        this.startUIUpdateTimer();
    },

    // Callback when timer is paused
    // 计时器暂停时的回调
    onTimerPaused() {
        const startBtn = document.getElementById('startBtn');
        startBtn.style.display = 'inline-block';
        startBtn.textContent = I18n.t('start');
        this.phaseJustCompleted = false;
        document.getElementById('pauseBtn').style.display = 'none';
        document.body.classList.remove('timer-running');
        document.body.classList.add('timer-paused');
        this.stopUIUpdateTimer();
    },

    // Callback when timer is reset
    // 计时器重置时的回调
    onTimerReset() {
        this.updateDisplay();
        this.updateProgressRing(0);
        const startBtn = document.getElementById('startBtn');
        startBtn.style.display = 'inline-block';
        startBtn.textContent = I18n.t('start');
        this.phaseJustCompleted = false;
        document.getElementById('pauseBtn').style.display = 'none';
        document.body.classList.remove('timer-running', 'timer-paused', 'timer-break', 'timer-long-break');
        this.stopUIUpdateTimer();
    },

    // Callback when phase completes
    // 阶段完成时的回调
    onPhaseComplete() {
        console.log('onPhaseComplete called, currentPhase:', this.currentPhase, 'currentCycle:', this.currentCycle);
        
        // Get screen focus and flash
        // 获取屏幕焦点并闪烁
        this.focusAndFlash();
        
        // Play alert (if enabled)
        // 播放提醒（如果启用）
        if (this.settings && this.settings.enableSound) {
            this.playAlert();
        }
        
        // Mark that phase just completed
        // 标记阶段刚完成
        // Note: currentPhase has already been updated to next phase by nextPhase() in background.js
        // 注意：currentPhase 已经被 background.js 中的 nextPhase() 更新为下一个阶段
        this.phaseJustCompleted = true;
        
        this.updateDisplay();
        this.updateProgressRing(0);
        
        // Update start button to show "Start Next" text
        // 更新开始按钮显示"开始下一个"文本
        const startBtn = document.getElementById('startBtn');
        startBtn.style.display = 'inline-block';
        startBtn.textContent = I18n.t('startNext');
        document.getElementById('pauseBtn').style.display = 'none';
        document.body.classList.remove('timer-running', 'timer-paused');
        this.stopUIUpdateTimer();
        
        console.log('Phase complete - next phase is:', this.currentPhase, 'cycle:', this.currentCycle);
    },

    getTotalTime() {
        if (!this.settings) return 25 * 60;
        switch (this.currentPhase) {
            case this.PHASES.POMODORO:
                return this.settings.pomodoroTime * 60;
            case this.PHASES.SHORT_BREAK:
                return this.settings.shortBreakTime * 60;
            case this.PHASES.LONG_BREAK:
                return this.settings.longBreakTime * 60;
            default:
                return 25 * 60;
        }
    },

    updateDisplay() {
        const minutes = Math.floor(this.remainingTime / 60);
        const seconds = this.remainingTime % 60;
        const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        document.getElementById('timerDisplay').textContent = timeString;
        
        // Update label
        // 更新标签
        let label = '';
        switch (this.currentPhase) {
            case this.PHASES.POMODORO:
                label = I18n.t('focusWork');
                document.body.classList.remove('timer-break', 'timer-long-break');
                break;
            case this.PHASES.SHORT_BREAK:
                label = I18n.t('shortBreak');
                document.body.classList.add('timer-break');
                document.body.classList.remove('timer-long-break');
                break;
            case this.PHASES.LONG_BREAK:
                label = I18n.t('longBreak');
                document.body.classList.add('timer-long-break');
                document.body.classList.remove('timer-break');
                break;
        }
        document.getElementById('timerLabel').textContent = label;
        
        // Update cycle info
        // 更新循环信息
        if (this.settings) {
            document.getElementById('currentCycle').textContent = this.currentCycle;
            document.getElementById('totalCycles').textContent = this.settings.cyclesBeforeLongBreak;
        }
    },

    updateUIState() {
        const startBtn = document.getElementById('startBtn');
        if (this.isRunning && !this.isPaused) {
            startBtn.style.display = 'none';
            startBtn.textContent = I18n.t('start');
            this.phaseJustCompleted = false;
            document.getElementById('pauseBtn').style.display = 'inline-block';
            document.body.classList.add('timer-running');
            document.body.classList.remove('timer-paused');
            this.startUIUpdateTimer();
        } else if (this.isPaused) {
            startBtn.style.display = 'inline-block';
            startBtn.textContent = I18n.t('start');
            this.phaseJustCompleted = false;
            document.getElementById('pauseBtn').style.display = 'none';
            document.body.classList.add('timer-paused');
            document.body.classList.remove('timer-running');
        } else {
            startBtn.style.display = 'inline-block';
            // If phase just completed, show "Start Next"
            // 如果阶段刚完成，显示"开始下一个"
            if (this.phaseJustCompleted) {
                startBtn.textContent = I18n.t('startNext');
            } else {
                // Check if remaining time equals total time (phase might have just completed)
                // 检查剩余时间是否等于总时间（阶段可能刚完成）
                const totalTime = this.getTotalTime();
                if (this.remainingTime === totalTime && totalTime > 0 && this.remainingTime > 0) {
                    // Only show "Start Next" if we're sure phase just completed
                    // 只有在确定阶段刚完成时才显示"开始下一个"
                    // For now, just show "Start" to avoid confusion
                    // 暂时只显示"开始"以避免混淆
                    startBtn.textContent = I18n.t('start');
                } else {
                    startBtn.textContent = I18n.t('start');
                }
                this.phaseJustCompleted = false;
            }
            document.getElementById('pauseBtn').style.display = 'none';
            document.body.classList.remove('timer-running', 'timer-paused');
        }
        
        // Set phase styles
        // 设置阶段样式
        document.body.classList.remove('timer-break', 'timer-long-break');
        if (this.currentPhase === this.PHASES.SHORT_BREAK) {
            document.body.classList.add('timer-break');
        } else if (this.currentPhase === this.PHASES.LONG_BREAK) {
            document.body.classList.add('timer-long-break');
        }
    },

    updateProgressRing(progress = null) {
        if (progress === null) {
            const total = this.getTotalTime();
            progress = total > 0 ? (total - this.remainingTime) / total : 0;
        }
        
        const circle = document.querySelector('.progress-ring-circle');
        if (!circle) return;
        
        const radius = circle.r.baseVal.value;
        const circumference = radius * 2 * Math.PI;
        const offset = circumference - (progress * circumference);
        
        circle.style.strokeDasharray = `${circumference} ${circumference}`;
        circle.style.strokeDashoffset = offset;
    },

    playAlert() {
        if (!this.settings || !this.settings.enableSound) return;
        
        this.alertAudioContext = null;
        this.alertOscillators = [];
        this.alertInterval = null;
        this.isAlertPlaying = true;
        
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.alertAudioContext = audioContext;
            const duration = 1.0;
            const volume = 0.8;
            let soundIndex = 0;
            
            const playSound = () => {
                if (!this.isAlertPlaying) return;
                
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = 600 + (soundIndex % 2) * 400;
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + duration);
                
                this.alertOscillators.push({ oscillator, gainNode });
                
                oscillator.onended = () => {
                    const index = this.alertOscillators.findIndex(item => item.oscillator === oscillator);
                    if (index > -1) {
                        this.alertOscillators.splice(index, 1);
                    }
                };
                
                soundIndex++;
            };
            
            playSound();
            
            this.alertInterval = setInterval(() => {
                if (this.isAlertPlaying) {
                    playSound();
                } else {
                    this.stopAlert();
                }
            }, 700);
            
        } catch (e) {
            console.error('Failed to play alert sound:', e);
        }
    },

    stopAlert() {
        this.isAlertPlaying = false;
        
        if (this.alertOscillators) {
            this.alertOscillators.forEach(({ oscillator, gainNode }) => {
                try {
                    gainNode.gain.cancelScheduledValues(this.alertAudioContext.currentTime);
                    gainNode.gain.setValueAtTime(0, this.alertAudioContext.currentTime);
                    oscillator.stop();
                } catch (e) {
                    // Ignore errors from stopped oscillators
                    // 忽略已停止的振荡器错误
                }
            });
            this.alertOscillators = [];
        }
        
        if (this.alertInterval) {
            clearInterval(this.alertInterval);
            this.alertInterval = null;
        }
        
        if (this.alertAudioContext && this.alertAudioContext.state !== 'closed') {
            this.alertAudioContext.close().catch(() => {});
            this.alertAudioContext = null;
        }
    },

    focusAndFlash() {
        this.forceFocus();
        
        if (typeof chrome !== 'undefined' && chrome.windows) {
            chrome.windows.getCurrent((win) => {
                if (win) {
                    chrome.windows.update(win.id, { 
                        focused: true,
                        drawAttention: true
                    });
                }
            });
        }
        
        const container = document.querySelector('.container');
        const body = document.body;
        if (container) {
            container.classList.add('alert-flash');
            if (body) {
                body.classList.add('alert-flash');
            }
            
            let flashCount = 0;
            const originalTitle = document.title;
            const flashInterval = setInterval(() => {
                if (this.isAlertPlaying) {
                    document.title = flashCount % 2 === 0 ? '⚠️ Time\'s Up!' : originalTitle;
                    // ⚠️ 时间到！
                    flashCount++;
                } else {
                    clearInterval(flashInterval);
                    document.title = originalTitle;
                }
            }, 500);
            
            const stopAlertHandler = () => {
                this.stopAlert();
                clearInterval(flashInterval);
                document.title = originalTitle;
                container.classList.remove('alert-flash');
                if (body) {
                    body.classList.remove('alert-flash');
                }
                document.removeEventListener('click', stopAlertHandler);
                document.removeEventListener('keydown', stopAlertHandler);
                document.removeEventListener('touchstart', stopAlertHandler);
            };
            
            setTimeout(() => {
                document.addEventListener('click', stopAlertHandler);
                document.addEventListener('keydown', stopAlertHandler);
                document.addEventListener('touchstart', stopAlertHandler);
            }, 100);
        }
    },

    forceFocus() {
        if (window.focus) {
            window.focus();
        }
        
        try {
            window.blur();
            setTimeout(() => {
                window.focus();
            }, 10);
        } catch (e) {
            // Ignore errors
            // 忽略错误
        }
    },

    // Update all UI texts with i18n
    // 使用国际化更新所有UI文本
    updateUITexts() {
        // Check if I18n is available
        // 检查 I18n 是否可用
        if (typeof I18n === 'undefined') {
            console.warn('I18n is not available, skipping UI text updates');
            return;
        }
        
        // Update buttons
        // 更新按钮
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            // Ensure button is visible
            // 确保按钮可见
            startBtn.style.display = 'inline-block';
            // Only update text if not phase just completed (to preserve "Start Next" text)
            // 只有在阶段未刚完成时更新文本（以保留"开始下一个"文本）
            if (!this.phaseJustCompleted) {
                startBtn.textContent = I18n.t('start');
            }
        }
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.textContent = I18n.t('pause');
        }
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            resetBtn.textContent = I18n.t('reset');
        }
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.title = I18n.t('settings');
        }
        
        // Update menu items
        // 更新菜单项
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            const phase = item.dataset.phase;
            switch(phase) {
                case 'pomodoro':
                    item.textContent = I18n.t('startPomodoro');
                    break;
                case 'shortBreak':
                    item.textContent = I18n.t('startShortBreak');
                    break;
                case 'longBreak':
                    item.textContent = I18n.t('startLongBreak');
                    break;
            }
        });
        
        // Update timer label if not running
        // 如果未运行，更新计时器标签
        if (!this.isRunning && !this.isPaused) {
            const timerLabel = document.getElementById('timerLabel');
            if (timerLabel) {
                timerLabel.textContent = I18n.t('readyToStart');
            }
        }
        
        // Update cycle info label
        // 更新循环信息标签
        const cycleInfo = document.querySelector('.cycle-info');
        if (cycleInfo) {
            const cycleText = cycleInfo.textContent;
            if (cycleText.includes('Current Cycle') || cycleText.includes('当前循环')) {
                cycleInfo.innerHTML = `${I18n.t('currentCycle')}: <span id="currentCycle">0</span>/<span id="totalCycles">4</span>`;
            }
        }
        
        // Update app title
        // 更新应用标题
        const appTitle = document.getElementById('appTitle');
        if (appTitle) {
            appTitle.textContent = I18n.t('appTitle');
        }
    },

    updateSettings(newSettings) {
        this.settings = newSettings;
        
        // Notify background that settings have been updated
        // 通知background设置已更新
        this.sendMessage('settingsUpdated');
        
        // Update display
        // 更新显示
        this.updateDisplay();
        this.updateProgressRing();
        
        // Ensure button state is displayed correctly
        // 确保按钮状态正确显示
        document.getElementById('startBtn').style.display = 'inline-block';
        document.getElementById('pauseBtn').style.display = 'none';
        
        const startMenu = document.getElementById('startMenu');
        if (startMenu) {
            startMenu.classList.remove('show');
        }
        
        document.body.classList.remove('timer-running', 'timer-paused', 'timer-break', 'timer-long-break');
    }
};

// Initialize
// 初始化
window.addEventListener('DOMContentLoaded', () => {
    SettingsManager.init();
    window.pomodoro = Pomodoro;
    Pomodoro.init();
    
    // Stop UI update timer before popup closes
    // 在popup关闭前停止UI更新定时器
    window.addEventListener('beforeunload', () => {
        Pomodoro.stopUIUpdateTimer();
    });
    
    // Listen for popup visibility changes
    // 监听popup可见性变化
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Stop UI update timer when popup is hidden
            // popup隐藏时停止UI更新定时器
            Pomodoro.stopUIUpdateTimer();
        } else {
            // Re-fetch state and start UI update when popup is shown
            // popup显示时重新获取状态并启动UI更新
            if (Pomodoro.isRunning && !Pomodoro.isPaused) {
                Pomodoro.getStateFromBackground();
                Pomodoro.startUIUpdateTimer();
            }
        }
    });
});

// 番茄钟UI逻辑 - 通过消息与background通信
const Pomodoro = {
    remainingTime: 0,
    isRunning: false,
    isPaused: false,
    currentPhase: 'pomodoro',
    currentCycle: 0,
    settings: null,
    // 闹钟相关
    alertAudioContext: null,
    alertOscillators: [],
    alertInterval: null,
    isAlertPlaying: false,
    // UI更新定时器（用于平滑显示）
    uiUpdateTimer: null,
    
    // 状态常量
    PHASES: {
        POMODORO: 'pomodoro',
        SHORT_BREAK: 'shortBreak',
        LONG_BREAK: 'longBreak'
    },

    init() {
        console.log('Pomodoro.init called');
        SettingsManager.getSettings((settings) => {
            console.log('Settings loaded:', settings);
            this.settings = settings;
            this.bindEvents();
            this.setupMessageListener();
            
            // 从background获取当前状态
            this.getStateFromBackground();
            
            // 请求通知权限（如果尚未请求）
            if (this.settings.enableNotification && 'Notification' in window) {
                if (Notification.permission === 'default') {
                    Notification.requestPermission().catch(err => {
                        console.log('通知权限请求失败:', err);
                    });
                }
            }
        });
    },

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
                    this.updateFromBackground(message.data);
                    this.onPhaseComplete();
                    break;
            }
        });
    },

    // 从background获取状态
    getStateFromBackground() {
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.sendMessage({ action: 'getState' }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('获取状态失败:', chrome.runtime.lastError);
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

    // 从background更新状态
    updateFromBackground(data) {
        if (data.remainingTime !== undefined) {
            this.remainingTime = data.remainingTime;
        }
        if (data.currentPhase !== undefined) {
            this.currentPhase = data.currentPhase;
        }
        if (data.currentCycle !== undefined) {
            this.currentCycle = data.currentCycle;
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

    // 开始UI更新定时器（用于平滑显示）
    startUIUpdateTimer() {
        if (this.uiUpdateTimer) {
            clearInterval(this.uiUpdateTimer);
        }
        // 每500ms更新一次UI（background会每100ms发送一次更新，所以这里主要是为了同步）
        this.uiUpdateTimer = setInterval(() => {
            if (this.isRunning && !this.isPaused) {
                // 从background获取最新状态
                this.getStateFromBackground();
            }
        }, 500);
    },

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
        
        // 点击开始按钮显示/隐藏菜单
        startBtn.addEventListener('click', (e) => {
            console.log('Start button clicked, isRunning:', this.isRunning, 'isPaused:', this.isPaused);
            e.stopPropagation();
            if (!this.isRunning && !this.isPaused) {
                // 如果菜单已经显示，直接开始番茄钟
                if (startMenu.classList.contains('show')) {
                    this.startWithPhase('pomodoro');
                    startMenu.classList.remove('show');
                } else {
                    // 显示菜单
                    startMenu.classList.toggle('show');
                }
            } else {
                // 如果正在运行或暂停，直接开始/恢复
                this.start();
            }
        });
        
        // 点击菜单项开始对应阶段
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const phase = item.dataset.phase;
                console.log('Menu item clicked, phase:', phase);
                this.startWithPhase(phase);
                startMenu.classList.remove('show');
            });
        });
        
        // 点击其他地方关闭菜单
        document.addEventListener('click', (e) => {
            if (!startBtn.contains(e.target) && !startMenu.contains(e.target)) {
                startMenu.classList.remove('show');
            }
        });
        
        document.getElementById('pauseBtn').addEventListener('click', () => this.pause());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
    },

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
                    console.error('发送消息失败:', chrome.runtime.lastError);
                    return;
                }
                console.log('Message sent successfully, response:', response);
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

    // 计时器开始时的回调
    onTimerStarted() {
        document.getElementById('startBtn').style.display = 'none';
        document.getElementById('pauseBtn').style.display = 'inline-block';
        document.getElementById('startMenu').classList.remove('show');
        this.updateDisplay();
        this.updateProgressRing(0);
        document.body.classList.add('timer-running');
        document.body.classList.remove('timer-paused');
        this.startUIUpdateTimer();
    },

    // 计时器暂停时的回调
    onTimerPaused() {
        document.getElementById('startBtn').style.display = 'inline-block';
        document.getElementById('pauseBtn').style.display = 'none';
        document.body.classList.remove('timer-running');
        document.body.classList.add('timer-paused');
        this.stopUIUpdateTimer();
    },

    // 计时器重置时的回调
    onTimerReset() {
        this.updateDisplay();
        this.updateProgressRing(0);
        document.getElementById('startBtn').style.display = 'inline-block';
        document.getElementById('pauseBtn').style.display = 'none';
        document.body.classList.remove('timer-running', 'timer-paused', 'timer-break', 'timer-long-break');
        this.stopUIUpdateTimer();
    },

    // 阶段完成时的回调
    onPhaseComplete() {
        // 获取屏幕焦点并闪烁
        this.focusAndFlash();
        
        // 播放提醒（如果启用）
        if (this.settings && this.settings.enableSound) {
            this.playAlert();
        }
        
        this.updateDisplay();
        this.updateProgressRing(0);
        document.getElementById('startBtn').style.display = 'inline-block';
        document.getElementById('pauseBtn').style.display = 'none';
        document.body.classList.remove('timer-running', 'timer-paused');
        this.stopUIUpdateTimer();
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
        
        // 更新标签
        let label = '';
        switch (this.currentPhase) {
            case this.PHASES.POMODORO:
                label = '专注工作';
                document.body.classList.remove('timer-break', 'timer-long-break');
                break;
            case this.PHASES.SHORT_BREAK:
                label = '小休';
                document.body.classList.add('timer-break');
                document.body.classList.remove('timer-long-break');
                break;
            case this.PHASES.LONG_BREAK:
                label = '大休';
                document.body.classList.add('timer-long-break');
                document.body.classList.remove('timer-break');
                break;
        }
        document.getElementById('timerLabel').textContent = label;
        
        // 更新循环信息
        if (this.settings) {
            document.getElementById('currentCycle').textContent = this.currentCycle;
            document.getElementById('totalCycles').textContent = this.settings.cyclesBeforeLongBreak;
        }
    },

    updateUIState() {
        if (this.isRunning && !this.isPaused) {
            document.getElementById('startBtn').style.display = 'none';
            document.getElementById('pauseBtn').style.display = 'inline-block';
            document.body.classList.add('timer-running');
            document.body.classList.remove('timer-paused');
            this.startUIUpdateTimer();
        } else if (this.isPaused) {
            document.getElementById('startBtn').style.display = 'inline-block';
            document.getElementById('pauseBtn').style.display = 'none';
            document.body.classList.add('timer-paused');
            document.body.classList.remove('timer-running');
        } else {
            document.getElementById('startBtn').style.display = 'inline-block';
            document.getElementById('pauseBtn').style.display = 'none';
            document.body.classList.remove('timer-running', 'timer-paused');
        }
        
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
                    document.title = flashCount % 2 === 0 ? '⚠️ 时间到！' : originalTitle;
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
            // 忽略错误
        }
    },

    updateSettings(newSettings) {
        this.settings = newSettings;
        
        // 通知background设置已更新
        this.sendMessage('settingsUpdated');
        
        // 更新显示
        this.updateDisplay();
        this.updateProgressRing();
        
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

// 初始化
window.addEventListener('DOMContentLoaded', () => {
    SettingsManager.init();
    window.pomodoro = Pomodoro;
    Pomodoro.init();
    
    // 在popup关闭前停止UI更新定时器
    window.addEventListener('beforeunload', () => {
        Pomodoro.stopUIUpdateTimer();
    });
    
    // 监听popup可见性变化
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // popup隐藏时停止UI更新定时器
            Pomodoro.stopUIUpdateTimer();
        } else {
            // popup显示时重新获取状态并启动UI更新
            if (Pomodoro.isRunning && !Pomodoro.isPaused) {
                Pomodoro.getStateFromBackground();
                Pomodoro.startUIUpdateTimer();
            }
        }
    });
});

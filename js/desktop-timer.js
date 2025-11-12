// Desktop timer manager - independent timer logic for desktop app
// 桌面计时器管理器 - 桌面应用独立的计时器逻辑
const DesktopTimer = {
    timer: null,
    startTime: null,
    remainingTime: 0,
    isRunning: false,
    isPaused: false,
    currentPhase: 'pomodoro',
    currentCycle: 0,
    settings: null,
    saveStateCounter: 0,
    callbacks: {},

    PHASES: {
        POMODORO: 'pomodoro',
        SHORT_BREAK: 'shortBreak',
        LONG_BREAK: 'longBreak'
    },

    init(settings) {
        this.settings = settings;
        this.loadState();
    },

    on(event, callback) {
        if (!this.callbacks[event]) {
            this.callbacks[event] = [];
        }
        this.callbacks[event].push(callback);
    },

    emit(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(callback => callback(data));
        }
    },

    getTotalTime() {
        // 如果 settings 未加载，使用默认值
        if (!this.settings) {
            const defaults = {
                pomodoroTime: 25,
                shortBreakTime: 5,
                longBreakTime: 15
            };
            switch (this.currentPhase) {
                case this.PHASES.POMODORO:
                    return defaults.pomodoroTime * 60;
                case this.PHASES.SHORT_BREAK:
                    return defaults.shortBreakTime * 60;
                case this.PHASES.LONG_BREAK:
                    return defaults.longBreakTime * 60;
                default:
                    return defaults.pomodoroTime * 60;
            }
        }
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

    startTimer() {
        if (!this.settings) {
            console.error('Settings not loaded');
            return;
        }

        if (this.isPaused) {
            // Resume from paused state
            this.isPaused = false;
            if (this.remainingTime <= 0) {
                this.startTime = Date.now();
                this.remainingTime = this.getTotalTime();
            } else {
                this.startTime = Date.now() - (this.getTotalTime() - this.remainingTime) * 1000;
            }
        } else {
            // New start
            this.startTime = Date.now();
            this.remainingTime = this.getTotalTime();
        }

        this.isRunning = true;
        this.saveStateCounter = 0;
        this.startTimerInterval();
        this.saveState();

        this.emit('timerStarted', {
            remainingTime: this.remainingTime,
            currentPhase: this.currentPhase
        });
    },

    startWithPhase(phase) {
        if (!this.settings) {
            console.error('Settings not loaded');
            return;
        }

        if (this.isRunning) {
            this.pauseTimer();
        }

        switch(phase) {
            case 'pomodoro':
                this.currentPhase = this.PHASES.POMODORO;
                break;
            case 'shortBreak':
                this.currentPhase = this.PHASES.SHORT_BREAK;
                break;
            case 'longBreak':
                this.currentPhase = this.PHASES.LONG_BREAK;
                break;
            default:
                return;
        }

        this.isPaused = false;
        this.remainingTime = this.getTotalTime();
        this.startTime = Date.now();
        this.isRunning = true;
        this.saveStateCounter = 0;
        this.startTimerInterval();
        this.saveState();

        this.emit('timerStarted', {
            remainingTime: this.remainingTime,
            currentPhase: this.currentPhase
        });
    },

    pauseTimer() {
        this.isRunning = false;
        this.isPaused = true;
        this.stopTimer();
        this.saveState();
        this.emit('timerPaused', {
            remainingTime: this.remainingTime,
            currentPhase: this.currentPhase
        });
    },

    resetTimer() {
        this.isRunning = false;
        this.isPaused = false;
        this.stopTimer();
        this.currentPhase = this.PHASES.POMODORO;
        this.currentCycle = 0;
        this.remainingTime = this.getTotalTime();
        this.saveState();
        this.emit('timerReset', {
            remainingTime: this.remainingTime,
            currentPhase: this.currentPhase
        });
    },

    startTimerInterval() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        this.timer = setInterval(() => {
            this.tick();
        }, 100);
    },

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    },

    tick() {
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        this.remainingTime = Math.max(0, this.getTotalTime() - elapsed);

        // Notify UI to update
        this.emit('timerUpdate', {
            remainingTime: this.remainingTime,
            currentPhase: this.currentPhase,
            currentCycle: this.currentCycle,
            isRunning: this.isRunning,
            isPaused: this.isPaused
        });

        if (this.remainingTime <= 0) {
            this.completePhase();
        } else {
            // Save state every 5 seconds
            this.saveStateCounter++;
            if (this.saveStateCounter >= 50) {
                this.saveState();
                this.saveStateCounter = 0;
            }
        }
    },

    completePhase() {
        this.stopTimer();
        this.isRunning = false;
        this.isPaused = false;

        // Show notification if enabled
        if (this.settings && this.settings.enableNotification) {
            this.showNotification();
        }

        // Determine next phase
        let nextPhase = this.PHASES.SHORT_BREAK;
        if (this.currentPhase === this.PHASES.POMODORO) {
            this.currentCycle++;
            if (this.currentCycle >= (this.settings?.cyclesBeforeLongBreak || 4)) {
                nextPhase = this.PHASES.LONG_BREAK;
                this.currentCycle = 0;
            } else {
                nextPhase = this.PHASES.SHORT_BREAK;
            }
        } else {
            nextPhase = this.PHASES.POMODORO;
        }

        this.currentPhase = nextPhase;
        this.remainingTime = this.getTotalTime();

        this.saveState();

        this.emit('phaseComplete', {
            currentPhase: this.currentPhase,
            currentCycle: this.currentCycle,
            remainingTime: this.remainingTime
        });
    },

    showNotification() {
        let title = 'Pomodoro Complete!';
        let body = 'Time for a break!';

        if (this.currentPhase === this.PHASES.SHORT_BREAK) {
            title = 'Short Break Over!';
            body = 'Ready to work';
        } else if (this.currentPhase === this.PHASES.LONG_BREAK) {
            title = 'Long Break Over!';
            body = 'Ready to work';
        }

        // Use Web Notification API
        if ('Notification' in window) {
            // 在桌面应用中，图标路径需要相对于应用根目录
            const iconPath = window.location.origin + '/icons/icon48.png';
            if (Notification.permission === 'granted') {
                new Notification(title, { body, icon: iconPath });
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        new Notification(title, { body, icon: iconPath });
                    }
                });
            }
        }
    },

    getState() {
        return {
            remainingTime: this.remainingTime,
            currentPhase: this.currentPhase,
            currentCycle: this.currentCycle,
            isRunning: this.isRunning,
            isPaused: this.isPaused
        };
    },

    saveState() {
        const state = {
            startTime: this.startTime,
            remainingTime: this.remainingTime,
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            currentPhase: this.currentPhase,
            currentCycle: this.currentCycle
        };
        try {
            localStorage.setItem('pomodoroTimerState', JSON.stringify(state));
        } catch (e) {
            console.error('Failed to save timer state:', e);
        }
    },

    loadState() {
        try {
            const stored = localStorage.getItem('pomodoroTimerState');
            if (stored) {
                const state = JSON.parse(stored);
                this.startTime = state.startTime;
                this.remainingTime = state.remainingTime || this.getTotalTime();
                this.isRunning = state.isRunning || false;
                this.isPaused = state.isPaused || false;
                this.currentPhase = state.currentPhase || this.PHASES.POMODORO;
                this.currentCycle = state.currentCycle || 0;

                // If timer was running, calculate remaining time
                if (this.isRunning && !this.isPaused && this.startTime) {
                    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
                    this.remainingTime = Math.max(0, this.getTotalTime() - elapsed);
                    if (this.remainingTime > 0) {
                        this.startTimerInterval();
                    } else {
                        this.completePhase();
                    }
                }
            } else {
                this.remainingTime = this.getTotalTime();
            }
        } catch (e) {
            console.error('Failed to load timer state:', e);
            this.remainingTime = this.getTotalTime();
        }
    }
};


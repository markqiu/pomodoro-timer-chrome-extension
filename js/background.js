// Chrome extension background service
// Chrome插件后台服务
// Handles notifications, background tasks, and timer logic
// 用于处理通知和后台任务，以及计时器逻辑

// Simple i18n for background script
// 后台脚本的简单国际化
const bgI18n = {
    getLanguage() {
        if (typeof chrome !== 'undefined' && chrome.i18n) {
            const uiLang = chrome.i18n.getUILanguage();
            return uiLang.startsWith('zh') ? 'zh' : 'en';
        }
        return 'en';
    },
    
    t(key) {
        const lang = this.getLanguage();
        const translations = {
            en: {
                pomodoroComplete: 'Pomodoro Complete!',
                timeForBreak: 'Time for a break!',
                shortBreakOver: 'Short Break Over!',
                longBreakOver: 'Long Break Over!',
                readyToWork: 'Ready to work'
            },
            zh: {
                pomodoroComplete: '番茄钟完成！',
                timeForBreak: '休息时间到！',
                shortBreakOver: '小休结束！',
                longBreakOver: '大休结束！',
                readyToWork: '准备开始工作'
            }
        };
        return translations[lang] && translations[lang][key] ? translations[lang][key] : translations.en[key] || key;
    }
};

// Timer state
// 计时器状态
let timerState = {
    timer: null,
    startTime: null,
    remainingTime: 0,
    isRunning: false,
    isPaused: false,
    currentPhase: 'pomodoro', // pomodoro, shortBreak, longBreak
    currentCycle: 0,
    settings: null,
    saveStateCounter: 0,
    badgeUpdateCounter: 0 // Badge update counter, updates every 50 ticks (5 seconds)
    // badge更新计数器，每50次tick（5秒）更新一次
};

const PHASES = {
    POMODORO: 'pomodoro',
    SHORT_BREAK: 'shortBreak',
    LONG_BREAK: 'longBreak'
};

// Default settings
// 默认设置
const defaultSettings = {
    pomodoroTime: 25,
    shortBreakTime: 5,
    longBreakTime: 15,
    cyclesBeforeLongBreak: 4,
    enableSound: true,
    enableNotification: true
};

// Initialize
// 初始化
chrome.runtime.onInstalled.addListener(() => {
    console.log('Minimal Pomodoro Timer installed');
    // 极简番茄钟已安装
    loadSettings(() => {
        loadTimerState();
    });
});

// Load state on startup
// 启动时也加载状态
chrome.runtime.onStartup.addListener(() => {
    loadSettings(() => {
        loadTimerState();
    });
});

// Load settings
// 加载设置
function loadSettings(callback) {
    chrome.storage.local.get('pomodoroSettings', (result) => {
        if (result.pomodoroSettings) {
            timerState.settings = { ...defaultSettings, ...result.pomodoroSettings };
        } else {
            timerState.settings = defaultSettings;
        }
        if (callback) callback();
    });
}

// Load timer state
// 加载计时器状态
function loadTimerState() {
    chrome.storage.local.get('pomodoroTimerState', (result) => {
        if (result.pomodoroTimerState) {
            restoreState(result.pomodoroTimerState);
        } else {
            // If no saved state, initialize default values
            // 如果没有保存的状态，初始化默认值
            // Ensure settings are loaded
            // 确保settings已加载
            if (timerState.settings) {
                timerState.remainingTime = getTotalTime();
            } else {
                // If settings not loaded yet, wait for settings to load before setting
                // 如果settings还没加载，等待settings加载完成后再设置
                timerState.remainingTime = defaultSettings.pomodoroTime * 60;
            }
            updateBadge(true);
        }
    });
}

// Restore state
// 恢复状态
function restoreState(savedState) {
    timerState.currentPhase = savedState.currentPhase || PHASES.POMODORO;
    timerState.currentCycle = savedState.currentCycle || 0;
    timerState.isRunning = savedState.isRunning || false;
    timerState.isPaused = savedState.isPaused || false;
    timerState.saveStateCounter = 0;
    
    if (timerState.isRunning && !timerState.isPaused && savedState.savedAt) {
        const elapsedSinceSave = Math.floor((Date.now() - savedState.savedAt) / 1000);
        const savedRemaining = savedState.remainingTime || getTotalTime();
        timerState.remainingTime = Math.max(0, savedRemaining - elapsedSinceSave);
        
        if (timerState.remainingTime <= 0) {
            timerState.isRunning = false;
            timerState.isPaused = false;
            nextPhase();
            chrome.storage.local.remove('pomodoroTimerState');
            updateBadge(true);
        } else {
            timerState.startTime = Date.now() - (getTotalTime() - timerState.remainingTime) * 1000;
            startTimerInterval();
        }
    } else {
        timerState.remainingTime = savedState.remainingTime || getTotalTime();
        timerState.startTime = savedState.startTime || null;
        updateBadge(true);
    }
}

// Get total time
// 获取总时间
function getTotalTime() {
    const settings = timerState.settings || defaultSettings;
    switch (timerState.currentPhase) {
        case PHASES.POMODORO:
            return settings.pomodoroTime * 60;
        case PHASES.SHORT_BREAK:
            return settings.shortBreakTime * 60;
        case PHASES.LONG_BREAK:
            return settings.longBreakTime * 60;
        default:
            return 25 * 60;
    }
}

// Save state
// 保存状态
function saveState() {
    const state = {
        startTime: timerState.startTime,
        remainingTime: timerState.remainingTime,
        isRunning: timerState.isRunning,
        isPaused: timerState.isPaused,
        currentPhase: timerState.currentPhase,
        currentCycle: timerState.currentCycle,
        savedAt: Date.now()
    };
    chrome.storage.local.set({ pomodoroTimerState: state });
}

// Start timer (internal function, used to start the interval)
// 开始计时器（内部函数，用于启动定时器）
function startTimerInterval() {
    if (timerState.timer) {
        clearInterval(timerState.timer);
    }
    // Initialize badge and counter
    // 初始化badge和计数器
    timerState.badgeUpdateCounter = 0;
    updateBadge(true);
    timerState.timer = setInterval(() => {
        tick();
    }, 100);
}

// Stop timer
// 停止计时器
function stopTimer() {
    if (timerState.timer) {
        clearInterval(timerState.timer);
        timerState.timer = null;
    }
}

// Update icon badge
// 更新图标badge
function updateBadge(force = false) {
    if (timerState.isRunning && !timerState.isPaused) {
        // Running: show remaining time (minutes)
        // 运行中：显示剩余时间（分钟）
        const minutes = Math.ceil(timerState.remainingTime / 60);
        const badgeText = minutes > 0 ? String(minutes) : '0';
        
        // Set color based on phase
        // 根据阶段设置颜色
        let badgeColor = '#4CAF50'; // Default green
        // 默认绿色
        switch (timerState.currentPhase) {
            case PHASES.POMODORO:
                badgeColor = '#F44336'; // Red - Pomodoro
                // 红色 - 番茄钟
                break;
            case PHASES.SHORT_BREAK:
                badgeColor = '#4CAF50'; // Green - Short break
                // 绿色 - 小休
                break;
            case PHASES.LONG_BREAK:
                badgeColor = '#2196F3'; // Blue - Long break
                // 蓝色 - 大休
                break;
        }
        
        chrome.action.setBadgeText({ text: badgeText });
        chrome.action.setBadgeBackgroundColor({ color: badgeColor });
    } else if (timerState.isPaused) {
        // Paused: show remaining time but use gray to indicate paused state
        // 暂停：显示剩余时间但用灰色表示暂停状态
        const minutes = Math.ceil(timerState.remainingTime / 60);
        const badgeText = minutes > 0 ? String(minutes) : '0';
        chrome.action.setBadgeText({ text: badgeText });
        chrome.action.setBadgeBackgroundColor({ color: '#757575' }); // Gray indicates paused
        // 灰色表示暂停
    } else {
        // Not running: clear badge
        // 未运行：清除badge
        chrome.action.setBadgeText({ text: '' });
    }
}

// Timer tick
// 计时器tick
function tick() {
    const elapsed = Math.floor((Date.now() - timerState.startTime) / 1000);
    timerState.remainingTime = Math.max(0, getTotalTime() - elapsed);
    
    // Update badge every 5 seconds (every 50 ticks, since tick runs every 100ms)
    // 每5秒更新一次badge（每50次tick，因为tick每100ms执行一次）
    timerState.badgeUpdateCounter++;
    if (timerState.badgeUpdateCounter >= 50 || timerState.remainingTime <= 0) {
        updateBadge();
        timerState.badgeUpdateCounter = 0;
    }
    
    // Notify popup to update (if popup is open)
    // 通知popup更新（如果有打开的popup）
    notifyPopup('timerUpdate', {
        remainingTime: timerState.remainingTime,
        currentPhase: timerState.currentPhase,
        currentCycle: timerState.currentCycle,
        isRunning: timerState.isRunning,
        isPaused: timerState.isPaused
    });
    
    if (timerState.remainingTime <= 0) {
        completePhase();
    } else {
        // Save state every 5 seconds
        // 每5秒保存一次状态
        timerState.saveStateCounter++;
        if (timerState.saveStateCounter >= 50) {
            saveState();
            timerState.saveStateCounter = 0;
        }
    }
}

// Complete phase
// 完成阶段
function completePhase() {
    stopTimer();
    timerState.isRunning = false;
    timerState.isPaused = false;
    
    const completedPhase = timerState.currentPhase;
    
    // Play alert sound (cannot play sound in background, but can use notifications)
    // 播放提醒声音（在background中无法播放声音，但可以通过通知）
    // Show notification
    // 显示通知
    showNotification(completedPhase);
    
    // Move to next phase
    // 进入下一阶段
    nextPhase();
    
    // Update badge
    // 更新badge
    updateBadge(true);
    
    // Notify popup
    // 通知popup
    notifyPopup('phaseComplete', {
        currentPhase: timerState.currentPhase,
        currentCycle: timerState.currentCycle,
        remainingTime: timerState.remainingTime
    });
    
    saveState();
}

// Next phase
// 下一阶段
function nextPhase() {
    const settings = timerState.settings || defaultSettings;
    
    if (timerState.currentPhase === PHASES.POMODORO) {
        timerState.currentCycle++;
        if (timerState.currentCycle >= settings.cyclesBeforeLongBreak) {
            timerState.currentPhase = PHASES.LONG_BREAK;
        } else {
            timerState.currentPhase = PHASES.SHORT_BREAK;
        }
    } else {
        if (timerState.currentCycle >= settings.cyclesBeforeLongBreak) {
            timerState.currentCycle = 0;
        }
        timerState.currentPhase = PHASES.POMODORO;
    }
    
    timerState.remainingTime = getTotalTime();
}

// Show notification
// 显示通知
function showNotification(phase) {
    const settings = timerState.settings || defaultSettings;
    if (!settings.enableNotification) return;
    
    let title = '';
    let body = '';
    
    switch (phase) {
        case PHASES.POMODORO:
            title = bgI18n.t('pomodoroComplete');
            body = bgI18n.t('timeForBreak');
            break;
        case PHASES.SHORT_BREAK:
            title = bgI18n.t('shortBreakOver');
            body = bgI18n.t('readyToWork');
            break;
        case PHASES.LONG_BREAK:
            title = bgI18n.t('longBreakOver');
            body = bgI18n.t('readyToWork');
            break;
    }
    
    chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon48.png'),
        title: title,
        message: body,
        requireInteraction: true,
        priority: 2
    });
}

// Notify popup to update
// 通知popup更新
function notifyPopup(action, data) {
    chrome.runtime.sendMessage({
        action: action,
        data: data
    }).catch(() => {
        // Ignore errors when popup is not open
        // popup未打开时忽略错误
    });
}

// Handle messages from popup
// 处理来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'getState':
            // Ensure settings are loaded
            // 确保settings已加载
            if (!timerState.settings) {
                loadSettings(() => {
                    sendResponse({
                        remainingTime: timerState.remainingTime || getTotalTime(),
                        currentPhase: timerState.currentPhase,
                        currentCycle: timerState.currentCycle,
                        isRunning: timerState.isRunning,
                        isPaused: timerState.isPaused,
                        settings: timerState.settings || defaultSettings
                    });
                });
                return true; // Keep message channel open
                // 保持消息通道开放
            }
            sendResponse({
                remainingTime: timerState.remainingTime || getTotalTime(),
                currentPhase: timerState.currentPhase,
                currentCycle: timerState.currentCycle,
                isRunning: timerState.isRunning,
                isPaused: timerState.isPaused,
                settings: timerState.settings || defaultSettings
            });
            break;
            
        case 'start':
            console.log('Background received start message, phase:', request.phase);
            if (request.phase) {
                startWithPhase(request.phase);
            } else {
                startTimer();
            }
            sendResponse({ success: true });
            break;
            
        case 'pause':
            pauseTimer();
            sendResponse({ success: true });
            break;
            
        case 'reset':
            resetTimer();
            sendResponse({ success: true });
            break;
            
        case 'settingsUpdated':
            loadSettings(() => {
                // If running, recalculate remaining time
                // 如果正在运行，重新计算剩余时间
                if (timerState.isRunning && !timerState.isPaused) {
                    const total = getTotalTime();
                    const elapsed = Math.floor((Date.now() - timerState.startTime) / 1000);
                    timerState.remainingTime = Math.max(0, total - elapsed);
                }
            });
            sendResponse({ success: true });
            break;
            
        default:
            sendResponse({ success: false });
    }
    return true; // Keep message channel open
    // 保持消息通道开放
});

// Start timer
// 开始计时
function startTimer() {
    console.log('startTimer called, settings:', timerState.settings, 'isPaused:', timerState.isPaused);
    // Ensure settings are loaded
    // 确保设置已加载
    if (!timerState.settings) {
        console.log('Settings not loaded, loading...');
        loadSettings(() => {
            startTimer();
        });
        return;
    }
    
    if (timerState.isPaused) {
        // Resume from paused state
        // 从暂停状态恢复
        console.log('Resuming from pause');
        timerState.isPaused = false;
        // If remaining time is 0 or invalid, restart
        // 如果剩余时间为0或无效，重新开始
        if (timerState.remainingTime <= 0) {
            timerState.startTime = Date.now();
            timerState.remainingTime = getTotalTime();
        } else {
            timerState.startTime = Date.now() - (getTotalTime() - timerState.remainingTime) * 1000;
        }
    } else {
        // New start
        // 新开始
        console.log('Starting new timer');
        timerState.startTime = Date.now();
        timerState.remainingTime = getTotalTime();
    }
    
    timerState.isRunning = true;
    timerState.saveStateCounter = 0;
    startTimerInterval();
    saveState();
    
    console.log('Timer started, remainingTime:', timerState.remainingTime, 'phase:', timerState.currentPhase);
    notifyPopup('timerStarted', {
        remainingTime: timerState.remainingTime,
        currentPhase: timerState.currentPhase
    });
}

// Start with specified phase
// 使用指定阶段开始
function startWithPhase(phase) {
    // Ensure settings are loaded
    // 确保设置已加载
    if (!timerState.settings) {
        loadSettings(() => {
            startWithPhase(phase);
        });
        return;
    }
    
    if (timerState.isRunning) {
        pauseTimer();
    }
    
    switch(phase) {
        case 'pomodoro':
            timerState.currentPhase = PHASES.POMODORO;
            break;
        case 'shortBreak':
            timerState.currentPhase = PHASES.SHORT_BREAK;
            break;
        case 'longBreak':
            timerState.currentPhase = PHASES.LONG_BREAK;
            break;
        default:
            return;
    }
    
    timerState.isPaused = false;
    timerState.remainingTime = getTotalTime();
    timerState.startTime = Date.now();
    timerState.isRunning = true;
    timerState.saveStateCounter = 0;
    startTimerInterval();
    saveState();
    
    notifyPopup('timerStarted', {
        remainingTime: timerState.remainingTime,
        currentPhase: timerState.currentPhase
    });
}

// Pause timer
// 暂停计时
function pauseTimer() {
    timerState.isRunning = false;
    timerState.isPaused = true;
    stopTimer();
    saveState();
    
    // Update badge (force update to show paused state)
    // 更新badge（强制更新以显示暂停状态）
    updateBadge(true);
    
    notifyPopup('timerPaused', {
        remainingTime: timerState.remainingTime
    });
}

// Reset timer
// 重置计时器
function resetTimer() {
    timerState.isRunning = false;
    timerState.isPaused = false;
    stopTimer();
    timerState.currentPhase = PHASES.POMODORO;
    timerState.currentCycle = 0;
    timerState.remainingTime = getTotalTime();
    chrome.storage.local.remove('pomodoroTimerState');
    
    // Update badge (force update to clear badge)
    // 更新badge（强制更新以清除badge）
    updateBadge(true);
    
    notifyPopup('timerReset', {
        remainingTime: timerState.remainingTime,
        currentPhase: timerState.currentPhase,
        currentCycle: timerState.currentCycle
    });
}

// Handle notification click
// 处理通知点击
chrome.notifications.onClicked.addListener((notificationId) => {
    chrome.notifications.clear(notificationId);
    chrome.windows.getCurrent((win) => {
        if (win) {
            chrome.windows.update(win.id, { focused: true });
        }
    });
});

// Handle notification close
// 处理通知关闭
chrome.notifications.onClosed.addListener((notificationId, byUser) => {
    // Handle when notification is closed
    // 通知被关闭时的处理
});


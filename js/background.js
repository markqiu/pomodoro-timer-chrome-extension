// Chrome插件后台服务
// 用于处理通知和后台任务，以及计时器逻辑

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
    badgeUpdateCounter: 0 // badge更新计数器，每50次tick（5秒）更新一次
};

const PHASES = {
    POMODORO: 'pomodoro',
    SHORT_BREAK: 'shortBreak',
    LONG_BREAK: 'longBreak'
};

// 默认设置
const defaultSettings = {
    pomodoroTime: 25,
    shortBreakTime: 5,
    longBreakTime: 15,
    cyclesBeforeLongBreak: 4,
    enableSound: true,
    enableNotification: true
};

// 初始化
chrome.runtime.onInstalled.addListener(() => {
    console.log('极简番茄钟已安装');
    loadSettings(() => {
        loadTimerState();
    });
});

// 启动时也加载状态
chrome.runtime.onStartup.addListener(() => {
    loadSettings(() => {
        loadTimerState();
    });
});

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

// 加载计时器状态
function loadTimerState() {
    chrome.storage.local.get('pomodoroTimerState', (result) => {
        if (result.pomodoroTimerState) {
            restoreState(result.pomodoroTimerState);
        } else {
            // 如果没有保存的状态，初始化默认值
            // 确保settings已加载
            if (timerState.settings) {
                timerState.remainingTime = getTotalTime();
            } else {
                // 如果settings还没加载，等待settings加载完成后再设置
                timerState.remainingTime = defaultSettings.pomodoroTime * 60;
            }
            updateBadge(true);
        }
    });
}

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

// 开始计时器（内部函数，用于启动定时器）
function startTimerInterval() {
    if (timerState.timer) {
        clearInterval(timerState.timer);
    }
    // 初始化badge和计数器
    timerState.badgeUpdateCounter = 0;
    updateBadge(true);
    timerState.timer = setInterval(() => {
        tick();
    }, 100);
}

// 停止计时器
function stopTimer() {
    if (timerState.timer) {
        clearInterval(timerState.timer);
        timerState.timer = null;
    }
}

// 更新图标badge
function updateBadge(force = false) {
    if (timerState.isRunning && !timerState.isPaused) {
        // 运行中：显示剩余时间（分钟）
        const minutes = Math.ceil(timerState.remainingTime / 60);
        const badgeText = minutes > 0 ? String(minutes) : '0';
        
        // 根据阶段设置颜色
        let badgeColor = '#4CAF50'; // 默认绿色
        switch (timerState.currentPhase) {
            case PHASES.POMODORO:
                badgeColor = '#F44336'; // 红色 - 番茄钟
                break;
            case PHASES.SHORT_BREAK:
                badgeColor = '#4CAF50'; // 绿色 - 小休
                break;
            case PHASES.LONG_BREAK:
                badgeColor = '#2196F3'; // 蓝色 - 大休
                break;
        }
        
        chrome.action.setBadgeText({ text: badgeText });
        chrome.action.setBadgeBackgroundColor({ color: badgeColor });
    } else if (timerState.isPaused) {
        // 暂停：显示剩余时间但用灰色表示暂停状态
        const minutes = Math.ceil(timerState.remainingTime / 60);
        const badgeText = minutes > 0 ? String(minutes) : '0';
        chrome.action.setBadgeText({ text: badgeText });
        chrome.action.setBadgeBackgroundColor({ color: '#757575' }); // 灰色表示暂停
    } else {
        // 未运行：清除badge
        chrome.action.setBadgeText({ text: '' });
    }
}

// 计时器tick
function tick() {
    const elapsed = Math.floor((Date.now() - timerState.startTime) / 1000);
    timerState.remainingTime = Math.max(0, getTotalTime() - elapsed);
    
    // 每5秒更新一次badge（每50次tick，因为tick每100ms执行一次）
    timerState.badgeUpdateCounter++;
    if (timerState.badgeUpdateCounter >= 50 || timerState.remainingTime <= 0) {
        updateBadge();
        timerState.badgeUpdateCounter = 0;
    }
    
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
        // 每5秒保存一次状态
        timerState.saveStateCounter++;
        if (timerState.saveStateCounter >= 50) {
            saveState();
            timerState.saveStateCounter = 0;
        }
    }
}

// 完成阶段
function completePhase() {
    stopTimer();
    timerState.isRunning = false;
    timerState.isPaused = false;
    
    const completedPhase = timerState.currentPhase;
    
    // 播放提醒声音（在background中无法播放声音，但可以通过通知）
    // 显示通知
    showNotification(completedPhase);
    
    // 进入下一阶段
    nextPhase();
    
    // 更新badge
    updateBadge(true);
    
    // 通知popup
    notifyPopup('phaseComplete', {
        currentPhase: timerState.currentPhase,
        currentCycle: timerState.currentCycle,
        remainingTime: timerState.remainingTime
    });
    
    saveState();
}

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

// 显示通知
function showNotification(phase) {
    const settings = timerState.settings || defaultSettings;
    if (!settings.enableNotification) return;
    
    let title = '';
    let body = '';
    
    switch (phase) {
        case PHASES.POMODORO:
            title = '番茄钟完成！';
            body = '休息时间到！';
            break;
        case PHASES.SHORT_BREAK:
            title = '小休结束！';
            body = '准备开始工作';
            break;
        case PHASES.LONG_BREAK:
            title = '大休结束！';
            body = '准备开始工作';
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

// 通知popup更新
function notifyPopup(action, data) {
    chrome.runtime.sendMessage({
        action: action,
        data: data
    }).catch(() => {
        // popup未打开时忽略错误
    });
}

// 处理来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'getState':
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
                return true; // 保持消息通道开放
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
    return true; // 保持消息通道开放
});

// 开始计时
function startTimer() {
    console.log('startTimer called, settings:', timerState.settings, 'isPaused:', timerState.isPaused);
    // 确保设置已加载
    if (!timerState.settings) {
        console.log('Settings not loaded, loading...');
        loadSettings(() => {
            startTimer();
        });
        return;
    }
    
    if (timerState.isPaused) {
        // 从暂停状态恢复
        console.log('Resuming from pause');
        timerState.isPaused = false;
        // 如果剩余时间为0或无效，重新开始
        if (timerState.remainingTime <= 0) {
            timerState.startTime = Date.now();
            timerState.remainingTime = getTotalTime();
        } else {
            timerState.startTime = Date.now() - (getTotalTime() - timerState.remainingTime) * 1000;
        }
    } else {
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

// 使用指定阶段开始
function startWithPhase(phase) {
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

// 暂停计时
function pauseTimer() {
    timerState.isRunning = false;
    timerState.isPaused = true;
    stopTimer();
    saveState();
    
    // 更新badge（强制更新以显示暂停状态）
    updateBadge(true);
    
    notifyPopup('timerPaused', {
        remainingTime: timerState.remainingTime
    });
}

// 重置计时器
function resetTimer() {
    timerState.isRunning = false;
    timerState.isPaused = false;
    stopTimer();
    timerState.currentPhase = PHASES.POMODORO;
    timerState.currentCycle = 0;
    timerState.remainingTime = getTotalTime();
    chrome.storage.local.remove('pomodoroTimerState');
    
    // 更新badge（强制更新以清除badge）
    updateBadge(true);
    
    notifyPopup('timerReset', {
        remainingTime: timerState.remainingTime,
        currentPhase: timerState.currentPhase,
        currentCycle: timerState.currentCycle
    });
}

// 处理通知点击
chrome.notifications.onClicked.addListener((notificationId) => {
    chrome.notifications.clear(notificationId);
    chrome.windows.getCurrent((win) => {
        if (win) {
            chrome.windows.update(win.id, { focused: true });
        }
    });
});

// 处理通知关闭
chrome.notifications.onClosed.addListener((notificationId, byUser) => {
    // 通知被关闭时的处理
});


/**
 * 测试环境 setup - mock 微信、Cocos、浏览器环境
 */

// Mock 微信小程序环境
const mockWx = {
    getSystemInfoSync: () => ({
        screenWidth: 375,
        screenHeight: 750,
    }),
    createBannerAd: (opts: any) => ({
        show: () => Promise.resolve(),
        hide: () => {},
        destroy: () => {},
        onLoad: (cb: any) => {},
        onError: (cb: any) => {},
        onResize: (cb: any) => {},
        style: { top: 650 },
    }),
    createRewardedVideoAd: (opts: any) => ({
        show: () => Promise.resolve(),
        load: () => Promise.resolve(),
        destroy: () => {},
        onLoad: (cb: any) => {},
        onError: (cb: any) => {},
        onClose: (cb: any) => {},
    }),
    createInterstitialAd: (opts: any) => ({
        show: () => Promise.resolve(),
        load: () => Promise.resolve(),
        destroy: () => {},
        onLoad: (cb: any) => {},
        onError: (cb: any) => {},
        onClose: (cb: any) => {},
    }),
    createCustomAd: (opts: any) => ({
        show: () => {},
        destroy: () => {},
        onLoad: (cb: any) => {},
        onError: (cb: any) => {},
    }),
    request: (opts: any) => {
        if (opts.success) opts.success({ statusCode: 200, data: {} });
    },
    getFileSystemManager: () => ({
        readFile: (opts: any) => {
            if (opts.success) opts.success({ data: '{}' });
        },
    }),
    env: {
        USER_DATA_PATH: '/user/data',
    },
};

// Mock Cocos Creator 环境
const mockCc = {
    resources: {
        load: (path: string, type: any, cb: any) => {
            if (cb) cb(null, { json: {} });
        },
    },
};

// 根据测试需要设置全局环境
export function setEnv(env: 'wechat' | 'cocos' | 'browser' | 'empty') {
    // 清理全局对象
    delete (global as any).wx;
    delete (global as any).cc;
    delete (global as any).fetch;
    delete (global as any).XMLHttpRequest;

    switch (env) {
        case 'wechat':
            (global as any).wx = mockWx;
            break;
        case 'cocos':
            (global as any).cc = mockCc;
            break;
        case 'browser':
            (global as any).fetch = () => Promise.resolve({
                ok: true,
                json: () => ({}),
            });
            (global as any).XMLHttpRequest = class {
                open() {}
                send() {}
                onload: any;
                onerror: any;
                status = 200;
                responseText = '{}';
            };
            break;
        case 'empty':
            // 空环境，测试非微信/非浏览器情况
            break;
    }
}

// 重置 AdConfigManager 和 AdManager 单例
export function resetSingletons() {
    // 通过反射重置单例
    const AdConfigManager = require('../AdConfigManager').AdConfigManager;
    if (AdConfigManager && (AdConfigManager as any).instance) {
        (AdConfigManager as any).instance = null;
    }

    const AdManager = require('../AdManager').AdManager;
    if (AdManager && (AdManager as any).instance) {
        (AdManager as any).instance = null;
    }
}

export { mockWx, mockCc };

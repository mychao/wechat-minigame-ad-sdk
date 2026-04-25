/**
 * AdConfigManager 单元测试
 * 测试配置加载、优先级、环境变量适配等功能
 */
import { AdConfigManager } from '../AdConfigManager';
import { AdSDKConfig, AppAdConfig } from '../types';
import { setEnv, resetSingletons } from './setup';

// Mock 配置数据
const mockConfig1: AdSDKConfig = {
    'wx-app-111': {
        banner: 'adunit-111-banner',
        interstitial: 'adunit-111-interstitial',
        rewardedVideo: {
            'gold': 'adunit-111-gold',
            'revive': 'adunit-111-revive',
        },
    },
    'wx-app-222': {
        // 没有 banner 配置
        rewardedVideo: {
            'coin': 'adunit-222-coin',
        },
    },
};

const mockConfig2: AdSDKConfig = {
    'wx-app-111': {
        banner: 'adunit-override-banner',  // 覆盖 banner
        interstitial: 'adunit-override-interstitial',
    },
};

const mockConfigFull: AdSDKConfig = {
    'wx-game-1': {
        banner: 'adunit-game1-banner',
        interstitial: 'adunit-game1-interstitial',
        rewardedVideo: {
            'gold': 'adunit-game1-gold',
            'revive': 'adunit-game1-revive',
            'speedUp': 'adunit-game1-speed',
        },
    },
    'wx-game-2': {
        banner: 'adunit-game2-banner',
        rewardedVideo: {
            'coin': 'adunit-game2-coin',
            'boost': 'adunit-game2-boost',
        },
    },
    'wx-game-3': {
        interstitial: 'adunit-game3-interstitial',
        rewardedVideo: {
            'hint': 'adunit-game3-hint',
        },
    },
};

// ======== 基础功能测试 =======

describe('AdConfigManager - 基础功能', () => {
    beforeEach(() => {
        resetSingletons();
        setEnv('empty');
    });

    test('单例模式：多次获取实例返回同一对象', () => {
        const a = AdConfigManager.getInstance();
        const b = AdConfigManager.getInstance();
        expect(a).toBe(b);
    });

    test('初始化后 appId 正确设置', async () => {
        const mgr = AdConfigManager.getInstance();
        await mgr.init({
            appId: 'wx-app-111',
            localConfig: mockConfig1,
        });

        expect(mgr.getAppId()).toBe('wx-app-111');
    });

    test('getConfig 返回正确配置', async () => {
        const mgr = AdConfigManager.getInstance();
        await mgr.init({
            appId: 'wx-app-111',
            localConfig: mockConfig1,
        });

        const config = mgr.getConfig();
        expect(config).not.toBeNull();
        expect(config!.banner).toBe('adunit-111-banner');
        expect(config!.interstitial).toBe('adunit-111-interstitial');
        expect(config!.rewardedVideo!['gold']).toBe('adunit-111-gold');
    });

    test('getConfig 对未知 appId 返回 null', async () => {
        const mgr = AdConfigManager.getInstance();
        await mgr.init({
            appId: 'wx-unknown',
            localConfig: mockConfig1,
        });

        expect(mgr.getConfig()).toBeNull();
    });
});

// ======== 配置优先级测试 =======

describe('AdConfigManager - 配置优先级', () => {
    beforeEach(() => {
        resetSingletons();
        setEnv('empty');
    });

    test('优先级 1：测试模式最高', async () => {
        const mgr = AdConfigManager.getInstance();
        await mgr.init({
            appId: 'wx-app-111',
            localConfig: mockConfig1,
            testMode: true,
        });

        const config = mgr.getConfig();
        // 测试模式返回测试配置，不是 localConfig
        expect(config!.banner).toBe('adunit-0000000000000000');
        expect(config!.rewardedVideo!['gold']).toBe('adunit-0000000000000001');
    });

    test('优先级 2：本地配置对象次之', async () => {
        const mgr = AdConfigManager.getInstance();
        await mgr.init({
            appId: 'wx-app-111',
            localConfig: mockConfig1,
            // 不开启测试模式
        });

        const config = mgr.getConfig();
        expect(config!.banner).toBe('adunit-111-banner');
    });

    test('本地配置对象覆盖文件配置', async () => {
        const mgr = AdConfigManager.getInstance();
        await mgr.init({
            appId: 'wx-app-111',
            localConfig: mockConfig2,  // 包含覆盖的 banner
        });

        const config = mgr.getConfig();
        // localConfig 中的值应该生效
        expect(config!.banner).toBe('adunit-override-banner');
        // 但文件配置中不存在的字段不应该有值
        // （实际上 mockConfig2 中没有 rewardedVideo，所以应该是 undefined）
    });

    test('未配置任何内容时返回 null', async () => {
        const mgr = AdConfigManager.getInstance();
        await mgr.init({
            appId: 'wx-app-111',
        });

        expect(mgr.getConfig()).toBeNull();
    });
});

// ======== 广告位获取测试 =======

describe('AdConfigManager - 广告位获取', () => {
    beforeEach(() => {
        resetSingletons();
        setEnv('empty');
    });

    test('getBannerAdUnit 返回正确 ID', async () => {
        const mgr = AdConfigManager.getInstance();
        await mgr.init({ appId: 'wx-app-111', localConfig: mockConfig1 });

        expect(mgr.getBannerAdUnit()).toBe('adunit-111-banner');
    });

    test('getInterstitialAdUnit 返回正确 ID', async () => {
        const mgr = AdConfigManager.getInstance();
        await mgr.init({ appId: 'wx-app-111', localConfig: mockConfig1 });

        expect(mgr.getInterstitialAdUnit()).toBe('adunit-111-interstitial');
    });

    test('getRewardedVideoAdUnit 按位置返回正确 ID', async () => {
        const mgr = AdConfigManager.getInstance();
        await mgr.init({ appId: 'wx-app-111', localConfig: mockConfig1 });

        expect(mgr.getRewardedVideoAdUnit('gold')).toBe('adunit-111-gold');
        expect(mgr.getRewardedVideoAdUnit('revive')).toBe('adunit-111-revive');
    });

    test('getRewardedVideoAdUnit 对未知位置返回 undefined', async () => {
        const mgr = AdConfigManager.getInstance();
        await mgr.init({ appId: 'wx-app-111', localConfig: mockConfig1 });

        expect(mgr.getRewardedVideoAdUnit('unknown')).toBeUndefined();
    });

    test('无 banner 配置时 getBannerAdUnit 返回 undefined', async () => {
        const mgr = AdConfigManager.getInstance();
        await mgr.init({ appId: 'wx-app-222', localConfig: mockConfig1 });

        expect(mgr.getBannerAdUnit()).toBeUndefined();
    });
});

// ======== 动态更新测试 =======

describe('AdConfigManager - 动态更新', () => {
    beforeEach(() => {
        resetSingletons();
        setEnv('empty');
    });

    test('setRewardedVideoAdUnit 可以动态设置广告位', async () => {
        const mgr = AdConfigManager.getInstance();
        await mgr.init({ appId: 'wx-app-111', localConfig: mockConfig1 });

        mgr.setRewardedVideoAdUnit('newPos', 'adunit-new-pos');
        expect(mgr.getRewardedVideoAdUnit('newPos')).toBe('adunit-new-pos');
    });

    test('setTestMode 切换测试模式', async () => {
        const mgr = AdConfigManager.getInstance();
        await mgr.init({
            appId: 'wx-app-111',
            localConfig: mockConfig1,
            testMode: false,
        });

        // 正常模式：返回本地配置
        expect(mgr.getBannerAdUnit()).toBe('adunit-111-banner');

        // 切换到测试模式
        mgr.setTestMode(true);
        expect(mgr.getBannerAdUnit()).toBe('adunit-0000000000000000');

        // 切换回正常模式
        mgr.setTestMode(false);
        expect(mgr.getBannerAdUnit()).toBe('adunit-111-banner');
    });
});

// ======== 多小游戏支持测试 =======

describe('AdConfigManager - 多小游戏支持', () => {
    beforeEach(() => {
        resetSingletons();
        setEnv('empty');
    });

    test('不同 appId 获取各自配置', async () => {
        const mgr = AdConfigManager.getInstance();
        await mgr.init({
            appId: 'wx-game-1',
            localConfig: mockConfigFull,
        });

        // 游戏1 的配置
        expect(mgr.getBannerAdUnit()).toBe('adunit-game1-banner');
        expect(mgr.getRewardedVideoAdUnit('gold')).toBe('adunit-game1-gold');
        expect(mgr.getRewardedVideoAdUnit('speedUp')).toBe('adunit-game1-speed');
    });

    test('切换 appId 后获取对应配置', async () => {
        const mgr = AdConfigManager.getInstance();
        await mgr.init({
            appId: 'wx-game-2',
            localConfig: mockConfigFull,
        });

        expect(mgr.getBannerAdUnit()).toBe('adunit-game2-banner');
        expect(mgr.getRewardedVideoAdUnit('coin')).toBe('adunit-game2-coin');
        expect(mgr.getRewardedVideoAdUnit('boost')).toBe('adunit-game2-boost');
        // game-2 没有 interstitial
        expect(mgr.getInterstitialAdUnit()).toBeUndefined();
    });

    test('三个小游戏配置互不干扰', async () => {
        const mgr = AdConfigManager.getInstance();
        await mgr.init({
            appId: 'wx-game-3',
            localConfig: mockConfigFull,
        });

        expect(mgr.getInterstitialAdUnit()).toBe('adunit-game3-interstitial');
        expect(mgr.getRewardedVideoAdUnit('hint')).toBe('adunit-game3-hint');
        // game-3 没有 banner
        expect(mgr.getBannerAdUnit()).toBeUndefined();
    });
});

// ======== 环境适配测试 =======

describe('AdConfigManager - 环境适配', () => {
    afterEach(() => {
        resetSingletons();
    });

    test('微信环境：wx 对象存在', async () => {
        setEnv('wechat');

        const mgr = AdConfigManager.getInstance();
        await mgr.init({ appId: 'wx-app-111' });

        // 不应该报错
        expect(mgr.getAppId()).toBe('wx-app-111');
    });

    test('Cocos 环境：cc 对象存在', async () => {
        setEnv('cocos');

        const mgr = AdConfigManager.getInstance();
        await mgr.init({ appId: 'wx-app-111' });

        expect(mgr.getAppId()).toBe('wx-app-111');
    });

    test('浏览器环境：fetch 存在', async () => {
        setEnv('browser');

        const mgr = AdConfigManager.getInstance();
        await mgr.init({ appId: 'wx-app-111' });

        expect(mgr.getAppId()).toBe('wx-app-111');
    });

    test('空环境：非微信非浏览器', async () => {
        setEnv('empty');

        const mgr = AdConfigManager.getInstance();
        await mgr.init({ appId: 'wx-app-111' });

        expect(mgr.getAppId()).toBe('wx-app-111');
        expect(mgr.getConfig()).toBeNull();
    });
});

// ======== getAllLocalConfig 测试 =======

describe('AdConfigManager - getAllLocalConfig', () => {
    beforeEach(() => {
        resetSingletons();
        setEnv('empty');
    });

    test('返回完整本地配置', async () => {
        const mgr = AdConfigManager.getInstance();
        await mgr.init({
            appId: 'wx-game-1',
            localConfig: mockConfigFull,
        });

        const all = mgr.getAllLocalConfig();
        expect(Object.keys(all)).toHaveLength(3);
        expect(all['wx-game-1'].banner).toBe('adunit-game1-banner');
        expect(all['wx-game-2'].banner).toBe('adunit-game2-banner');
        expect(all['wx-game-3'].interstitial).toBe('adunit-game3-interstitial');
    });
});

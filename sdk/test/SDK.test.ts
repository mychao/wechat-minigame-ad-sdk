/**
 * SDK 集成测试
 * 测试 AdSDK 初始化、配置加载、广告调用等完整流程
 */
import { AdSDK } from '../index';
import { AdConfigManager } from '../AdConfigManager';
import { setEnv, resetSingletons } from './setup';

const mockConfig = {
    'wx-sdk-test': {
        banner: 'adunit-sdk-banner',
        interstitial: 'adunit-sdk-interstitial',
        rewardedVideo: {
            'gold': 'adunit-sdk-gold',
            'revive': 'adunit-sdk-revive',
        },
    },
    'wx-sdk-test2': {
        banner: 'adunit-sdk-banner2',
        rewardedVideo: {
            'coin': 'adunit-sdk-coin',
        },
    },
};

describe('AdSDK - 初始化', () => {
    beforeEach(() => {
        resetSingletons();
        setEnv('wechat');
    });

    test('init 成功初始化 SDK', async () => {
        await AdSDK.init({
            appId: 'wx-sdk-test',
            localConfig: mockConfig,
        });

        expect(AdSDK.Config.getAppId()).toBe('wx-sdk-test');
    });

    test('init 后 AdManager 可用', async () => {
        await AdSDK.init({
            appId: 'wx-sdk-test',
            localConfig: mockConfig,
        });

        expect(AdSDK.AdManager).not.toBeNull();
    });

    test('未初始化时获取配置返回 null', () => {
        resetSingletons();
        setEnv('empty');

        const config = AdConfigManager.getInstance().getConfig();
        expect(config).toBeNull();
    });
});

describe('AdSDK - 配置优先级', () => {
    beforeEach(() => {
        resetSingletons();
        setEnv('wechat');
    });

    test('测试模式优先级最高', async () => {
        await AdSDK.init({
            appId: 'wx-sdk-test',
            localConfig: mockConfig,
            testMode: true,
        });

        // 测试模式应该返回测试配置
        const banner = AdSDK.Config.getBannerAdUnit();
        expect(banner).toBe('adunit-0000000000000000');
    });

    test('本地配置次之', async () => {
        await AdSDK.init({
            appId: 'wx-sdk-test',
            localConfig: mockConfig,
            testMode: false,
        });

        const banner = AdSDK.Config.getBannerAdUnit();
        expect(banner).toBe('adunit-sdk-banner');
    });

    test('未知 appId 返回 null', async () => {
        await AdSDK.init({
            appId: 'wx-unknown',
            localConfig: mockConfig,
        });

        const config = AdSDK.Config.getConfig();
        expect(config).toBeNull();
    });
});

describe('AdSDK - 多小游戏', () => {
    beforeEach(() => {
        resetSingletons();
        setEnv('wechat');
    });

    test('不同 appId 获取各自配置', async () => {
        // 初始化 game1
        await AdSDK.init({
            appId: 'wx-sdk-test',
            localConfig: mockConfig,
        });

        expect(AdSDK.Config.getBannerAdUnit()).toBe('adunit-sdk-banner');
        expect(AdSDK.Config.getRewardedVideoAdUnit('gold')).toBe('adunit-sdk-gold');

        // 重新初始化 game2（同一 SDK 实例）
        resetSingletons();
        await AdSDK.init({
            appId: 'wx-sdk-test2',
            localConfig: mockConfig,
        });

        expect(AdSDK.Config.getBannerAdUnit()).toBe('adunit-sdk-banner2');
        expect(AdSDK.Config.getRewardedVideoAdUnit('coin')).toBe('adunit-sdk-coin');
        // game2 没有 interstitial
        expect(AdSDK.Config.getInterstitialAdUnit()).toBeUndefined();
    });
});

describe('AdSDK - 广告调用', () => {
    beforeEach(() => {
        resetSingletons();
        setEnv('wechat');
    });

    test('showRewardedVideoAd 不报错', async () => {
        await AdSDK.init({
            appId: 'wx-sdk-test',
            localConfig: mockConfig,
        });

        expect(() => {
            AdSDK.AdManager.showRewardedVideoAd({
                position: 'gold',
                onReward: () => {},
            });
        }).not.toThrow();
    });

    test('showBannerAd 不报错', async () => {
        await AdSDK.init({
            appId: 'wx-sdk-test',
            localConfig: mockConfig,
        });

        expect(() => {
            AdSDK.AdManager.showBannerAd();
        }).not.toThrow();
    });

    test('showInterstitialAd 不报错', async () => {
        await AdSDK.init({
            appId: 'wx-sdk-test',
            localConfig: mockConfig,
        });

        expect(() => {
            AdSDK.AdManager.showInterstitialAd();
        }).not.toThrow();
    });

    test('非微信环境直接执行奖励回调', (done) => {
        resetSingletons();
        setEnv('empty');

        AdSDK.init({
            appId: 'wx-sdk-test',
            localConfig: mockConfig,
        }).then(() => {
            AdSDK.AdManager.showRewardedVideoAd({
                position: 'gold',
                onReward: () => {
                    // 非微信环境应该直接给奖励
                    expect(true).toBe(true);
                    done();
                },
                onFail: () => {
                    done.fail('不应该调用 onFail');
                },
            });
        });
    });
});

describe('AdSDK - 工具方法', () => {
    beforeEach(() => {
        resetSingletons();
        setEnv('wechat');
    });

    test('setTestMode 切换测试模式', async () => {
        await AdSDK.init({
            appId: 'wx-sdk-test',
            localConfig: mockConfig,
            testMode: false,
        });

        // 正常模式
        expect(AdSDK.Config.getBannerAdUnit()).toBe('adunit-sdk-banner');

        // 切换到测试模式
        AdSDK.setTestMode(true);
        expect(AdSDK.Config.getBannerAdUnit()).toBe('adunit-0000000000000000');

        // 切换回正常模式
        AdSDK.setTestMode(false);
        expect(AdSDK.Config.getBannerAdUnit()).toBe('adunit-sdk-banner');
    });

    test('destroyAll 不报错', async () => {
        await AdSDK.init({
            appId: 'wx-sdk-test',
            localConfig: mockConfig,
        });

        expect(() => {
            AdSDK.destroyAll();
        }).not.toThrow();
    });

    test('reloadLocalConfig 不报错', async () => {
        await AdSDK.init({
            appId: 'wx-sdk-test',
            localConfig: mockConfig,
        });

        expect(() => {
            AdSDK.reloadLocalConfig();
        }).not.toThrow();
    });
});

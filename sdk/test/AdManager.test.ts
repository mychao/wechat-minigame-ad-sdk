/**
 * AdManager 单元测试
 * 测试广告显示、回调、错误处理等功能
 */
import { AdManager } from '../AdManager';
import { AdConfigManager } from '../AdConfigManager';
import { setEnv, resetSingletons } from './setup';

// Mock 配置
const mockConfig = {
    'wx-test-app': {
        banner: 'adunit-banner-111',
        interstitial: 'adunit-interstitial-222',
        rewardedVideo: {
            'gold': 'adunit-rv-gold',
            'revive': 'adunit-rv-revive',
        },
    },
};

describe('AdManager - 基础功能', () => {
    beforeEach(() => {
        resetSingletons();
        setEnv('wechat');
    });

    test('单例模式：多次获取实例返回同一对象', () => {
        const a = AdManager.getInstance();
        const b = AdManager.getInstance();
        expect(a).toBe(b);
    });

    test('showBannerAd 在非微信环境不报错', () => {
        setEnv('empty');
        // 不应该抛出错误
        expect(() => {
            AdManager.getInstance().showBannerAd();
        }).not.toThrow();
    });

    test('hideBannerAd 不报错', () => {
        expect(() => {
            AdManager.getInstance().hideBannerAd();
        }).not.toThrow();
    });

    test('destroyBannerAd 不报错', () => {
        expect(() => {
            AdManager.getInstance().destroyBannerAd();
        }).not.toThrow();
    });

    test('destroyAllAds 不报错', () => {
        expect(() => {
            AdManager.getInstance().destroyAllAds();
        }).not.toThrow();
    });
});

describe('AdManager - 激励视频回调', () => {
    beforeEach(() => {
        resetSingletons();
        setEnv('wechat');
    });

    test('非微信环境直接执行奖励回调', (done) => {
        setEnv('empty');

        const manager = AdManager.getInstance();
        manager.showRewardedVideoAd({
            position: 'gold',
            onReward: () => {
                // 应该直接被调用
                expect(true).toBe(true);
                done();
            },
            onFail: () => {
                done.fail('不应该调用 onFail');
            },
        });
    });

    test('微信环境调用 showRewardedVideoAd', (done) => {
        (async () => {
            resetSingletons();
            setEnv('wechat');

            // 设置配置
            const configMgr = AdConfigManager.getInstance();
            await configMgr.init({
                appId: 'wx-test-app',
                localConfig: mockConfig,
            });

            const manager = AdManager.getInstance();

            // 不应该抛出错误
            expect(() => {
                manager.showRewardedVideoAd({
                    position: 'gold',
                    onReward: () => {},
                });
            }).not.toThrow();
            done();
        })().catch(done);
    });

    test('未知位置降级处理：直接给奖励', async () => {
        resetSingletons();
        setEnv('wechat');

        const configMgr = AdConfigManager.getInstance();
        await configMgr.init({
            appId: 'wx-test-app',
            localConfig: mockConfig,
        });

        const manager = AdManager.getInstance();
        await new Promise<void>((resolve) => {
            manager.showRewardedVideoAd({
                position: 'unknown-position',
                onReward: () => {
                    // 未知位置应该降级，直接给奖励
                    expect(true).toBe(true);
                    resolve();
                },
                onFail: () => {
                    fail('未知位置不应该调用 onFail');
                },
            });
        });

    });
});

describe('AdManager - 防止重复调用', () => {
    beforeEach(() => {
        resetSingletons();
        setEnv('empty');
    });

    test('连续调用 showRewardedVideoAd 防止重复', (done) => {
        const manager = AdManager.getInstance();
        let rewardCount = 0;

        // 第一次调用
        manager.showRewardedVideoAd({
            position: 'gold',
            onReward: () => {
                rewardCount++;
                if (rewardCount > 1) {
                    done.fail('不应该被调用多次');
                }
            },
        });

        // 立即第二次调用（应该被阻止）
        manager.showRewardedVideoAd({
            position: 'gold',
            onReward: () => {
                rewardCount++;
            },
        });

        setTimeout(() => {
            expect(rewardCount).toBe(1);
            done();
        }, 100);
    });
});

describe('AdManager - Banner 广告', () => {
    beforeEach(() => {
        resetSingletons();
        setEnv('wechat');
    });

    test('showBannerAd 需要配置', async () => {
        resetSingletons();
        setEnv('wechat');

        const configMgr = AdConfigManager.getInstance();
        await configMgr.init({
            appId: 'wx-test-app',
            localConfig: {
                'wx-test-app': {
                    // 没有 banner 配置
                    rewardedVideo: { 'gold': 'adunit-xxx' },
                },
            },
        });

        // 没有 banner 配置时不应该报错
        expect(() => {
            AdManager.getInstance().showBannerAd();
        }).not.toThrow();
    });

    test('showBannerAd 使用配置的 banner adUnitId', (done) => {
        (async () => {
            resetSingletons();
            setEnv('wechat');

            const configMgr = AdConfigManager.getInstance();
            await configMgr.init({
                appId: 'wx-test-app',
                localConfig: mockConfig,
            });

            // 不应该报错
            expect(() => {
                AdManager.getInstance().showBannerAd();
            }).not.toThrow();
            done();
        })().catch(done);
    });
});

describe('AdManager - 插屏广告', () => {
    beforeEach(() => {
        resetSingletons();
        setEnv('wechat');
    });

    test('showInterstitialAd 需要配置', async () => {
        resetSingletons();
        setEnv('wechat');

        const configMgr = AdConfigManager.getInstance();
        await configMgr.init({
            appId: 'wx-test-app',
            localConfig: {
                'wx-test-app': {
                    // 没有 interstitial 配置
                    rewardedVideo: { 'gold': 'adunit-xxx' },
                },
            },
        });

        // 没有插屏配置时不应该报错
        expect(() => {
            AdManager.getInstance().showInterstitialAd();
        }).not.toThrow();
    });

    test('showInterstitialAd 使用配置的 interstitial adUnitId', (done) => {
        (async () => {
            resetSingletons();
            setEnv('wechat');

            const configMgr = AdConfigManager.getInstance();
            await configMgr.init({
                appId: 'wx-test-app',
                localConfig: mockConfig,
            });

            expect(() => {
                AdManager.getInstance().showInterstitialAd();
            }).not.toThrow();
            done();
        })().catch(done);
    });
});

describe('AdManager - 原生模板广告', () => {
    beforeEach(() => {
        resetSingletons();
        setEnv('wechat');
    });

    test('createCustomAd 需要 adUnitId', () => {
        const result = AdManager.getInstance().createCustomAd({
            adUnitId: 'adunit-custom-123',
            left: 0,
            top: 0,
            width: 300,
        });

        // 应该返回 ad 对象
        expect(result).not.toBeNull();
    });

    test('非微信环境 createCustomAd 返回 null', () => {
        setEnv('empty');

        const result = AdManager.getInstance().createCustomAd({
            adUnitId: 'adunit-custom-123',
            left: 0,
            top: 0,
            width: 300,
        });

        expect(result).toBeNull();
    });
});

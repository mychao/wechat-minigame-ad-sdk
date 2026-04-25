/**
 * 微信小游戏广告 SDK - 广告管理器
 * 使用配置管理器按 appId 维度获取广告位配置
 */
import { AdConfigManager } from './AdConfigManager';
import { ShowRewardedVideoOptions, ShowBannerOptions, ShowCustomAdOptions } from './types';

export class AdManager {
    private static instance: AdManager = null!;

    // 广告实例
    private bannerAd: any = null;
    private interstitialAd: any = null;

    // 激励视频广告实例：adUnitId -> ad instance
    private rewardedVideoAds: Map<string, any> = new Map();

    // 激励视频回调
    private rewardCallback: (() => void) | null = null;
    private rewardFailCallback: ((err: any) => void) | null = null;

    // 是否正在显示激励视频（防止重复调用）
    private isShowingRewardedVideo: boolean = false;

    private constructor() {}

    static getInstance(): AdManager {
        if (!AdManager.instance) {
            AdManager.instance = new AdManager();
        }
        return AdManager.instance;
    }

    //#region Banner 广告

    /**
     * 显示 Banner 广告
     * @param options 显示选项
     */
    showBannerAd(options?: ShowBannerOptions): void {
        // @ts-ignore
        if (typeof wx === 'undefined') {
            console.warn('[AdManager] 非微信环境，无法显示 Banner 广告');
            return;
        }

        const configMgr = AdConfigManager.getInstance();
        const adUnitId = configMgr.getBannerAdUnit();
        if (!adUnitId) {
            console.warn('[AdManager] 未配置 Banner 广告位');
            return;
        }

        // 如果已存在，先销毁
        if (this.bannerAd) {
            this.bannerAd.destroy();
            this.bannerAd = null;
        }

        // 获取屏幕信息
        // @ts-ignore
        const systemInfo = wx.getSystemInfoSync();
        const screenWidth = systemInfo.screenWidth;
        const screenHeight = systemInfo.screenHeight;

        // 默认样式：底部居中
        const defaultStyle = {
            left: 0,
            top: screenHeight - 100,
            width: screenWidth,
        };

        const finalStyle = { ...defaultStyle, ...options };

        // 创建 Banner 广告
        // @ts-ignore
        this.bannerAd = wx.createBannerAd({
            adUnitId: adUnitId,
            style: finalStyle,
        });

        // 监听 Banner 广告加载成功
        this.bannerAd.onLoad(() => {
            console.log('[AdManager] Banner 广告加载成功');
        });

        // 监听 Banner 广告加载失败
        this.bannerAd.onError((err: any) => {
            console.error('[AdManager] Banner 广告加载失败', err);
        });

        // 监听 Banner 广告尺寸变化
        this.bannerAd.onResize((res: any) => {
            this.bannerAd.style.top = screenHeight - res.height;
        });

        // 显示广告
        this.bannerAd.show();
    }

    /**
     * 隐藏 Banner 广告
     */
    hideBannerAd(): void {
        if (this.bannerAd) {
            this.bannerAd.hide();
        }
    }

    /**
     * 销毁 Banner 广告
     */
    destroyBannerAd(): void {
        if (this.bannerAd) {
            this.bannerAd.destroy();
            this.bannerAd = null;
            console.log('[AdManager] Banner 广告已销毁');
        }
    }

    //#endregion

    //#region 激励视频广告（按位置指定广告位）

    /**
     * 显示激励视频广告
     * @param options 显示选项（包含 position、onReward、onFail）
     */
    showRewardedVideoAd(options: ShowRewardedVideoOptions): void {
        const { position, onReward, onFail } = options;

        if (this.isShowingRewardedVideo) {
            console.warn('[AdManager] 激励视频正在显示中，请稍候');
            return;
        }

        // @ts-ignore
        if (typeof wx === 'undefined') {
            console.warn('[AdManager] 非微信环境，直接给予奖励');
            this.isShowingRewardedVideo = true;
            onReward();
            // 延迟重置状态，确保同步的重复调用被阻止
            setTimeout(() => {
                this.isShowingRewardedVideo = false;
            }, 0);
            return;
        }

        // 从配置管理器获取该位置对应的广告位 ID
        const configMgr = AdConfigManager.getInstance();
        const adUnitId = configMgr.getRewardedVideoAdUnit(position);
        if (!adUnitId) {
            console.warn(`[AdManager] 位置 "${position}" 未配置激励视频广告位`);
            onReward(); // 降级处理：直接给奖励
            return;
        }

        // 获取或创建广告实例
        let ad = this.rewardedVideoAds.get(adUnitId);
        if (!ad) {
            ad = this.createRewardedVideoAdInstance(adUnitId);
        }

        if (!ad) {
            console.warn(`[AdManager] 广告位 "${adUnitId}" 初始化失败`);
            onReward(); // 降级处理
            return;
        }

        this.rewardCallback = onReward;
        this.rewardFailCallback = onFail || null;
        this.isShowingRewardedVideo = true;

        console.log(`[AdManager] 显示激励视频: 位置="${position}", 广告位="${adUnitId}"`);

        // 显示广告
        ad.show()
            .then(() => {
                // 显示成功
            })
            .catch((err: any) => {
                console.error(`[AdManager] 激励视频广告显示失败: ${adUnitId}`, err);

                // 尝试重新加载当前广告位
                ad.load()
                    .then(() => ad.show())
                    .catch((err2: any) => {
                        console.error(`[AdManager] 激励视频重新加载失败: ${adUnitId}`, err2);
                        this.isShowingRewardedVideo = false;

                        if (this.rewardFailCallback) {
                            this.rewardFailCallback(err2);
                            this.rewardFailCallback = null;
                            this.rewardCallback = null;
                        } else {
                            if (this.rewardCallback) {
                                this.rewardCallback();
                                this.rewardCallback = null;
                            }
                        }
                    });
            });
    }

    /**
     * 为指定广告位 ID 创建激励视频广告实例
     */
    private createRewardedVideoAdInstance(adUnitId: string): any {
        // @ts-ignore
        if (typeof wx === 'undefined') {
            return null;
        }

        // @ts-ignore
        const ad = wx.createRewardedVideoAd({
            adUnitId: adUnitId,
        });

        // 监听广告加载成功
        ad.onLoad(() => {
            console.log(`[AdManager] 激励视频广告加载成功: ${adUnitId}`);
        });

        // 监听广告加载失败
        ad.onError((err: any) => {
            console.error(`[AdManager] 激励视频广告加载失败: ${adUnitId}`, err);
        });

        // 监听广告关闭
        ad.onClose((res: any) => {
            if (res && res.isEnded) {
                console.log(`[AdManager] 用户看完激励视频: ${adUnitId}`);
                if (this.rewardCallback) {
                    this.rewardCallback();
                    this.rewardCallback = null;
                    this.rewardFailCallback = null;
                }
            } else {
                console.log(`[AdManager] 用户未看完激励视频: ${adUnitId}`);
            }

            this.isShowingRewardedVideo = false;

            // 重新加载广告
            ad.load().catch(() => {});
        });

        // 预加载
        ad.load().catch(() => {});

        this.rewardedVideoAds.set(adUnitId, ad);
        return ad;
    }

    //#endregion

    //#region 插屏广告

    /**
     * 显示插屏广告
     */
    showInterstitialAd(): void {
        // @ts-ignore
        if (typeof wx === 'undefined') {
            console.warn('[AdManager] 非微信环境，无法显示插屏广告');
            return;
        }

        const configMgr = AdConfigManager.getInstance();
        const adUnitId = configMgr.getInterstitialAdUnit();
        if (!adUnitId) {
            console.warn('[AdManager] 未配置插屏广告位');
            return;
        }

        // 创建插屏广告（每次调用创建新实例）
        // @ts-ignore
        if (!wx.createInterstitialAd) {
            console.warn('[AdManager] 当前微信版本不支持插屏广告');
            return;
        }

        // @ts-ignore
        const ad = wx.createInterstitialAd({
            adUnitId: adUnitId,
        });

        ad.onLoad(() => {
            console.log('[AdManager] 插屏广告加载成功');
            ad.show().catch((err: any) => {
                console.error('[AdManager] 插屏广告显示失败', err);
            });
        });

        ad.onError((err: any) => {
            console.error('[AdManager] 插屏广告加载失败', err);
        });
    }

    //#endregion

    //#region 原生模板广告

    /**
     * 创建原生模板广告
     * @param options 广告选项
     */
    createCustomAd(options: ShowCustomAdOptions): any {
        // @ts-ignore
        if (typeof wx === 'undefined') {
            console.warn('[AdManager] 非微信环境，无法创建原生模板广告');
            return null;
        }

        // @ts-ignore
        const customAd = wx.createCustomAd({
            adUnitId: options.adUnitId,
            style: {
                left: options.left,
                top: options.top,
                width: options.width,
                fixed: options.fixed,
            },
        });

        customAd.onLoad(() => {
            console.log('[AdManager] 原生模板广告加载成功');
        });

        customAd.onError((err: any) => {
            console.error('[AdManager] 原生模板广告加载失败', err);
        });

        customAd.show();

        return customAd;
    }

    //#endregion

    /**
     * 销毁所有广告
     */
    destroyAllAds(): void {
        this.destroyBannerAd();

        // 销毁所有激励视频广告
        this.rewardedVideoAds.forEach((ad, adUnitId) => {
            ad.offLoad();
            ad.offError();
            ad.offClose();
        });
        this.rewardedVideoAds.clear();

        this.isShowingRewardedVideo = false;
        this.rewardCallback = null;
        this.rewardFailCallback = null;

        console.log('[AdManager] 所有广告已销毁');
    }
}

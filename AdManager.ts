/**
 * 微信小游戏广告管理器
 * 统一管理所有广告的创建、显示、销毁
 * 支持按位置（场景）指定激励视频广告位
 */
export class AdManager {
    private static instance: AdManager = null!;

    // 广告位 ID 配置
    private adUnitIds = {
        banner: "",
        interstitial: "",
    };

    // 激励视频按位置配置：position -> adUnitId
    private rewardedVideoPositions: Map<string, string> = new Map();
    // 激励视频广告实例：adUnitId -> ad instance
    private rewardedVideoAds: Map<string, any> = new Map();

    // 激励视频回调
    private rewardCallback: (() => void) | null = null;
    private rewardFailCallback: ((err: any) => void) | null = null;

    // 是否正在显示激励视频（防止重复调用）
    private isShowingRewardedVideo: boolean = false;

    // Banner 和插屏广告实例
    private bannerAd: any = null;
    private interstitialAd: any = null;

    private constructor() {
        this.init();
    }

    static getInstance(): AdManager {
        if (!AdManager.instance) {
            AdManager.instance = new AdManager();
        }
        return AdManager.instance;
    }

    /**
     * 配置广告位 ID
     * @param config 广告位配置
     */
    configure(config: {
        banner?: string;
        interstitial?: string;
        rewardedVideo?: Record<string, string>;
    }) {
        if (config.banner) {
            this.adUnitIds.banner = config.banner;
        }
        if (config.interstitial) {
            this.adUnitIds.interstitial = config.interstitial;
        }
        if (config.rewardedVideo) {
            this.rewardedVideoPositions.clear();
            Object.keys(config.rewardedVideo).forEach((position) => {
                const adUnitId = config.rewardedVideo![position];
                this.rewardedVideoPositions.set(position, adUnitId);
            });
            // 重新初始化激励视频广告
            this.initRewardedVideoAds();
        }
    }

    /**
     * 为指定位置设置激励视频广告位
     * @param position 位置标识（如 "gold"、"revive"）
     * @param adUnitId 广告位 ID
     */
    setRewardedVideoAdUnit(position: string, adUnitId: string) {
        const oldAdUnitId = this.rewardedVideoPositions.get(position);
        if (oldAdUnitId === adUnitId) {
            return; // 未变化
        }

        this.rewardedVideoPositions.set(position, adUnitId);

        // 如果已有该广告位的实例，先销毁
        if (this.rewardedVideoAds.has(adUnitId)) {
            return; // 已存在
        }

        // 创建新的广告实例
        this.createRewardedVideoAd(adUnitId);
    }

    /**
     * 获取指定位置的广告位 ID
     * @param position 位置标识
     */
    getRewardedVideoAdUnit(position: string): string | undefined {
        return this.rewardedVideoPositions.get(position);
    }

    /**
     * 初始化广告
     */
    private init() {
        console.log("[AdManager] 初始化");

        // @ts-ignore
        if (typeof wx === 'undefined') {
            console.warn("[AdManager] 非微信环境，广告功能不可用");
            return;
        }

        // 预加载插屏广告
        this.createInterstitialAd();
    }

    /**
     * 初始化所有激励视频广告（根据位置配置）
     */
    private initRewardedVideoAds() {
        // @ts-ignore
        if (typeof wx === 'undefined') {
            return;
        }

        // 去重：收集所有唯一的广告位 ID
        const adUnitIdSet = new Set<string>();
        this.rewardedVideoPositions.forEach((adUnitId) => {
            adUnitIdSet.add(adUnitId);
        });

        // 为每个唯一的广告位创建实例
        adUnitIdSet.forEach((adUnitId) => {
            if (!this.rewardedVideoAds.has(adUnitId)) {
                this.createRewardedVideoAd(adUnitId);
            }
        });

        console.log(`[AdManager] 已初始化 ${this.rewardedVideoAds.size} 个激励视频广告位`);
    }

    /**
     * 为指定广告位 ID 创建激励视频广告实例
     */
    private createRewardedVideoAd(adUnitId: string) {
        // @ts-ignore
        if (typeof wx === 'undefined') {
            return;
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
                // 用户看完广告
                console.log(`[AdManager] 用户看完激励视频: ${adUnitId}`);
                if (this.rewardCallback) {
                    this.rewardCallback();
                    this.rewardCallback = null;
                    this.rewardFailCallback = null;
                }
            } else {
                // 用户中途关闭
                console.log(`[AdManager] 用户未看完激励视频: ${adUnitId}`);
            }

            this.isShowingRewardedVideo = false;

            // 重新加载广告
            ad.load().catch(() => {});
        });

        // 预加载
        ad.load().catch(() => {});

        this.rewardedVideoAds.set(adUnitId, ad);
    }

    //#region Banner 广告

    /**
     * 显示 Banner 广告
     * @param style 广告样式配置
     */
    showBannerAd(style?: {
        left?: number;
        top?: number;
        width?: number;
    }) {
        // @ts-ignore
        if (typeof wx === 'undefined') {
            console.warn("[AdManager] 非微信环境，无法显示 Banner 广告");
            return;
        }

        if (!this.adUnitIds.banner) {
            console.warn("[AdManager] 未配置 Banner 广告位");
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

        const finalStyle = { ...defaultStyle, ...style };

        // 创建 Banner 广告
        // @ts-ignore
        this.bannerAd = wx.createBannerAd({
            adUnitId: this.adUnitIds.banner,
            style: finalStyle,
        });

        // 监听 Banner 广告加载成功
        this.bannerAd.onLoad(() => {
            console.log("[AdManager] Banner 广告加载成功");
        });

        // 监听 Banner 广告加载失败
        this.bannerAd.onError((err: any) => {
            console.error("[AdManager] Banner 广告加载失败", err);
        });

        // 监听 Banner 广告尺寸变化
        this.bannerAd.onResize((res: any) => {
            // 根据实际高度调整位置
            this.bannerAd.style.top = screenHeight - res.height;
        });

        // 显示广告
        this.bannerAd.show();
    }

    /**
     * 隐藏 Banner 广告
     */
    hideBannerAd() {
        if (this.bannerAd) {
            this.bannerAd.hide();
        }
    }

    /**
     * 销毁 Banner 广告
     */
    destroyBannerAd() {
        if (this.bannerAd) {
            this.bannerAd.destroy();
            this.bannerAd = null;
            console.log("[AdManager] Banner 广告已销毁");
        }
    }

    //#endregion

    //#region 激励视频广告（按位置指定广告位）

    /**
     * 显示激励视频广告（按位置指定广告位）
     * @param position 位置标识（如 "gold"、"revive"）
     * @param onReward 看完广告的奖励回调
     * @param onFail 失败回调（可选）
     */
    showRewardedVideoAd(position: string, onReward: () => void, onFail?: (err: any) => void) {
        // @ts-ignore
        if (typeof wx === 'undefined') {
            console.warn("[AdManager] 非微信环境，直接给予奖励");
            onReward();
            return;
        }

        if (this.isShowingRewardedVideo) {
            console.warn("[AdManager] 激励视频正在显示中，请稍候");
            return;
        }

        // 查找该位置对应的广告位 ID
        const adUnitId = this.rewardedVideoPositions.get(position);
        if (!adUnitId) {
            console.warn(`[AdManager] 位置 "${position}" 未配置激励视频广告位`);
            onReward(); // 降级处理：直接给奖励
            return;
        }

        const ad = this.rewardedVideoAds.get(adUnitId);
        if (!ad) {
            console.warn(`[AdManager] 广告位 "${adUnitId}" 未初始化`);
            onReward(); // 降级处理：直接给奖励
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
                    .then(() => {
                        // 加载成功，再次尝试显示
                        return ad.show();
                    })
                    .catch((err2: any) => {
                        console.error(`[AdManager] 激励视频重新加载失败: ${adUnitId}`, err2);
                        this.isShowingRewardedVideo = false;

                        if (this.rewardFailCallback) {
                            this.rewardFailCallback(err2);
                            this.rewardFailCallback = null;
                            this.rewardCallback = null;
                        } else {
                            // 降级处理：直接给奖励
                            if (this.rewardCallback) {
                                this.rewardCallback();
                                this.rewardCallback = null;
                            }
                        }
                    });
            });
    }

    /**
     * 预加载所有激励视频广告
     */
    preloadRewardedVideoAds() {
        this.rewardedVideoAds.forEach((ad, adUnitId) => {
            ad.load().catch((err: any) => {
                console.warn(`[AdManager] 预加载失败: ${adUnitId}`, err);
            });
        });
    }

    //#endregion

    //#region 插屏广告

    /**
     * 创建插屏广告（预加载）
     */
    private createInterstitialAd() {
        // @ts-ignore
        if (typeof wx === 'undefined') {
            return;
        }

        if (!this.adUnitIds.interstitial) {
            console.warn("[AdManager] 未配置插屏广告位");
            return;
        }

        // 检查是否支持插屏广告（基础库 2.6.0 开始支持）
        // @ts-ignore
        if (!wx.createInterstitialAd) {
            console.warn("[AdManager] 当前微信版本不支持插屏广告");
            return;
        }

        // @ts-ignore
        this.interstitialAd = wx.createInterstitialAd({
            adUnitId: this.adUnitIds.interstitial,
        });

        // 监听广告加载成功
        this.interstitialAd.onLoad(() => {
            console.log("[AdManager] 插屏广告加载成功");
        });

        // 监听广告加载失败
        this.interstitialAd.onError((err: any) => {
            console.error("[AdManager] 插屏广告加载失败", err);
        });

        // 监听广告关闭
        this.interstitialAd.onClose(() => {
            console.log("[AdManager] 插屏广告关闭");
            // 重新加载
            this.interstitialAd.load().catch(() => {});
        });

        // 预加载
        this.interstitialAd.load().catch(() => {});
    }

    /**
     * 显示插屏广告
     */
    showInterstitialAd() {
        // @ts-ignore
        if (typeof wx === 'undefined') {
            console.warn("[AdManager] 非微信环境，无法显示插屏广告");
            return;
        }

        if (!this.interstitialAd) {
            console.warn("[AdManager] 插屏广告未初始化");
            return;
        }

        // 显示广告
        this.interstitialAd.show()
            .catch((err: any) => {
                console.error("[AdManager] 插屏广告显示失败", err);

                // 广告未加载完成，重新加载
                this.interstitialAd.load()
                    .then(() => {
                        console.log("[AdManager] 插屏广告重新加载成功");
                    });
            });
    }

    //#endregion

    //#region 原生模板广告

    /**
     * 创建原生模板广告
     * @param adUnitId 原生模板广告位 ID
     * @param style 广告样式
     */
    createCustomAd(adUnitId: string, style: {
        left: number;
        top: number;
        width: number;
        fixed?: boolean;
    }) {
        // @ts-ignore
        if (typeof wx === 'undefined') {
            console.warn("[AdManager] 非微信环境，无法创建原生模板广告");
            return null;
        }

        // @ts-ignore
        const customAd = wx.createCustomAd({
            adUnitId: adUnitId,
            style: style,
        });

        customAd.onLoad(() => {
            console.log("[AdManager] 原生模板广告加载成功");
        });

        customAd.onError((err: any) => {
            console.error("[AdManager] 原生模板广告加载失败", err);
        });

        customAd.show();

        return customAd;
    }

    //#endregion

    /**
     * 销毁所有广告
     */
    destroyAllAds() {
        this.destroyBannerAd();

        // 销毁所有激励视频广告
        this.rewardedVideoAds.forEach((ad, adUnitId) => {
            ad.offLoad();
            ad.offError();
            ad.offClose();
        });
        this.rewardedVideoAds.clear();
        this.rewardedVideoPositions.clear();

        // 销毁插屏广告
        if (this.interstitialAd) {
            this.interstitialAd.offLoad();
            this.interstitialAd.offError();
            this.interstitialAd.offClose();
            this.interstitialAd = null;
        }

        this.isShowingRewardedVideo = false;
        this.rewardCallback = null;
        this.rewardFailCallback = null;

        console.log("[AdManager] 所有广告已销毁");
    }
}

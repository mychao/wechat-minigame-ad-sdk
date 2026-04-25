"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdManager = void 0;
const AdConfigManager_1 = require("./AdConfigManager");
class AdManager {
    constructor() {
        this.bannerAd = null;
        this.interstitialAd = null;
        this.rewardedVideoAds = new Map();
        this.rewardCallback = null;
        this.rewardFailCallback = null;
        this.isShowingRewardedVideo = false;
    }
    static getInstance() {
        if (!AdManager.instance) {
            AdManager.instance = new AdManager();
        }
        return AdManager.instance;
    }
    showBannerAd(options) {
        if (typeof wx === 'undefined') {
            console.warn('[AdManager] 非微信环境，无法显示 Banner 广告');
            return;
        }
        const configMgr = AdConfigManager_1.AdConfigManager.getInstance();
        const adUnitId = configMgr.getBannerAdUnit();
        if (!adUnitId) {
            console.warn('[AdManager] 未配置 Banner 广告位');
            return;
        }
        if (this.bannerAd) {
            this.bannerAd.destroy();
            this.bannerAd = null;
        }
        const systemInfo = wx.getSystemInfoSync();
        const screenWidth = systemInfo.screenWidth;
        const screenHeight = systemInfo.screenHeight;
        const defaultStyle = {
            left: 0,
            top: screenHeight - 100,
            width: screenWidth,
        };
        const finalStyle = Object.assign(Object.assign({}, defaultStyle), options);
        this.bannerAd = wx.createBannerAd({
            adUnitId: adUnitId,
            style: finalStyle,
        });
        this.bannerAd.onLoad(() => {
            console.log('[AdManager] Banner 广告加载成功');
        });
        this.bannerAd.onError((err) => {
            console.error('[AdManager] Banner 广告加载失败', err);
        });
        this.bannerAd.onResize((res) => {
            this.bannerAd.style.top = screenHeight - res.height;
        });
        this.bannerAd.show();
    }
    hideBannerAd() {
        if (this.bannerAd) {
            this.bannerAd.hide();
        }
    }
    destroyBannerAd() {
        if (this.bannerAd) {
            this.bannerAd.destroy();
            this.bannerAd = null;
            console.log('[AdManager] Banner 广告已销毁');
        }
    }
    showRewardedVideoAd(options) {
        const { position, onReward, onFail } = options;
        if (this.isShowingRewardedVideo) {
            console.warn('[AdManager] 激励视频正在显示中，请稍候');
            return;
        }
        if (typeof wx === 'undefined') {
            console.warn('[AdManager] 非微信环境，直接给予奖励');
            this.isShowingRewardedVideo = true;
            onReward();
            setTimeout(() => {
                this.isShowingRewardedVideo = false;
            }, 0);
            return;
        }
        const configMgr = AdConfigManager_1.AdConfigManager.getInstance();
        const adUnitId = configMgr.getRewardedVideoAdUnit(position);
        if (!adUnitId) {
            console.warn(`[AdManager] 位置 "${position}" 未配置激励视频广告位`);
            onReward();
            return;
        }
        let ad = this.rewardedVideoAds.get(adUnitId);
        if (!ad) {
            ad = this.createRewardedVideoAdInstance(adUnitId);
        }
        if (!ad) {
            console.warn(`[AdManager] 广告位 "${adUnitId}" 初始化失败`);
            onReward();
            return;
        }
        this.rewardCallback = onReward;
        this.rewardFailCallback = onFail || null;
        this.isShowingRewardedVideo = true;
        console.log(`[AdManager] 显示激励视频: 位置="${position}", 广告位="${adUnitId}"`);
        ad.show()
            .then(() => {
        })
            .catch((err) => {
            console.error(`[AdManager] 激励视频广告显示失败: ${adUnitId}`, err);
            ad.load()
                .then(() => ad.show())
                .catch((err2) => {
                console.error(`[AdManager] 激励视频重新加载失败: ${adUnitId}`, err2);
                this.isShowingRewardedVideo = false;
                if (this.rewardFailCallback) {
                    this.rewardFailCallback(err2);
                    this.rewardFailCallback = null;
                    this.rewardCallback = null;
                }
                else {
                    if (this.rewardCallback) {
                        this.rewardCallback();
                        this.rewardCallback = null;
                    }
                }
            });
        });
    }
    createRewardedVideoAdInstance(adUnitId) {
        if (typeof wx === 'undefined') {
            return null;
        }
        const ad = wx.createRewardedVideoAd({
            adUnitId: adUnitId,
        });
        ad.onLoad(() => {
            console.log(`[AdManager] 激励视频广告加载成功: ${adUnitId}`);
        });
        ad.onError((err) => {
            console.error(`[AdManager] 激励视频广告加载失败: ${adUnitId}`, err);
        });
        ad.onClose((res) => {
            if (res && res.isEnded) {
                console.log(`[AdManager] 用户看完激励视频: ${adUnitId}`);
                if (this.rewardCallback) {
                    this.rewardCallback();
                    this.rewardCallback = null;
                    this.rewardFailCallback = null;
                }
            }
            else {
                console.log(`[AdManager] 用户未看完激励视频: ${adUnitId}`);
            }
            this.isShowingRewardedVideo = false;
            ad.load().catch(() => { });
        });
        ad.load().catch(() => { });
        this.rewardedVideoAds.set(adUnitId, ad);
        return ad;
    }
    showInterstitialAd() {
        if (typeof wx === 'undefined') {
            console.warn('[AdManager] 非微信环境，无法显示插屏广告');
            return;
        }
        const configMgr = AdConfigManager_1.AdConfigManager.getInstance();
        const adUnitId = configMgr.getInterstitialAdUnit();
        if (!adUnitId) {
            console.warn('[AdManager] 未配置插屏广告位');
            return;
        }
        if (!wx.createInterstitialAd) {
            console.warn('[AdManager] 当前微信版本不支持插屏广告');
            return;
        }
        const ad = wx.createInterstitialAd({
            adUnitId: adUnitId,
        });
        ad.onLoad(() => {
            console.log('[AdManager] 插屏广告加载成功');
            ad.show().catch((err) => {
                console.error('[AdManager] 插屏广告显示失败', err);
            });
        });
        ad.onError((err) => {
            console.error('[AdManager] 插屏广告加载失败', err);
        });
    }
    createCustomAd(options) {
        if (typeof wx === 'undefined') {
            console.warn('[AdManager] 非微信环境，无法创建原生模板广告');
            return null;
        }
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
        customAd.onError((err) => {
            console.error('[AdManager] 原生模板广告加载失败', err);
        });
        customAd.show();
        return customAd;
    }
    destroyAllAds() {
        this.destroyBannerAd();
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
exports.AdManager = AdManager;
AdManager.instance = null;
//# sourceMappingURL=AdManager.js.map
import { ShowRewardedVideoOptions, ShowBannerOptions, ShowCustomAdOptions } from './types';
export declare class AdManager {
    private static instance;
    private bannerAd;
    private interstitialAd;
    private rewardedVideoAds;
    private rewardCallback;
    private rewardFailCallback;
    private isShowingRewardedVideo;
    private constructor();
    static getInstance(): AdManager;
    showBannerAd(options?: ShowBannerOptions): void;
    hideBannerAd(): void;
    destroyBannerAd(): void;
    showRewardedVideoAd(options: ShowRewardedVideoOptions): void;
    private createRewardedVideoAdInstance;
    showInterstitialAd(): void;
    createCustomAd(options: ShowCustomAdOptions): any;
    destroyAllAds(): void;
}
//# sourceMappingURL=AdManager.d.ts.map
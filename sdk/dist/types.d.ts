export interface RewardedVideoConfig {
    [position: string]: string;
}
export interface AppAdConfig {
    banner?: string;
    interstitial?: string;
    rewardedVideo?: RewardedVideoConfig;
}
export interface AdSDKConfig {
    [appId: string]: AppAdConfig;
}
export interface AdSDKOptions {
    appId: string;
    localConfig?: AdSDKConfig;
    localConfigPath?: string;
    remoteConfigUrl?: string;
    testMode?: boolean;
    testConfig?: AppAdConfig;
}
export declare const DEFAULT_CONFIG_PATHS: string[];
export interface ShowRewardedVideoOptions {
    position: string;
    onReward: () => void;
    onFail?: (err: any) => void;
}
export interface ShowBannerOptions {
    left?: number;
    top?: number;
    width?: number;
}
export interface ShowCustomAdOptions {
    adUnitId: string;
    left: number;
    top: number;
    width: number;
    fixed?: boolean;
}
//# sourceMappingURL=types.d.ts.map
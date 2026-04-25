/**
 * 微信小游戏广告 SDK - 类型定义
 */

/** 激励视频位置到广告位的映射 */
export interface RewardedVideoConfig {
    [position: string]: string;
}

/** 单个小游戏的广告配置 */
export interface AppAdConfig {
    banner?: string;
    interstitial?: string;
    rewardedVideo?: RewardedVideoConfig;
}

/** 完整配置（按 appId 维度） */
export interface AdSDKConfig {
    [appId: string]: AppAdConfig;
}

/** SDK 初始化选项 */
export interface AdSDKOptions {
    /** 当前小游戏的 appId */
    appId: string;
    /** 本地配置对象（优先级最高） */
    localConfig?: AdSDKConfig;
    /** 本地配置文件路径（优先级次之，支持自定义路径） */
    localConfigPath?: string;
    /** 远程配置 URL（远程配置优先级最低） */
    remoteConfigUrl?: string;
    /** 测试模式（使用测试广告位） */
    testMode?: boolean;
    /** 测试广告位配置 */
    testConfig?: AppAdConfig;
}

/** 默认配置文件路径 */
export const DEFAULT_CONFIG_PATHS = [
    'ad-config.json',              // 项目根目录
    'config/ad-config.json',       // config 目录
    'assets/resources/ad-config.json', // Cocos Creator resources
    'resources/ad-config.json',    // resources 目录
];

/** 激励视频显示选项 */
export interface ShowRewardedVideoOptions {
    /** 位置标识（对应配置中的键名） */
    position: string;
    /** 看完广告的奖励回调 */
    onReward: () => void;
    /** 广告加载失败回调 */
    onFail?: (err: any) => void;
}

/** Banner 广告显示选项 */
export interface ShowBannerOptions {
    left?: number;
    top?: number;
    width?: number;
}

/** 原生模板广告选项 */
export interface ShowCustomAdOptions {
    adUnitId: string;
    left: number;
    top: number;
    width: number;
    fixed?: boolean;
}

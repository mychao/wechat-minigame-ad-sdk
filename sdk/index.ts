/**
 * 微信小游戏广告 SDK - 统一导出入口
 *
 * 使用方式：
 *
 * ```typescript
 * import { AdSDK, AdManager, AdConfigManager } from './sdk';
 *
 * // 1. 从本地 JSON 文件加载（推荐）
 * await AdSDK.init({
 *     appId: 'wx1234567890abcdef',
 *     localConfigPath: 'ad-config.json',  // 指定文件路径
 * });
 *
 * // 2. 使用默认路径（自动查找）
 * await AdSDK.init({
 *     appId: 'wx1234567890abcdef',
 * });
 * // 默认查找路径：ad-config.json / config/ad-config.json / assets/resources/ad-config.json
 *
 * // 3. 使用远程配置
 * await AdSDK.init({
 *     appId: 'wx1234567890abcdef',
 *     remoteConfigUrl: 'https://your-server.com/ad-config.json',
 * });
 *
 * // 4. 混合使用（优先级：对象 > 文件 > 远程）
 * await AdSDK.init({
 *     appId: 'wx1234567890abcdef',
 *     localConfig: { 'wx123': { banner: 'adunit-xxx' } },  // 最高优先级
 *     localConfigPath: 'ad-config.json',                     // 次优先级
 *     remoteConfigUrl: 'https://your-server.com/ad-config.json', // 最低优先级
 * });
 *
 * // 显示广告
 * AdSDK.AdManager.showRewardedVideoAd({
 *     position: 'gold',
 *     onReward: () => { console.log('获得金币'); },
 * });
 * ```
 */

import { AdManager } from './AdManager';
import { AdConfigManager } from './AdConfigManager';

export { AdManager } from './AdManager';
export { AdConfigManager } from './AdConfigManager';
export type {
    AdSDKConfig,
    AppAdConfig,
    RewardedVideoConfig,
    AdSDKOptions,
    ShowRewardedVideoOptions,
    ShowBannerOptions,
    ShowCustomAdOptions,
} from './types';

/**
 * SDK 初始化辅助类
 */
export class AdSDK {
    /**
     * 初始化 SDK
     * @param options 初始化选项
     */
    static async init(options: {
        appId: string;
        localConfig?: import('./types').AdSDKConfig;
        localConfigPath?: string;
        remoteConfigUrl?: string;
        testMode?: boolean;
        testConfig?: import('./types').AppAdConfig;
    }): Promise<void> {
        // 初始化配置管理器
        await AdConfigManager.getInstance().init({
            appId: options.appId,
            localConfig: options.localConfig,
            localConfigPath: options.localConfigPath,
            remoteConfigUrl: options.remoteConfigUrl,
            testMode: options.testMode,
            testConfig: options.testConfig,
        });

        // 初始化广告管理器（预加载插屏广告）
        AdManager.getInstance();

        console.log(`[AdSDK] SDK 初始化完成，appId: ${options.appId}`);
    }

    /**
     * 获取 AdManager 实例（快捷方式）
     */
    static get AdManager() {
        return AdManager.getInstance();
    }

    /**
     * 获取 AdConfigManager 实例（快捷方式）
     */
    static get Config() {
        return AdConfigManager.getInstance();
    }

    /**
     * 设置测试模式
     */
    static setTestMode(enabled: boolean): void {
        AdConfigManager.getInstance().setTestMode(enabled);
    }

    /**
     * 销毁所有广告（退出时调用）
     */
    static destroyAll(): void {
        AdManager.getInstance().destroyAllAds();
    }

    /**
     * 从指定路径重新加载本地配置文件
     * @param filePath 文件路径（可选，不传则使用默认路径）
     */
    static async reloadLocalConfig(filePath?: string): Promise<void> {
        const configMgr = AdConfigManager.getInstance();
        if (filePath) {
            await configMgr.loadLocalConfigFile(filePath);
        } else {
            await configMgr.loadLocalConfigFromDefaultPaths();
        }
    }
}

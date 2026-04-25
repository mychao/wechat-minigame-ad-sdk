import { AdManager } from './AdManager';
import { AdConfigManager } from './AdConfigManager';
export { AdManager } from './AdManager';
export { AdConfigManager } from './AdConfigManager';
export type { AdSDKConfig, AppAdConfig, RewardedVideoConfig, AdSDKOptions, ShowRewardedVideoOptions, ShowBannerOptions, ShowCustomAdOptions, } from './types';
export declare class AdSDK {
    static init(options: {
        appId: string;
        localConfig?: import('./types').AdSDKConfig;
        localConfigPath?: string;
        remoteConfigUrl?: string;
        testMode?: boolean;
        testConfig?: import('./types').AppAdConfig;
    }): Promise<void>;
    static get AdManager(): AdManager;
    static get Config(): AdConfigManager;
    static setTestMode(enabled: boolean): void;
    static destroyAll(): void;
    static reloadLocalConfig(filePath?: string): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map
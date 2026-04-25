import { AdSDKConfig, AppAdConfig } from './types';
export declare class AdConfigManager {
    private static instance;
    private localConfig;
    private remoteConfig;
    private remoteConfigUrl;
    private currentAppId;
    private testMode;
    private testConfig;
    private constructor();
    static getInstance(): AdConfigManager;
    init(options: {
        appId: string;
        localConfig?: AdSDKConfig;
        localConfigPath?: string;
        remoteConfigUrl?: string;
        testMode?: boolean;
        testConfig?: AppAdConfig;
    }): Promise<void>;
    loadLocalConfigFile(filePath: string): Promise<void>;
    loadLocalConfigFromDefaultPaths(): Promise<void>;
    private readJsonFile;
    private readFileInWechat;
    private readFileInCocos;
    private readFileInBrowser;
    private mergeLocalConfig;
    private loadRemoteConfig;
    getConfig(): AppAdConfig | null;
    getRewardedVideoAdUnit(position: string): string | undefined;
    getBannerAdUnit(): string | undefined;
    getInterstitialAdUnit(): string | undefined;
    setRewardedVideoAdUnit(position: string, adUnitId: string): void;
    setTestMode(enabled: boolean): void;
    getAppId(): string;
    getAllLocalConfig(): AdSDKConfig;
}
//# sourceMappingURL=AdConfigManager.d.ts.map
/**
 * 微信小游戏广告 SDK - 配置管理器
 * 按 appId 维度管理广告配置，支持：本地对象、本地文件、远程配置
 */
import { AdSDKConfig, AppAdConfig, DEFAULT_CONFIG_PATHS } from './types';

export class AdConfigManager {
    private static instance: AdConfigManager = null!;

    /** 本地配置对象（优先级最高） */
    private localConfig: AdSDKConfig = {};

    /** 远程配置缓存 */
    private remoteConfig: AdSDKConfig = {};

    /** 远程配置 URL */
    private remoteConfigUrl: string = "";

    /** 当前小游戏的 appId */
    private currentAppId: string = "";

    /** 测试模式 */
    private testMode: boolean = false;

    /** 测试配置 */
    private testConfig: AppAdConfig = {
        banner: "adunit-0000000000000000",
        interstitial: "adunit-0000000000000003",
        rewardedVideo: {
            "gold": "adunit-0000000000000001",
            "revive": "adunit-0000000000000002",
        },
    };

    private constructor() {}

    static getInstance(): AdConfigManager {
        if (!AdConfigManager.instance) {
            AdConfigManager.instance = new AdConfigManager();
        }
        return AdConfigManager.instance;
    }

    /**
     * 初始化配置管理器
     * @param options 初始化选项
     */
    async init(options: {
        appId: string;
        localConfig?: AdSDKConfig;
        localConfigPath?: string;
        remoteConfigUrl?: string;
        testMode?: boolean;
        testConfig?: AppAdConfig;
    }): Promise<void> {
        this.currentAppId = options.appId;
        this.testMode = options.testMode || false;

        if (options.testConfig) {
            this.testConfig = options.testConfig;
        }

        // 1. 加载本地配置对象（最高优先级）
        if (options.localConfig) {
            this.localConfig = options.localConfig;
            console.log(`[AdConfigManager] 本地配置对象已加载，共 ${Object.keys(options.localConfig).length} 个 appId`);
        }

        // 2. 从本地 JSON 文件加载配置（优先级次之）
        if (options.localConfigPath) {
            await this.loadLocalConfigFile(options.localConfigPath);
        } else {
            // 未指定路径时，尝试默认路径
            await this.loadLocalConfigFromDefaultPaths();
        }

        // 3. 加载远程配置（优先级最低）
        if (options.remoteConfigUrl) {
            this.remoteConfigUrl = options.remoteConfigUrl;
            await this.loadRemoteConfig();
        }
    }

    /**
     * 从指定路径加载本地 JSON 配置文件
     * @param filePath 文件路径（相对于项目根目录）
     */
    async loadLocalConfigFile(filePath: string): Promise<void> {
        console.log(`[AdConfigManager] 尝试加载本地配置文件: ${filePath}`);

        const config = await this.readJsonFile(filePath);
        if (config) {
            this.mergeLocalConfig(config);
        } else {
            console.warn(`[AdConfigManager] 本地配置文件加载失败: ${filePath}`);
        }
    }

    /**
     * 尝试从默认路径加载配置文件
     */
    async loadLocalConfigFromDefaultPaths(): Promise<void> {
        for (const path of DEFAULT_CONFIG_PATHS) {
            const config = await this.readJsonFile(path);
            if (config) {
                console.log(`[AdConfigManager] 默认路径配置加载成功: ${path}`);
                this.mergeLocalConfig(config);
                return;
            }
        }
        console.log('[AdConfigManager] 未找到默认路径下的配置文件（可忽略，如使用远程配置）');
    }

    /**
     * 读取 JSON 文件，自动适配不同环境
     * @param filePath 文件路径
     * @returns 解析后的配置对象，失败返回 null
     */
    private readJsonFile(filePath: string): Promise<AdSDKConfig | null> {
        return new Promise((resolve) => {
            // @ts-ignore
            if (typeof wx !== 'undefined') {
                // 微信小游戏环境：使用 wx.getFileSystemManager()
                this.readFileInWechat(filePath).then(resolve).catch(() => resolve(null));
                return;
            }

            // @ts-ignore
            if (typeof cc !== 'undefined' && cc.resources) {
                // Cocos Creator 环境：使用 cc.resources.load
                this.readFileInCocos(filePath).then(resolve).catch(() => resolve(null));
                return;
            }

            // 浏览器 / Node.js 环境：使用 fetch 或 require
            this.readFileInBrowser(filePath).then(resolve).catch(() => resolve(null));
        });
    }

    /**
     * 微信小游戏环境：使用 wx.getFileSystemManager() 读取文件
     */
    private readFileInWechat(filePath: string): Promise<AdSDKConfig> {
        return new Promise((resolve, reject) => {
            // @ts-ignore
            const fs = wx.getFileSystemManager();
            // @ts-ignore
            const appBasePath = wx.env.USER_DATA_PATH || '';

            // 尝试绝对路径
            const fullPath = filePath.startsWith('/') ? filePath : `${appBasePath}/${filePath}`;

            // @ts-ignore
            fs.readFile({
                filePath: fullPath,
                encoding: 'utf-8',
                success: (res: any) => {
                    try {
                        const config = JSON.parse(res.data) as AdSDKConfig;
                        resolve(config);
                    } catch (e) {
                        reject(new Error(`JSON 解析失败: ${filePath}`));
                    }
                },
                fail: () => {
                    reject(new Error(`文件读取失败: ${fullPath}`));
                },
            });
        });
    }

    /**
     * Cocos Creator 环境：使用 cc.resources.load 读取 resources 下的文件
     */
    private readFileInCocos(filePath: string): Promise<AdSDKConfig> {
        return new Promise((resolve, reject) => {
            // 判断是否在 resources 目录下
            let resPath = filePath;
            if (filePath.startsWith('assets/resources/')) {
                resPath = filePath.replace('assets/resources/', '').replace('.json', '');
            } else if (filePath.startsWith('resources/')) {
                resPath = filePath.replace('resources/', '').replace('.json', '');
            } else if (filePath.endsWith('.json')) {
                resPath = filePath.replace('.json', '');
            }

            // @ts-ignore
            cc.resources.load(resPath, cc.JsonAsset, (err: any, asset: any) => {
                if (err) {
                    reject(new Error(`Cocos 资源加载失败: ${resPath}`));
                    return;
                }
                resolve(asset.json as AdSDKConfig);
            });
        });
    }

    /**
     * 浏览器 / Node.js 环境：使用 fetch 或 XMLHttpRequest
     */
    private readFileInBrowser(filePath: string): Promise<AdSDKConfig> {
        return new Promise((resolve, reject) => {
            // 优先使用 fetch
            if (typeof fetch !== 'undefined') {
                fetch(filePath)
                    .then((res) => {
                        if (!res.ok) throw new Error(`HTTP ${res.status}`);
                        return res.json();
                    })
                    .then((data) => resolve(data as AdSDKConfig))
                    .catch(() => reject(new Error(`fetch 失败: ${filePath}`)));
                return;
            }

            // 降级使用 XMLHttpRequest
            const xhr = new XMLHttpRequest();
            xhr.open('GET', filePath, true);
            xhr.onload = () => {
                if (xhr.status === 200) {
                    try {
                        resolve(JSON.parse(xhr.responseText) as AdSDKConfig);
                    } catch (e) {
                        reject(new Error(`JSON 解析失败: ${filePath}`));
                    }
                } else {
                    reject(new Error(`XHR 失败: ${xhr.status}`));
                }
            };
            xhr.onerror = () => reject(new Error(`XHR 错误: ${filePath}`));
            xhr.send();
        });
    }

    /**
     * 将文件配置合并到本地配置（对象形式配置优先级更高）
     */
    private mergeLocalConfig(fileConfig: AdSDKConfig): void {
        const merged: AdSDKConfig = { ...this.localConfig };

        Object.keys(fileConfig).forEach((appId) => {
            if (!merged[appId]) {
                merged[appId] = fileConfig[appId];
            } else {
                // 合并单个 appId 下的配置，已有的值不覆盖
                const existing = merged[appId];
                const incoming = fileConfig[appId];
                if (incoming.banner && !existing.banner) existing.banner = incoming.banner;
                if (incoming.interstitial && !existing.interstitial) existing.interstitial = incoming.interstitial;
                if (incoming.rewardedVideo) {
                    if (!existing.rewardedVideo) {
                        existing.rewardedVideo = { ...incoming.rewardedVideo };
                    } else {
                        Object.keys(incoming.rewardedVideo).forEach((pos) => {
                            if (!existing.rewardedVideo![pos]) {
                                existing.rewardedVideo![pos] = incoming.rewardedVideo![pos];
                            }
                        });
                    }
                }
            }
        });

        this.localConfig = merged;
        console.log(`[AdConfigManager] 文件配置已合并，共 ${Object.keys(merged).length} 个 appId`);
    }

    /**
     * 加载远程配置
     */
    private async loadRemoteConfig(): Promise<void> {
        return new Promise((resolve) => {
            // @ts-ignore
            if (typeof wx === 'undefined') {
                console.warn('[AdConfigManager] 非微信环境，跳过远程配置加载');
                resolve();
                return;
            }

            // @ts-ignore
            wx.request({
                url: this.remoteConfigUrl,
                method: 'GET',
                success: (res: any) => {
                    if (res.statusCode === 200 && res.data) {
                        this.remoteConfig = res.data as AdSDKConfig;
                        console.log(`[AdConfigManager] 远程配置加载成功，共 ${Object.keys(res.data).length} 个 appId 配置`);
                    } else {
                        console.warn('[AdConfigManager] 远程配置加载失败，使用本地配置', res.errMsg);
                    }
                    resolve();
                },
                fail: (err: any) => {
                    console.warn('[AdConfigManager] 远程配置请求失败，使用本地配置', err);
                    resolve();
                },
            });
        });
    }

    /**
     * 获取当前 appId 的广告配置
     * 优先级：测试模式 > 本地配置对象 > 本地文件配置 > 远程配置
     */
    getConfig(): AppAdConfig | null {
        if (!this.currentAppId) {
            console.warn('[AdConfigManager] 未设置 appId');
            return null;
        }

        // 测试模式：返回测试配置
        if (this.testMode) {
            return this.testConfig;
        }

        // 优先级1：本地配置（对象 + 文件合并后的结果）
        const localAppConfig = this.localConfig[this.currentAppId];
        if (localAppConfig) {
            return localAppConfig;
        }

        // 优先级2：远程配置
        const remoteAppConfig = this.remoteConfig[this.currentAppId];
        if (remoteAppConfig) {
            return remoteAppConfig;
        }

        console.warn(`[AdConfigManager] 未找到 appId "${this.currentAppId}" 的配置`);
        return null;
    }

    /**
     * 获取指定位置的激励视频广告位 ID
     */
    getRewardedVideoAdUnit(position: string): string | undefined {
        const config = this.getConfig();
        if (!config || !config.rewardedVideo) {
            return undefined;
        }
        return config.rewardedVideo[position];
    }

    /**
     * 获取 Banner 广告位 ID
     */
    getBannerAdUnit(): string | undefined {
        const config = this.getConfig();
        return config?.banner;
    }

    /**
     * 获取插屏广告位 ID
     */
    getInterstitialAdUnit(): string | undefined {
        const config = this.getConfig();
        return config?.interstitial;
    }

    /**
     * 动态更新某个位置的激励视频广告位
     */
    setRewardedVideoAdUnit(position: string, adUnitId: string): void {
        const config = this.getConfig();
        if (config) {
            if (!config.rewardedVideo) {
                config.rewardedVideo = {};
            }
            config.rewardedVideo[position] = adUnitId;
        }
    }

    /**
     * 设置测试模式
     */
    setTestMode(enabled: boolean): void {
        this.testMode = enabled;
        console.log(`[AdConfigManager] 测试模式: ${enabled ? '开启' : '关闭'}`);
    }

    /**
     * 获取当前 appId
     */
    getAppId(): string {
        return this.currentAppId;
    }

    /**
     * 获取完整本地配置（用于调试）
     */
    getAllLocalConfig(): AdSDKConfig {
        return { ...this.localConfig };
    }
}

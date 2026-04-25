"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdConfigManager = void 0;
const types_1 = require("./types");
class AdConfigManager {
    constructor() {
        this.localConfig = {};
        this.remoteConfig = {};
        this.remoteConfigUrl = "";
        this.currentAppId = "";
        this.testMode = false;
        this.testConfig = {
            banner: "adunit-0000000000000000",
            interstitial: "adunit-0000000000000003",
            rewardedVideo: {
                "gold": "adunit-0000000000000001",
                "revive": "adunit-0000000000000002",
            },
        };
    }
    static getInstance() {
        if (!AdConfigManager.instance) {
            AdConfigManager.instance = new AdConfigManager();
        }
        return AdConfigManager.instance;
    }
    init(options) {
        return __awaiter(this, void 0, void 0, function* () {
            this.currentAppId = options.appId;
            this.testMode = options.testMode || false;
            if (options.testConfig) {
                this.testConfig = options.testConfig;
            }
            if (options.localConfig) {
                this.localConfig = options.localConfig;
                console.log(`[AdConfigManager] 本地配置对象已加载，共 ${Object.keys(options.localConfig).length} 个 appId`);
            }
            if (options.localConfigPath) {
                yield this.loadLocalConfigFile(options.localConfigPath);
            }
            else {
                yield this.loadLocalConfigFromDefaultPaths();
            }
            if (options.remoteConfigUrl) {
                this.remoteConfigUrl = options.remoteConfigUrl;
                yield this.loadRemoteConfig();
            }
        });
    }
    loadLocalConfigFile(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`[AdConfigManager] 尝试加载本地配置文件: ${filePath}`);
            const config = yield this.readJsonFile(filePath);
            if (config) {
                this.mergeLocalConfig(config);
            }
            else {
                console.warn(`[AdConfigManager] 本地配置文件加载失败: ${filePath}`);
            }
        });
    }
    loadLocalConfigFromDefaultPaths() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const path of types_1.DEFAULT_CONFIG_PATHS) {
                const config = yield this.readJsonFile(path);
                if (config) {
                    console.log(`[AdConfigManager] 默认路径配置加载成功: ${path}`);
                    this.mergeLocalConfig(config);
                    return;
                }
            }
            console.log('[AdConfigManager] 未找到默认路径下的配置文件（可忽略，如使用远程配置）');
        });
    }
    readJsonFile(filePath) {
        return new Promise((resolve) => {
            if (typeof wx !== 'undefined') {
                this.readFileInWechat(filePath).then(resolve).catch(() => resolve(null));
                return;
            }
            if (typeof cc !== 'undefined' && cc.resources) {
                this.readFileInCocos(filePath).then(resolve).catch(() => resolve(null));
                return;
            }
            this.readFileInBrowser(filePath).then(resolve).catch(() => resolve(null));
        });
    }
    readFileInWechat(filePath) {
        return new Promise((resolve, reject) => {
            const fs = wx.getFileSystemManager();
            const appBasePath = wx.env.USER_DATA_PATH || '';
            const fullPath = filePath.startsWith('/') ? filePath : `${appBasePath}/${filePath}`;
            fs.readFile({
                filePath: fullPath,
                encoding: 'utf-8',
                success: (res) => {
                    try {
                        const config = JSON.parse(res.data);
                        resolve(config);
                    }
                    catch (e) {
                        reject(new Error(`JSON 解析失败: ${filePath}`));
                    }
                },
                fail: () => {
                    reject(new Error(`文件读取失败: ${fullPath}`));
                },
            });
        });
    }
    readFileInCocos(filePath) {
        return new Promise((resolve, reject) => {
            let resPath = filePath;
            if (filePath.startsWith('assets/resources/')) {
                resPath = filePath.replace('assets/resources/', '').replace('.json', '');
            }
            else if (filePath.startsWith('resources/')) {
                resPath = filePath.replace('resources/', '').replace('.json', '');
            }
            else if (filePath.endsWith('.json')) {
                resPath = filePath.replace('.json', '');
            }
            cc.resources.load(resPath, cc.JsonAsset, (err, asset) => {
                if (err) {
                    reject(new Error(`Cocos 资源加载失败: ${resPath}`));
                    return;
                }
                resolve(asset.json);
            });
        });
    }
    readFileInBrowser(filePath) {
        return new Promise((resolve, reject) => {
            if (typeof fetch !== 'undefined') {
                fetch(filePath)
                    .then((res) => {
                    if (!res.ok)
                        throw new Error(`HTTP ${res.status}`);
                    return res.json();
                })
                    .then((data) => resolve(data))
                    .catch(() => reject(new Error(`fetch 失败: ${filePath}`)));
                return;
            }
            const xhr = new XMLHttpRequest();
            xhr.open('GET', filePath, true);
            xhr.onload = () => {
                if (xhr.status === 200) {
                    try {
                        resolve(JSON.parse(xhr.responseText));
                    }
                    catch (e) {
                        reject(new Error(`JSON 解析失败: ${filePath}`));
                    }
                }
                else {
                    reject(new Error(`XHR 失败: ${xhr.status}`));
                }
            };
            xhr.onerror = () => reject(new Error(`XHR 错误: ${filePath}`));
            xhr.send();
        });
    }
    mergeLocalConfig(fileConfig) {
        const merged = Object.assign({}, this.localConfig);
        Object.keys(fileConfig).forEach((appId) => {
            if (!merged[appId]) {
                merged[appId] = fileConfig[appId];
            }
            else {
                const existing = merged[appId];
                const incoming = fileConfig[appId];
                if (incoming.banner && !existing.banner)
                    existing.banner = incoming.banner;
                if (incoming.interstitial && !existing.interstitial)
                    existing.interstitial = incoming.interstitial;
                if (incoming.rewardedVideo) {
                    if (!existing.rewardedVideo) {
                        existing.rewardedVideo = Object.assign({}, incoming.rewardedVideo);
                    }
                    else {
                        Object.keys(incoming.rewardedVideo).forEach((pos) => {
                            if (!existing.rewardedVideo[pos]) {
                                existing.rewardedVideo[pos] = incoming.rewardedVideo[pos];
                            }
                        });
                    }
                }
            }
        });
        this.localConfig = merged;
        console.log(`[AdConfigManager] 文件配置已合并，共 ${Object.keys(merged).length} 个 appId`);
    }
    loadRemoteConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                if (typeof wx === 'undefined') {
                    console.warn('[AdConfigManager] 非微信环境，跳过远程配置加载');
                    resolve();
                    return;
                }
                wx.request({
                    url: this.remoteConfigUrl,
                    method: 'GET',
                    success: (res) => {
                        if (res.statusCode === 200 && res.data) {
                            this.remoteConfig = res.data;
                            console.log(`[AdConfigManager] 远程配置加载成功，共 ${Object.keys(res.data).length} 个 appId 配置`);
                        }
                        else {
                            console.warn('[AdConfigManager] 远程配置加载失败，使用本地配置', res.errMsg);
                        }
                        resolve();
                    },
                    fail: (err) => {
                        console.warn('[AdConfigManager] 远程配置请求失败，使用本地配置', err);
                        resolve();
                    },
                });
            });
        });
    }
    getConfig() {
        if (!this.currentAppId) {
            console.warn('[AdConfigManager] 未设置 appId');
            return null;
        }
        if (this.testMode) {
            return this.testConfig;
        }
        const localAppConfig = this.localConfig[this.currentAppId];
        if (localAppConfig) {
            return localAppConfig;
        }
        const remoteAppConfig = this.remoteConfig[this.currentAppId];
        if (remoteAppConfig) {
            return remoteAppConfig;
        }
        console.warn(`[AdConfigManager] 未找到 appId "${this.currentAppId}" 的配置`);
        return null;
    }
    getRewardedVideoAdUnit(position) {
        const config = this.getConfig();
        if (!config || !config.rewardedVideo) {
            return undefined;
        }
        return config.rewardedVideo[position];
    }
    getBannerAdUnit() {
        const config = this.getConfig();
        return config === null || config === void 0 ? void 0 : config.banner;
    }
    getInterstitialAdUnit() {
        const config = this.getConfig();
        return config === null || config === void 0 ? void 0 : config.interstitial;
    }
    setRewardedVideoAdUnit(position, adUnitId) {
        const config = this.getConfig();
        if (config) {
            if (!config.rewardedVideo) {
                config.rewardedVideo = {};
            }
            config.rewardedVideo[position] = adUnitId;
        }
    }
    setTestMode(enabled) {
        this.testMode = enabled;
        console.log(`[AdConfigManager] 测试模式: ${enabled ? '开启' : '关闭'}`);
    }
    getAppId() {
        return this.currentAppId;
    }
    getAllLocalConfig() {
        return Object.assign({}, this.localConfig);
    }
}
exports.AdConfigManager = AdConfigManager;
AdConfigManager.instance = null;
//# sourceMappingURL=AdConfigManager.js.map
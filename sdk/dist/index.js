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
exports.AdSDK = exports.AdConfigManager = exports.AdManager = void 0;
const AdManager_1 = require("./AdManager");
const AdConfigManager_1 = require("./AdConfigManager");
var AdManager_2 = require("./AdManager");
Object.defineProperty(exports, "AdManager", { enumerable: true, get: function () { return AdManager_2.AdManager; } });
var AdConfigManager_2 = require("./AdConfigManager");
Object.defineProperty(exports, "AdConfigManager", { enumerable: true, get: function () { return AdConfigManager_2.AdConfigManager; } });
class AdSDK {
    static init(options) {
        return __awaiter(this, void 0, void 0, function* () {
            yield AdConfigManager_1.AdConfigManager.getInstance().init({
                appId: options.appId,
                localConfig: options.localConfig,
                localConfigPath: options.localConfigPath,
                remoteConfigUrl: options.remoteConfigUrl,
                testMode: options.testMode,
                testConfig: options.testConfig,
            });
            AdManager_1.AdManager.getInstance();
            console.log(`[AdSDK] SDK 初始化完成，appId: ${options.appId}`);
        });
    }
    static get AdManager() {
        return AdManager_1.AdManager.getInstance();
    }
    static get Config() {
        return AdConfigManager_1.AdConfigManager.getInstance();
    }
    static setTestMode(enabled) {
        AdConfigManager_1.AdConfigManager.getInstance().setTestMode(enabled);
    }
    static destroyAll() {
        AdManager_1.AdManager.getInstance().destroyAllAds();
    }
    static reloadLocalConfig(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const configMgr = AdConfigManager_1.AdConfigManager.getInstance();
            if (filePath) {
                yield configMgr.loadLocalConfigFile(filePath);
            }
            else {
                yield configMgr.loadLocalConfigFromDefaultPaths();
            }
        });
    }
}
exports.AdSDK = AdSDK;
//# sourceMappingURL=index.js.map
/**
 * 微信小游戏广告 SDK - 高级配置示例
 * 展示多种配置方式：本地对象、本地文件、远程配置
 */

import { AdSDK } from '../index';
import type { AdSDKConfig } from '../types';

// 示例 1：使用本地对象配置（优先级最高）
async function initWithLocalObject() {
    const localConfig: AdSDKConfig = {
        'wx1234567890abcdef': {
            banner: 'adunit-xxxxxx',
            interstitial: 'adunit-yyyyyy',
            rewardedVideo: {
                gold: 'adunit-zzzzzz',
                revive: 'adunit-aaaaaa',
                speedUp: 'adunit-bbbbbb',
            },
        },
    };

    await AdSDK.init({
        appId: 'wx1234567890abcdef',
        localConfig, // 直接传入配置对象
    });
}

// 示例 2：使用本地 JSON 文件配置
async function initWithLocalFile() {
    await AdSDK.init({
        appId: 'wx1234567890abcdef',
        localConfigPath: 'config/ad-config.json', // 指定文件路径
    });
}

// 示例 3：使用远程配置
async function initWithRemoteConfig() {
    await AdSDK.init({
        appId: 'wx1234567890abcdef',
        remoteConfigUrl: 'https://your-server.com/api/ad-config',
    });
}

// 示例 4：混合使用（优先级：对象 > 文件 > 远程）
async function initWithMixedConfig() {
    const localConfig: AdSDKConfig = {
        'wx1234567890abcdef': {
            banner: 'adunit-override', // 这个会覆盖文件和远程配置
        },
    };

    await AdSDK.init({
        appId: 'wx1234567890abcdef',
        localConfig, // 最高优先级
        localConfigPath: 'ad-config.json', // 次优先级
        remoteConfigUrl: 'https://your-server.com/api/ad-config', // 最低优先级
    });
}

// 示例 5：动态更新配置（热更新）
async function updateConfigDynamically() {
    // 初始化
    await AdSDK.init({
        appId: 'wx1234567890abcdef',
    });

    // 运行时从服务器获取新配置
    const response = await fetch('https://your-server.com/api/ad-config/latest');
    const newConfig: AdSDKConfig = await response.json();

    // 重新初始化（会合并配置）
    await AdSDK.init({
        appId: 'wx1234567890abcdef',
        localConfig: newConfig,
    });
}

// 示例 6：多 appId 管理（一套 SDK 支持多个小游戏）
class MultiGameAdManager {
    private currentAppId: string = '';

    async switchGame(appId: string) {
        this.currentAppId = appId;
        await AdSDK.init({ appId });
    }

    showRewardVideo(position: string, onReward: () => void) {
        AdSDK.AdManager.showRewardedVideoAd({
            position,
            onReward,
        });
    }
}

// 使用示例
async function multiGameExample() {
    const manager = new MultiGameAdManager();

    // 切换到游戏 A
    await manager.switchGame('wx-game-a-id');
    manager.showRewardVideo('gold', () => console.log('Game A: 获得金币'));

    // 切换到游戏 B
    await manager.switchGame('wx-game-b-id');
    manager.showRewardVideo('revive', () => console.log('Game B: 复活'));
}

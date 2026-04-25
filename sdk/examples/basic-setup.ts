/**
 * 微信小游戏广告 SDK - 基础示例
 * 展示如何初始化 SDK 和显示各种广告
 */

// 导入 SDK
import { AdSDK } from '../index';

// 1. 初始化 SDK（最简单方式 - 自动查找配置文件）
async function initSDK() {
    try {
        await AdSDK.init({
            appId: 'wx1234567890abcdef', // 你的小游戏 appId
        });
        console.log('SDK 初始化成功');
    } catch (err) {
        console.error('SDK 初始化失败', err);
    }
}

// 2. 显示激励视频广告（获得金币）
function showRewardVideoForGold() {
    AdSDK.AdManager.showRewardedVideoAd({
        position: 'gold', // 对应 ad-config.json 中 rewardedVideo.gold
        onReward: () => {
            console.log('用户看完广告，发放 100 金币');
            // 这里调用你的游戏逻辑，发放奖励
            // Game.addGold(100);
        },
        onFail: (err) => {
            console.error('激励视频加载失败', err);
            // 失败时也可以给予奖励（可选）
            // Game.addGold(100);
        },
    });
}

// 3. 显示激励视频广告（复活）
function showRewardVideoForRevive() {
    AdSDK.AdManager.showRewardedVideoAd({
        position: 'revive',
        onReward: () => {
            console.log('用户看完广告，角色复活');
            // Game.revive();
        },
    });
}

// 4. 显示 Banner 广告
function showBanner() {
    // 在屏幕底部显示 Banner
    AdSDK.AdManager.showBannerAd({
        left: 0,
        top: 100, // 根据实际屏幕高度调整
        width: 300,
    });
}

// 5. 隐藏 Banner（进入游戏时）
function hideBanner() {
    AdSDK.AdManager.hideBannerAd();
}

// 6. 显示插屏广告（关卡结束时）
function showInterstitial() {
    AdSDK.AdManager.showInterstitialAd();
}

// 7. 测试模式（开发时使用）
function enableTestMode() {
    AdSDK.setTestMode(true);
    console.log('测试模式已开启，将使用微信官方测试广告位');
}

// 8. 退出游戏时清理
function onGameExit() {
    AdSDK.destroyAll();
    console.log('所有广告已销毁');
}

// 主流程
async function main() {
    // 初始化
    await initSDK();

    // 显示 Banner
    showBanner();

    // 5 秒后显示激励视频（模拟用户点击）
    setTimeout(() => {
        showRewardVideoForGold();
    }, 5000);

    // 10 秒后显示插屏广告
    setTimeout(() => {
        showInterstitial();
    }, 10000);
}

// 如果是 Node.js 环境，直接运行（非微信环境会给出警告）
if (typeof window !== 'undefined' || typeof wx !== 'undefined') {
    main().catch(console.error);
}

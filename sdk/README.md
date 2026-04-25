# 微信小游戏广告 SDK

统一的小游戏广告管理 SDK，支持 Banner、激励视频、插屏、原生模板广告，按 appId 维度管理配置，支持本地、远程两种配置方式。

## 特性

- 支持多种广告类型：Banner、激励视频、插屏、原生模板
- 按 appId 维度管理广告配置，一套 SDK 支持多个小游戏
- 配置优先级：本地对象 > 本地文件 > 远程配置
- 自动预加载激励视频和插屏广告
- TypeScript 支持，提供完整类型定义
- 适配微信小游戏、Cocos Creator 环境

## 安装

### npm 安装（推荐）

```bash
npm install wechat-minigame-ad-sdk
```

### 本地开发

```bash
cd sdk
npm install
npm run build
```

## 快速开始

### 1. 准备配置文件

在项目根目录或 `config/` 目录下创建 `ad-config.json`：

```json
{
  "wx1234567890abcdef": {
    "banner": "adunit-xxxxxx",
    "interstitial": "adunit-yyyyyy",
    "rewardedVideo": {
      "gold": "adunit-zzzzzz",
      "revive": "adunit-aaaaaa"
    }
  }
}
```

### 2. 初始化 SDK

```typescript
import { AdSDK } from 'wechat-minigame-ad-sdk';

// 初始化（异步）
await AdSDK.init({
  appId: 'wx1234567890abcdef',
  localConfigPath: 'ad-config.json', // 可选，默认自动查找
});

// 或者使用本地对象配置（优先级最高）
await AdSDK.init({
  appId: 'wx1234567890abcdef',
  localConfig: {
    'wx1234567890abcdef': {
      banner: 'adunit-xxxxxx',
      rewardedVideo: { gold: 'adunit-zzzzzz' },
    },
  },
});

// 或者使用远程配置
await AdSDK.init({
  appId: 'wx1234567890abcdef',
  remoteConfigUrl: 'https://your-server.com/ad-config.json',
});
```

### 3. 使用广告

#### 激励视频广告

```typescript
import { AdSDK } from 'wechat-minigame-ad-sdk';

// 显示激励视频
AdSDK.AdManager.showRewardedVideoAd({
  position: 'gold', // 对应配置中的 rewardedVideo.gold
  onReward: () => {
    console.log('用户看完广告，发放奖励');
    // 发放金币等奖励
  },
  onFail: (err) => {
    console.error('广告加载失败', err);
  },
});
```

#### Banner 广告

```typescript
// 显示 Banner（底部居中）
AdSDK.AdManager.showBannerAd({
  left: 0,
  top: 100, // 距离顶部 100px
  width: 300,
});

// 隐藏 Banner
AdSDK.AdManager.hideBannerAd();

// 销毁 Banner
AdSDK.AdManager.destroyBannerAd();
```

#### 插屏广告

```typescript
// 显示插屏广告
AdSDK.AdManager.showInterstitialAd();
```

#### 原生模板广告

```typescript
const customAd = AdSDK.AdManager.createCustomAd({
  adUnitId: 'adunit-xxxxxx',
  left: 0,
  top: 0,
  width: 300,
});
```

### 4. 测试模式

```typescript
// 开启测试模式（使用微信官方测试广告位）
AdSDK.setTestMode(true);
```

### 5. 退出时清理

```typescript
// 销毁所有广告实例
AdSDK.destroyAll();
```

## API 文档

### AdSDK 静态方法

| 方法 | 说明 |
|------|------|
| `AdSDK.init(options)` | 初始化 SDK |
| `AdSDK.AdManager` | 获取 AdManager 实例 |
| `AdSDK.Config` | 获取 AdConfigManager 实例 |
| `AdSDK.setTestMode(enabled)` | 设置测试模式 |
| `AdSDK.destroyAll()` | 销毁所有广告 |
| `AdSDK.reloadLocalConfig(filePath?)` | 重新加载本地配置 |

### AdManager 方法

| 方法 | 说明 |
|------|------|
| `showRewardedVideoAd(options)` | 显示激励视频广告 |
| `showBannerAd(style?)` | 显示 Banner 广告 |
| `hideBannerAd()` | 隐藏 Banner 广告 |
| `destroyBannerAd()` | 销毁 Banner 广告 |
| `showInterstitialAd()` | 显示插屏广告 |
| `createCustomAd(options)` | 创建原生模板广告 |
| `destroyAllAds()` | 销毁所有广告 |

### AdConfigManager 方法

| 方法 | 说明 |
|------|------|
| `getConfig()` | 获取当前 appId 的配置 |
| `getRewardedVideoAdUnit(position)` | 获取指定位置的激励视频广告位 ID |
| `getBannerAdUnit()` | 获取 Banner 广告位 ID |
| `getInterstitialAdUnit()` | 获取插屏广告位 ID |
| `setTestMode(enabled)` | 设置测试模式 |

## 配置说明

### 配置优先级

1. **本地对象配置**（最高优先级）：通过 `init({ localConfig })` 传入
2. **本地文件配置**：通过 `init({ localConfigPath })` 指定路径，或自动查找默认路径
3. **远程配置**（最低优先级）：通过 `init({ remoteConfigUrl })` 设置

### 默认配置文件查找路径

- `ad-config.json`（项目根目录）
- `config/ad-config.json`
- `assets/resources/ad-config.json`（Cocos Creator）
- `resources/ad-config.json`

## 注意事项

1. **微信环境**：SDK 只在微信小游戏环境中（`typeof wx !== 'undefined'`）才会真正创建广告
2. **非微信环境**：调用广告方法时，SDK 会给出警告，并直接执行奖励回调（便于开发调试）
3. **广告位 ID**：正式发布前，请替换测试广告位 ID 为真实广告位 ID
4. **预加载**：激励视频和插屏广告会在初始化时自动预加载
5. **频率控制**：建议自行控制广告展示频率，避免过度打扰用户

## 示例项目

完整的示例项目请参考 `examples/` 目录（即将推出）。

## 许可证

MIT

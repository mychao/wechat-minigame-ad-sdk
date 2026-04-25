# 微信小游戏广告 SDK - 使用指南

## 一、SDK 简介

本 SDK 是一个适用于多个微信小游戏的广告接入框架，核心特性：

- **按 appId 维度配置**：一份配置支持多个小游戏
- **配置化**：支持本地对象、本地 JSON 文件、远程配置，优先级依次降低
- **开箱即用**：SDK 形式引入，初始化后直接使用
- **按位置指定广告位**：不同场景使用不同广告位，便于数据分析
- **零代码修改**：通过 JSON 文件管理配置，无需修改代码

---

## 二、SDK 目录结构

```
docs/wechat-ads/sdk/
├── index.ts                # SDK 统一导出（入口）
├── types.ts                # 类型定义
├── AdConfigManager.ts      # 配置管理器
├── AdManager.ts           # 广告管理器
├── SDK使用指南.md        # 本文档
└── ad-config.json        # 配置文件（可选，见下文）
```

---

## 三、快速开始

### 3.1 安装/引入

将 `sdk/` 目录复制到你的项目中，例如：

```
assets/scripts/ads/sdk/   # Cocos Creator 项目
```
或
```
src/ads/sdk/             # 其他项目
```

### 3.2 创建配置文件（推荐）

在项目根目录或 `assets/resources/` 下创建 `ad-config.json`：

```json
{
    "wx1234567890abcdef": {
        "banner": "adunit-xxxxxx",
        "interstitial": "adunit-yyyyyy",
        "rewardedVideo": {
            "gold": "adunit-zzzzzz",
            "revive": "adunit-aaaaaa",
            "speedUp": "adunit-bbbbbb"
        }
    },
    "wxabcdef1234567890": {
        "banner": "adunit-ccc",
        "rewardedVideo": {
            "coin": "adunit-ddd"
        }
    }
}
```

### 3.3 初始化 SDK

**方式一：从本地 JSON 文件加载（推荐）**

```typescript
import { AdSDK } from './path/to/sdk';

// 指定自定义路径
async function initAds() {
    await AdSDK.init({
        appId: 'wx1234567890abcdef',
        localConfigPath: 'ad-config.json',  // 自定义路径
    });
}

// 或使用默认路径（无需指定 localConfigPath）
async function initAds() {
    await AdSDK.init({
        appId: 'wx1234567890abcdef',
    });
    // SDK 会自动查找以下默认路径：
    // 1. ad-config.json
    // 2. config/ad-config.json
    // 3. assets/resources/ad-config.json
    // 4. resources/ad-config.json
}

initAds();
```

**方式二：使用本地配置对象（优先级最高）**

```typescript
import { AdSDK } from './path/to/sdk';

async function initAds() {
    await AdSDK.init({
        appId: 'wx1234567890abcdef',
        localConfig: {
            'wx1234567890abcdef': {
                banner: 'adunit-xxx',
                interstitial: 'adunit-yyy',
                rewardedVideo: {
                    'gold': 'adunit-zzz',
                    'revive': 'adunit-aaa',
                },
            },
        },
    });
}
```

**方式三：使用远程配置（便于热更新）**

```typescript
import { AdSDK } from './path/to/sdk';

async function initAds() {
    await AdSDK.init({
        appId: 'wx1234567890abcdef',
        remoteConfigUrl: 'https://your-server.com/ad-config.json',
    });
}
```

**方式四：混合使用（推荐用于生产）**

优先级：本地对象 > 本地文件 > 远程配置

```typescript
import { AdSDK } from './path/to/sdk';

async function initAds() {
    await AdSDK.init({
        appId: 'wx1234567890abcdef',
        localConfig: {        // 优先级1：紧急覆盖
            'wx1234567890abcdef': {
                banner: 'adunit-override',
            },
        },
        localConfigPath: 'ad-config.json',  // 优先级2：主要配置
        remoteConfigUrl: 'https://your-server.com/ad-config.json', // 优先级3：备份配置
    });
}
```

**方式五：测试模式**

```typescript
import { AdSDK } from './path/to/sdk';

await AdSDK.init({
    appId: 'wx1234567890abcdef',
    testMode: true,  // 使用官方测试广告位
});
```

### 3.4 显示广告

**Banner 广告**：

```typescript
import { AdSDK } from './path/to/sdk';

// 显示 Banner
AdSDK.AdManager.showBannerAd({
    left: 0,
    top: screenHeight - 100,
    width: screenWidth,
});

// 隐藏 Banner
AdSDK.AdManager.hideBannerAd();

// 销毁 Banner
AdSDK.AdManager.destroyBannerAd();
```

**激励视频广告**（按位置显示）：

```typescript
import { AdSDK } from './path/to/sdk';

// 看视频得金币（使用 "gold" 位置的广告位）
AdSDK.AdManager.showRewardedVideoAd({
    position: 'gold',
    onReward: () => {
        console.log('获得 100 金币');
    },
    onFail: (err) => {
        console.error('广告播放失败', err);
    },
});
```

**插屏广告**：

```typescript
import { AdSDK } from './path/to/sdk';

// 显示插屏广告
AdSDK.AdManager.showInterstitialAd();
```

---

## 四、配置文件详解

### 4.1 默认路径

SDK 在未指定 `localConfigPath` 时，会自动按以下顺序查找配置文件：

| 优先级 | 路径 | 适用场景 |
|--------|------|----------|
| 1 | `ad-config.json` | 项目根目录 |
| 2 | `config/ad-config.json` | config 目录 |
| 3 | `assets/resources/ad-config.json` | Cocos Creator 项目 |
| 4 | `resources/ad-config.json` | resources 目录 |

找到任意一个即停止查找。

### 4.2 自定义路径

```typescript
await AdSDK.init({
    appId: 'wx1234567890abcdef',
    localConfigPath: 'config/my-ad-config.json',  // 自定义路径
});
```

路径说明：
- 以 `/` 开头：绝对路径（微信小游戏 `wx.env.USER_DATA_PATH` 下）
- 其他：相对于项目根目录

### 4.3 配置文件格式

```json
{
    "wx-app-id-1": {
        "banner": "adunit-xxx",
        "interstitial": "adunit-yyy",
        "rewardedVideo": {
            "gold": "adunit-zzz",
            "revive": "adunit-aaa",
            "speedUp": "adunit-bbb"
        }
    },
    "wx-app-id-2": {
        "banner": "adunit-ccc",
        "rewardedVideo": {
            "coin": "adunit-ddd"
        }
    }
}
```

### 4.4 环境适配

SDK 自动适配不同环境的文件读取：

| 环境 | 读取方式 |
|------|----------|
| 微信小游戏 | `wx.getFileSystemManager().readFile()` |
| Cocos Creator | `cc.resources.load()` (resources 目录) |
| 浏览器 / Node.js | `fetch()` 或 `XMLHttpRequest` |

---

## 五、配置优先级

SDK 配置加载优先级（从高到低）：

1. **测试模式**：`testMode: true` 时，使用内置测试配置
2. **本地配置对象**：`localConfig` 中对应 appId 的配置
3. **本地配置文件**：`localConfigPath` 指定的 JSON 文件
4. **默认路径文件**：自动查找的 `ad-config.json`
5. **远程配置**：`remoteConfigUrl` 加载的配置

---

## 六、多个小游戏共用 SDK

这是本 SDK 的核心设计目标。只需一份配置文件，即可支持多个小游戏：

**配置文件**（本地或远程）：

```json
{
    "wx-app-id-game1": {
        "banner": "adunit-game1-banner",
        "rewardedVideo": {
            "gold": "adunit-game1-gold",
            "revive": "adunit-game1-revive"
        }
    },
    "wx-app-id-game2": {
        "banner": "adunit-game2-banner",
        "rewardedVideo": {
            "coin": "adunit-game2-coin",
            "boost": "adunit-game2-boost"
        }
    }
}
```

**每个游戏初始化时指定自己的 appId**：

```typescript
// 游戏1 初始化
await AdSDK.init({
    appId: 'wx-app-id-game1',
    localConfigPath: 'ad-config.json',
});

// 游戏2 初始化（同样的 SDK，不同的 appId）
await AdSDK.init({
    appId: 'wx-app-id-game2',
    localConfigPath: 'ad-config.json',
});
```

SDK 会自动根据 `appId` 加载对应的广告配置。

---

## 七、API 参考

### 7.1 AdSDK 类

| 方法 | 说明 |
|------|------|
| `AdSDK.init(options)` | 初始化 SDK |
| `AdSDK.AdManager` | 获取 AdManager 实例 |
| `AdSDK.Config` | 获取 AdConfigManager 实例 |
| `AdSDK.setTestMode(enabled)` | 设置测试模式 |
| `AdSDK.destroyAll()` | 销毁所有广告 |
| `AdSDK.reloadLocalConfig(path?)` | 重新加载本地配置文件 |

### 7.2 AdManager 类

| 方法 | 说明 |
|------|------|
| `showBannerAd(options?)` | 显示 Banner 广告 |
| `hideBannerAd()` | 隐藏 Banner 广告 |
| `destroyBannerAd()` | 销毁 Banner 广告 |
| `showRewardedVideoAd(options)` | 显示激励视频广告（需指定 position） |
| `showInterstitialAd()` | 显示插屏广告 |
| `createCustomAd(options)` | 创建原生模板广告 |

### 7.3 配置格式

```typescript
interface AppAdConfig {
    banner?: string;              // Banner 广告位 ID
    interstitial?: string;         // 插屏广告位 ID
    rewardedVideo?: {              // 激励视频按位置配置
        [position: string]: string; // position -> adUnitId
    };
}

interface AdSDKConfig {
    [appId: string]: AppAdConfig; // appId -> 该小游戏的广告配置
}
```

---

## 八、最佳实践

### 8.1 配置管理

- **开发环境**：使用 `testMode: true` 开启测试模式
- **生产环境**：使用 `localConfigPath` 指定配置文件，便于部署时替换
- **热更新**：同时提供 `remoteConfigUrl` 作为远程配置，支持动态修改
- **紧急覆盖**：使用 `localConfig` 对象进行紧急配置覆盖

### 8.2 文件部署建议

```
# 项目结构示例
my-game/
├── ad-config.json          # 广告配置文件（随项目部署）
├── assets/
│   └── resources/
│       └── ad-config.json  # 或放在 resources 下（Cocos Creator）
└── src/
    └── main.ts
```

### 8.3 多个小游戏

- 所有小游戏共享一个配置文件（按 appId 区分）
- 各小游戏的广告位独立配置，互不干扰
- 便于在流量主后台统一管理多个小游戏的广告收益

### 8.4 激励视频

- 为每个场景定义清晰的位置标识（如 `gold`、`revive`）
- 不同位置可以复用同一个广告位 ID
- 通过流量主后台可以按广告位 ID 查看各场景收益

---

## 九、常见问题

### Q: 如何获取小游戏的 appId？

在微信公众平台 → 开发 → 开发管理 → 开发设置 → 开发者ID(AppID)

### Q: 本地配置文件应该放在哪里？

推荐放在项目根目录的 `ad-config.json`，或 Cocos Creator 项目的 `assets/resources/ad-config.json`。

### Q: 远程配置加载失败怎么办？

SDK 会自动降级到本地配置文件。如果没有本地配置，则输出警告。

### Q: 如何动态更新某个广告位？

```typescript
// 通过 AdConfigManager 动态设置
AdSDK.Config.setRewardedVideoAdUnit('gold', 'new-adunit-id');
```

### Q: 如何重新加载配置文件？

```typescript
// 重新从默认路径加载
await AdSDK.reloadLocalConfig();

// 或从指定路径加载
await AdSDK.reloadLocalConfig('config/ad-config.json');
```

### Q: 如何确认当前使用的是哪个配置？

```typescript
const appId = AdSDK.Config.getAppId();
console.log('当前 appId:', appId);

const allConfig = AdSDK.Config.getAllLocalConfig();
console.log('完整配置:', allConfig);
```

---

祝你的小游戏广告收益越来越高！💰

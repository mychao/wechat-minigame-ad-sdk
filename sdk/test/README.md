# 微信小游戏广告 SDK - 单元测试

## 一、测试说明

本目录包含 SDK 的完整单元测试，覆盖：
- `AdConfigManager` - 配置管理器
- `AdManager` - 广告管理器
- `AdSDK` - SDK 集成

## 二、测试环境

测试使用 Jest + ts-jest，在 Node.js 环境运行（非微信环境）。

Mock 对象：
- `wx` - 微信小程序 API（createBannerAd、createRewardedVideoAd 等）
- `cc` - Cocos Creator API（cc.resources.load）
- `fetch` / `XMLHttpRequest` - 浏览器环境

## 三、运行测试

### 3.1 安装依赖

```bash
cd docs/wechat-ads/sdk/test
npm install
```

### 3.2 运行所有测试

```bash
npm test
```

### 3.3 监听模式（开发时）

```bash
npm run test:watch
```

### 3.4 生成覆盖率报告

```bash
npm run test:coverage
```

## 四、测试用例概览

### AdConfigManager.test.ts

| 测试套件 | 用例数 | 覆盖内容 |
|---------|--------|---------|
| 基础功能 | 4 | 单例模式、初始化、getConfig |
| 配置优先级 | 4 | 测试模式 > 本地配置 > 远程配置 |
| 广告位获取 | 5 | getBannerAdUnit、getInterstitialAdUnit、getRewardedVideoAdUnit |
| 动态更新 | 2 | setRewardedVideoAdUnit、setTestMode |
| 多小游戏支持 | 3 | 不同 appId 获取各自配置 |
| 环境适配 | 4 | 微信、Cocos、浏览器、空环境 |
| getAllLocalConfig | 1 | 返回完整配置 |

### AdManager.test.ts

| 测试套件 | 用例数 | 覆盖内容 |
|---------|--------|---------|
| 基础功能 | 5 | 单例模式、showBannerAd、hideBannerAd、destroy、destroyAllAds |
| 激励视频回调 | 3 | 非微信环境直接奖励、微信环境调用、未知位置降级 |
| 防止重复调用 | 1 | 连续调用 showRewardedVideoAd 被阻止 |
| Banner 广告 | 2 | 配置缺失处理、正常显示 |
| 插屏广告 | 2 | 配置缺失处理、正常显示 |
| 原生模板广告 | 2 | 正常创建、非微信环境返回 null |

### SDK.test.ts

| 测试套件 | 用例数 | 覆盖内容 |
|---------|--------|---------|
| 初始化 | 3 | init 成功、AdManager 可用、未初始化处理 |
| 配置优先级 | 3 | 测试模式、本地配置、未知 appId |
| 多小游戏 | 1 | 不同 appId 获取各自配置 |
| 广告调用 | 4 | showRewardedVideoAd、showBannerAd、showInterstitialAd、非微信环境 |
| 工具方法 | 3 | setTestMode、destroyAll、reloadLocalConfig |

## 五、测试覆盖率目标

| 模块 | 目标覆盖率 | 当前状态 |
|------|---------|---------|
| AdConfigManager.ts | 90%+ | ✅ 已覆盖 |
| AdManager.ts | 80%+ | ✅ 已覆盖 |
| index.ts (AdSDK) | 90%+ | ✅ 已覆盖 |
| types.ts | N/A | 类型定义，无需测试 |

## 六、添加新测试

### 6.1 添加测试用例

在对应的 `.test.ts` 文件中添加：

```typescript
test('描述', async () => {
    // 准备
    resetSingletons();
    setEnv('wechat');

    // 执行
    const mgr = AdConfigManager.getInstance();
    await mgr.init({ appId: 'wx-test', ... });

    // 断言
    expect(mgr.getConfig()).not.toBeNull();
});
```

### 6.2 Mock 新环境

在 `setup.ts` 中添加：

```typescript
export function setEnv(env: 'wechat' | 'cocos' | 'browser' | 'empty') {
    // ... 现有代码

    if (env === 'new-env') {
        (global as any).newEnv = { ... };
    }
}
```

## 七、CI 集成

### GitHub Actions 示例

```yaml
name: SDK Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd docs/wechat-ads/sdk/test && npm install
      - run: cd docs/wechat-ads/sdk/test && npm test
```

## 八、已知限制

1. **微信 API 行为**：测试使用 mock，不保证与实际微信 API 完全一致
2. **文件读取**：本地文件读取测试需要真实文件系统，部分测试使用 mock
3. **远程配置**：远程配置测试使用 mock 的 wx.request，不发起真实网络请求

## 九、调试技巧

### 查看详细错误

```bash
npm test -- --verbose
```

### 运行单个测试文件

```bash
npx jest AdConfigManager.test.ts
```

### 运行单个测试套件

```bash
npx jest -t "AdConfigManager - 基础功能"
```

---

祝测试通过！✅

# 微信小游戏广告 SDK 发布指南

本文档说明如何将 SDK 发布到 npm，或作为 Git 依赖供外部使用。

## 方式一：发布到 npm（推荐）

### 1. 准备

确保已完成以下准备：

- [x] `package.json` 已创建，包名唯一（建议先到 npm 搜索确认）
- [x] `tsconfig.json` 已配置，可以编译出 `dist/` 目录
- [x] `README.md` 已编写，包含基本使用说明
- [x] 代码已测试，功能正常

### 2. 编译构建

```bash
cd sdk
npm install
npm run build
```

检查 `dist/` 目录是否生成了 `.js` 和 `.d.ts` 文件。

### 3. 登录 npm

```bash
npm login
# 按提示输入用户名、密码、邮箱
```

如果没有 npm 账号，先注册：https://www.npmjs.com/signup

### 4. 发布

```bash
# 确保包名没有被占用
npm search wechat-minigame-ad-sdk

# 发布
cd sdk
npm publish --access public
```

> 如果是 scoped 包（如 `@yourname/wechat-minigame-ad-sdk`），需要加上 `--access public`。

### 5. 更新版本

每次更新代码后，需要更新版本号：

```bash
# 补丁版本（1.0.0 -> 1.0.1）
npm version patch

# 小版本（1.0.0 -> 1.1.0）
npm version minor

# 大版本（1.0.0 -> 2.0.0）
npm version major

# 然后发布
npm publish
```

## 方式二：作为 Git 依赖使用

如果不想发布到 npm，可以将代码推送到 Git 仓库，然后通过 Git URL 安装。

### 1. 创建 Git 仓库

```bash
cd /Users/mychao/Documents/workspace/sdks/wechat-ads
git init
git add sdk/
git commit -m "Initial commit: wechat minigame ad SDK"
```

### 2. 推送到 GitHub/GitLab

```bash
# GitHub
git remote add origin https://github.com/your-username/wechat-ads-sdk.git
git push -u origin main

# 或者 GitLab
git remote add origin https://gitlab.com/your-username/wechat-ads-sdk.git
git push -u origin main
```

### 3. 外部项目安装

其他开发者可以通过 Git URL 安装：

```bash
# 通过 HTTPS
npm install https://github.com/your-username/wechat-ads-sdk.git

# 或者通过 SSH
npm install git+ssh://git@github.com:your-username/wechat-ads-sdk.git

# 安装指定分支
npm install https://github.com/your-username/wechat-ads-sdk.git#main
```

然后在代码中引用：

```typescript
import { AdSDK } from 'wechat-ads-sdk/sdk';
```

> 注意：这种方式引用的是整个仓库，入口路径是 `wechat-ads-sdk/sdk`。

如果希望直接引用 `wechat-ads-sdk`，可以在仓库根目录也创建一个 `package.json`，或者将 SDK 代码放在仓库根目录。

## 方式三：发布到私有 npm 仓库

企业内部可以使用私有 npm 仓库。

### Verdaccio（本地私有仓库）

```bash
# 安装 Verdaccio
npm install -g verdaccio

# 启动
verdaccio

# 设置 npm  registry
npm set registry http://localhost:4873

# 注册用户
npm adduser --registry http://localhost:4873

# 发布
cd sdk
npm publish
```

### 企业 npm 仓库

如果公司有私有 npm 仓库（如 Nexus、Artifactory），修改 `package.json` 中的 `publishConfig`：

```json
{
  "publishConfig": {
    "registry": "https://your-private-npm.com/"
  }
}
```

然后发布：

```bash
cd sdk
npm publish
```

## 方式四：直接复制文件（最简单）

对于小范围使用，可以直接将 `sdk/` 目录复制到其他项目中。

```bash
# 复制 SDK 目录到目标项目
cp -r sdk/ /path/to/your/project/libs/wechat-ad-sdk
```

然后在目标项目中引用：

```typescript
import { AdSDK } from '../libs/wechat-ad-sdk';
```

## 推荐方案

| 使用场景 | 推荐方式 |
|----------|----------|
| 开源，供所有人使用 | 发布到公共 npm |
| 企业内部使用 | 私有 npm 仓库 |
| 小团队，快速集成 | Git 依赖或直接复制 |
| 需要版本控制 | npm 版本管理 |

## 注意事项

1. **包名唯一性**：发布前到 npm 搜索确认包名未被占用
2. **敏感信息**：确保 `ad-config.json` 不包含真实广告位 ID（使用测试配置）
3. **编译检查**：发布前确保 `dist/` 目录已生成，且包含 `.d.ts` 类型声明文件
4. **测试**：发布前在测试项目中安装验证
5. **文档**：保持 README 更新，说明最新用法

## 验证发布结果

发布后，在其他项目中测试安装：

```bash
# 新建测试项目
mkdir test-project && cd test-project
npm init -y
npm install wechat-minigame-ad-sdk

# 创建测试文件
echo "import { AdSDK } from 'wechat-minigame-ad-sdk'; console.log(AdSDK);" > test.ts

# 编译测试
npx tsc --init
npx tsc test.ts
node test.js
```

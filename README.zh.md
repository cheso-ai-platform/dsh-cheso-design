# Cheso × DeepSeek Harness

[English](README.md) | 中文

用一句对话让 Cheso 做出成品——PPT、幻灯片、演示文稿、海报、图片或动效视频——然后直接在右侧栏打开，不用离开会话。

本仓库是 DeepSeek Harness 插件 `dsh-cheso-design` 的公开主页，npm 包为 [`dsh-cheso-design`](https://www.npmjs.com/package/dsh-cheso-design)。

## 功能

- 支持创建任务、等待结果和展示成品。Cheso 提问时，DSH 会展示问题和选项，等你回答或明确跳过。
- 每个结果在回合末尾显示为产物卡，点击文件即可在右侧栏预览。
- 任务全程在 Cheso 上执行，DSH 侧只保存对话、登录授权和短期预览地址。

| 工具 | 用途 |
| --- | --- |
| `cheso_create` | 创建任务，立即返回 `task_id` |
| `cheso_wait` | 等待任务；有提问时先等用户操作，完成后返回在线产物卡 |
| `cheso_stop` | 停止正在运行的 Cheso 任务 |
| `cheso_project_files` | 按项目 ID 或完整项目链接查询已有项目的文件 |
| `cheso_login` / `cheso_login_wait` | 显示授权卡，然后检查登录状态 |
| `cheso_whoami` | 查看已登录账号和积分 |
| `cheso_logout` | 清除当前站点的授权，并请求 Cheso 撤销 |

## 环境要求

- DeepSeek Harness `>=0.2.1-rc.1 <0.2.2-0 || >=0.2.2-rc.1 <0.3.0-0`，使用 Web profile。
- [cheso.ai](https://cheso.ai) 上的 Cheso 账号。

## 安装

```sh
dsh plugin --profile web add dsh-cheso-design
```

也可以在「插件 → 安装」里粘贴 `dsh-cheso-design` 后确认。从插件市场安装的效果相同。

插件通过 HMR 生效；如果宿主返回 `restart-required`，重启 DSH 即可。

## 使用

1. 打开「插件 → Cheso Design」的详情页，在「Cheso 账号」里点击「连接 Cheso 账号」，按授权页指引完成后回到 DSH，登录状态会自动确认。也可以在对话里说「使用 dsh-cheso-design 登录」，或点击登录卡上的「获取授权链接」。
2. 直接说要做什么，例如「使用 dsh-cheso-design 做一份三页的水循环 PPT」。也可以粘贴项目链接说「用 dsh-cheso-design 查看这个项目的产物」。

如果 Cheso 询问风格、大纲或其他选项，请在问答卡上逐题回答或明确跳过。原任务会自动继续。问答卡不可用时，可以打开 Cheso 项目处理，再回到 DSH 让它继续等待。

等待期间，可以用「插话发送」说「停止当前 Cheso 任务」。插件会向 Cheso 请求停止，并检查任务状态。

Cheso 卡片、预览控件和站点设置跟随「设置 → 常规」中的界面语言，支持中文、英文、日语、西班牙语、法语、德语、俄语和巴西葡萄牙语。

## 配置

| 字段 | 默认 | 说明 |
| --- | --- | --- |
| `site` | `configured` | `global` 使用 `https://cheso.ai`，`configured` 使用 `baseUrl` 和 `embedBaseUrl` |
| `baseUrl` | `https://cheso.ai` | 登录和项目 API 使用的站点地址 |
| `embedBaseUrl` | 空（跟随 `baseUrl`） | 预览页所在站点；本地联调时可指向 Vite |
| `devSet` | 空 | 可选的 Manager 分流标识；设置后 Host 请求会带 `X-Dev-Set` 头 |
| `timeoutSec` | `540` | 每段任务轮询的默认上限（秒），不含用户回答时间 |
| `token` | 空 | 可选的 API token，对应上面的 `baseUrl`；否则使用 DSH 凭据服务保存的站点授权 |

## 会离开本机的数据

- 你发送的需求，以及你附加或引用的文件，会上传到所选 Cheso 站点，供其 agent 处理。
- Cheso 授权保存在 DSH 凭据服务中，按站点区分；`cheso_logout` 会撤销该授权。
- 预览地址由 DSH 宿主在校验访问者为本实例所有者后签发，只在浏览器内存中使用。

## 已知限制

- 切换站点等于切换账号，凭据与项目历史都属于各自的账号。
- 升级或重装插件会关闭升级前打开的预览标签，需要从产物卡重新打开。

## 开发

```sh
npm install
npm run build      # 生成 lib/index.js 与 lib/client.js
npm run typecheck
npm test           # 构建插件并运行离线 Host 测试
```

`npm run watch` 可持续构建。改 Host 部分后需要重启 DSH；改 Client 部分随 Web 包热更新。

## 发布

在仓库根目录安装依赖，用有包发布权限的 npm 账号登录，然后指定发布渠道和版本。

```sh
npm ci
npm login --registry=https://registry.npmjs.org
npm run release -- test 0.1.1-rc.0 --dry-run
npm run release -- test 0.1.1-rc.0
npm run release -- stable 0.1.1
```

`test` 需要预发布版本号，发布到 `next`。测试者可以用 `npm install dsh-cheso-design@next` 安装。`stable` 需要正式版本号，发布到 `latest`。两个渠道都是公开的。

两个渠道均可用 `--dry-run` 预览。脚本会执行类型检查、构建和测试，并将指定版本写入临时打包目录中的 `package.json`。

仓库里的 `package.json` 记录最近一次发布的版本：打 tag 时在同一个提交里同步它和 lockfile，保证仓库与 npm 始终一致。

### GitHub Actions 自动发布

合并[发布工作流](.github/workflows/publish.yml)后，在 npm 包的设置里添加 [GitHub Actions Trusted Publisher](https://docs.npmjs.com/trusted-publishers/#configuring-trusted-publishing)。组织填 `cheso-ai-platform`，仓库填 `dsh-cheso-design`，工作流文件名填 `publish.yml`。Environment 留空，勾选允许 `npm publish`。

在要发布的提交上打 tag，再推送到 GitHub。版本号须在 npm 上尚未使用。`v0.1.1-rc.0` 这类预发布 tag 会发布到 `next`，`v0.1.1` 这类正式 tag 会发布到 `latest`。

```sh
git tag v0.1.1-rc.0
git push origin v0.1.1-rc.0
```

## 许可证

MIT，见 [LICENSE](LICENSE)。

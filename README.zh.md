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

## 许可证

MIT，见 [LICENSE](LICENSE)。

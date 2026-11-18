# Cheso for DeepSeek Harness

[中文](README.zh.md) | English

Turn a chat request into a finished Cheso artifact — a deck, a slide, a presentation, a poster, an image or a motion video — then open it in the right sidebar without leaving the conversation.

This repository is the public home of the `dsh-cheso-design` plugin for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). The npm package is [`dsh-cheso-design`](https://www.npmjs.com/package/dsh-cheso-design).

## What it does

- Lets the agent start a task and show the finished files. If Cheso asks a question, DeepSeek Harness shows you the options and waits for you to answer or skip.
- Renders every result as an artifact card at the end of the turn; clicking a file opens it in the right sidebar.
- Keeps the whole task on Cheso: the DSH side only holds the conversation, the login grant and a short-lived preview URL.

| Tool | Purpose |
| --- | --- |
| `cheso_create` | Create a task and return its `task_id` immediately |
| `cheso_wait` | Wait for a task, pausing for your answers when needed, then return its artifact card |
| `cheso_project_files` | List an existing project's files by project id or link |
| `cheso_login` / `cheso_login_wait` | Show the authorization card, then poll the login state |
| `cheso_whoami` | Show the signed-in account and its credits |
| `cheso_logout` | Clear this site's grant and ask Cheso to revoke it |

## Requirements

- DeepSeek Harness `>=0.2.1-rc.1 <0.2.2-0 || >=0.2.2-rc.1 <0.3.0-0` with the Web profile.
- A Cheso account on [cheso.ai](https://cheso.ai).

## Install

```sh
dsh plugin --profile web add dsh-cheso-design
```

Or open **Plugins → Install**, paste `dsh-cheso-design`, and confirm. Installing from the plugin market does the same thing.

The plugin activates through HMR; restart DSH if the host stops with `restart-required`.

## Use it

1. Open the **Plugins → Cheso Design** detail page and select **Connect Cheso account** under **Cheso account**. Finish on the authorization page and return to DSH, where the sign-in is confirmed automatically. You can also ask for `use dsh-cheso-design to log in`, or click **Get authorization link** on the login card.
2. Ask for what you want, for example `use dsh-cheso-design to make a three-slide deck about the water cycle`, or paste a project link and ask for its artifacts.

If Cheso asks about style, an outline, or another choice, use the question card to answer or explicitly skip each question. The same task resumes automatically. If the question card is unavailable, open the Cheso project to answer there, then ask DeepSeek Harness to continue waiting.

Cheso cards, preview controls and site settings follow the language selected in **Settings → General**. Available languages are Chinese, English, Japanese, Spanish, French, German, Russian and Brazilian Portuguese.

## Configuration

| Field | Default | Meaning |
| --- | --- | --- |
| `site` | `configured` | `global` uses `https://cheso.ai`. `configured` uses `baseUrl` and `embedBaseUrl`. |
| `baseUrl` | `https://cheso.ai` | Site used for login and the project API |
| `embedBaseUrl` | empty (follows `baseUrl`) | Where the preview page is served; point it at a local Vite server while developing |
| `devSet` | empty | Optional Manager routing id; when set, Host requests carry the `X-Dev-Set` header |
| `timeoutSec` | `540` | Default polling limit between questions or results, in seconds; time spent waiting for your answers does not count |
| `token` | empty | Optional API token for this `baseUrl`; otherwise the DSH credential store holds the site grant |

## What leaves your machine

- The prompt you send and the files you attach or reference are uploaded to the selected Cheso site so its agents can work on them.
- The Cheso grant is stored in the DSH credential store, scoped to that site; `cheso_logout` revokes it.
- Previews are shown through a short-lived URL that the DSH host signs after checking that the caller is the instance owner. The URL stays in browser memory.

## Limitations

- Switching sites switches both credentials and project history, because they belong to different accounts.
- Upgrading or reinstalling the plugin closes preview tabs that were opened before the upgrade; reopen them from the artifact card.

## Development

```sh
npm install
npm run build      # lib/index.js and lib/client.js
npm run typecheck
npm test           # builds the plugin and runs offline host tests
```

`npm run watch` rebuilds continuously while you edit. Changes to the host half need a DSH restart; client changes reload with the Web bundle.

## Publishing

From the repository root, install dependencies and sign in with an npm account that can publish the package. Choose a channel and an explicit version.

```sh
npm ci
npm login --registry=https://registry.npmjs.org
npm run release -- test 0.1.1-rc.0 --dry-run
npm run release -- test 0.1.1-rc.0
npm run release -- stable 0.1.1
```

`test` requires a prerelease version and publishes to `next`. Testers can install it with `npm install dsh-cheso-design@next`. `stable` requires a stable version and publishes to `latest`. Both channels are public.

Use `--dry-run` to preview either channel. The script type-checks, builds, runs tests, and writes the requested version to `package.json` in a temporary staging directory.

### GitHub Actions

After merging [the publish workflow](.github/workflows/publish.yml), open the npm package settings and add a [GitHub Actions trusted publisher](https://docs.npmjs.com/trusted-publishers/#configuring-trusted-publishing). Enter `cheso-ai-platform` as the organization, `dsh-cheso-design` as the repository, and `publish.yml` as the workflow filename. Leave Environment blank and allow `npm publish`.

Push a tag for an unused npm version on the commit you want to release. A prerelease tag such as `v0.1.1-rc.0` publishes to `next`. A stable tag such as `v0.1.1` publishes to `latest`.

```sh
git tag v0.1.1-rc.0
git push origin v0.1.1-rc.0
```

## License

MIT — see [LICENSE](LICENSE).

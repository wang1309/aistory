# 题材故事生成器设计

**日期：** 2026-10-27  
**状态：** 已确认，待实现

## 目标

在不更改、替代或重定向现有题材页面 URL 的前提下，新增六个具备独立生成体验的题材故事生成器：

- `/horror-story-generator`
- `/mystery-story-generator`
- `/sci-fi-story-generator`
- `/adventure-story-generator`
- `/children-story-generator`
- `/historical-story-generator`

这些页面补齐当前题材覆盖，不创建现有页面的同义或近义重复 URL。现有 `/fantasy-generator`、`/romance-story-generator`、`/bedtime-story-generator`、`/fanfic-generator`、`/comic-generator` 与 `/poem-generator` 继续作为各自主题的 canonical 页面。

## 页面与 SEO

每个新 URL 使用独立页面入口及独立 locale JSON，覆盖 `en`、`zh`、`de`、`ko`、`ja`、`ru`。页面须提供：

- 专属 title、description、keywords、Open Graph 与 Twitter metadata；
- 该 URL 的 canonical 与 `buildLanguageAlternates`；
- BreadcrumbList、WebApplication、FAQPage JSON-LD；
- 题材专属的 Hero、功能说明、使用场景、FAQ、CTA 与 RelatedTools 内容。

不得新增 `fantasy-story-generator`、`romance-generator` 或 `ai-fantasy-story-generator` 等与现有内容竞争的页面。新页面在 `src/services/tools.ts`、六个全局消息文件的 `ai_tools.tools`、以及 `src/app/sitemap.ts` 的静态 `routes` 数组和 `TOOL_ROUTES` 集合中注册。

## 生成器与 API

实现一个共享的客户端题材生成器。各页面通过类型受限的题材配置提供标题、路由、配额 page key、允许字段、默认值及题材专属选项；组件只呈现当前题材允许的输入。

实现 `/api/genre-story-generate`，并将可测试逻辑放到 `src/app/api/genre-story-generate/_lib.ts`。纯函数负责：

- 识别六种允许的题材；
- 验证通用与题材专属输入；
- 忽略或拒绝其他题材不允许的字段；
- 为每个题材创建对应的系统提示与用户提示。

路由层沿用项目标准：Turnstile 在未配置 secret 时自动跳过、`prepareCreativeQuota`、`commitCreativeQuotaCharge`、`withCreativeVisitorCookie`，并通过 `fetchChatCompletion` 与 `resolveModelTier` 进行流式输出。客户端保持既有的模型选择、匿名额度、Turnstile、流式结果、继续写作与故事保存体验。

## 题材差异

| 路由 | 题材专属输入 | 输出约束 |
| --- | --- | --- |
| Horror | 恐怖类型、恐怖强度、结局类型 | 避免将心理恐怖、超自然和怪物恐怖混为同一模板。 |
| Mystery | 案件类型、线索密度、侦探视角、揭示方式 | 线索、误导与真相必须保持逻辑一致。 |
| Sci-Fi | 科技主题、时代、硬/软科幻、世界规则 | 将科技规则及其后果落实到情节中。 |
| Adventure | 任务、地点、对手、风险 | 生成明确目标、行程阻碍与行动推进。 |
| Children | 读者年龄、教育目标、词汇难度、安全边界 | 符合年龄、正向且无不适龄内容。 |
| Historical | 时代、地点、历史背景、虚构比例 | 明确历史事实与虚构人物/情节的边界。 |

通用输入包括故事构想、长度、语气、叙事视角、受众、输出语言与模型档位。所有题材均使用其路由名作为创作额度的 page key，防止跨页面绕过匿名额度。

## 页面组织

页面入口保留为六个固定路由，保证路由发现性及各页独立 metadata；页面内部调用共享的服务器页面构建器和客户端生成器，避免复制 SEO 结构、配额交互和流式渲染代码。每个 locale JSON 保持题材内容独立，不以只替换题材名称的模板生成。

共享配置、类型、生成器、纯 API 逻辑和页面构建器各自只处理一类职责，避免将题材条件散落到六个页面中。

## 测试与验收

- `_lib.ts` 单元测试：允许/拒绝的 genre、必填字段、题材字段白名单、prompt 包含题材差异约束；
- 路由测试：验证请求处理、Turnstile 跳过行为、配额 page key 与 LLM 调用结构；
- 页面/站点注册测试：固定路由、metadata/alternates/schema、工具注册、六语言文案、Sitemap 两处注册；
- 定向运行新增测试，随后运行 `pnpm lint` 和 `pnpm build`。

## 非目标

- 不迁移、重命名或重定向任何现有公开题材 URL；
- 不新增由 tone、POV、长度、题材别名组合而成的薄内容 URL；
- 不将用户生成故事或分享链接加入 Sitemap；
- 不在本次处理 `/story-generate` 的 Sitemap 历史问题或第二阶段工具集群。

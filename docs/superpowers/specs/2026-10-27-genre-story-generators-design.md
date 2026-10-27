# 题材故事生成器设计

**日期：** 2026-10-27  
**状态：** 已确认，待实现

## 目标

在不更改、替代或重定向现有题材页面 URL 的前提下，新增五个具备独立生成体验的题材故事生成器：

- `/horror-story-generator`
- `/mystery-story-generator`
- `/sci-fi-story-generator`
- `/adventure-story-generator`
- `/historical-story-generator`

这些页面补齐当前题材覆盖，不创建现有页面的同义或近义重复 URL。现有 `/fantasy-generator`、`/romance-story-generator`、`/bedtime-story-generator`、`/fanfic-generator`、`/comic-generator` 与 `/poem-generator` 继续作为各自主题的 canonical 页面。

## 页面与 SEO

每个新 URL 使用独立页面入口及独立 locale JSON，覆盖 `en`、`zh`、`de`、`ko`、`ja`、`ru`。页面须提供：

- 专属 title、description、Open Graph 与 Twitter metadata；不设置 `meta keywords`；
- 该 URL 的 canonical 与 `buildLanguageAlternates`；
- BreadcrumbList、WebApplication、FAQPage JSON-LD；
- 题材专属的 Hero、功能说明、使用场景、FAQ、CTA 与 RelatedTools 内容。

不得新增 `fantasy-story-generator`、`romance-generator` 或 `ai-fantasy-story-generator` 等与现有内容竞争的页面。新页面在 `src/services/tools.ts`、六个全局消息文件的 `ai_tools.tools`、以及 `src/app/sitemap.ts` 的静态 `routes` 数组和 `TOOL_ROUTES` 集合中注册。

### Horror 落地页关键词布局

`/horror-story-generator` 是唯一的 Horror canonical URL；不再创建 `/ai-horror-story-generator`。`AI` 变体通过 title、H1、首屏、工具文案和可见内容承接，避免两个 URL 相互竞争。

英文页固定使用以下 TDH：

- Title：`Free Horror Story Generator – AI Scary Story Maker`
- Meta description：`Generate creepy plots, cursed characters and two-sentence scares in seconds. Free AI horror story generator — horror story ideas, titles and prompts, no sign-up.`
- H1：`Free AI Horror Story Generator`
- H1 下首句：`Turn one line of an idea into a full horror story, a plot outline or a two-sentence scare — pick a subgenre and generate.`

不设置或维护 HTML `meta keywords`。首屏必须直接包含可用生成器，而不是只有 CTA：Horror/Spooky/Psychological/Supernatural 题材、Two-sentence/Short/Full 长度、强度与结局选项，以及三张明确标作示例输出的编辑样例卡。信任文案应如实表述为免费且无需注册开始；不得在仍存在模型额度限制时声称“Unlimited”。

Horror 页在生成器后渲染下列可见、可维护的内容模块：

1. `Horror Story Ideas & Plots`，包含 `Horror story ideas with a twist` 和 `Plot structures that actually scare`；
2. `Horror Story Prompts by Subgenre`，覆盖 psychological、supernatural、body、folk、creepypasta 与 analog horror；
3. `Horror Story Titles`，含剧情输入和恰好五个标题的页内小工具；
4. `Two-Sentence Horror Stories`，含 12 条原创、可读的示例；
5. `How to Generate a Horror Story with AI`、`Who Uses a Horror Story Generator`、`What is a Horror Story Generator?` 与可见 FAQ；
6. `From Horror Story to Video`，提供适合视频化的场景节拍、旁白和视觉提示交接，但在没有视频渲染能力前不得自称视频生成器或承诺生成视频文件。

FAQ 必须展示并与 JSON-LD 逐题一致：`How can I create my own scary story?`、`Can you make me a horror story?`、`Can ChatGPT write horror stories?`、`What is the scariest story ever?`、`What is the best free horror story generator?`、`Can I make a horror story video from the generated story?`。FAQ schema 只表达页面上真实可见的问答，不承诺富结果展示。

Horror 页优先内部链接到首页 `/`，锚文本为 `AI story generator`；也可链接到已经存在的 `/plot-generator`、`/story-prompt-generator`、`/book-title-generator` 与 `/ai-write`。不得为尚不存在的 scary、spooky、ghost、Halloween、creepypasta 或 Christmas-horror 路由制造空链接或开设近义页面。未来仅在真实、可索引的对应内容上线后再使用这些精确锚文本；现有或未来的 horror-writing-prompts 内容应回链本页面并使用自然的 `horror story generator` 锚文本。

### Mystery 落地页关键词布局

`/mystery-story-generator` 是 Mystery 主工具页；不使用 `/mystery-story-generate`。英文页固定使用：

- Title：`Free Mystery Story Generator – AI Mystery Plot Maker`
- Meta description：`Generate a mystery plot, clue trail and twist ending in seconds. Free AI mystery story generator — mystery story ideas, titles and prompts, no sign-up.`
- H1：`Free AI Mystery Story Generator`
- H1 下首句：`Give it a setting, a victim and a suspect list — get a full mystery plot, a short story or a two-line hook you can build on.`

不设置 HTML `meta keywords`，也不得在仍存在模型额度限制时使用“Unlimited”。首屏直接提供 mystery 工具，包含 Murder/Cozy/Locked-room/Detective/Noir/Psychological、Hook/Short/Full outline、强度和 twist 选项，并展示三条标作示例输出的编辑样例：密室 clue 清单、noir 开场、三嫌疑人轮盘。

Mystery 页在生成器后展示：`Mystery Story Ideas & Plot Outlines`（含 `Mystery story ideas with a twist`）、`Mystery Story Prompts by Subgenre`、`Murder Mystery Generator` 短块、`Mystery Story Titles` 五标题小工具、`How to Build a Mystery Plot Step by Step`、`Clues, Red Herrings and the Twist`、`Mystery vs Thriller: Which Generator Do You Need?`、受众说明、定义段与 FAQ。页面必须解释证据、误导、嫌疑人和揭示之间的逻辑关系，而不是只重复关键词。

FAQ 必须可见并与 JSON-LD 逐题一致：`Is there a free mystery story generator?`、`Can AI write a good mystery story?`、`How do I come up with a mystery plot?`、`Can I generate a fantasy mystery story?`、`Can I generate a romance mystery story?`、`What's the difference between a mystery and a thriller?`、`Can I generate a crime story instead?`。

Mystery 页链接 `AI story generator` 至首页、`horror story generator` 至 Horror 页。`Murder Mystery Generator` 仅作为本页的内容板块和现有生成器中的子类型，不规划独立子页或对应内链。用户提供的信息型 URL `/blog/mystery-story-ideas` 与现有项目的 `/posts/[slug]` 架构冲突：在未获批进行全站博客迁移和永久重定向前，文章 canonical 应为 `/posts/mystery-story-ideas`，上线前不从工具页创建死链。Thriller 与 Crime 也仅在存在独立工具体验后才建立页面或链接。

### Sci-Fi 落地页关键词布局

`/sci-fi-story-generator` 是唯一的 Sci-Fi canonical URL。`sci fi`、`sci-fi` 与 `science fiction` 属于同一主题簇：页面使用可读的连字符写法作为主词，借由 title、H1、首屏、生成器与完整的可见内容覆盖其余自然变体；不为这些写法另开 URL。

英文页固定使用：

- Title：`Sci-Fi Story Generator – Free AI Science Fiction Plot Maker`
- Meta description：`Generate a sci-fi plot, world and cast in seconds — hard SF, space opera, cyberpunk or dystopian. Free AI sci-fi story generator with ideas, prompts and titles, no sign-up.`
- H1：`Free AI Sci-Fi Story Generator`
- H1 下首句：`Pick a subgenre and a length — get a full plot outline, a short story, or a one-line hook built around your world.`

不设置 HTML `meta keywords`，也不得在仍存在模型额度限制时使用“Unlimited”。首屏直接提供可用工具，包含 Hard SF/Space opera/Cyberpunk/Dystopian/Time travel/First contact/AI uprising/Post-apocalyptic 八种子类型、Hook/Short/Full outline 三种篇幅、Hard SF ↔ Space opera 的硬度选择，以及 twist 选项。首屏同时显示三条明确标作示例输出的编辑样例：一段 space-opera 开场、一个 AI 觉醒三幕大纲、一份飞船或殖民地设定清单。信任文案使用 `Free • No sign-up required • Start instantly`，不得承诺不限量。

Sci-Fi 页在生成器后展示下列可见、可维护的内容模块：

1. `Sci-Fi Story Ideas & Plot Outlines`，含 `Sci-fi story ideas with a twist`；
2. `Sci-Fi Writing Prompts by Subgenre`，为八种子类型各提供一条具体 prompt 示例；
3. `Worldbuilding: Settings, Species, Tech`，包含可读的角色示例，说明设定、物种、技术规则与情节后果的关系；
4. `Sci-Fi Story Titles`，含剧情输入和恰好五个标题的页内小工具；
5. `How to Generate a Sci-Fi Story in 4 Steps`，按 world → conflict → tech rule → twist 展开；
6. `Make It Believable: The One Rule of Hard SF`，解释一条技术规则应如何始终产生可见后果；
7. `Sci-Fi vs Fantasy: Which Generator Do You Need?`，清晰比较科学推演与魔法/神话规则；
8. `Who Uses a Sci-Fi Story Generator`、`What is a Sci-Fi Story Generator?` 与可见 FAQ。

FAQ 必须可见并与 JSON-LD 逐题一致：`Is there a free sci-fi story generator?`、`Can AI write a good science fiction story?`、`Can I generate a fantasy story instead?`、`Can I generate a romance sci-fi story?`、`What is a sci-fi backstory generator?`、`How long a story can it generate?`、`What's the difference between sci-fi and fantasy?`。FAQ schema 只表达可见、可维护的问答，不承诺富结果展示。

Sci-Fi 页链接 `AI story generator` 至首页、`horror story generator` 至 Horror 页、`mystery story generator` 至 Mystery 页，并以 `fantasy story generator` 锚文本链接至现有 canonical `/fantasy-generator`。`sci fi name generator` 是不同的命名任务，不得硬塞入故事生成器的 title、H1 或主体段落；本次不规划对应路由或空链接。`sci fi story ideas` 与 `sci fi writing prompts` 是信息型内容机会：现有内容系统使用 `/posts/[slug]`，未单独获批和发布前不得创建 `/blog/...` URL 或死链。上述文章、主工具页与相邻题材页发布后可自然回链本页并使用 `sci-fi story generator` 锚文本。

### Adventure 落地页关键词布局

`/adventure-story-generator` 是唯一的 Adventure canonical URL。页面服务的任务是：帮助用户在浏览器内生成并阅读冒险故事、剧情大纲或有两到三个可点选分支的互动路径；它不声称提供原生应用或完整游戏引擎。

英文页固定使用：

- Title：`Adventure Story Generator – Free AI Adventure Plot Maker`
- Meta description：`Generate an adventure story, quest or plot in seconds — pirates, lost worlds, space, or a playable choose-your-path. Free AI adventure story generator, no sign-up.`
- H1：`Free AI Adventure Story Generator`
- H1 下首句：`Pick a setting and a length — get a full adventure plot, a short story, or a playable branching path you can read right here.`

不设置 HTML `meta keywords`，也不得在仍存在模型额度限制时使用“Unlimited”。首屏必须直接包含可用工具：Pirate/Lost world/Space/Fantasy kingdom/Survival/Mystery quest 六种场景，以及 One-line hook/Short story/Full plot outline/Playable branching path 四种篇幅或输出形式。选择 Playable branching path 后，结果必须在浏览器中展示当前场景与两到三个可点选选择；选择后继续生成下一个场景与选择。首屏展示三条明确标作示例输出的编辑样例：一个海盗寻宝开场、一份遗迹探险三幕大纲、一段有两到三个选择的分支剧情。信任文案使用 `Free • No sign-up • Play in browser`，不得承诺不限量。

Adventure 页在生成器后展示下列可见、可维护的内容模块：

1. `Adventure Story Ideas & Plots`，包含 `Adventure story ideas with a twist`；
2. `Adventure Writing Prompts by Setting`，为六种场景各提供一条具体 prompt 示例；
3. `Choose Your Own Adventure`，提供分支选择器并说明每个选择会如何继续当前故事；
4. `Play It Instead of Reading It`，以可在浏览器中继续点击的文字互动模式承接互动游戏与文本冒险需求；
5. `Adventure Story Titles`，含剧情输入和恰好五个标题的页内小工具；
6. `From Adventure to Tabletop`，短块说明如何把任务、遭遇和地点改写为桌游素材；
7. `How to Generate an Adventure Story in 4 Steps`，按 setting → inciting incident → escalating obstacles → payoff 展开；
8. `What Makes an Adventure Story Work`，解释冲突升级、代价、地图与目标；
9. `Adventure vs Fantasy: Which Generator Do You Need?`、受众说明、定义段与 FAQ。

FAQ 必须可见并与 JSON-LD 逐题一致：`Is there a free adventure story generator?`、`Can I use it online without installing anything?`、`Can I play the story as a game?`、`Can I make a text-based adventure RPG?`、`Can I generate a DnD adventure or campaign?`、`Can teachers use it with students?`。FAQ schema 只表达页面上真实可见的问答：浏览器中的分支路径可阅读和继续点击，但不承诺原生应用、多人游戏或完整 RPG 规则引擎。

Adventure 页链接 `AI story generator` 至首页，并以 `horror story generator`、`mystery story generator`、`sci-fi story generator` 链接已规划的相邻题材页，以 `fantasy story generator` 锚文本链接现有 canonical `/fantasy-generator`。当前没有与 `DnD campaign generator` 或 `DnD adventure generator` 相符的独立工具：`From Adventure to Tabletop` 在本次保留为可读内容，不得虚构链接或把现有 backstory 工具伪装成 campaign generator。`DnD campaign generator`、`choose your own adventure generator`、`superhero story generator` 仅记录为未来需单独获批、具备独立体验后才能创建的候选任务，不属于本次 P1。`adventure story ideas` 与 `adventure story` 是信息型内容机会，遵循现有 `/posts/[slug]` 架构；未单独获批和发布前不得创建 `/blog/...` URL 或死链。发布后的文章、主工具页和相邻题材页应使用自然的 `adventure story generator` 锚文本回链本页，不使用无意义的 `adv`。

## 生成器与 API

实现一个共享的客户端题材生成器。各页面通过类型受限的题材配置提供标题、路由、配额 page key、允许字段、默认值及题材专属选项；组件只呈现当前题材允许的输入。

实现 `/api/genre-story-generate`，并将可测试逻辑放到 `src/app/api/genre-story-generate/_lib.ts`。纯函数负责：

- 识别五种允许的题材；
- 验证通用与题材专属输入；
- 忽略或拒绝其他题材不允许的字段；
- 为每个题材创建对应的系统提示与用户提示。

路由层沿用项目标准：Turnstile 在未配置 secret 时自动跳过、`prepareCreativeQuota`、`commitCreativeQuotaCharge`、`withCreativeVisitorCookie`，并通过 `fetchChatCompletion` 与 `resolveModelTier` 进行流式输出。客户端保持既有的模型选择、匿名额度、Turnstile、流式结果、继续写作与故事保存体验。

## 题材差异

| 路由 | 题材专属输入 | 输出约束 |
| --- | --- | --- |
| Horror | 恐怖类型、恐怖强度、结局类型 | 避免将心理恐怖、超自然和怪物恐怖混为同一模板。 |
| Mystery | 子类型、强度、是否 twist；在故事构想中填写场景、受害者与嫌疑人 | 线索、误导与真相必须保持逻辑一致。 |
| Sci-Fi | 子类型、硬度、是否 twist；在故事构想中填写世界、冲突和科技规则 | 将科技规则及其后果落实到情节中。 |
| Adventure | 场景、篇幅或输出形式 | 生成明确目标、行程阻碍与行动推进；选择分支路径时提供两到三个可点击、可继续的文字选项。 |
| Historical | 时代、地点、历史背景、虚构比例 | 明确历史事实与虚构人物/情节的边界。 |

通用输入包括故事构想、长度、语气、叙事视角、受众、输出语言与模型档位。所有题材均使用其路由名作为创作额度的 page key，防止跨页面绕过匿名额度。

## 页面组织

页面入口保留为五个固定路由，保证路由发现性及各页独立 metadata；页面内部调用共享的服务器页面构建器和客户端生成器，避免复制 SEO 结构、配额交互和流式渲染代码。每个 locale JSON 保持题材内容独立，不以只替换题材名称的模板生成。

共享配置、类型、生成器、纯 API 逻辑和页面构建器各自只处理一类职责，避免将题材条件散落到五个页面中。

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

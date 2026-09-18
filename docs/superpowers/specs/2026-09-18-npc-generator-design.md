# NPC Generator 设计

## 目标

在 storiesgenerator.org 新增 `/ai-tools/npc-generator`。它是一个免登录、零 AI
调用、零配额扣除的 NPC 快速生成工具，服务两类不同用户：选择「通用奇幻 RPG」
的玩家获得可立即角色扮演的叙事卡；选择「D&D 5e」的地下城主额外获得完整、
可战斗的 5e 兼容属性块。

首发以英文完整内容承接 `npc generator`、`dnd npc generator` 和 `random npc
generator` 词簇，同时提供中文、德语、韩语、日语、俄语的完整界面、元数据、
页面文案和词库本地化。该页面的商业价值是自然搜索获客和导流至既有
`dnd-backstory-generator`，而不是单独的订阅产品。

## 范围

- 创建 `/ai-tools/npc-generator` 及六语言路由，页面归属 `ai-tools`。
- 页面默认选择「通用奇幻 RPG」，零输入即可生成一张角色扮演卡。
- 用户切换至「D&D 5e」后，输出通用卡加完整战斗属性块：AC、HP、六维、速度、
  感知、语言、CR 和 1-3 个动作。
- 用户可锁定任一输出字段后重掷其余字段，或单独重掷一个未锁定字段；可重掷整张卡。
- 输出可复制为 Markdown 或纯文本。
- 仅在 5e 模式展示「扩写背景故事」入口，并把可兼容字段预填至
  `/dnd-backstory-generator`。
- 使用本地词库、模板和可复现的伪随机序列；无 API、Turnstile、创作额度、账号、
  数据库存储、localStorage、分享链接、存档或分析事件。
- 注册到工具目录、站点地图、六语言卡片文案、页面文案与图标注册机制。

## 非目标

- 不提供泛用数值/属性系统；通用奇幻 RPG 模式不显示 5e 属性、CR 或动作。
- 不实现战役管理、用户 NPC 库、永久保存、协作、分享 URL 或批量生成。
- 不将随机输出声称为官方 D&D 规则、平衡过的遭遇设计或完整角色构筑。
- 不复制 D&D 的专有规则文本；5e 模板只使用 SRD 兼容的普通数值结构和原创动作说明。
- 不在此页面做 AI 深化生成、鉴权、付费墙或新的订阅计划。

## 用户体验

### 初始状态和模式选择

首屏显示清晰的模式分段控件：`Fantasy RPG`（默认）和 `D&D 5e`。模式切换不请求
网络，也不保留不兼容的数值字段。页面初始显示一个可直接点击的「Generate NPC」
按钮以及简短说明。用户可选定以下约束后再生成：种族/血统、性别表达、职业/场景
角色、场景基调，以及 5e 模式专用的 CR 档位。

全部选择项支持 `Random`。这保证临场玩家不填表也能立刻拿到角色，同时让备团用户
能控制酒馆老板、卫兵、对手、任务发布者等常见场景。

### 通用奇幻 RPG 卡片

结果始终按可扫描的固定顺序展示：姓名、种族/血统、职业/场景角色、外观、声音或
习惯、性格特征、当前动机、秘密、剧情钩子。它不显示 AC、HP、属性、CR 或动作。
这张卡的目标是在几秒内给用户一个可演出的角色，而不是取代任意游戏系统的规则书。

### D&D 5e 卡片

5e 模式在相同叙事字段下显示属性块：AC、HP、速度、力量/敏捷/体质/智力/感知/魅力、
被动感知、语言、CR 和一至三个动作。数值来自按角色职业和 CR 档位选择的离散模板，
而不是将完全随机的六维、AC、HP 拼在一起。非战斗角色仍有低 CR 的基础自卫动作；
用户须在界面中看到这是「5e-compatible quick NPC」，而非经官方审核的 stat block。

### 重掷、锁定和复制

每个字段头部有可访问的锁定按钮和重掷按钮。锁定表示**后续整卡重掷**保留该字段；
单字段重掷始终只替换该字段，是否锁定不影响用户主动点按自己的字段重掷。锁定状态
只存在当前 React 会话。

「Reroll NPC」先保留所有锁定字段，再从同一模式与约束生成剩余字段。随机源以
`crypto.getRandomValues` 生成种子，由纯函数消费该种子；测试可注入固定随机函数，
生产不承诺 URL 可复现。

「Copy Markdown」输出标准标题、叙事字段和可选的 5e 表格；「Copy text」输出不依赖
Markdown 的可粘贴文本。复制失败显示本地化 toast，不能因为 Clipboard API 不可用而
丢失结果或锁定状态。

### 背景故事深化

5e 卡结果底部出现「Expand into DnD Backstory」。点击后使用站内 `router.push` 前往
`/dnd-backstory-generator`，并通过现有 `GENERATOR_PREFILL_KEY` sessionStorage 约定
传递以下字段：

- `race`：NPC 的种族/血统；
- `characterClass`：职业或 5e 原型；
- `background`：角色职业/场景角色；
- `prompt`：由姓名、外观、习惯、动机、秘密、剧情钩子拼成的简短概念；
- `motivation`、`secret`、`hookType`：从当前卡映射得到的可选值；
- `useCase`：固定为 `npc`。

通用模式不显示这个入口，以免承诺将非 D&D 内容正确转换为 5e 规则内容。

## 架构

### 纯逻辑层

`src/lib/npc-generator.ts` 是唯一的生成规则边界。它定义闭合集合、输出类型、默认
约束、词库、5e 模板与纯函数：

```ts
export type NpcGameSystem = "fantasy" | "dnd5e";
export type NpcCrTier = "commoner" | "trained" | "veteran" | "elite";

export interface NpcGenerationOptions {
  system: NpcGameSystem;
  race: string;
  presentation: string;
  role: string;
  tone: string;
  crTier: NpcCrTier;
}

export interface NpcCard {
  name: string;
  race: string;
  presentation: string;
  role: string;
  appearance: string;
  mannerism: string;
  personality: string;
  motivation: string;
  secret: string;
  hook: string;
  statBlock?: Dnd5eNpcStatBlock;
}
```

生成函数接受一个随机函数参数，默认用加密随机源；测试以固定序列保证断言稳定。它保证
通用卡永远没有 `statBlock`，5e 卡永远有完整 `statBlock`。一个单字段重掷函数只更新
请求的顶级叙事字段；5e 属性块作为不可拆分的 `statBlock` 字段整体重掷，避免 AC、HP
和动作来自相互矛盾的模板。锁定/重掷状态属于客户端，不能污染领域逻辑。

词库为每个首发 locale 提供独立的显示字符串，键与规则模板保持语言无关。这样英文词库
可针对 SEO 和桌游表达深度维护，同时六语言用户实际看到本地化的姓名片段、外观、习惯、
动机、秘密和钩子。任何 locale 缺少词条时，构建期测试失败，不能静默回退英文。

5e 模板按 `roleArchetype` 和 `crTier` 建模，列出所有完整字段。每个模板提供动作数组，
动作数限制为 1-3。模板输出以常识性数值为目标，不承诺遭遇平衡，也不引用专有怪物文本。

### 客户端生成块

`src/components/blocks/npc-generator/index.tsx` 是一个 client component，拥有选项、
当前卡片、锁定集合与复制状态。它从 `src/lib/npc-generator.ts` 导入生成函数，不发送
fetch 请求。组件复用站内 `Button`、`Select`、`Label`、`Card`、toast、lucide 图标、
`useLocale` 与本地化导航 router。

结果卡、5e 属性块、导出格式和背景故事预填可拆分为同目录内的小组件/纯 formatter，
避免将互动状态、数值渲染和字符串序列化混在一个大型文件中。所有图标按钮必须有
`aria-label` 和 tooltip；锁定和重掷按钮有固定尺寸，保证字段文字变长时布局不跳动。

### 服务端页面与本地化

`src/app/[locale]/(default)/ai-tools/npc-generator/page.tsx` 参照其他 ai-tools 页面：
动态导入 `src/i18n/pages/npc-generator/<locale>.json`，设置 locale，输出 title、
description、keywords、canonical、Open Graph 与 language alternates，渲染工具块及
FeatureIntro、HowToUse、Benefits、UseCases、FAQ、RelatedTools 和 CTA。

英文 H1 必须为 `Free NPC Generator for D&D 5e & Fantasy RPGs`，并自然覆盖主词。
页面追加 `BreadcrumbList`、`WebApplication` 和有 FAQ 时的 `FAQPage` JSON-LD。应用
类别为 `GameApplication`，免费报价为 USD 0。SEO 正文必须说明两种模式的区别，不能把
通用奇幻模式描述成 D&D 规则工具。

所有六个 locale JSON 都有并行的 `metadata`、`ui`、模式/筛选项、字段标签、状态提示、
复制文本、FAQ 和支持区块。`src/types/blocks/npc-generator.d.ts` 描述这些页面数据；
`src/i18n/messages/{en,zh,de,ko,ja,ru}.json` 为工具中心卡片增加
`ai_tools.tools.npc_generator`。

### 工具注册

在 `src/services/tools.ts` 注册 `npc-generator`：`module: "ai-tools"`、与现有工具分类
一致的 `category`、`href: "/ai-tools/npc-generator"`、已在
`src/components/icon/index.tsx` 可用的 Remix 图标、卡片文案 key 和合理 priority。页面
曾未在根路径出现，所以不增加重定向。

`src/app/sitemap.ts` 同时将路径加入 `routes` 与 `TOOL_ROUTES`。这是硬编码规则，不可
只依赖 tools registry。

## 错误处理、隐私与可访问性

- 不存在网络生成失败；所有初始生成、模式切换、字段重掷都同步完成。
- 当选项值非法或某个 locale 词库为空，纯逻辑在开发时抛出明确错误；页面将该类错误
  作为不可恢复的本地错误显示，不生成半张卡。
- 复制 API 不可用或失败时，页面保留结果和所有锁定状态，并显示本地化错误 toast。
- 不写入 API、数据库、cookie、localStorage、永久 session 存档或分析系统。
- 模式、筛选器、锁定、重掷和复制均可键盘操作；结果区域使用 `aria-live="polite"`；
  5e 数值以有表头的语义化表格呈现；不只依靠颜色传达锁定或模式状态。

## 测试

测试遵循仓库 `node:test` + `tsx` 约定，并在实现前写入。

1. `tests/npc-generator-lib.test.ts`
   - 用固定随机源验证通用卡字段完整且绝无 `statBlock`；
   - 验证 5e 卡的 AC、HP、六维、速度、感知、语言、CR 和 1-3 个动作都存在；
   - 验证角色职业和 CR 档位选择相应模板；
   - 验证单字段重掷只改变指定字段、5e 属性块整体重掷；
   - 验证六语言词库都可生成完整卡，且非法 locale/模式/档位会失败；
   - 验证 Markdown/纯文本 formatter 同时覆盖通用和 5e 结果。

2. `tests/npc-generator.test.ts`
   - 源码级验证 client block 不含 `fetch`、Turnstile、creative quota、AI auth/paywall、
     `localStorage` 或分析事件；
   - 验证模式切换、锁定、字段重掷、整卡重掷、两种复制和仅 5e 可见的深化入口；
   - 验证预填使用 `GENERATOR_PREFILL_KEY` 并固定 `useCase: "npc"`。

3. `tests/npc-generator-page.test.ts`
   - 验证路由、英文 H1、metadata alternates、BreadcrumbList、WebApplication、
     FAQPage、`GameApplication` 和相关工具；
   - 验证六个 locale 页面数据有相同完整结构，英文元数据覆盖主词和模式差异。

4. `tests/npc-generator-site-registration.test.ts`
   - 验证 tools registry 中的 slug、module、category、href、图标和卡片 key；
   - 验证六语言卡片文案、工具中心发现和 sitemap 的默认/本地化 URL；
   - 源码级验证 `routes` 与 `TOOL_ROUTES` 都含该路径。

实现后依次运行四个聚焦测试文件、`pnpm lint` 与 `pnpm build`。全量测试存在已知的无关
失败时，只报告而不为本功能改动无关测试。

## 验收标准

- 无账号访客可在不产生任何网络请求的情况下生成通用奇幻或 D&D 5e NPC。
- 默认通用模式不展示数值规则；5e 模式稳定输出完整属性块和 1-3 个动作。
- 字段锁定、单字段重掷、整卡重掷、Markdown/文本复制均可用且不会丢失锁定字段。
- 只有 5e 卡提供背景故事深化入口，且能将兼容字段预填到既有页面。
- 英文拥有完整 SEO 内容，全部六种 locale 均有完整 UI、词库、页面内容、metadata 和
  工具中心卡片文案。
- 工具在 ai-tools hub 和 sitemap 可发现；注册、纯逻辑、页面与本地化均被自动化测试覆盖。

## 发布后验证

发布后第 30、60、90 天从 Search Console 检查 `npc generator`、`dnd npc generator`、
`random npc generator` 的非品牌词展示、CTR 和页面排名，并从站内可聚合指标查看模式
选择、生成完成、复制、5e 背景故事跳转与复访。除非后续获得合规的聚合指标能力，否则
不引入内容级追踪，不记录 NPC 字段或用户自定义文本。若主要流量只生成一次且不跳转，
优先改善快速卡价值和内部工具衔接，而不是增加 AI 成本或收费墙。

# 页面级 Creative 每日额度设计

## 目标

将主页现有的 Creative 模型每日 3 次免费额度推广到所有包含 Creative 模型的生成落地页，同时保证每个页面的额度独立计算。登录用户在免费额度用完后可以继续使用并扣积分；匿名用户用完额度后必须登录，且同一浏览器内的匿名使用次数会转移到登录账号。

## 产品规则

- 每个页面每天独立提供 3 次 Creative 免费额度，按 UTC 日期重置。
- 额度只适用于 `creative` 模型，`fast`、`standard` 等模型保持现有行为。
- 登录用户当天尚未使用某页面的 Creative 时，先使用该页面的 3 次免费额度。
- 登录用户用完某页面的免费额度后，继续生成时按统一 Creative 成本扣积分。
- 登录用户积分不足时，接口返回 `402 insufficient_credits`，前端打开现有付费墙。
- 匿名用户用完某页面的免费额度后，接口返回 `429 free_quota_exceeded`，前端引导登录。
- 匿名用户当天使用 1-2 次后在同一浏览器登录，已使用次数转移到账号；例如匿名使用 1 次，登录后该页面剩余 2 次免费额度。
- 匿名用户当天使用满 3 次后在同一浏览器登录，账号在该页面当天直接进入积分扣费阶段，不重新获得 3 次免费额度。
- 匿名额度只通过同一浏览器的服务端 `visitor_id` cookie 转移；跨设备登录不转移匿名使用次数。
- 匿名和账号使用次数合并时按页面、日期分别处理，账号已使用次数与匿名已使用次数相加并封顶为 3，匿名记录随后标记为已合并。
- AI 上游请求失败时不扣积分；免费额度计数沿用主页当前策略，在通过额度闸门、调用上游前乐观增加。

## 页面与 API 映射

以下页面使用固定的服务端 page key；page key 由 API 路由决定，不从客户端请求体读取：

| Page key | 页面组件 | API 路由 |
| --- | --- | --- |
| `story-generator` | `src/components/blocks/story-generate/index.tsx` | `/api/story-generate` |
| `backstory-generator` | `src/components/blocks/backstory-generate/index.tsx` | `/api/backstory/generate` |
| `bedtime-story-generator` | `src/components/blocks/bedtime-story-generate/index.tsx` | `/api/bedtime-story/generate` |
| `comic-generator` | `src/components/blocks/comic-generate/index.tsx` | `/api/comic-generate` |
| `dialogue-generator` | `src/components/blocks/dialogue-generate/index.tsx` | `/api/dialogue-generate` |
| `dnd-backstory-generator` | `src/components/blocks/dnd-backstory-generate/index.tsx` | `/api/dnd-backstory/generate` |
| `fanfic-generator` | `src/components/blocks/fanfic-generate/tabbed-fanfic-generate.tsx` | `/api/fanfic-generate` |
| `fantasy-generator` | `src/components/blocks/fantasy-generate/index.tsx` | `/api/fantasy-generate` |
| `plot-generator` | `src/components/blocks/plot-generate/index.tsx` | `/api/plot-generate` |
| `poem-generator` | `src/components/blocks/poem-generate/index.tsx` | `/api/poem-generate` |
| `romance-story-generator` | `src/components/blocks/romance-story-generate/index.tsx` | `/api/romance-story/generate` |

## 后端架构

### 统一额度服务

扩展 `src/lib/free-quota.ts`，保留现有 Cloudflare KV / REST fallback 和 UTC 日期逻辑，新增页面参数：

- `checkCreativeQuota(pageKey)`：读取当天身份的页面级 Creative 使用量。
- `incrementCreativeQuota(pageKey)`：在免费额度路径中增加页面级使用量。
- `mergeVisitorCreativeQuota(pageKey, visitorId, userUuid)`：登录后将同一浏览器匿名记录合并到账户，并写入合并标记。
- `getOrCreateVisitorId()`：读取请求 cookie；不存在时生成随机不可预测 ID，并由 API 响应设置 `visitor_id` cookie。

账号 key 使用 `free-quota:<date>:user:<uuid>:<pageKey>:creative`；匿名 key 使用 `free-quota:<date>:visitor:<visitorId>:<pageKey>:creative`；合并标记使用对应日期、visitor、账号和 page key 的独立 key。已有旧版故事额度 key 不再作为其它页面的来源；故事页迁移到新的 `story-generator` key 时需保持兼容策略，避免同一用户突然获得重复免费额度。

额度服务返回统一状态：

```ts
type CreativeQuotaStatus = {
  used: number;
  limit: number;
  remaining: number;
  mode: "free" | "credits";
};
```

### API 闸门

每个上述 API 在 Turnstile 验证成功后、调用 AI 上游前执行相同流程：

1. 获取账号 UUID和浏览器 visitor ID。
2. 登录请求先执行匿名额度合并；匿名请求只读取 visitor 额度。
3. 检查跨页面共享的 IP hard cap，超过时继续返回 `429 rate_limited`。
4. 仅当 `model === "creative"` 时检查页面级额度。
5. `used < limit`：执行 `incrementCreativeQuota(pageKey)`，标记 `mode: "free"`。
6. `used >= limit` 且未登录：返回 `429 free_quota_exceeded`，包含 `remaining: 0`、`limit` 和 `need: "login"`。
7. `used >= limit` 且已登录：读取用户积分；积分不足返回 `402 insufficient_credits`，积分足够则记录待扣费成本。
8. 只有 AI 上游响应成功后才调用 `decreaseCredits`；扣费失败不回滚已发生的上游请求，但记录安全日志并保持现有 fail-open 行为。

所有额度错误使用显式 HTTP 状态，避免被流式客户端当作正常生成内容处理。API 不信任客户端传入的 page key，也不把 cookie 中的 visitor ID 作为账号身份使用。

## 前端架构

新增共享客户端 quota 工具，负责页面级 localStorage 镜像：

- key 格式：`creative_quota:<pageKey>:<UTC日期>`；
- hydration 后读取 `used`，只用于即时 UI，不作为服务端权限判断；
- Creative 生成成功后同步本地使用次数；
- 页面收到额度错误时立即将本地使用次数更新到 limit；
- 页面显示今日剩余次数和额度用尽状态。

每个页面提供自己的 page key，并在现有生成错误处理处增加统一分支：

- `429 free_quota_exceeded`：同步额度、提示额度用完、调用现有 `requireAuth`；
- `402 insufficient_credits`：提示积分不足、打开现有 `PaywallModal`；
- 其它错误：保持页面原有错误提示和生成状态处理。

需要付费墙的页面复用现有 `src/components/story/paywall-modal.tsx`，不复制支付逻辑。登录引导使用现有 auth source/page 归因，page key 与 auth source page 保持一致。

现有 6 个未提交的 activation 埋点改动必须保留；额度拦截、成功生成和失败路径不得删除或重复触发已有 generation 事件。

## 错误与一致性

- KV 不可用时延续现有 fail-open 策略，记录安全日志并允许请求继续；前端 localStorage 不得被当作真实额度来源。
- visitor cookie 只存随机 ID，不存用户邮箱、账号 UUID、额度或支付信息；设置为 `HttpOnly`、`SameSite=Lax`、`Secure`（生产环境）并使用合理过期时间。
- 同一请求只允许一次额度计数；重复请求或刷新由服务端 key 负责约束，前端按钮禁用只作为体验优化。
- 免费额度按页面隔离，IP hard cap 仍跨页面共享。
- 账号合并和额度增加需要避免重复执行；合并标记必须在成功迁移后写入。

## 验证与测试

### 单元/服务测试

- page key 参与 KV key 生成，11 个页面互不串额度。
- 匿名用户在同一页面第 1、2、3 次免费放行，第 4 次返回 `429 free_quota_exceeded`。
- 登录用户没有匿名历史时同一页面前 3 次免费，第 4 次在积分足够时进入扣费模式。
- 匿名使用 1-2 次后同一浏览器登录，账号只获得剩余次数；匿名使用 3 次后登录直接进入扣费模式。
- 合并操作幂等，重复请求不会重复转移匿名次数。
- 积分不足返回 `402`，AI 上游失败不调用扣费函数。
- 不同 UTC 日期自动使用新 key。

### 集成验证

- 所有 11 个 API 在 Creative 路径执行额度闸门，非 Creative 路径不受影响。
- 所有 11 个前端页面正确处理 `429` 和 `402`，并显示各自 page key 的剩余次数。
- 现有 story-generator 的生成、登录、付费墙和 activation 埋点行为不回退。
- 运行 `pnpm lint`、`pnpm build` 及相关测试。


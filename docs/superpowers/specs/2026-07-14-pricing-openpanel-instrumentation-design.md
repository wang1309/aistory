# Pricing OpenPanel 埋点设计

## 目标

为 pricing 页面建立购买漏斗埋点，覆盖套餐购买意图、登录拦截、checkout 创建结果。页面浏览继续使用现有 OpenPanel 配置自动记录的 screen view，不增加重复的自定义页面浏览事件。

## 范围与架构

- 只修改客户端 pricing 组件 `src/components/blocks/pricing/index.tsx`。
- 通过现有 `useOpenPanel()` 调用 OpenPanel，不新增 SDK、服务端接口或数据库字段。
- 事件在用户动作和 checkout API 返回结果处发送，checkout 创建成功表示已拿到有效 `checkout_url`，不代表最终支付成功。
- 现有登录流程保持不变：仍通过 `requireAuth({ source: "pricing", action: "checkout" })` 打开登录弹窗。

## 事件定义

所有事件携带 `source_page: "pricing"`。购买上下文事件携带以下通用属性：

- `product_id`: 套餐商品 ID
- `product_name`: 套餐名称
- `pricing_group`: 套餐分组；无分组时为 `null`
- `interval`: 计费周期
- `currency`: 实际提交给 checkout 的币种
- `payment_method`: `default` 或 `cnpay`
- `logged_in`: 点击时是否存在用户会话

| 事件 | 触发时机 | 额外属性 |
| --- | --- | --- |
| `pricing_checkout_click` | 用户点击普通购买按钮或人民币支付入口 | 通用购买上下文 |
| `pricing_auth_required` | 未登录点击购买，或 checkout 返回 HTTP 401 | `reason`: `not_authenticated` 或 `session_expired`；通用购买上下文 |
| `pricing_checkout_created` | checkout API 返回有效 `checkout_url`，跳转支付页前 | 通用购买上下文 |
| `pricing_checkout_failed` | checkout 返回业务错误、缺少 URL，或请求/解析异常 | `failure_reason`: `response_error`、`missing_checkout_url` 或 `network_error`；可选 `http_status`；通用购买上下文 |

HTTP 401 只记录 `pricing_auth_required`，不重复记录 `pricing_checkout_failed`，避免把预期的登录恢复流程统计为技术失败。其它 HTTP 非成功响应、业务错误和网络异常均记录 `pricing_checkout_failed`。

## 数据流

1. 普通 CTA 或 CNY 支付入口点击时，先记录 `pricing_checkout_click`。
2. 若用户未登录，记录 `pricing_auth_required`（`not_authenticated`）并沿用现有登录弹窗流程，不发起 checkout 请求。
3. checkout 返回 401 时，记录 `pricing_auth_required`（`session_expired`）并沿用现有登录弹窗流程。
4. checkout 返回有效 URL 时，记录 `pricing_checkout_created`，随后跳转到支付页。
5. 业务失败、无 URL 或异常时，记录 `pricing_checkout_failed`，保留现有 toast 和 loading 状态处理。

不发送邮箱、订单号、支付 URL、原始异常消息或其它敏感信息。

## 验证

- 运行 `pnpm lint`，确认 React/TypeScript 代码通过检查。
- 运行 `pnpm build`，确认 Next.js 生产构建成功。
- 通过代码路径检查确认普通支付和 CNY 支付入口都覆盖点击事件，未登录和 401 分别覆盖两种登录拦截原因，成功和失败分支不会漏报。


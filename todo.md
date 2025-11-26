# AI Story 系统优化待办事项

> 📅 创建时间: 2025-11-25  
> 🎯 目标: 降低用户跳出率，提升使用频率和付费转化率

---

## 📊 核心问题总结

### 当前系统状态
- ✅ 视觉设计精美，玻璃态效果出色
- ✅ 多语言支持完善（12种语言）
- ✅ 基础功能完整（故事/同人文/情节/诗歌生成）
- ⚠️ 首页跳出率高（预估 50%+）
- ⚠️ 用户留存率低
- ⚠️ 付费转化不足
- ⚠️ 缺少社区和持续使用动机

### 影响跳出率的主要问题
1. 首屏价值不明确 - 用户 3 秒内看不到核心价值
2. 上手门槛高 - 没有引导，不知道从哪开始
3. 功能过载 - 选项太多，反而不知道选什么
4. 验证摩擦 - 首次使用就需要验证，可能放弃
5. 缺少即时满足 - 无法快速体验效果

### 影响使用频率的主要问题
1. 缺少使用理由 - 没有每日挑战或新内容
2. 无数据积累价值 - LocalStorage 数据容易丢失
3. 无社交驱动 - 看不到他人作品，缺少互动
4. 无个性化 - 每次都重新开始，无优化
5. 工具属性重 - 只是工具，不是平台

---

## 🚀 第一阶段：优化首次体验（1-2月）🔥

**目标**: 30秒内完成首次生成，跳出率降低30%

### 1.1 极简化首屏设计

- [ ] **移除首屏过载元素**
  - [ ] 将粒子背景改为异步加载
  - [ ] 隐藏非必要的 Feature 模块
  - [ ] 简化首屏只保留核心功能
  - 📁 文件: `src/app/[locale]/(default)/page.tsx`

- [ ] **设计极简首屏布局**
  ```
  ┌─────────────────────────────────────┐
  │  🎨 AI Story Generator              │
  │  用一句话描述你的故事创意            │
  │  ┌───────────────────────────────┐  │
  │  │ 输入框...                     │  │
  │  └───────────────────────────────┘  │
  │  [  ⚡ 30秒生成魔法故事  ]          │
  │  [奇幻] [科幻] [爱情] [悬疑]       │
  └─────────────────────────────────────┘
  ```
  - [ ] 创建新的简化版 Hero 组件
  - [ ] 预设默认使用最快 AI 模型
  - [ ] 隐藏高级选项（可展开）
  - 📁 新文件: `src/components/blocks/hero/hero-minimal.tsx`

### 1.2 新手引导系统

- [ ] **安装引导库**
  ```bash
  pnpm add react-joyride
  ```

- [ ] **创建引导流程组件**
  - [ ] 步骤1: 欢迎弹窗（可跳过）
  - [ ] 步骤2: 高亮提示词输入框
  - [ ] 步骤3: 展示示例提示词
  - [ ] 步骤4: 引导选择生成模式
  - [ ] 步骤5: 完成庆祝页面
  - 📁 新文件: `src/components/onboarding/story-guide.tsx`

- [ ] **引导状态管理**
  - [ ] 使用 localStorage 记录引导完成状态
  - [ ] 添加"重新播放引导"按钮
  - [ ] 跳过引导后不再自动弹出

### 1.3 示例故事展示

- [ ] **创建示例故事数据**
  - [ ] 准备 5-8 个高质量示例故事
  - [ ] 包含不同类型（奇幻/科幻/爱情/悬疑）
  - [ ] 添加元数据（字数/点赞数/标签）
  - 📁 新文件: `src/data/example-stories.ts`

- [ ] **示例轮播组件**
  - [ ] 使用 Embla Carousel 实现轮播
  - [ ] 自动播放，间隔 5 秒
  - [ ] 显示故事预览和元数据
  - 📁 新文件: `src/components/story-showcase/example-carousel.tsx`

### 1.4 移除/延后验证

- [x] **优化认证时机**
  - [x] 首次生成无需验证
  - [x] 第 2-3 次生成再启用验证
  - [x] 后台异步验证（不阻塞用户）
  - 📁 文件: `src/components/blocks/story-generate/index.tsx` (handleGenerateClick)

- [ ] **验证计数器**
  - [ ] localStorage 记录生成次数
  - [ ] 达到阈值再显示验证
  ```typescript
  const generationCount = parseInt(localStorage.getItem('generationCount') || '0');
  if (generationCount < 2) {
    // 直接生成，无验证
  }
  ```

### 1.5 渐进式功能展示

- [ ] **功能解锁系统**
  - [ ] 首次: 只显示基础输入
  - [ ] 第2次: 解锁预设模板
  - [ ] 第3次: 解锁高级选项
  - [ ] 第5次: 提示注册账号
  - 📁 新文件: `src/hooks/use-progressive-features.ts`

- [ ] **功能提示组件**
  - [ ] Toast 提示新功能解锁
  - [ ] 高亮新解锁的功能
  - 📁 新文件: `src/components/ui/feature-unlock-toast.tsx`

### 🎯 第一阶段预期效果
- ✅ 首次成功生成时间: 5分钟 → **30秒**
- ✅ 首页跳出率: 50%+ → **35%**
- ✅ 引导完成率: **70%+**

---

## 💪 第二阶段：增强用户粘性（3-4月）🔥

**目标**: 周回访从1次提升至3次，30日留存率提升50%

### 2.1 完善账号系统

- [ ] **数据库表设计**
  ```sql
  -- 用户作品表
  CREATE TABLE stories (
    id VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    title VARCHAR(200),
    prompt TEXT,
    content TEXT,
    word_count INT,
    model_used VARCHAR(50),
    settings JSONB,
    status VARCHAR(20), -- draft/saved/published
    created_at TIMESTAMP,
    updated_at TIMESTAMP
  );
  
  -- 用户统计表
  CREATE TABLE user_stats (
    user_id VARCHAR PRIMARY KEY,
    total_stories INT DEFAULT 0,
    total_words INT DEFAULT 0,
    creation_days INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    current_streak INT DEFAULT 0,
    last_creation_date DATE
  );
  ```
  - 📁 文件: `src/db/schema/stories.ts`

- [ ] **Drizzle ORM 模型**
  - [ ] 定义 stories 表结构
  - [ ] 定义 user_stats 表结构
  - [ ] 创建迁移文件
  ```bash
  pnpm db:generate
  pnpm db:migrate
  ```

- [ ] **创作空间页面**
  - [ ] 我的故事列表（最近创作/收藏/草稿）
  - [ ] 创作统计展示
  - [ ] 成就徽章墙
  - 📁 新文件: `src/app/[locale]/(console)/my-stories/page.tsx`

- [ ] **云同步功能**
  - [ ] LocalStorage 数据迁移到数据库
  - [ ] 登录后自动同步
  - [ ] 跨设备访问

### 2.2 社区功能 - 创作广场

- [ ] **数据库表设计**
  ```sql
  -- 社区互动表
  CREATE TABLE story_likes (
    id VARCHAR PRIMARY KEY,
    story_id VARCHAR,
    user_id VARCHAR,
    created_at TIMESTAMP
  );
  
  CREATE TABLE story_comments (
    id VARCHAR PRIMARY KEY,
    story_id VARCHAR,
    user_id VARCHAR,
    content TEXT,
    created_at TIMESTAMP
  );
  
  CREATE TABLE story_tags (
    story_id VARCHAR,
    tag VARCHAR,
    PRIMARY KEY (story_id, tag)
  );
  ```
  - 📁 文件: `src/db/schema/community.ts`

- [ ] **创作广场页面**
  - [ ] 热门/最新/精选 tab 切换
  - [ ] 故事卡片组件（标题/预览/作者/互动数据）
  - [ ] 无限滚动加载
  - [ ] 搜索和筛选功能
  - 📁 新文件: `src/app/[locale]/community/page.tsx`

- [ ] **互动功能**
  - [ ] 点赞 API (`POST /api/stories/:id/like`)
  - [ ] 评论 API (`POST /api/stories/:id/comments`)
  - [ ] 收藏 API (`POST /api/stories/:id/bookmark`)
  - 📁 新文件: `src/app/api/stories/[id]/route.ts`

- [ ] **发布流程**
  - [ ] 发布到广场按钮
  - [ ] 隐私设置（公开/私密/仅关注者）
  - [ ] 标签选择器
  - 📁 组件: `src/components/story/publish-dialog.tsx`

### 2.3 成就系统

- [ ] **成就定义**
  - [ ] 创建成就配置文件
  ```typescript
  const ACHIEVEMENTS = [
    { id: 'first_story', name: '初露锋芒', desc: '创作第1个故事', icon: '🌱' },
    { id: 'ten_stories', name: '笔耕不辍', desc: '创作第10个故事', icon: '✍️' },
    { id: 'streak_7', name: '火力全开', desc: '连续7天创作', icon: '🔥' },
    // ... 更多成就
  ];
  ```
  - 📁 新文件: `src/config/achievements.ts`

- [ ] **成就检测逻辑**
  - [ ] 创建成就触发器
  - [ ] 检测用户行为并解锁
  - [ ] 发送成就解锁通知
  - 📁 新文件: `src/lib/achievement-engine.ts`

- [ ] **成就展示**
  - [ ] 个人主页徽章墙
  - [ ] 成就解锁动画（confetti）
  - [ ] 成就进度条
  - 📁 组件: `src/components/achievement/badge-wall.tsx`

### 2.4 每日创作挑战

- [ ] **挑战系统设计**
  - [ ] 挑战题库（100+ 个主题）
  - [ ] 每日自动更新挑战
  - [ ] 挑战完成判定逻辑
  - 📁 新文件: `src/data/daily-challenges.ts`

- [ ] **挑战页面**
  - [ ] 今日挑战展示
  - [ ] 完成奖励说明
  - [ ] 连续完成记录
  - [ ] 查看他人挑战作品
  - 📁 新文件: `src/app/[locale]/challenges/page.tsx`

- [ ] **挑战 API**
  - [ ] 获取今日挑战 (`GET /api/challenges/today`)
  - [ ] 提交挑战作品 (`POST /api/challenges/:id/submit`)
  - [ ] 挑战排行榜 (`GET /api/challenges/:id/leaderboard`)

### 2.5 创作日历和统计

- [ ] **创作日历组件**
  - [ ] 日历热力图（类似 GitHub Contribution）
  - [ ] 显示每日创作状态（🟢已创作 ⚪未创作）
  - [ ] 点击日期查看当日作品
  - 📁 组件: `src/components/stats/creation-calendar.tsx`

- [ ] **统计图表**
  - [ ] 使用 Recharts 绘制趋势图
  - [ ] 周创作分布（柱状图）
  - [ ] 类型偏好（饼图）
  - [ ] 字数增长曲线
  - 📁 组件: `src/components/stats/charts.tsx`

### 2.6 邮件通知系统

- [ ] **邮件模板**
  - [ ] 每日挑战更新
  - [ ] 作品互动通知（点赞/评论）
  - [ ] 连续天数提醒
  - [ ] 每周精选入选
  - 📁 目录: `emails/` (使用 React Email)

- [ ] **通知偏好设置**
  - [ ] 用户可选择接收类型
  - [ ] 通知频率设置（实时/每日汇总）
  - 📁 页面: `src/app/[locale]/(console)/settings/notifications/page.tsx`

- [ ] **Resend 集成**
  - [ ] 配置 Resend API
  - [ ] 创建发送队列
  - [ ] 邮件发送统计

### 🎯 第二阶段预期效果
- ✅ 注册用户占比: 10% → **40%**
- ✅ 周回访次数: 1次 → **3次**
- ✅ 30日留存率提升: **+50%**
- ✅ 平均创作数量提升: **3倍**

---

## 🛠️ 第三阶段：提升实用价值（5-6月）⚡

**目标**: 从工具到平台，支持完整创作流程

### 3.1 内联编辑功能

- [ ] **集成 MDEditor**
  ```bash
  pnpm add @uiw/react-md-editor
  ```

- [ ] **编辑模式切换**
  - [ ] 查看模式 / 编辑模式切换
  - [ ] 实时 Markdown 预览
  - [ ] 自动保存草稿
  - 📁 更新: `src/components/blocks/story-generate/index.tsx`

- [ ] **编辑工具栏**
  - [ ] [编辑] [续写] [导出] [分享] 按钮
  - [ ] 撤销/重做功能
  - [ ] 字数统计实时更新

### 3.2 续写和改写

- [ ] **续写功能 API**
  - [ ] 发送前文上下文（最近1000字）
  - [ ] 续写指令类型（继续/转折/切换视角/扩展/对话）
  - [ ] 标记续写部分（高亮显示）
  - 📁 新 API: `src/app/api/story-continue/route.ts`

- [ ] **续写选项面板**
  - [ ] 弹出选择续写类型
  - [ ] 设置续写长度
  - [ ] 实时流式输出
  - 📁 组件: `src/components/story/continue-panel.tsx`

- [ ] **智能改写功能**
  - [ ] 选中文字右键菜单
  - [ ] 改写选项（更口语化/正式/简洁/详细）
  - [ ] 对比展示（原文 vs 改写）
  - 📁 组件: `src/components/story/rewrite-menu.tsx`

### 3.3 分章节创作

- [ ] **章节管理数据结构**
  ```typescript
  interface Chapter {
    id: string;
    order: number;
    title: string;
    content: string;
    wordCount: number;
    status: 'writing' | 'completed' | 'pending';
  }
  ```

- [ ] **章节管理组件**
  - [ ] 章节列表（可拖拽排序）
  - [ ] 添加/删除章节
  - [ ] 章节字数统计
  - [ ] 导出时合并或分开
  - 📁 组件: `src/components/story/chapter-manager.tsx`

- [ ] **长篇创作模式**
  - [ ] 转换为长篇模式
  - [ ] 章节间连贯性检查
  - [ ] 大纲视图
  - 📁 页面: `src/app/[locale]/long-form/[id]/page.tsx`

### 3.4 角色和世界观管理

- [ ] **数据库表**
  ```sql
  CREATE TABLE characters (
    id VARCHAR PRIMARY KEY,
    user_id VARCHAR,
    name VARCHAR,
    age INT,
    personality TEXT,
    background TEXT,
    character_arc TEXT
  );
  
  CREATE TABLE worldbuilds (
    id VARCHAR PRIMARY KEY,
    user_id VARCHAR,
    name VARCHAR,
    era VARCHAR,
    tech_level TEXT,
    social_structure TEXT,
    special_rules TEXT
  );
  ```
  - 📁 文件: `src/db/schema/creative-assets.ts`

- [ ] **角色档案编辑器**
  - [ ] 角色信息表单
  - [ ] 图片上传（可选）
  - [ ] 关系图谱
  - 📁 组件: `src/components/creative/character-editor.tsx`

- [ ] **世界观编辑器**
  - [ ] 世界设定表单
  - [ ] 时间线编辑
  - [ ] 地图标记（可选）
  - 📁 组件: `src/components/creative/worldbuild-editor.tsx`

- [ ] **引用角色/世界观**
  - [ ] 生成时选择角色和世界观
  - [ ] 自动注入到提示词
  - [ ] 保持一致性

### 3.5 灵感工具集

- [ ] **头脑风暴助手**
  - [ ] 输入关键词生成创意
  - [ ] 创意组合器
  - 📁 页面: `src/app/[locale]/tools/brainstorm/page.tsx`

- [ ] **角色名生成器**
  - [ ] 按文化/性别/风格生成
  - [ ] 批量生成
  - 📁 页面: `src/app/[locale]/tools/name-generator/page.tsx`

- [ ] **情节点生成器**
  - [ ] 输入当前情节，生成可能转折
  - [ ] 冲突设计建议
  - 📁 页面: `src/app/[locale]/tools/plot-points/page.tsx`

### 🎯 第三阶段预期效果
- ✅ 平均编辑次数: 0 → **3次**
- ✅ 长篇创作用户: **20%**
- ✅ 工具使用深度提升: **150%**

---

## 🌟 第四阶段：社区建设（7-8月）⚡

**目标**: 用户创造内容和价值

- [ ] **完善创作广场功能** （见第二阶段 2.2）
- [ ] **每周精选机制**
  - [ ] 编辑推荐流程
  - [ ] 用户投票系统
  - [ ] 精选展示页面
  
- [ ] **关注系统**
  - [ ] 关注作者
  - [ ] 关注者动态 feed
  - [ ] 通知系统

- [ ] **话题和标签**
  - [ ] 热门话题榜
  - [ ] 标签聚合页
  - [ ] 话题讨论区

### 🎯 第四阶段预期效果
- ✅ 作品发布率: **15%**
- ✅ 社区活跃度大幅提升

---

## 💰 第五阶段：商业化优化（9-10月）🔥

**目标**: 付费转化率达到3-5%，MRR增长200%+

### 5.1 清晰的功能对比

- [ ] **价格对比表组件**
  - [ ] 三档价格（免费/PRO/创作者）
  - [ ] 功能逐项对比
  - [ ] 高亮差异点
  - 📁 更新: `src/components/blocks/pricing/index.tsx`

- [ ] **价值主张文案**
  - [ ] 突出付费解锁的价值
  - [ ] 使用场景说明
  - [ ] 用户评价展示

### 5.2 免费额度优化

- [ ] **额度系统重构**
  ```typescript
  interface CreditSystem {
    dailyFree: number;      // 每日免费次数
    totalFree: number;      // 总免费额度
    bonusCredits: number;   // 奖励积分
    paidCredits: number;    // 购买积分
  }
  ```

- [ ] **额度显示组件**
  - [ ] 实时显示剩余额度
  - [ ] 进度条可视化
  - [ ] 获取更多积分提示
  - 📁 组件: `src/components/credits/credit-indicator.tsx`

- [ ] **积分奖励机制**
  - [ ] 注册 +10 次
  - [ ] 完成引导 +5 次
  - [ ] 邮箱验证 +5 次
  - [ ] 分享 +5 次
  - [ ] 邀请好友 +10 次/人

### 5.3 付费触发优化

- [ ] **软提示组件**
  - [ ] 额度用完提示
  - [ ] 付费功能限制提示
  - [ ] 价值强化提示
  - 📁 组件: `src/components/upgrade/soft-prompt.tsx`

- [ ] **触发时机设计**
  - [ ] 第 5 次使用后
  - [ ] 生成长内容时
  - [ ] 使用高级功能时
  - [ ] 成功生成后

### 5.4 定价策略实施

- [ ] **Stripe 集成**
  - [ ] 创建产品和价格
  - [ ] 订阅管理
  - [ ] Webhook 处理
  - 📁 API: `src/app/api/stripe/`

- [ ] **定价方案**
  - [ ] 月付: $9.9/月 (PRO), $29.9/月 (创作者)
  - [ ] 年付: 优惠 20%
  - [ ] 积分包: 灵活消费

- [ ] **订阅管理页面**
  - [ ] 当前计划展示
  - [ ] 使用统计
  - [ ] 升级/取消订阅
  - [ ] 发票下载
  - 📁 页面: `src/app/[locale]/(console)/subscription/page.tsx`

### 5.5 促销活动

- [ ] **首次购买优惠**
  - [ ] 新用户首月 50% OFF
  - [ ] 限时折扣倒计时

- [ ] **推荐奖励系统**
  - [ ] 生成推荐链接
  - [ ] 追踪推荐转化
  - [ ] 奖励发放（双向奖励）
  - 📁 页面: `src/app/[locale]/(console)/referrals/page.tsx`

### 🎯 第五阶段预期效果
- ✅ 付费转化率: **3-5%**
- ✅ ARPU 提升: **+50%**
- ✅ MRR 增长: **+200%**
- ✅ 订阅留存率: **80%+**

---

## 📊 持续优化：数据驱动

### 数据追踪

- [ ] **关键事件埋点**
  - [ ] 页面访问事件
  - [ ] 用户交互事件
  - [ ] 生成相关事件
  - [ ] 转化事件
  - 📁 文件: `src/lib/analytics/events.ts`

- [ ] **漏斗分析看板**
  - [ ] Vercel Analytics / OpenPanel
  - [ ] 自定义事件追踪
  - [ ] 转化率监控

### A/B 测试

- [ ] **A/B 测试框架搭建**
  ```bash
  pnpm add @vercel/flags
  ```

- [ ] **测试案例**
  - [ ] 首屏设计对比
  - [ ] 验证时机对比
  - [ ] 预设模板展示对比
  - [ ] 定价展示对比

### 用户反馈

- [ ] **即时反馈收集**
  - [ ] 生成后满意度调查
  - [ ] 功能使用反馈
  - 📁 组件: `src/components/feedback/satisfaction-survey.tsx`

- [ ] **用户访谈计划**
  - [ ] 每月深度访谈 5-10 人
  - [ ] 记录用户痛点和需求

---

## 🚀 快速见效优化（可立即实施）

### 优先级最高，可立即动手

- [ ] **首页添加"快速体验"按钮**
  - [ ] 预填充随机提示词
  - [ ] 自动选择快速模型
  - [ ] 一键生成
  - ⏱️ 预计: 30分钟
  - 📁 文件: `src/components/blocks/hero/index.tsx`

- [ ] **生成前展示预期**
  - [ ] 显示将要生成的类型/长度/时间
  - [ ] 设定用户期望
  - ⏱️ 预计: 1小时
  - 📁 组件: `src/components/story/generation-preview.tsx`

- [ ] **移除首次验证**
  - [ ] generationCount < 2 时跳过验证
  - ⏱️ 预计: 30分钟
  - 📁 文件: `src/components/blocks/story-generate/index.tsx`

- [ ] **添加进度提示**
  - [ ] 生成中显示百分比和小贴士
  - [ ] 缓解等待焦虑
  - ⏱️ 预计: 1小时
  - 📁 组件: `src/components/story/generation-progress.tsx`

- [ ] **完成后引导**
  - [ ] 显示后续操作建议
  - [ ] 引导注册账号
  - ⏱️ 预计: 1小时
  - 📁 组件: `src/components/story/completion-guide.tsx`

---

## 📈 成功指标（6个月后目标）

### 用户增长
- [ ] MAU 增长 **300%**
- [ ] 注册用户占比 **40%**
- [ ] 自然流量占比 **60%**

### 用户留存
- [ ] 次日留存率 **35%+**
- [ ] 7日留存率 **25%+**
- [ ] 30日留存率 **15%+**

### 用户参与
- [ ] 周访问次数 **3次**
- [ ] 平均生成数 **2.5次/会话**
- [ ] 社区发布率 **15%**

### 商业指标
- [ ] 付费转化率 **3-5%**
- [ ] MRR 增长 **200%+**
- [ ] LTV 提升 **150%**
- [ ] CAC 降低 **30%**

### 产品质量
- [ ] 首页跳出率 **< 35%**
- [ ] 生成成功率 **> 95%**
- [ ] 平均生成时长 **< 30秒**
- [ ] NPS **> 40**

---

## 📝 备注

### 开发资源
- 前端开发: 3-4 人月
- 后端开发: 2-3 人月
- UI/UX 设计: 1-2 人月
- 数据分析: 持续

### 风险和挑战
- ⚠️ 功能复杂度提升，需要保持系统稳定性
- ⚠️ 社区内容审核需要人力投入
- ⚠️ 数据迁移（LocalStorage → 数据库）需要平滑过渡
- ⚠️ 付费转化需要持续优化和测试

### 迭代原则
1. **数据驱动** - 每个改动都要追踪数据
2. **快速验证** - 小步快跑，快速试错
3. **用户至上** - 以用户反馈为核心
4. **持续优化** - 没有完美，只有更好

---

**📌 下一步行动**: 从"快速见效优化"开始，立即实施 5 个小改动，预计 1 天完成，快速验证效果！

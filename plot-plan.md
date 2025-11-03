# Plot Generator 实施计划

## 项目概述

基于用户需求，将创建一个**混合模式的 Plot Generator**，支持从高层故事结构到章节大纲的全流程可视化生成，并与 Story Generator 形成完整的 Plot → Story 工作流。

---

## 🎯 需求确认结果

### 用户选择汇总：
1. **功能定位**：混合模式（高层故事结构 + 章节大纲）
2. **输出格式**：结构化文本（Markdown）
3. **输入参数**：新增 Plot 特有参数（复杂度、角色、情节点等）
4. **功能集成**：工作流集成（Plot → Story 无缝转换）
5. **参数复杂度**：中等（重要参数可见，全部可展开）
6. **页面设计**：可视化优先（思维导图式界面）
7. **存储方案**：独立管理（LocalStorage）

---

## 📊 现有系统分析

### Story Generator 架构亮点（可借鉴）
- ✅ **流式响应**：TransformStream 处理 SSE，实时显示生成内容
- ✅ **验证系统**：集成 Cloudflare Turnstile 防机器人
- ✅ **组件设计**：Shadcn UI + Tailwind，玻璃拟态风格
- ✅ **状态管理**：useState + useRef 避免闭包陷阱
- ✅ **参数映射**：优雅的 slug 到描述性文本转换
- ✅ **本地存储**：LocalStorage 保存历史记录（10条限制）
- ✅ **国际化**：next-intl 支持 12 种语言

### 技术架构
```
Frontend: Next.js 15 + TypeScript + Tailwind CSS
Backend: Edge Runtime (Cloudflare)
AI: Gemini 2.5 Flash (通过 GRSAI API)
Storage: LocalStorage（与 Story Generator 保持一致）
```

---

## 🚀 Plot Generator 技术方案

### 1. 功能定位

**混合模式实现**
- 高层故事结构生成（三幕式、五幕式）
- 可细化为章节大纲（每章关键事件）
- 灵活的粒度切换（用户可选择输出详细程度）

### 2. 输入参数设计（中等复杂度）

#### 基础参数（沿用 Story Generator）
- prompt、model、locale、genre、tone、perspective

#### Plot 特有参数（新增）
- **复杂度级别**：Simple / Medium / Complex
- **角色配置**：主角数量 (1-3)、配角数量 (0-5)
- **情节配置**：情节点数量 (3-9)、副线情节 (0-3)
- **冲突类型**：内在冲突 / 外在冲突 / 双重冲突
- **情感弧线**：成长型 / 堕落型 / 觉醒型 / 救赎型 / 探索型
- **悬念设置**：开头悬念 / 中段悬念 / 多重悬念 / 无悬念

### 3. 输出格式

**结构化 Markdown 大纲**
```markdown
## 故事标题
### 📖 故事梗概
### 👥 主要角色
### 🌟 情节点（3-9个）
### 🎭 副线情节（0-3条）
### 🎨 叙事弧线
### ⛓️ 冲突结构
### 🎪 悬念元素
### 📚 章节大纲（可选）
```

---

## 🏗️ 技术架构

### 1. 目录结构
```
src/
├── app/
│   ├── api/
│   │   ├── plot-generate/route.ts           # Plot 生成 API
│   │   ├── story-generate-from-plot/route.ts # Plot→Story 工作流
│   │   └── plot/list/save/route.ts          # Plot 管理 API
│   └── [locale]/
│       └── plot-generate/
│           ├── page.tsx                      # 页面入口
│           └── layout.tsx                    # 页面布局
├── components/
│   ├── blocks/
│   │   ├── plot-generate/                   # 新组件
│   │   │   ├── index.tsx                    # 主组件
│   │   │   ├── plot-form.tsx                # 参数表单
│   │   │   ├── plot-advanced-options.tsx    # 高级选项
│   │   │   ├── plot-visualizer/             # 可视化模块
│   │   │   │   ├── index.tsx                # React Flow 容器
│   │   │   │   ├── custom-node.tsx          # 可编辑节点
│   │   │   │   ├── custom-edge.tsx          # 连线组件
│   │   │   │   └── node-types/              # 节点类型
│   │   │   │       ├── chapter-node.tsx
│   │   │   │       ├── plot-point-node.tsx
│   │   │   │       └── character-node.tsx
│   │   │   ├── plot-preview.tsx             # Markdown 预览
│   │   │   └── plot-to-story-dialog.tsx     # 生成确认对话框
│   │   └── story-generate/                  # 现有组件（复用设计模式）
├── lib/
│   ├── plot-storage.ts                      # Plot 存储管理（LocalStorage）
│   ├── story-storage.ts                     # 复用现有
│   └── plot-prompt.ts                       # Plot Prompt 工程
└── types/
    └── plot.d.ts                            # Plot 类型定义
```

### 2. 数据结构设计

#### PlotData 类型定义
```typescript
// types/plot.d.ts
export interface PlotData {
  id: string;
  title: string;
  prompt: string;
  content: string; // Markdown 格式
  model: string;
  complexity: 'simple' | 'medium' | 'complex';
  mainCharacterCount: number;
  supportingCharacterCount: number;
  plotPointCount: number;
  subPlotCount: number;
  conflictTypes: string[];
  emotionalArc: string;
  suspenseStyle: string;
  createdAt: string;
  storyCount: number; // 关联的 LocalStory 数量
}

// Plot-Story 关联关系
export interface PlotStoryLink {
  plotId: string;
  storyId: string;
  createdAt: string;
}

// Plot 生成参数
export interface PlotGenerateOptions {
  // 基础参数
  prompt: string;
  model: 'fast' | 'standard' | 'creative';
  locale: string;

  // Plot 特有参数
  complexity: 'simple' | 'medium' | 'complex';
  mainCharacterCount: number;      // 1-3
  supportingCharacterCount: number; // 0-5
  plotPointCount: number;          // 3-9
  subPlotCount: number;            // 0-3
  conflictTypes: string[];
  emotionalArc: string;
  suspenseStyle: string;

  // 可选参数
  characterSettings?: {
    protagonist?: string;
    deuteragonist?: string;
    antagonist?: string;
  };
}
```

### 3. LocalStorage 管理

#### Plot 存储管理
```typescript
// lib/plot-storage.ts
const PLOT_STORAGE_KEY = 'aistory-plots';
const PLOT_STORY_LINKS_KEY = 'aistory-plot-story-links';

export function savePlot(plot: Omit<PlotData, 'id'>): PlotData {
  const plots = getPlots();
  const newPlot: PlotData = {
    ...plot,
    id: generateId(),
    createdAt: new Date().toISOString(),
    storyCount: 0
  };

  const updatedPlots = [newPlot, ...plots].slice(0, 10); // 最多保存10个
  localStorage.setItem(PLOT_STORAGE_KEY, JSON.stringify(updatedPlots));

  return newPlot;
}

export function getPlots(): PlotData[] {
  const stored = localStorage.getItem(PLOT_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function getPlotById(id: string): PlotData | undefined {
  return getPlots().find(plot => plot.id === id);
}

export function deletePlot(id: string): void {
  const plots = getPlots();
  const updatedPlots = plots.filter(plot => plot.id !== id);
  localStorage.setItem(PLOT_STORAGE_KEY, JSON.stringify(updatedPlots));
}

export function linkPlotToStory(plotId: string, storyId: string): void {
  const links = getPlotStoryLinks();
  const newLink: PlotStoryLink = {
    plotId,
    storyId,
    createdAt: new Date().toISOString()
  };

  // 避免重复关联
  if (!links.find(l => l.plotId === plotId && l.storyId === storyId)) {
    links.push(newLink);
    localStorage.setItem(PLOT_STORY_LINKS_KEY, JSON.stringify(links));
  }
}

export function getStoriesByPlot(plotId: string): string[] {
  const links = getPlotStoryLinks();
  return links.filter(l => l.plotId === plotId).map(l => l.storyId);
}

export function updatePlotStoryCount(plotId: string): void {
  const plots = getPlots();
  const plotIndex = plots.findIndex(p => p.id === plotId);
  if (plotIndex >= 0) {
    const storyCount = getStoriesByPlot(plotId).length;
    plots[plotIndex].storyCount = storyCount;
    localStorage.setItem(PLOT_STORAGE_KEY, JSON.stringify(plots));
  }
}
```

### 4. API 路由设计

#### Plot 生成 API
```typescript
// app/api/plot-generate/route.ts
import { NextResponse } from 'next/server';
import { buildPlotPrompt } from '@/lib/plot-prompt';

export async function POST(req: Request) {
  const body = await req.json();
  const {
    prompt,
    model,
    locale,
    complexity,
    mainCharacterCount,
    supportingCharacterCount,
    plotPointCount,
    subPlotCount,
    conflictTypes,
    emotionalArc,
    suspenseStyle
  } = body;

  // 构建 Plot 专用 Prompt
  const plotPrompt = buildPlotPrompt({
    prompt,
    complexity,
    mainCharacterCount,
    supportingCharacterCount,
    plotPointCount,
    subPlotCount,
    conflictTypes,
    emotionalArc,
    suspenseStyle,
    locale
  });

  // 调用 AI API
  const response = await fetch('https://api.grs.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GRSAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: getModelName(model),
      messages: [{ role: 'user', content: plotPrompt }],
      stream: true
    })
  });

  // 流式响应处理
  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}

function getModelName(model: string): string {
  const modelMap = {
    'fast': 'gemini-2.5-flash-lite',
    'standard': 'gemini-2.5-flash',
    'creative': 'gemini-2.5-flash-think'
  };
  return modelMap[model as keyof typeof modelMap] || 'gemini-2.5-flash';
}
```

#### Plot→Story 工作流 API
```typescript
// app/api/story-generate-from-plot/route.ts
import { NextResponse } from 'next/server';
import { getPlotById } from '@/lib/plot-storage';

export async function POST(req: Request) {
  const { plotId, overrides } = await req.json();

  // 从客户端传递的数据获取 Plot（注意：API 路由无法直接访问 localStorage）
  const plot = overrides?.plotData;

  if (!plot) {
    return NextResponse.json(
      { error: 'Plot data not provided' },
      { status: 400 }
    );
  }

  // 将 Plot 参数转换为 Story 参数
  const storyParams = {
    prompt: plot.prompt,
    model: overrides?.model || plot.model,
    format: overrides?.format || 'prose',
    length: overrides?.length || 'medium',
    genre: overrides?.genre || plot.genre || 'general',
    tone: overrides?.tone || plot.tone || 'neutral',
    perspective: overrides?.perspective || 'third-person',
    audience: overrides?.audience || 'adult',
    locale: overrides?.locale || 'zh-CN'
  };

  // 调用 Story 生成 API
  const response = await fetch('/api/story-generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(storyParams)
  });

  return response;
}
```

### 5. AI Prompt 工程

```typescript
// lib/plot-prompt.ts
export function buildPlotPrompt(options: PlotGenerateOptions): string {
  const {
    prompt,
    complexity,
    mainCharacterCount,
    supportingCharacterCount,
    plotPointCount,
    subPlotCount,
    conflictTypes,
    emotionalArc,
    suspenseStyle,
    locale
  } = options;

  return `
Generate a detailed story plot for: "${prompt}"

# Plot Structure Requirements:
- Complexity Level: ${complexity}
- Main Characters: ${mainCharacterCount} protagonists, ${supportingCharacterCount} supporting characters
- Plot Points: ${plotPointCount} major plot points
- Subplots: ${subPlotCount} subplots
- Conflict Types: ${conflictTypes.join(', ')}
- Emotional Arc: ${emotionalArc}
- Suspense Style: ${suspenseStyle}

# Output Format (STRICTLY FOLLOW):
## {Plot Title}

### 📖 Synopsis
{Brief 2-3 sentence overview of the entire story}

### 👥 Characters
**Protagonist:** {Name and description}
${supportingCharacterCount > 0 ? '**Supporting Characters:** {Names and descriptions}' : ''}

### 🌟 Main Plot Points
${Array.from({ length: plotPointCount }, (_, i) => `
${i + 1}. **${getPlotPointTitle(i)}**
   - Description: {What happens}
   - Emotional tone: {Mood at this point}
   - Stakes: {What's at risk}`).join('\n')}

### 🎭 Subplots
${Array.from({ length: subPlotCount }, (_, i) => `
${i + 1}. **Subplot ${i + 1} Title**
   - Connection to main plot: {How it relates}
   - Character involved: {Who drives this subplot}
   - Outcome: {Resolution}`).join('\n') || 'None'}

### 🎨 Narrative Arc
- **Opening Hook:** {How you grab reader attention}
- **Inciting Incident:** {Event that sets the story in motion}
- **Rising Action:** {Building tension and complications}
- **First Plot Point:** {Major turning point}
- **Midpoint:** {Significant revelation or change}
- **Climax:** {Final confrontation or resolution}
- **Falling Action:** {Aftermath and consequences}
- **Resolution:** {How everything ends}

### ⛓️ Conflict Structure
- **Primary Conflict:** ${conflictTypes.join(' & ')}
- **Internal Conflicts:** {Character's inner struggles}
- **External Conflicts:** {Obstacles from outside forces}

### 🎪 Suspense Elements
- **Opening Hook:** ${suspenseStyle === 'cliffhanger' ? 'Immediate tension with a hook' : 'Engaging introduction'}
- **Key Suspense Points:** {When and how suspense peaks}
- **Foreshadowing:** {Hints and clues planted throughout}

### 📚 Chapter Outline (Optional - Only for Complex plots)
${complexity === 'complex' ? Array.from({ length: Math.min(plotPointCount, 8) }, (_, i) => `
**Chapter ${i + 1}:**
- Key Events: {What happens}
- POV: {Whose perspective}
- Word Count Target: ${Math.floor(Math.random() * 1000) + 1500} words`).join('\n') : 'Outline provided at plot level only.'}

IMPORTANT: Return ONLY the plot structure in Markdown format. No additional commentary or explanations.
`;
}

function getPlotPointTitle(index: number): string {
  const titles = [
    'Opening Scene',
    'Inciting Incident',
    'First Plot Point',
    'Rising Action',
    'Midpoint',
    'Pinch Point',
    'Second Plot Point',
    'Climax',
    'Falling Action',
    'Resolution'
  ];
  return titles[index] || `Plot Point ${index + 1}`;
}
```

---

## 🎨 UI/UX 设计

### 页面布局
```
┌─────────────────────────────────────────────────────┐
│  Header (Logo, Navigation, Plot Generator 标题)      │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────┐ ┌─────────────────────────┐│
│  │   参数表单区域       │ │     可视化大纲区域       ││
│  │   (左侧 1/3 宽度)   │ │     (右侧 2/3 宽度)     ││
│  │                     │ │                         ││
│  │  • 基础输入框       │ │  • React Flow 画布      ││
│  │  • 模型选择         │ │  • 可编辑节点           ││
│  │  • 高级选项         │ │  • 工具栏              ││
│  │  • 快速预设         │ │  • Mini-map            ││
│  │  • 生成按钮         │ │                         ││
│  └─────────────────────┘ └─────────────────────────┘│
├─────────────────────────────────────────────────────┤
│  操作栏                                               │
│  [编辑 Plot] [基于此 Plot 生成 Story] [导出] [分享]   │
└─────────────────────────────────────────────────────┘
```

### 可视化节点类型
- **章节节点**（蓝色）：章节标题和内容
- **情节点**（绿色）：关键情节转折
- **角色节点**（紫色）：角色介绍
- **副线节点**（橙色）：支线剧情

### Plot 生成流程
```
1. 输入 Plot 参数
   ↓
2. 点击生成 → Turnstile 验证
   ↓
3. API 生成 Plot（流式显示 Markdown）
   ↓
4. 保存到 LocalStorage
   ↓
5. 显示"查看可视化大纲"按钮
```

### Plot-Story 工作流
```
Plot 生成完成 → 可视化大纲 → 编辑优化 → 一键生成 Story → 应用 Plot 参数
```

---

## 📅 实施计划（6周）

### Phase 1: 基础功能（Week 1-2）
- [ ] Plot 存储管理（LocalStorage）
- [ ] `/api/plot-generate` 路由实现
- [ ] PlotGenerateForm 组件开发
- [ ] AI Prompt 工程优化
- [ ] 类型定义和验证
- [ ] 基础 UI 布局

### Phase 2: 可视化核心（Week 3-4）
- [ ] React Flow 集成和配置
- [ ] 可编辑节点组件开发
- [ ] 拖拽排序功能实现
- [ ] 折叠/展开功能
- [ ] Mini-map 导航
- [ ] Markdown 预览切换

### Phase 3: 工作流集成（Week 5-6）
- [ ] `/api/story-generate-from-plot` 开发
- [ ] 客户端 Plot-Story 关联
- [ ] Plot 管理面板
- [ ] 响应式适配
- [ ] 性能优化
- [ ] 导出功能（PDF/JSON）

---

## 💡 核心特性

### 1. Plot → Story 工作流
- 可视化大纲 → 一键生成 Story
- 自动传递 Plot 参数（genre、tone、characters 等）
- 保留 Story 生成的高级选项（format、length 等）
- 关联关系追溯（Story 可显示来源 Plot）

### 2. 可视化大纲编辑
- 双击节点编辑标题和描述
- 拖拽调整章节顺序
- 右键菜单（删除、添加同级/子级节点）
- 实时预览 Markdown 输出

### 3. 独立管理
- 独立的 Plot 历史记录（LocalStorage）
- Plot 管理面板（查看、编辑、删除）
- Plot-Story 关联统计
- 最多保存 10 个 Plot（与 Story 保持一致）

---

## 🔧 关键组件实现

### Plot 生成主组件
```typescript
// components/blocks/plot-generate/index.tsx
'use client';

import { useState, useCallback } from 'react';
import { PlotData } from '@/types/plot';
import { savePlot } from '@/lib/plot-storage';
import { PlotForm } from './plot-form';
import { PlotVisualizer } from './plot-visualizer';
import { PlotPreview } from './plot-preview';

export function PlotGenerator() {
  const [plot, setPlot] = useState<PlotData | null>(null);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(false);

  const handlePlotGenerated = useCallback((content: string) => {
    setGeneratedContent(content);
    setIsGenerating(false);

    // 自动保存到 LocalStorage
    const savedPlot = savePlot({
      title: extractTitle(content),
      prompt: '', // 来自表单
      content,
      model: 'standard',
      complexity: 'medium',
      // ... 其他参数
    });

    setPlot(savedPlot);
  }, []);

  const toggleVisualizer = useCallback(() => {
    setShowVisualizer(prev => !prev);
  }, []);

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 参数表单区域 */}
        <div className="lg:col-span-1">
          <PlotForm
            onPlotGenerated={handlePlotGenerated}
            isGenerating={isGenerating}
            setIsGenerating={setIsGenerating}
          />
        </div>

        {/* 可视化/预览区域 */}
        <div className="lg:col-span-2">
          {showVisualizer && plot ? (
            <PlotVisualizer plot={plot} />
          ) : (
            <PlotPreview content={generatedContent} />
          )}
        </div>
      </div>

      {/* 操作栏 */}
      {plot && (
        <div className="mt-6 flex gap-4">
          <Button onClick={toggleVisualizer}>
            {showVisualizer ? '📝 查看预览' : '🎨 查看可视化'}
          </Button>
          <PlotToStoryButton plotId={plot.id} />
        </div>
      )}
    </div>
  );
}
```

### 可视化节点组件
```typescript
// components/blocks/plot-generate/plot-visualizer/custom-node.tsx
import { Handle, Position, NodeProps } from 'reactflow';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface PlotNodeData {
  id: string;
  type: 'chapter' | 'plot-point' | 'character' | 'subplot';
  title: string;
  description: string;
  isEditable?: boolean;
  onUpdate: (id: string, data: Partial<PlotNodeData>) => void;
}

export function CustomPlotNode({ data }: NodeProps<PlotNodeData>) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(data.title);
  const [editedDesc, setEditedDesc] = useState(data.description);

  const handleSave = () => {
    data.onUpdate(data.id, {
      title: editedTitle,
      description: editedDesc
    });
    setIsEditing(false);
  };

  const nodeColors = {
    chapter: 'border-blue-500 bg-blue-50',
    'plot-point': 'border-green-500 bg-green-50',
    character: 'border-purple-500 bg-purple-50',
    subplot: 'border-orange-500 bg-orange-50'
  };

  return (
    <Card className={`p-4 min-w-[200px] border-2 ${nodeColors[data.type]}`}>
      <Handle type="target" position={Position.Top} />

      {isEditing ? (
        <div className="space-y-2">
          <Input
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            placeholder="标题"
          />
          <Textarea
            value={editedDesc}
            onChange={(e) => setEditedDesc(e.target.value)}
            placeholder="描述"
            rows={3}
          />
          <Button size="sm" onClick={handleSave}>保存</Button>
        </div>
      ) : (
        <div onDoubleClick={() => data.isEditable && setIsEditing(true)}>
          <h4 className="font-semibold">{data.title}</h4>
          <p className="text-sm text-muted-foreground mt-1">{data.description}</p>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} />
    </Card>
  );
}
```

### Plot→Story 转换组件
```typescript
// components/blocks/plot-generate/plot-to-story-dialog.tsx
'use client';

import { useState, useCallback } from 'react';
import { getPlotById, linkPlotToStory } from '@/lib/plot-storage';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { PlotToStoryParams } from './plot-to-story-params';

interface PlotToStoryDialogProps {
  plotId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlotToStoryDialog({
  plotId,
  open,
  onOpenChange
}: PlotToStoryDialogProps) {
  const plot = getPlotById(plotId);

  const handleGenerateStory = useCallback(async (overrides: any) => {
    // 调用 Plot→Story API
    const response = await fetch('/api/story-generate-from-plot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        plotId,
        overrides,
        plotData: plot
      })
    });

    // 处理流式响应...
    // ...

    // 记录关联关系
    const newStoryId = 'generated-story-id';
    linkPlotToStory(plotId, newStoryId);

    onOpenChange(false);
  }, [plotId, plot, onOpenChange]);

  if (!plot) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>基于 Plot 生成 Story</DialogTitle>
          <DialogDescription>
            以下参数来自 Plot "{plot.title}"，可根据需要调整
          </DialogDescription>
        </DialogHeader>

        <PlotToStoryParams
          plot={plot}
          onGenerate={handleGenerateStory}
        />
      </DialogContent>
    </Dialog>
  );
}
```

---

## ⚠️ 技术风险与应对

| 风险 | 解决方案 |
|------|----------|
| React Flow 性能问题 | 虚拟化渲染、限制可见节点 |
| AI Prompt 质量不稳定 | 强化 Prompt 工程、多轮测试 |
| UI/UX 复杂度提升 | 渐进式展示、使用引导 |
| LocalStorage 限制 | 最多保存 10 个 Plot，压缩数据 |
| Plot-Story 关联丢失 | 关联关系同样存储在 LocalStorage |

---

## 📈 预期收益

- **用户价值**：Plot → Story 完整工作流，提升创作效率
- **产品差异化**：市场上独特的可视化 Plot 功能
- **技术资产**：可视化组件库可复用，支持未来扩展
- **架构优势**：保持与现有系统完全一致的技术栈

---

## 🎯 总结

这个 Plot Generator 方案：
1. ✅ 完全沿用 Story Generator 的设计模式和架构
2. ✅ 使用 LocalStorage 而非数据库（符合当前需求）
3. ✅ 提供完整的工作流集成（Plot → Story）
4. ✅ 具备强大的可视化功能（React Flow）
5. ✅ 支持中等复杂度的参数配置
6. ✅ 可扩展性强，易于维护

建议立即开始 Phase 1 的开发工作！

---

**最后更新**：2025-11-03
**预计开发周期**：6 周
**技术栈**：Next.js 15 + TypeScript + React Flow + Tailwind CSS

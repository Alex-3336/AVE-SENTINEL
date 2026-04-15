# AVE Sentinel

[English](./README_EN.md)

AVE Sentinel 是一个基于 AVE 的地址优先多链研究与执行终端。

它面向高噪声、快节奏的早期链上市场，核心要解决的只有一个问题：

**给定一个合约地址，这个标的是值得做、值得继续看，还是应该回避？**

AVE 已经提供了 K 线、持有人、交易记录、pair 和风险报告等原始浏览能力。  
AVE Sentinel 不重复做一个更重的数据面板，而是专注在决策层：

- `SENTINEL-8` 评分
- 风险门控
- 证据解释
- Quote 试算
- 执行准备

## 项目截图

![AVE Sentinel Access Program](./docs/submission-assets/access-program.png)

上图展示的是当前公开版中的用户体系页面。  
这个页面用于说明产品未来的准入机制、等级划分和权益差异，体现 AVE Sentinel 在研究与交易之外的产品扩展方向。

## 核心定位

- 地址优先：看到一个 CA，直接进入完整分析
- 多链统一：覆盖 Solana、BSC、Base、Ethereum
- 决策优先：重点展示评分、风险、证据和执行准备
- 与 AVE 互补：AVE 提供基础浏览与交易能力，Sentinel 提供研究与判断层

## 当前工作流

1. 输入合约地址
2. 生成 `SENTINEL-8` 分数
3. 查看证据页
4. 进入风险拦截
5. 拉取 AVE 官方 Quote
6. 做执行准备

## SENTINEL-8

`SENTINEL-8` 是 AVE Sentinel 的核心评分模型，包含八个维度：

- `L` 流动性深度
- `V` 成交质量
- `M` 动量
- `A` 活跃度加速
- `C` 持仓集中度
- `R` 风险门面
- `S` 信号质量
- `F` 周期新鲜度

最终输出三档结论：

- `可做`
- `观望`
- `回避`

## 三个入口

### Web

主工作台，负责：

- 完整单币分析
- 评分解释
- 风险判断
- Quote 准备
- 执行准备

### Telegram

轻量移动端入口，适合：

- 快速查币
- 快速查风险
- 快速做 Quote
- 接收简报

### CLI / Skill Runtime

结构化运行时入口，适合：

- 大模型自然语言调用
- 脚本化工作流
- JSON 结构化调用

## 论文

- [查看论文 PDF](./paper/main.pdf)

论文说明了项目的研究背景、产品边界、评分模型设计，以及 AVE Sentinel 与 AVE 之间的互补关系。

## 快速启动

```bash
npm install
npm run dev
```

## 环境变量

参考：

- `.env.example`

运行项目至少需要配置：

- `VITE_AVE_API_KEY`
- `AVE_API_SECRET`

## 说明

GitHub 公开版本只保留核心 README、英文备选说明、展示截图与论文 PDF。  
更完整的内部文档、提交材料和扩展说明保留在本地工作仓库中，不在公开仓库展开。

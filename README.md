# hxyfront-62003 法医昆虫学跨案联检台

源提示词编号：5

法医昆虫学样本记录前端工具。在采样地点、环境温度、尸体暴露阶段、昆虫种类、
发育阶段、采样时间、保存方式、鉴定备注的记录能力之上，提供**跨案联检台**：

- 预置三案六样，鉴定员勾选至少两份样本建立联检批；
- 入批条件：虫种相同、发育阶段相同、保存方式一致、采样时刻两两相距 24 小时以内；
- 保存方式不一致、已进别批、案件封存或其他条件不符的样本**显示退回理由**且不入批；
- 原名单与既有旧批只读不可变，新批只追加；
- 联检编号同步到各案件关联页、样本详情卡、联检批列表与温度曲线；
- 发育阶段筛选联动样本表与温度曲线，建批后曲线按批成组连线。

## 业务模块划分（不加运行时依赖、无后端）

```
src/domain/   判定模块：入批规则与退回理由（纯函数，不碰存储与 React）
  types.ts     领域类型
  rules.ts     reviewSelection 勾选审查、退回理由文案
src/data/     资料存取模块：预置数据 + 不可变更新 + localStorage
  seed.ts      三案六样与既有旧批 JCB-2026-001
  store.ts     useReducer 仓库、建批编号、案件-联检编号派生态
src/ui/       页面交互模块：视图组件
  SampleTable / ReviewBar / StageFilter / TemperatureChart
  BatchList / CaseBoard / SampleDetail
```

持久化仅用浏览器 localStorage（可在页面上"恢复预置数据"重置）。

## 技术栈

React + Vite + TypeScript

## 本地运行

```bash
npm install
npm run dev
```

开发端口：62003

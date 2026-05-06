# Prometheus 监控配置

## metrics 端点
- URL: `http://localhost:18602/metrics`
- 格式: JSON

## 关键指标
- meetings_total: 会议总数
- active_meetings: 活跃会议数
- messages_total: 消息总数
- agents_online: 在线 Agent 数量

## 部署方式
1. 安装 prometheus
2. 配置 scrape 目标
3. 设置告警规则
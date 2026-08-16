<map version="1.0.1">
<node TEXT="Agent Harness 从零构建 (s01-s17)">
<node TEXT="1. 核心循环（地基）">
<node TEXT="s01 agent_loop">
<node TEXT="while True 调模型"/>
<node TEXT="messages 累积"/>
</node>
<node TEXT="s02 tool_use">
<node TEXT="工具定义 schema"/>
<node TEXT="TOOL_HANDLERS 分发"/>
<node TEXT="tool_use / tool_result 配对"/>
</node>
<node TEXT="s15 integrated">
<node TEXT="25 工具一个循环"/>
<node TEXT="事件驱动唤醒"/>
</node>
</node>
<node TEXT="2. 安全与扩展">
<node TEXT="s03 permission">
<node TEXT="三道闸门：拒绝列表/规则/审批"/>
<node TEXT="执行前判断"/>
</node>
<node TEXT="s04 hooks">
<node TEXT="4 事件：UserPrompt/PreTool/PostTool/Stop"/>
<node TEXT="register + trigger"/>
<node TEXT="返回非 None 即拦截"/>
</node>
<node TEXT="s14 MCP">
<node TEXT="tools/list + tools/call"/>
<node TEXT="mcp__server__tool 前缀"/>
<node TEXT="宿主授权 ≠ 服务方声明"/>
</node>
</node>
<node TEXT="3. 计划与委派">
<node TEXT="s05 todo_write">
<node TEXT="会话内清单"/>
<node TEXT="pending/in_progress/completed"/>
</node>
<node TEXT="s06 subagent">
<node TEXT="一次性隔离上下文"/>
<node TEXT="只回最终摘要"/>
</node>
<node TEXT="s10 task_system">
<node TEXT="任务落盘 JSON"/>
<node TEXT="blockedBy 依赖"/>
</node>
<node TEXT="s13 teams">
<node TEXT="Lead + 持久 Teammate"/>
<node TEXT="MessageBus 文件信箱"/>
<node TEXT="WORK/IDLE 状态机"/>
<node TEXT="worktree 目录隔离"/>
</node>
</node>
<node TEXT="4. 知识与记忆">
<node TEXT="s07 skill">
<node TEXT="目录 → 按需加载"/>
<node TEXT="不堆 system prompt"/>
</node>
<node TEXT="s08 compact">
<node TEXT="四步管线：budget/snip/micro/summary"/>
<node TEXT="先存盘再裁剪"/>
</node>
<node TEXT="s09 memory">
<node TEXT="跨会话持久"/>
<node TEXT="提取 + 整合"/>
</node>
</node>
<node TEXT="5. 时间与并发">
<node TEXT="s11 background">
<node TEXT="run_in_background 线程"/>
<node TEXT="bg_id + 占位结果"/>
</node>
<node TEXT="s12 cron">
<node TEXT="五段 cron 表达式"/>
<node TEXT="调度线程 + 队列"/>
</node>
</node>
<node TEXT="6. 编排与闭环">
<node TEXT="s16 workflow">
<node TEXT="agent/parallel/pipeline"/>
<node TEXT="journal 断点续跑"/>
<node TEXT="结构化输出校验"/>
</node>
<node TEXT="s17 goal">
<node TEXT="独立判断器"/>
<node TEXT="ok/impossible 三态"/>
<node TEXT="block_cap 防死循环"/>
</node>
</node>
</node>
</map>

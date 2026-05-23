#!/usr/bin/env node
/**
 * ApiPost MCP - API文档管理工具
 * 提供简洁高效的API文档创建、查看、修改和删除功能
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// 配置模块
import { APIPOST_HOST, APIPOST_TOKEN, logWithTime, validateEnv } from './config/index.js';

// 工作空间模块
import { initWorkspace } from './workspace/index.js';

// 工具模块
import { tools } from './tools/definitions.js';
import { handlers } from './tools/handlers.js';

// 工具函数
import { formatError } from './utils/index.js';

// 验证环境变量
validateEnv();

// 创建MCP服务器
const server = new Server({
    name: 'apipost-mcp',
    version: '1.0.0',
    capabilities: { tools: {} }
});

// 工具定义
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools
}));

// 工具处理
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    if (!args) {
        throw new Error('缺少参数');
    }

    const startTime = Date.now();
    const handler = handlers[name];

    if (!handler) {
        throw new Error(`未知工具: ${name}`);
    }

    try {
        return await handler(args);
    } catch (error) {
        const errorMsg = formatError(error, name);
        logWithTime(`❌ 工具 '${name}' 执行失败: ${error instanceof Error ? error.message : String(error)}`, startTime);
        return {
            content: [{
                type: 'text',
                text: `❌ ${errorMsg}\n\n💡 调试提示:\n• 检查传入的参数是否正确\n• 确认接口ID是否存在\n• 验证网络连接和API权限`
            }],
            isError: true
        };
    }
});

// 启动服务器
async function main() {
    try {
        const mainStartTime = Date.now();
        console.error('='.repeat(50));
        console.error('🚀 ApiPost MCP 启动中...');
        console.error(`🔗 连接到: ${APIPOST_HOST}`);
        console.error(`🔐 Token: ${APIPOST_TOKEN?.substring(0, 8)}...`);

        // 预初始化工作空间以提高首次调用速度（在MCP连接前完成，避免日志重复）
        try {
            console.error('🔄 预初始化工作空间...');
            await initWorkspace(mainStartTime);
            console.error('✨ 工作空间预初始化完成');
        } catch (error) {
            console.error('⚠️ 工作空间预初始化失败，将在首次调用时重试:', error instanceof Error ? error.message : String(error));
            // 不阻止服务器启动，在工具调用时再尝试初始化
        }

        const transport = new StdioServerTransport();
        await server.connect(transport);

        console.error('✅ ApiPost MCP 启动成功!');
        console.error('📊 可用工具: apipost_create_folder, apipost_smart_create, apipost_list, apipost_update, apipost_delete');
        console.error('📈 等待工具调用...');
        console.error('='.repeat(50));
    } catch (error) {
        console.error('❌ 启动失败:', error);
        process.exit(1);
    }
}

main();

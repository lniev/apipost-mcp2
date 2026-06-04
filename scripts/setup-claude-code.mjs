#!/usr/bin/env node
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, resolve } from 'path';
import { homedir } from 'os';

const CLAUDE_CODE_CONFIG_PATH = join(homedir(), '.claude.json');
const MCP_JSON_PATH = resolve(process.cwd(), 'mcp.json');

async function main() {
  // 1. 读取 mcp.json
  let mcpData;
  try {
    const raw = await readFile(MCP_JSON_PATH, 'utf-8');
    mcpData = JSON.parse(raw);
  } catch (err) {
    console.error(`❌ 无法读取或解析 ${MCP_JSON_PATH}:`, err.message);
    process.exit(1);
  }

  const apipostConfig = mcpData?.mcpServers?.apipost;
  if (!apipostConfig) {
    console.error('❌ mcp.json 中未找到 mcpServers.apipost 配置');
    process.exit(1);
  }

  // 2. 读取或创建 ~/.claude.json
  let claudeData = {};
  if (existsSync(CLAUDE_CODE_CONFIG_PATH)) {
    try {
      const raw = await readFile(CLAUDE_CODE_CONFIG_PATH, 'utf-8');
      claudeData = JSON.parse(raw);
    } catch (err) {
      console.error(`❌ 无法解析 ${CLAUDE_CODE_CONFIG_PATH}:`, err.message);
      process.exit(1);
    }
  }

  // 3. 合并配置
  if (!claudeData.mcpServers) {
    claudeData.mcpServers = {};
  }
  claudeData.mcpServers.apipost = apipostConfig;

  // 4. 写回 ~/.claude.json
  try {
    await writeFile(CLAUDE_CODE_CONFIG_PATH, JSON.stringify(claudeData, null, 2) + '\n', 'utf-8');
    console.log(`✅ 已将 apipost MCP 配置写入 ${CLAUDE_CODE_CONFIG_PATH}`);
  } catch (err) {
    console.error(`❌ 无法写入 ${CLAUDE_CODE_CONFIG_PATH}:`, err.message);
    process.exit(1);
  }
}

main();

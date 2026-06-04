#!/usr/bin/env node
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve } from 'path';

const ENV_PATH = resolve(process.cwd(), '.env');
const MCP_JSON_PATH = resolve(process.cwd(), 'mcp.json');

async function main() {
  // 1. 读取 .env 文件
  if (!existsSync(ENV_PATH)) {
    console.error(`❌ 未找到 ${ENV_PATH}，请先创建 .env 文件`);
    process.exit(1);
  }

  let envContent;
  try {
    envContent = await readFile(ENV_PATH, 'utf-8');
  } catch (err) {
    console.error(`❌ 无法读取 ${ENV_PATH}:`, err.message);
    process.exit(1);
  }

  // 2. 解析 .env 内容
  const env = {};
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    // 去除首尾引号
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }

  // 3. 构建 mcp.json 结构
  const mcpJson = {
    mcpServers: {
      apipost: {
        command: 'node',
        args: [resolve(process.cwd(), 'dist/index.js')],
        env: {
          APIPOST_TOKEN: env.APIPOST_TOKEN || '',
          APIPOST_HOST: env.APIPOST_HOST || '',
          APIPOST_SECURITY_MODE: env.APIPOST_SECURITY_MODE || 'full',
          APIPOST_DEFAULT_TEAM_NAME: env.APIPOST_DEFAULT_TEAM_NAME || '',
          APIPOST_DEFAULT_PROJECT_NAME: env.APIPOST_DEFAULT_PROJECT_NAME || '',
          APIPOST_URL_PREFIX: env.APIPOST_URL_PREFIX || ''
        }
      }
    }
  };

  // 4. 写入 mcp.json
  try {
    await writeFile(MCP_JSON_PATH, JSON.stringify(mcpJson, null, 2) + '\n', 'utf-8');
    console.log(`✅ 已根据 .env 生成 ${MCP_JSON_PATH}`);
  } catch (err) {
    console.error(`❌ 无法写入 ${MCP_JSON_PATH}:`, err.message);
    process.exit(1);
  }
}

main();

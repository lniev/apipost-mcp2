#!/usr/bin/env node
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, resolve } from 'path';
import { homedir } from 'os';

const CODEX_CONFIG_PATH = join(homedir(), '.codex', 'config.toml');
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

  // 2. 读取或创建 ~/.codex/config.toml
  let codexToml = '';
  if (existsSync(CODEX_CONFIG_PATH)) {
    try {
      codexToml = await readFile(CODEX_CONFIG_PATH, 'utf-8');
    } catch (err) {
      console.error(`❌ 无法读取 ${CODEX_CONFIG_PATH}:`, err.message);
      process.exit(1);
    }
  }

  // 3. 生成 apipost 的 TOML 配置块
  const argsStr = apipostConfig.args.map(a => `"${a}"`).join(', ');
  const envEntries = Object.entries(apipostConfig.env || {});
  const envStr = envEntries.length > 0
    ? envEntries.map(([k, v]) => `${k} = "${v}"`).join('\n')
    : '';

  const apipostToml = `
[mcp_servers.apipost]
command = "${apipostConfig.command}"
args = [${argsStr}]
${envStr ? `[mcp_servers.apipost.env]\n${envStr}\n` : ''}`.trim();

  // 4. 检查是否已存在 [mcp_servers.apipost] 块，存在则替换，不存在则追加
  const mcpServersRegex = /\[mcp_servers\.apipost\][\s\S]*?(?=\n\[|$)/;
  if (mcpServersRegex.test(codexToml)) {
    codexToml = codexToml.replace(mcpServersRegex, apipostToml + '\n');
  } else {
    codexToml = codexToml.trimEnd() + '\n\n' + apipostToml + '\n';
  }

  // 5. 写回 ~/.codex/config.toml
  try {
    await writeFile(CODEX_CONFIG_PATH, codexToml, 'utf-8');
    console.log(`✅ 已将 apipost MCP 配置写入 ${CODEX_CONFIG_PATH}`);
  } catch (err) {
    console.error(`❌ 无法写入 ${CODEX_CONFIG_PATH}:`, err.message);
    process.exit(1);
  }
}

main();

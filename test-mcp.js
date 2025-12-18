// Simple MCP protocol test
import { spawn } from 'child_process';
import * as readline from 'readline';

const server = spawn('node', ['dist/index.js'], {
  cwd: 'c:\\Users\\longns\\Documents\\ggdoc',
  stdio: ['pipe', 'pipe', 'inherit']
});

const rl = readline.createInterface({
  input: server.stdout,
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  if (line.trim()) {
    try {
      const response = JSON.parse(line);
      console.log('\n📥 Response:');
      console.log(JSON.stringify(response, null, 2).substring(0, 2000));
      if (response.result?.tools) {
        console.log(`\n✅ Found ${response.result.tools.length} tools`);
      }
      if (response.result?.content) {
        console.log('\n✅ Tool call successful!');
      }
    } catch (e) {
      console.log('Raw:', line);
    }
  }
});

function sendRequest(request) {
  const json = JSON.stringify(request);
  console.log(`\n📤 Sending: ${request.method}`);
  server.stdin.write(json + '\n');
}

// Initialize
sendRequest({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test', version: '1.0' }
  }
});

setTimeout(() => {
  sendRequest({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {}
  });
}, 500);

setTimeout(() => {
  sendRequest({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'list_google_cloud_products',
      arguments: {}
    }
  });
}, 1000);

setTimeout(() => {
  console.log('\n✅ Test completed!');
  server.kill();
  process.exit(0);
}, 3000);

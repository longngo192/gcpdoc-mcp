// Test search with actual content fetching
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

      if (response.id === 3) {
        console.log('\n=== Search Results ===');
        const result = JSON.parse(response.result.content[0].text);

        console.log(`Query: "${result.query}"`);
        console.log(`Total matches: ${result.totalMatches}`);
        console.log(`\nResults with content:`);

        for (const doc of result.results) {
          console.log(`\n--- ${doc.title || doc.description} ---`);
          console.log(`URL: ${doc.url}`);
          if (doc.content) {
            console.log(`Content preview (first 500 chars):`);
            console.log(doc.content.substring(0, 500));
            console.log('...');
          }
          if (doc.error) {
            console.log(`Error: ${doc.error}`);
          }
        }

        if (result.otherRelatedDocs?.length > 0) {
          console.log(`\nOther related docs:`);
          for (const doc of result.otherRelatedDocs) {
            console.log(`  - ${doc.description}: ${doc.url}`);
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }
});

function sendRequest(request) {
  const json = JSON.stringify(request);
  console.log(`Sending: ${request.method} ${request.params?.name || ''}`);
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
  // Test search with content fetching
  sendRequest({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'search_google_cloud_docs',
      arguments: {
        query: 'create bucket'
      }
    }
  });
}, 500);

setTimeout(() => {
  console.log('\n\nTest completed!');
  server.kill();
  process.exit(0);
}, 15000);

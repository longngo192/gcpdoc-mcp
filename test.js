// Test search functionality
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

let testId = 1;
let currentQuery = '';

rl.on('line', (line) => {
  if (line.trim()) {
    try {
      const response = JSON.parse(line);

      if (response.result?.content) {
        const result = JSON.parse(response.result.content[0].text);

        console.log(`\n${'═'.repeat(70)}`);
        console.log(`QUERY: "${currentQuery}"`);
        console.log(`${'═'.repeat(70)}`);
        console.log(`Total results: ${result.totalResults || 0}`);

        if (result.results && result.results.length > 0) {
          for (let i = 0; i < result.results.length; i++) {
            const doc = result.results[i];
            console.log(`\n[${i + 1}] ${doc.title || 'No title'}`);
            console.log(`    URL: ${doc.url}`);
            if (doc.content) {
              // Show first 300 chars of content
              const preview = doc.content.substring(0, 300).replace(/\n/g, ' ');
              console.log(`    Content: ${preview}...`);
            }
            if (doc.error) {
              console.log(`    ❌ Error: ${doc.error}`);
            }
          }
        } else {
          console.log('❌ No results found');
        }
      }
    } catch (e) {
      // ignore
    }
  }
});

function sendSearch(query) {
  currentQuery = query;
  const request = {
    jsonrpc: '2.0',
    id: testId++,
    method: 'tools/call',
    params: {
      name: 'search_google_cloud_docs',
      arguments: { query }
    }
  };
  server.stdin.write(JSON.stringify(request) + '\n');
}

// Initialize
server.stdin.write(JSON.stringify({
  jsonrpc: '2.0',
  id: 0,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test', version: '1.0' }
  }
}) + '\n');

// Test queries
const testQueries = [
  'how to share encrypted bucket cross account',
  'cloud sql high availability setup',
  'vpc peering between projects',
  'gke autoscaling configuration',
  'bigquery partition table',
  'cloud run environment variables',
  'iam service account impersonation'
];

let queryIndex = 0;

function runNextTest() {
  if (queryIndex < testQueries.length) {
    setTimeout(() => {
      sendSearch(testQueries[queryIndex]);
      queryIndex++;
      runNextTest();
    }, 8000); // Wait 8 seconds between tests
  } else {
    setTimeout(() => {
      console.log('\n\n✅ All tests completed!');
      server.kill();
      process.exit(0);
    }, 8000);
  }
}

// Start tests after init
setTimeout(runNextTest, 1000);

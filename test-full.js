// Full test for all tools
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

let currentTest = '';

rl.on('line', (line) => {
  if (line.trim()) {
    try {
      const response = JSON.parse(line);

      if (response.result?.content) {
        const result = JSON.parse(response.result.content[0].text);
        console.log(`\n${'='.repeat(60)}`);
        console.log(`TEST: ${currentTest}`);
        console.log('='.repeat(60));

        if (result.title) {
          console.log(`Title: ${result.title}`);
        }
        if (result.url) {
          console.log(`URL: ${result.url}`);
        }
        if (result.query) {
          console.log(`Query: ${result.query}`);
          console.log(`Total matches: ${result.totalMatches}`);
        }
        if (result.totalProducts) {
          console.log(`Total products: ${result.totalProducts}`);
        }

        // Show content preview
        if (result.content) {
          console.log(`\nContent (first 800 chars):\n${'-'.repeat(40)}`);
          console.log(result.content.substring(0, 800));
          console.log('...');
        }

        // Show results array
        if (result.results) {
          for (const doc of result.results) {
            console.log(`\n--- ${doc.title || doc.description} ---`);
            if (doc.content) {
              console.log(doc.content.substring(0, 600));
              console.log('...');
            }
          }
        }

        // Show products
        if (result.products) {
          console.log('\nProducts:');
          result.products.slice(0, 5).forEach(p => {
            console.log(`  - ${p.name}: ${p.description}`);
          });
          if (result.products.length > 5) {
            console.log(`  ... and ${result.products.length - 5} more`);
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }
});

function sendRequest(request, testName) {
  currentTest = testName;
  const json = JSON.stringify(request);
  console.log(`\nSending: ${testName}...`);
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
}, 'Initialize');

// Test 1: List products
setTimeout(() => {
  sendRequest({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'list_google_cloud_products',
      arguments: {}
    }
  }, 'list_google_cloud_products');
}, 500);

// Test 2: Fetch specific doc
setTimeout(() => {
  sendRequest({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'fetch_google_cloud_doc',
      arguments: {
        path: 'compute/docs/instances'
      }
    }
  }, 'fetch_google_cloud_doc (compute instances)');
}, 3000);

// Test 3: Search for bigquery
setTimeout(() => {
  sendRequest({
    jsonrpc: '2.0',
    id: 4,
    method: 'tools/call',
    params: {
      name: 'search_google_cloud_docs',
      arguments: {
        query: 'bigquery'
      }
    }
  }, 'search_google_cloud_docs (bigquery)');
}, 8000);

// Test 4: Get API reference
setTimeout(() => {
  sendRequest({
    jsonrpc: '2.0',
    id: 5,
    method: 'tools/call',
    params: {
      name: 'get_api_reference',
      arguments: {
        service: 'storage'
      }
    }
  }, 'get_api_reference (storage)');
}, 15000);

setTimeout(() => {
  console.log('\n\n' + '='.repeat(60));
  console.log('ALL TESTS COMPLETED!');
  console.log('='.repeat(60));
  server.kill();
  process.exit(0);
}, 25000);

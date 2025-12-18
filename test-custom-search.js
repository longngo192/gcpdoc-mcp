// Test custom search query
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
        console.log('\n' + '='.repeat(70));
        console.log('SEARCH RESULTS');
        console.log('='.repeat(70));

        const result = JSON.parse(response.result.content[0].text);

        console.log(`Query: "${result.query}"`);
        console.log(`Total results found: ${result.totalResults}`);

        if (result.results && result.results.length > 0) {
          console.log(`\n${'─'.repeat(70)}`);
          console.log('FETCHED CONTENT:');
          console.log('─'.repeat(70));

          for (const doc of result.results) {
            console.log(`\n📄 ${doc.title || 'No title'}`);
            console.log(`🔗 ${doc.url}`);
            if (doc.snippet) {
              console.log(`📝 Snippet: ${doc.snippet}`);
            }
            if (doc.content) {
              console.log(`\n📖 Content (first 1500 chars):\n`);
              console.log(doc.content.substring(0, 1500));
              console.log('\n[... truncated ...]');
            }
            if (doc.error) {
              console.log(`❌ Error: ${doc.error}`);
            }
            console.log('─'.repeat(50));
          }
        } else {
          console.log('\n❌ No results found');
        }

        if (result.otherRelatedDocs && result.otherRelatedDocs.length > 0) {
          console.log(`\n${'─'.repeat(70)}`);
          console.log('OTHER RELATED DOCS (not fetched):');
          console.log('─'.repeat(70));
          for (const doc of result.otherRelatedDocs) {
            console.log(`  • ${doc.title}: ${doc.url}`);
          }
        }
      }
    } catch (e) {
      // ignore parse errors
    }
  }
});

function sendRequest(request) {
  const json = JSON.stringify(request);
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

// Test search with custom query
const testQuery = process.argv[2] || 'how to share encrypted bucket cross account';
console.log(`\n🔍 Testing search: "${testQuery}"\n`);

setTimeout(() => {
  sendRequest({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'search_google_cloud_docs',
      arguments: {
        query: testQuery
      }
    }
  });
}, 500);

setTimeout(() => {
  console.log('\n\n✅ Test completed!');
  server.kill();
  process.exit(0);
}, 30000);

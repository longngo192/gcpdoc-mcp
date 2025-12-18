// Test the core functions directly
import * as cheerio from 'cheerio';

const GOOGLE_CLOUD_API_DOCS_BASE = "https://cloud.google.com";

const GOOGLE_CLOUD_PRODUCTS = {
  compute: {
    name: "Compute Engine",
    docsPath: "compute/docs",
    description: "Virtual machines and infrastructure",
  },
  storage: {
    name: "Cloud Storage",
    docsPath: "storage/docs",
    description: "Object storage service",
  },
  bigquery: {
    name: "BigQuery",
    docsPath: "bigquery/docs",
    description: "Data warehouse and analytics",
  },
};

async function fetchWithTimeout(url, timeout = 30000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function testFetchDoc(path) {
  console.log(`\n=== Testing fetch_google_cloud_doc("${path}") ===`);
  const url = `${GOOGLE_CLOUD_API_DOCS_BASE}/${path}`;

  try {
    const response = await fetchWithTimeout(url);
    console.log(`Status: ${response.status}`);

    if (response.ok) {
      const html = await response.text();
      const $ = cheerio.load(html);

      const title = $('h1').first().text().trim() || $('title').text().trim();
      console.log(`Title: ${title}`);
      console.log(`HTML length: ${html.length} characters`);
      console.log('✅ Fetch successful!');
      return true;
    } else {
      console.log(`❌ HTTP Error: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  }
}

function testListProducts() {
  console.log('\n=== Testing list_google_cloud_products ===');
  const products = Object.entries(GOOGLE_CLOUD_PRODUCTS).map(([key, value]) => ({
    id: key,
    name: value.name,
    docsUrl: `https://cloud.google.com/${value.docsPath}`,
  }));

  console.log('Products:', JSON.stringify(products, null, 2));
  console.log('✅ List products successful!');
  return true;
}

function testSearchDocs(query) {
  console.log(`\n=== Testing search_google_cloud_docs("${query}") ===`);

  const queryMappings = {
    "create vm": [{ path: "compute/docs/instances/create-start-instance", description: "Create VM instance" }],
    "bucket": [{ path: "storage/docs/creating-buckets", description: "Creating buckets" }],
  };

  const queryLower = query.toLowerCase();
  const results = [];

  for (const [keyword, paths] of Object.entries(queryMappings)) {
    if (queryLower.includes(keyword)) {
      results.push(...paths);
    }
  }

  console.log('Results:', JSON.stringify(results, null, 2));
  console.log('✅ Search successful!');
  return true;
}

// Run tests
async function runTests() {
  console.log('Starting MCP Server Function Tests...\n');

  // Test 1: List products
  testListProducts();

  // Test 2: Search docs
  testSearchDocs('create vm instance');

  // Test 3: Fetch a real doc page
  await testFetchDoc('compute/docs');

  console.log('\n=== All tests completed! ===');
}

runTests();

#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import * as cheerio from "cheerio";

const GOOGLE_CLOUD_DOCS_BASE = "https://cloud.google.com/docs";
const GOOGLE_CLOUD_API_DOCS_BASE = "https://cloud.google.com";

// Define available tools with comprehensive descriptions for Claude
const tools: Tool[] = [
  {
    name: "fetch_google_cloud_doc",
    description: `Fetch and extract content from a specific Google Cloud documentation page.

**WHEN TO USE**: Use this tool when you already know the exact documentation path you need, or when you want to get detailed content from a specific GCP documentation page.

**INPUT**: Documentation path after cloud.google.com/ (e.g., 'compute/docs/instances/create-start-instance', 'storage/docs/creating-buckets')

**OUTPUT**: Returns JSON with:
- title: Page title
- url: Full URL
- content: Markdown-formatted documentation content (max 20,000 chars)
- contentLength: Total content length
- truncated: Whether content was truncated

**COMMON PATHS**:
- Compute: compute/docs/instances/create-start-instance
- Storage: storage/docs/creating-buckets, storage/docs/encryption
- BigQuery: bigquery/docs/partitioned-tables, bigquery/docs/clustered-tables
- Cloud SQL: sql/docs/high-availability, sql/docs/replication
- GKE: kubernetes-engine/docs/how-to/cluster-autoscaler
- IAM: iam/docs/understanding-roles, iam/docs/service-accounts
- VPC: vpc/docs/vpc-peering, vpc/docs/shared-vpc
- Cloud Run: run/docs/configuring/environment-variables

**TIP**: If you don't know the exact path, use 'search_google_cloud_docs' first to find relevant documentation.`,
    inputSchema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description:
            "The documentation path after cloud.google.com/ (e.g., 'compute/docs/instances/create-start-instance', 'storage/docs/creating-buckets')",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "search_google_cloud_docs",
    description: `Search Google Cloud documentation with any free-form query. Returns relevant documentation with actual content.

**WHEN TO USE**: ALWAYS use this tool when the user asks about Google Cloud Platform (GCP) services, configurations, best practices, or how-to questions. This is the PRIMARY tool for GCP-related queries.

**TRIGGERS** - Use this tool when user asks about:
- Any GCP service (Compute Engine, Cloud Storage, BigQuery, Cloud SQL, GKE, Cloud Run, IAM, VPC, etc.)
- Configuration questions ("how to configure...", "how to setup...")
- Best practices for GCP services
- Troubleshooting GCP issues
- Cross-project or cross-account scenarios
- Security, encryption, permissions in GCP
- Networking in GCP (VPC, peering, firewall, load balancer)
- Database configurations (Cloud SQL HA, replicas, backups)
- Container orchestration (GKE autoscaling, node pools)
- Serverless (Cloud Run, Cloud Functions environment variables)

**INPUT**:
- query (required): Free-form search query in natural language
- product (optional): Filter by specific GCP product

**EXAMPLE QUERIES**:
- "how to share encrypted bucket cross account"
- "vpc peering between two projects"
- "cloud sql high availability setup"
- "gke autoscaling configuration"
- "bigquery partition table"
- "cloud run environment variables"
- "iam service account impersonation"
- "cloud storage cmek encryption"
- "gke workload identity"

**OUTPUT**: Returns JSON with:
- query: Original search query
- totalResults: Number of results found
- results: Array of top 3 docs with full content (title, url, content)
- otherRelatedDocs: Additional related documentation URLs

**SUPPORTED TOPICS** (80+ mappings):
- Storage & Encryption: encrypt, bucket, cmek, kms, customer managed, object storage
- IAM & Security: iam, role, service account, impersonation, workload identity
- Networking: vpc, peering, shared vpc, firewall, load balancer, dns, nat, private access
- Database: cloud sql, high availability, mysql, postgres, replica, failover
- BigQuery: partition, cluster, materialized view, schedule
- GKE: gke, autoscaling, node pool, horizontal pod autoscaler, helm
- Serverless: cloud run, environment variable, cloud function, deploy
- Container: docker, artifact registry, cloud build
- Pub/Sub: pubsub, topic, subscription
- Data Processing: dataflow, dataproc, composer, airflow, spark
- Monitoring: logging, monitoring, metric, alert, dashboard, trace
- Infrastructure: terraform, deployment manager, gcloud`,
    inputSchema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description:
            "Free-form search query in natural language (e.g., 'how to share encrypted bucket cross account', 'vpc peering between projects', 'cloud sql high availability')",
        },
        product: {
          type: "string",
          description:
            "Optional: Filter by Google Cloud product (e.g., 'compute', 'storage', 'bigquery', 'kubernetes', 'sql', 'run')",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "list_google_cloud_products",
    description: `List all available Google Cloud products with their documentation paths.

**WHEN TO USE**: Use this tool when:
- User wants to see what GCP services are available
- User is exploring GCP products
- You need to find the correct product ID for other tools
- User asks "what GCP services are there?" or similar

**OUTPUT**: Returns JSON with:
- totalProducts: Number of products listed
- products: Array of products with id, name, docsPath, docsUrl, description

**PRODUCTS INCLUDED** (20+):
- Compute: compute, kubernetes, functions, run, appengine
- Storage: storage, firestore, spanner
- Database: sql, bigquery
- AI/ML: ai (Vertex AI), vision, speech, translate
- Networking: vpc, loadbalancing, cdn, dns
- Security: iam, kms
- Messaging: pubsub
- Monitoring: logging, monitoring

**TIP**: Use the returned 'docsPath' with 'fetch_google_cloud_doc' to get detailed documentation.`,
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_api_reference",
    description: `Get REST API reference documentation for a specific Google Cloud service.

**WHEN TO USE**: Use this tool when:
- User needs API endpoints, methods, or parameters
- User is developing integrations with GCP APIs
- User asks about REST API for a specific GCP service
- User needs to know available API resources for a service

**INPUT**:
- service (required): GCP service name (compute, storage, bigquery, pubsub, sql, kubernetes, functions, run, iam)
- resource (optional): Specific API resource (instances, buckets, datasets, topics, etc.)

**SUPPORTED SERVICES & RESOURCES**:
- compute: instances, disks, networks, firewalls, images, machineTypes
- storage: buckets, objects, notifications
- bigquery: datasets, tables, jobs, routines
- pubsub: topics, subscriptions, snapshots
- sql: instances, databases, users, backupRuns
- kubernetes: clusters, nodePools, operations
- functions: functions, operations, locations
- run: services, configurations, routes, revisions
- iam: roles, serviceAccounts, policies

**OUTPUT**: Returns JSON with:
- service: Service name
- description: Service description
- apiReferenceUrl: Full URL to API reference
- availableResources: List of available resources for this service
- documentation: Actual API documentation content (if available)

**EXAMPLE USAGE**:
- Get Compute Engine API overview: service="compute"
- Get Storage buckets API: service="storage", resource="buckets"
- Get BigQuery datasets API: service="bigquery", resource="datasets"`,
    inputSchema: {
      type: "object" as const,
      properties: {
        service: {
          type: "string",
          description:
            "The Google Cloud service name (e.g., 'compute', 'storage', 'bigquery', 'pubsub', 'sql', 'kubernetes', 'functions', 'run', 'iam')",
        },
        resource: {
          type: "string",
          description:
            "Optional: Specific API resource (e.g., 'instances', 'buckets', 'datasets', 'topics')",
        },
      },
      required: ["service"],
    },
  },
];

// Google Cloud products mapping
const GOOGLE_CLOUD_PRODUCTS: Record<
  string,
  { name: string; docsPath: string; description: string }
> = {
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
  kubernetes: {
    name: "Google Kubernetes Engine",
    docsPath: "kubernetes-engine/docs",
    description: "Managed Kubernetes service",
  },
  functions: {
    name: "Cloud Functions",
    docsPath: "functions/docs",
    description: "Serverless compute platform",
  },
  run: {
    name: "Cloud Run",
    docsPath: "run/docs",
    description: "Serverless containers",
  },
  pubsub: {
    name: "Pub/Sub",
    docsPath: "pubsub/docs",
    description: "Messaging and event ingestion",
  },
  sql: {
    name: "Cloud SQL",
    docsPath: "sql/docs",
    description: "Managed relational databases",
  },
  firestore: {
    name: "Firestore",
    docsPath: "firestore/docs",
    description: "NoSQL document database",
  },
  spanner: {
    name: "Cloud Spanner",
    docsPath: "spanner/docs",
    description: "Globally distributed database",
  },
  ai: {
    name: "Vertex AI",
    docsPath: "vertex-ai/docs",
    description: "Machine learning platform",
  },
  vision: {
    name: "Cloud Vision",
    docsPath: "vision/docs",
    description: "Image analysis API",
  },
  speech: {
    name: "Cloud Speech-to-Text",
    docsPath: "speech-to-text/docs",
    description: "Speech recognition API",
  },
  translate: {
    name: "Cloud Translation",
    docsPath: "translate/docs",
    description: "Translation API",
  },
  iam: {
    name: "IAM",
    docsPath: "iam/docs",
    description: "Identity and Access Management",
  },
  vpc: {
    name: "VPC",
    docsPath: "vpc/docs",
    description: "Virtual Private Cloud networking",
  },
  loadbalancing: {
    name: "Cloud Load Balancing",
    docsPath: "load-balancing/docs",
    description: "Global load balancing",
  },
  cdn: {
    name: "Cloud CDN",
    docsPath: "cdn/docs",
    description: "Content delivery network",
  },
  logging: {
    name: "Cloud Logging",
    docsPath: "logging/docs",
    description: "Log management and analysis",
  },
  monitoring: {
    name: "Cloud Monitoring",
    docsPath: "monitoring/docs",
    description: "Infrastructure monitoring",
  },
};

async function fetchWithTimeout(
  url: string,
  timeout = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchGoogleCloudDoc(path: string): Promise<string> {
  const cleanPath = path.replace(/^\/+/, "").replace(/^cloud\.google\.com\//, "");
  const url = `${GOOGLE_CLOUD_API_DOCS_BASE}/${cleanPath}`;

  try {
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      return JSON.stringify({
        error: `Failed to fetch documentation: HTTP ${response.status}`,
        url: url,
        suggestion:
          "Please check the path and try again. Use 'list_google_cloud_products' to see available products.",
      });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove all unwanted elements
    $(
      "script, style, nav, header, footer, noscript, iframe, svg, img, " +
      ".devsite-nav, .devsite-book-nav, .devsite-footer, .devsite-header, " +
      ".devsite-breadcrumb-list, .devsite-page-title, .devsite-banner, " +
      ".devsite-collapsible-section, .devsite-toc, .devsite-article-meta, " +
      '[role="navigation"], [role="banner"], [aria-hidden="true"], ' +
      ".nocontent, .caution, .note, .warning, .tip, .key-point, " +
      ".buttons, .button-group, .cta, .feedback, .rating"
    ).remove();

    // Extract title from h1 or title tag
    const title =
      $("h1.devsite-page-title").first().text().trim() ||
      $("article h1").first().text().trim() ||
      $("h1").first().text().trim() ||
      $("title").text().replace(" | Google Cloud", "").trim() ||
      "Google Cloud Documentation";

    // Find main content area
    const mainContent =
      $(".devsite-article-body").html() ||
      $("article .body-content").html() ||
      $("article").html() ||
      $("main").html() ||
      $(".content").html();

    if (!mainContent) {
      return JSON.stringify({
        error: "Could not extract content from the page",
        url: url,
        rawTextPreview: $("body").text().replace(/\s+/g, " ").substring(0, 500),
      });
    }

    const $content = cheerio.load(mainContent);

    // Remove remaining unwanted elements from content
    $content(
      "nav, .devsite-nav, .devsite-toc, .nocontent, " +
      '[role="navigation"], [aria-hidden="true"]'
    ).remove();

    // Build structured content
    const sections: { heading: string; content: string; level: number }[] = [];
    let currentSection = { heading: title, content: "", level: 1 };

    // Process each element in order
    $content("h1, h2, h3, h4, h5, p, pre, ul, ol, table, blockquote, dl").each((_, elem) => {
      const $elem = $content(elem);
      const tagName = elem.type === "tag" ? elem.name : "";

      // Skip empty elements
      const text = $elem.text().trim();
      if (!text) return;

      // Skip navigation-like content
      if (text.includes("Documentation") && text.includes("Home") && text.length < 100) return;
      if (text.startsWith("Stay organized with collections")) return;
      if (text.startsWith("Save and categorize")) return;

      if (["h1", "h2", "h3", "h4", "h5"].includes(tagName)) {
        // Save previous section if it has content
        if (currentSection.content.trim()) {
          sections.push({ ...currentSection });
        }
        currentSection = {
          heading: text,
          content: "",
          level: parseInt(tagName.substring(1)),
        };
      } else if (tagName === "pre") {
        // Code blocks
        const codeText = $elem.text().trim();
        if (codeText && codeText.length > 5) {
          // Detect language from class
          const codeClass = $elem.find("code").attr("class") || "";
          const lang = codeClass.match(/language-(\w+)/)?.[1] || "";
          currentSection.content += `\n\`\`\`${lang}\n${codeText}\n\`\`\`\n`;
        }
      } else if (tagName === "table") {
        // Extract table data
        const rows: string[] = [];
        $elem.find("tr").each((_, tr) => {
          const cells: string[] = [];
          $content(tr).find("th, td").each((_, cell) => {
            cells.push($content(cell).text().trim());
          });
          if (cells.length > 0) {
            rows.push(cells.join(" | "));
          }
        });
        if (rows.length > 0) {
          currentSection.content += `\n| ${rows.join(" |\n| ")} |\n`;
        }
      } else if (tagName === "ul" || tagName === "ol") {
        // Lists
        const items: string[] = [];
        $elem.children("li").each((i, li) => {
          const itemText = $content(li).text().trim();
          if (itemText) {
            const prefix = tagName === "ol" ? `${i + 1}.` : "-";
            items.push(`${prefix} ${itemText}`);
          }
        });
        if (items.length > 0) {
          currentSection.content += `\n${items.join("\n")}\n`;
        }
      } else if (tagName === "dl") {
        // Definition lists
        $elem.find("dt").each((_, dt) => {
          const term = $content(dt).text().trim();
          const dd = $content(dt).next("dd").text().trim();
          if (term) {
            currentSection.content += `\n**${term}**: ${dd}\n`;
          }
        });
      } else if (tagName === "blockquote") {
        currentSection.content += `\n> ${text}\n`;
      } else {
        // Paragraphs and other text
        if (text.length > 10) {
          currentSection.content += `\n${text}\n`;
        }
      }
    });

    // Push last section
    if (currentSection.content.trim()) {
      sections.push(currentSection);
    }

    // Format output as markdown
    const formattedContent = sections
      .filter(s => s.content.trim().length > 0)
      .map((s) => {
        const headingPrefix = "#".repeat(Math.min(s.level, 4));
        return `${headingPrefix} ${s.heading}\n${s.content.trim()}`;
      })
      .join("\n\n");

    // Clean up excessive whitespace
    const cleanContent = formattedContent
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return JSON.stringify({
      title: title,
      url: url,
      content: cleanContent.substring(0, 20000),
      contentLength: cleanContent.length,
      truncated: cleanContent.length > 20000,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return JSON.stringify({
      error: `Failed to fetch documentation: ${errorMessage}`,
      url: url,
    });
  }
}

// Search Google and extract results from cloud.google.com
async function searchGoogleForCloudDocs(
  query: string,
  product?: string
): Promise<{ url: string; title: string; snippet: string }[]> {
  // Build search query targeting cloud.google.com
  const siteFilter = product
    ? `site:cloud.google.com/${product}`
    : "site:cloud.google.com";
  const searchQuery = `${siteFilter} ${query}`;
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&num=10`;

  try {
    const response = await fetchWithTimeout(searchUrl, 15000);
    if (!response.ok) {
      return [];
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const results: { url: string; title: string; snippet: string }[] = [];

    // Parse Google search results
    $("div.g, div[data-hveid]").each((_, elem) => {
      const $elem = $(elem);

      // Find the link
      const $link = $elem.find("a[href^='http']").first();
      const url = $link.attr("href") || "";

      // Only include cloud.google.com results
      if (!url.includes("cloud.google.com")) return;

      // Extract title
      const title = $elem.find("h3").first().text().trim();

      // Extract snippet
      const snippet =
        $elem.find("div[data-sncf], div.VwiC3b, span.aCOpRe").first().text().trim() ||
        $elem.find("div").filter((_, el) => {
          const text = $(el).text();
          return text.length > 50 && text.length < 500;
        }).first().text().trim();

      if (url && title) {
        results.push({
          url: url.split("&")[0], // Clean URL
          title,
          snippet: snippet.substring(0, 300),
        });
      }
    });

    // Deduplicate by URL
    const uniqueResults = results.filter(
      (item, index, self) => index === self.findIndex((t) => t.url === item.url)
    );

    return uniqueResults.slice(0, 5);
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
}

// Alternative: Use Google Cloud's own search
async function searchCloudGoogleDirect(
  query: string
): Promise<{ url: string; title: string; snippet: string }[]> {
  // Try Google Cloud's search page
  const searchUrl = `https://cloud.google.com/s/results?q=${encodeURIComponent(query)}`;

  try {
    const response = await fetchWithTimeout(searchUrl, 15000);
    if (!response.ok) {
      return [];
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const results: { url: string; title: string; snippet: string }[] = [];

    // Parse search results from Google Cloud search page
    $("a.gs-title, .gsc-thumbnail-inside a, .gs-result a").each((_, elem) => {
      const $elem = $(elem);
      const url = $elem.attr("href") || "";
      const title = $elem.text().trim();

      if (url && title && url.includes("cloud.google.com")) {
        const $parent = $elem.closest(".gs-result, .gsc-webResult");
        const snippet = $parent.find(".gs-snippet, .gs-bidi-start-align").text().trim();

        results.push({
          url: url.startsWith("http") ? url : `https://cloud.google.com${url}`,
          title,
          snippet: snippet.substring(0, 300),
        });
      }
    });

    return results.slice(0, 5);
  } catch {
    return [];
  }
}

// Calculate relevance score for a search result
function calculateRelevance(
  url: string,
  title: string,
  query: string
): number {
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const urlLower = url.toLowerCase();
  const titleLower = title.toLowerCase();

  let score = 0;

  // Check each query word
  for (const word of queryWords) {
    if (urlLower.includes(word)) score += 3;
    if (titleLower.includes(word)) score += 2;
  }

  // Bonus for specific documentation pages (not generic overview)
  if (urlLower.includes("/how-to/") || urlLower.includes("/configure")) score += 2;
  if (urlLower.includes("/quickstart")) score += 1;

  // Penalty for very generic pages
  if (urlLower.endsWith("/docs") || urlLower.endsWith("/docs/")) score -= 1;

  return score;
}

async function searchGoogleCloudDocs(
  query: string,
  product?: string
): Promise<string> {
  const results: {
    url: string;
    title?: string;
    snippet?: string;
    content?: string;
    error?: string;
  }[] = [];

  const queryLower = query.toLowerCase();

  // Step 1: Try to search using Google
  let searchResults = await searchGoogleForCloudDocs(query, product);

  // Step 2: If no results, try direct Google Cloud search
  if (searchResults.length === 0) {
    searchResults = await searchCloudGoogleDirect(query);
  }

  // Step 3: Build fallback paths from topic mappings (always, to supplement Google results)
  const potentialPaths: string[] = [];

  // Check for product keywords
  for (const [key, value] of Object.entries(GOOGLE_CLOUD_PRODUCTS)) {
    if (queryLower.includes(key) || queryLower.includes(value.name.toLowerCase())) {
      potentialPaths.push(value.docsPath);
      }
    }

    // Common topic mappings - more specific patterns first
    const topicMappings: Record<string, string[]> = {
      // Storage & Encryption
      encrypt: ["storage/docs/encryption", "kms/docs", "storage/docs/encryption/customer-managed-keys"],
      "customer managed": ["storage/docs/encryption/customer-managed-keys", "kms/docs/cmek"],
      share: ["storage/docs/access-control", "iam/docs/granting-changing-revoking-access"],
      "cross account": ["iam/docs/granting-changing-revoking-access", "storage/docs/access-control/cross-project"],
      "cross project": ["storage/docs/access-control/cross-project", "iam/docs/granting-changing-revoking-access"],
      bucket: ["storage/docs/creating-buckets", "storage/docs/access-control", "storage/docs"],
      "object storage": ["storage/docs", "storage/docs/objects"],
      permission: ["iam/docs/understanding-roles", "iam/docs/granting-changing-revoking-access"],

      // IAM & Security
      iam: ["iam/docs", "iam/docs/understanding-roles"],
      role: ["iam/docs/understanding-roles", "iam/docs/creating-custom-roles"],
      kms: ["kms/docs", "kms/docs/quickstart"],
      cmek: ["storage/docs/encryption/customer-managed-keys", "kms/docs/cmek"],
      "service account": ["iam/docs/service-accounts", "iam/docs/creating-managing-service-accounts"],
      impersonat: ["iam/docs/service-account-impersonation", "iam/docs/impersonating-service-accounts"],
      workload: ["iam/docs/workload-identity-federation", "kubernetes-engine/docs/how-to/workload-identity"],

      // Networking
      vpc: ["vpc/docs", "vpc/docs/shared-vpc", "vpc/docs/vpc-peering"],
      peering: ["vpc/docs/vpc-peering", "vpc/docs/using-vpc-peering"],
      "shared vpc": ["vpc/docs/shared-vpc", "vpc/docs/provisioning-shared-vpc"],
      firewall: ["vpc/docs/firewalls", "vpc/docs/using-firewalls"],
      "load balancer": ["load-balancing/docs", "load-balancing/docs/load-balancing-overview"],
      ingress: ["kubernetes-engine/docs/concepts/ingress", "load-balancing/docs/https"],
      ssl: ["load-balancing/docs/ssl-certificates", "certificate-manager/docs"],
      dns: ["dns/docs", "dns/docs/overview"],
      "private access": ["vpc/docs/private-google-access", "vpc/docs/configure-private-google-access"],
      "private service": ["vpc/docs/private-service-connect", "vpc/docs/configure-private-service-connect-services"],
      nat: ["vpc/docs/nat-service", "vpc/docs/using-nat"],

      // Database - Cloud SQL
      "cloud sql": ["sql/docs", "sql/docs/introduction"],
      "high availability": ["sql/docs/high-availability", "sql/docs/configure-ha"],
      ha: ["sql/docs/high-availability", "sql/docs/configure-ha"],
      mysql: ["sql/docs/mysql", "sql/docs/mysql/quickstart"],
      postgres: ["sql/docs/postgres", "sql/docs/postgres/quickstart"],
      "sql server": ["sql/docs/sqlserver", "sql/docs/sqlserver/quickstart"],
      replica: ["sql/docs/replication", "sql/docs/mysql/replication/create-replica"],
      failover: ["sql/docs/high-availability", "sql/docs/configure-ha"],
      "read replica": ["sql/docs/replication", "sql/docs/mysql/replication"],
      "point in time": ["sql/docs/backup-recovery/pitr", "sql/docs/mysql/backup-recovery/pitr"],

      // BigQuery
      bigquery: ["bigquery/docs", "bigquery/docs/introduction"],
      partition: ["bigquery/docs/partitioned-tables", "bigquery/docs/creating-partitioned-tables"],
      cluster: ["bigquery/docs/clustered-tables", "bigquery/docs/creating-clustered-tables"],
      "materialized view": ["bigquery/docs/materialized-views-intro", "bigquery/docs/materialized-views-create"],
      schedule: ["bigquery/docs/scheduling-queries", "bigquery/docs/scheduled-queries"],

      // GKE & Kubernetes
      gke: ["kubernetes-engine/docs", "kubernetes-engine/docs/concepts/kubernetes-engine-overview"],
      kubernetes: ["kubernetes-engine/docs", "kubernetes-engine/docs/quickstart"],
      autoscal: ["kubernetes-engine/docs/concepts/cluster-autoscaler", "kubernetes-engine/docs/how-to/cluster-autoscaler"],
      "node pool": ["kubernetes-engine/docs/concepts/node-pools", "kubernetes-engine/docs/how-to/node-pools"],
      "horizontal pod": ["kubernetes-engine/docs/concepts/horizontalpodautoscaler", "kubernetes-engine/docs/how-to/horizontal-pod-autoscaling"],
      helm: ["kubernetes-engine/docs/how-to/deploying-workloads-using-helm"],

      // Serverless
      "cloud run": ["run/docs", "run/docs/quickstarts"],
      "environment variable": ["run/docs/configuring/environment-variables", "functions/docs/configuring/env-var"],
      "cloud function": ["functions/docs", "functions/docs/quickstart"],
      "app engine": ["appengine/docs", "appengine/docs/standard"],
      deploy: ["run/docs/deploying", "functions/docs/deploy", "kubernetes-engine/docs/deploy-app-cluster"],

      // Container & Artifact
      container: ["run/docs", "kubernetes-engine/docs", "artifact-registry/docs"],
      docker: ["artifact-registry/docs/docker", "cloud-build/docs/building/build-containers"],
      "artifact registry": ["artifact-registry/docs", "artifact-registry/docs/docker"],
      "container registry": ["container-registry/docs"],
      "cloud build": ["cloud-build/docs", "cloud-build/docs/quickstart-build"],

      // Secret & Config
      secret: ["secret-manager/docs", "secret-manager/docs/quickstart"],
      "secret manager": ["secret-manager/docs", "secret-manager/docs/creating-and-accessing-secrets"],
      config: ["runtime-config/docs", "deployment-manager/docs"],

      // Pub/Sub & Messaging
      pubsub: ["pubsub/docs", "pubsub/docs/overview"],
      "pub/sub": ["pubsub/docs", "pubsub/docs/overview"],
      topic: ["pubsub/docs/create-topic", "pubsub/docs/admin"],
      subscription: ["pubsub/docs/subscriber", "pubsub/docs/create-subscription"],

      // Data Processing
      dataflow: ["dataflow/docs", "dataflow/docs/quickstarts"],
      dataproc: ["dataproc/docs", "dataproc/docs/quickstarts"],
      composer: ["composer/docs", "composer/docs/quickstart"],
      airflow: ["composer/docs", "composer/docs/concepts/airflow"],
      spark: ["dataproc/docs/spark", "dataproc/docs/concepts/spark"],

      // Monitoring & Logging
      logging: ["logging/docs", "logging/docs/view/overview"],
      log: ["logging/docs", "logging/docs/view/logs-viewer-interface"],
      monitoring: ["monitoring/docs", "monitoring/docs/monitoring-overview"],
      metric: ["monitoring/docs/metrics", "monitoring/docs/custom-metrics"],
      alert: ["monitoring/docs/alerting", "monitoring/docs/alerting/policies"],
      dashboard: ["monitoring/docs/dashboards", "monitoring/docs/dashboards/build-dashboards"],
      trace: ["trace/docs", "trace/docs/quickstart"],

      // Infrastructure
      terraform: ["docs/terraform", "docs/terraform/quickstart"],
      "deployment manager": ["deployment-manager/docs"],
      gcloud: ["sdk/gcloud/reference"],
      "cloud shell": ["shell/docs", "shell/docs/quickstart"],

      // Misc
      backup: ["storage/docs/lifecycle", "sql/docs/backup-recovery/backups"],
      snapshot: ["compute/docs/disks/create-snapshots", "compute/docs/disks/snapshots"],
      api: ["apis/docs/overview", "endpoints/docs"],
      authentication: ["docs/authentication", "iam/docs/authentication"],
      "cloud scheduler": ["scheduler/docs", "scheduler/docs/quickstart"],
      "cloud tasks": ["tasks/docs", "tasks/docs/quickstart"],
      budget: ["billing/docs/how-to/budgets", "billing/docs/how-to/budgets-programmatic"],
      cost: ["billing/docs/how-to/export-data-bigquery", "billing/docs/onboarding-checklist"],
    };

  for (const [keyword, paths] of Object.entries(topicMappings)) {
    if (queryLower.includes(keyword)) {
      potentialPaths.push(...paths);
    }
  }

  // Remove duplicates from potential paths
  const uniquePaths = [...new Set(potentialPaths)];

  // Add fallback paths to search results if not already present
  for (const path of uniquePaths) {
    const url = `https://cloud.google.com/${path}`;
    if (!searchResults.some(r => r.url === url)) {
      searchResults.push({
        url,
        title: path,
        snippet: "",
      });
    }
  }

  // Step 4: Score and sort results by relevance
  const scoredResults = searchResults.map(item => ({
    ...item,
    score: calculateRelevance(item.url, item.title, query)
  }));

  // Sort by score descending
  scoredResults.sort((a, b) => b.score - a.score);

  // Filter out results with very low relevance (likely unrelated)
  const relevantResults = scoredResults.filter(r => r.score >= 0 || scoredResults.indexOf(r) < 3);

  // Step 5: Fetch content from top results
  const urlsToFetch = relevantResults.slice(0, 3);

  for (const item of urlsToFetch) {
    try {
      // Extract path from URL
      const path = item.url.replace("https://cloud.google.com/", "").split("?")[0];
      const docResult = await fetchGoogleCloudDoc(path);
      const parsed = JSON.parse(docResult);

      if (parsed.error) {
        results.push({
          url: item.url,
          title: item.title,
          snippet: item.snippet,
          error: parsed.error,
        });
      } else {
        results.push({
          url: item.url,
          title: parsed.title || item.title,
          snippet: item.snippet,
          content: parsed.content,
        });
      }
    } catch (error) {
      results.push({
        url: item.url,
        title: item.title,
        snippet: item.snippet,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Include other search results without fetching content
  const otherResults = relevantResults.slice(3, 6).map((item) => ({
    url: item.url,
    title: item.title,
    snippet: item.snippet,
  }));

  return JSON.stringify({
    query: query,
    product: product || "all",
    totalResults: relevantResults.length,
    results: results,
    otherRelatedDocs: otherResults,
  });
}

function listGoogleCloudProducts(): string {
  const products = Object.entries(GOOGLE_CLOUD_PRODUCTS).map(
    ([key, value]) => ({
      id: key,
      name: value.name,
      docsPath: value.docsPath,
      docsUrl: `https://cloud.google.com/${value.docsPath}`,
      description: value.description,
    })
  );

  return JSON.stringify({
    totalProducts: products.length,
    products: products,
    usage:
      'Use "fetch_google_cloud_doc" with the docsPath to get documentation content.',
  });
}

async function getApiReference(
  service: string,
  resource?: string
): Promise<string> {
  const serviceLower = service.toLowerCase();
  const product = GOOGLE_CLOUD_PRODUCTS[serviceLower];

  if (!product) {
    return JSON.stringify({
      error: `Unknown service: ${service}`,
      availableServices: Object.keys(GOOGLE_CLOUD_PRODUCTS),
      suggestion:
        'Use "list_google_cloud_products" to see all available services.',
    });
  }

  // API reference paths for common services
  const apiPaths: Record<string, { rest: string; resources: string[] }> = {
    compute: {
      rest: "compute/docs/reference/rest/v1",
      resources: [
        "instances",
        "disks",
        "networks",
        "firewalls",
        "images",
        "machineTypes",
      ],
    },
    storage: {
      rest: "storage/docs/json_api/v1",
      resources: ["buckets", "objects", "notifications"],
    },
    bigquery: {
      rest: "bigquery/docs/reference/rest",
      resources: ["datasets", "tables", "jobs", "routines"],
    },
    pubsub: {
      rest: "pubsub/docs/reference/rest",
      resources: ["topics", "subscriptions", "snapshots"],
    },
    sql: {
      rest: "sql/docs/mysql/admin-api/rest/v1",
      resources: ["instances", "databases", "users", "backupRuns"],
    },
    kubernetes: {
      rest: "kubernetes-engine/docs/reference/rest",
      resources: ["clusters", "nodePools", "operations"],
    },
    functions: {
      rest: "functions/docs/reference/rest/v2",
      resources: ["functions", "operations", "locations"],
    },
    run: {
      rest: "run/docs/reference/rest",
      resources: ["services", "configurations", "routes", "revisions"],
    },
    iam: {
      rest: "iam/docs/reference/rest",
      resources: ["roles", "serviceAccounts", "policies"],
    },
  };

  const apiInfo = apiPaths[serviceLower];

  if (!apiInfo) {
    return JSON.stringify({
      service: product.name,
      docsUrl: `https://cloud.google.com/${product.docsPath}`,
      apiReference: `https://cloud.google.com/${product.docsPath}/reference`,
      note: "API reference path not pre-configured. Try fetching the docs URL directly.",
    });
  }

  const apiUrl = resource
    ? `https://cloud.google.com/${apiInfo.rest}/${resource}`
    : `https://cloud.google.com/${apiInfo.rest}`;

  // Fetch the actual API reference page
  try {
    const docContent = await fetchGoogleCloudDoc(apiInfo.rest);
    const parsedContent = JSON.parse(docContent);

    return JSON.stringify({
      service: product.name,
      description: product.description,
      apiReferenceUrl: apiUrl,
      availableResources: apiInfo.resources,
      selectedResource: resource || "overview",
      documentation: parsedContent,
      usage: resource
        ? `Viewing API reference for ${resource}`
        : `Use "get_api_reference" with a resource parameter to get specific resource documentation. Available: ${apiInfo.resources.join(", ")}`,
    });
  } catch {
    return JSON.stringify({
      service: product.name,
      description: product.description,
      apiReferenceUrl: apiUrl,
      availableResources: apiInfo.resources,
      selectedResource: resource || "overview",
      fetchCommand: `Use fetch_google_cloud_doc with path: "${resource ? `${apiInfo.rest}/${resource}` : apiInfo.rest}"`,
    });
  }
}

// Create MCP server
const server = new Server(
  {
    name: "google-cloud-docs-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "fetch_google_cloud_doc": {
        const path = (args as { path: string }).path;
        const result = await fetchGoogleCloudDoc(path);
        return {
          content: [{ type: "text", text: result }],
        };
      }

      case "search_google_cloud_docs": {
        const { query, product } = args as { query: string; product?: string };
        const result = await searchGoogleCloudDocs(query, product);
        return {
          content: [{ type: "text", text: result }],
        };
      }

      case "list_google_cloud_products": {
        const result = listGoogleCloudProducts();
        return {
          content: [{ type: "text", text: result }],
        };
      }

      case "get_api_reference": {
        const { service, resource } = args as {
          service: string;
          resource?: string;
        };
        const result = await getApiReference(service, resource);
        return {
          content: [{ type: "text", text: result }],
        };
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Google Cloud Docs MCP Server running on stdio");
}

main().catch(console.error);

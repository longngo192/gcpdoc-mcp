# Google Cloud Docs MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![MCP SDK](https://img.shields.io/badge/MCP%20SDK-1.0.0-blue)](https://github.com/modelcontextprotocol/sdk)

An MCP (Model Context Protocol) server that provides AI assistants with access to Google Cloud Platform documentation. This enables Claude and other MCP-compatible assistants to search, fetch, and understand GCP documentation in real-time.

## Table of Contents

- [Features](#features)
- [How It Works](#how-it-works)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Available Tools](#available-tools)
- [Supported Topics](#supported-topics)
- [Project Structure](#project-structure)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Free-form Search**: Search GCP documentation with natural language queries
- **Content Extraction**: Extract clean markdown content from documentation pages
- **80+ Topic Mappings**: Pre-configured mappings for common GCP topics
- **Relevance Scoring**: Smart ranking of search results by relevance
- **API Reference**: Access REST API documentation for GCP services
- **20+ GCP Products**: Support for major Google Cloud services

## How It Works

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────────┐
│   Claude    │────▶│  MCP Server     │────▶│  Google Cloud    │
│  (or other  │     │  (this project) │     │  Documentation   │
│  MCP client)│◀────│                 │◀────│  (cloud.google   │
└─────────────┘     └─────────────────┘     │   .com/docs)     │
                                           └──────────────────┘
```

1. **Query Processing**: When Claude receives a GCP-related question, it calls the MCP server tools
2. **Search Strategy**: The server uses a multi-step search approach:
   - Google Search targeting `site:cloud.google.com`
   - Google Cloud's internal search API (fallback)
   - 80+ pre-configured topic mappings (fallback)
3. **Content Extraction**: Uses Cheerio to parse HTML and extract clean markdown
4. **Relevance Scoring**: Results are scored and sorted by query relevance
5. **Response**: Returns structured JSON with documentation content

### Technical Details

- **Protocol**: MCP (Model Context Protocol) over stdio transport
- **Content Parsing**: HTML to Markdown conversion with Cheerio
- **Search**: Combines Google Search scraping with fallback topic mappings
- **Output Format**: Structured JSON with markdown content

## Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Claude Desktop, Claude Code, or other MCP-compatible client

## Installation

### From Source

```bash
# Clone the repository
git clone https://github.com/longngo192/gcpdoc-mcp
cd gcpdoc-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

### Quick Start

```bash
npm install && npm run build
```

## Configuration

### Claude Desktop

Add to your Claude Desktop config file:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "google-cloud-docs": {
      "command": "node",
      "args": [
        "/path/to/google-cloud-docs-mcp/dist/index.js"
      ]
    }
  }
}
```

### Claude Code CLI

```bash
# Add the MCP server
claude mcp add google-cloud-docs -- node /path/to/dist/index.js

# Verify installation
claude mcp list
```

## Usage

Once configured, Claude will automatically use the GCP documentation tools when you ask questions about Google Cloud services.

### Example Queries

```
"How do I set up VPC peering between two GCP projects?"
"What are the steps to enable CMEK encryption for Cloud Storage?"
"How to configure Cloud SQL high availability?"
"Show me GKE autoscaling configuration options"
"How to set environment variables in Cloud Run?"
```

### Direct Tool Usage

If using MCP protocol directly:

```json
// Search documentation
{
  "method": "tools/call",
  "params": {
    "name": "search_google_cloud_docs",
    "arguments": {
      "query": "vpc peering between projects"
    }
  }
}

// Fetch specific documentation
{
  "method": "tools/call",
  "params": {
    "name": "fetch_google_cloud_doc",
    "arguments": {
      "path": "vpc/docs/vpc-peering"
    }
  }
}
```

## Available Tools

### 1. `search_google_cloud_docs`

Search GCP documentation with free-form queries. **Primary tool for GCP questions.**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Natural language search query |
| `product` | string | No | Filter by GCP product (e.g., 'compute', 'storage') |

**Example:**
```json
{
  "query": "how to share encrypted bucket cross account",
  "product": "storage"
}
```

### 2. `fetch_google_cloud_doc`

Fetch content from a specific documentation page.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | Yes | Documentation path after `cloud.google.com/` |

**Example:**
```json
{
  "path": "storage/docs/encryption/customer-managed-keys"
}
```

### 3. `list_google_cloud_products`

List all supported GCP products and their documentation paths.

*No parameters required.*

### 4. `get_api_reference`

Get REST API reference for a GCP service.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `service` | string | Yes | Service name (e.g., 'compute', 'storage') |
| `resource` | string | No | Specific API resource (e.g., 'instances', 'buckets') |

**Example:**
```json
{
  "service": "compute",
  "resource": "instances"
}
```

## Supported Topics

The server includes 80+ topic mappings for accurate search results:

| Category | Topics |
|----------|--------|
| **Storage & Encryption** | encrypt, bucket, cmek, kms, customer managed, object storage |
| **IAM & Security** | iam, role, service account, impersonation, workload identity |
| **Networking** | vpc, peering, shared vpc, firewall, load balancer, dns, nat |
| **Database** | cloud sql, high availability, mysql, postgres, replica, failover |
| **BigQuery** | partition, cluster, materialized view, schedule |
| **GKE** | gke, autoscaling, node pool, horizontal pod autoscaler, helm |
| **Serverless** | cloud run, environment variable, cloud function, deploy |
| **Container** | docker, artifact registry, cloud build |
| **Pub/Sub** | pubsub, topic, subscription |
| **Data Processing** | dataflow, dataproc, composer, airflow, spark |
| **Monitoring** | logging, monitoring, metric, alert, dashboard, trace |
| **Infrastructure** | terraform, deployment manager, gcloud |

## Supported GCP Products

| ID | Name | Description |
|----|------|-------------|
| `compute` | Compute Engine | Virtual machines and infrastructure |
| `storage` | Cloud Storage | Object storage service |
| `bigquery` | BigQuery | Data warehouse and analytics |
| `kubernetes` | GKE | Managed Kubernetes service |
| `functions` | Cloud Functions | Serverless compute platform |
| `run` | Cloud Run | Serverless containers |
| `pubsub` | Pub/Sub | Messaging and event ingestion |
| `sql` | Cloud SQL | Managed relational databases |
| `firestore` | Firestore | NoSQL document database |
| `spanner` | Cloud Spanner | Globally distributed database |
| `ai` | Vertex AI | Machine learning platform |
| `iam` | IAM | Identity and Access Management |
| `vpc` | VPC | Virtual Private Cloud networking |
| `loadbalancing` | Cloud Load Balancing | Global load balancing |
| `logging` | Cloud Logging | Log management and analysis |
| `monitoring` | Cloud Monitoring | Infrastructure monitoring |

## Project Structure

```
google-cloud-docs-mcp/
├── src/
│   └── index.ts          # Main MCP server implementation
├── dist/                  # Compiled JavaScript (generated)
├── package.json          # Project configuration
├── tsconfig.json         # TypeScript configuration
├── .gitignore           # Git ignore rules
├── LICENSE              # MIT License
└── README.md            # This file
```

## Development

### Running in Development Mode

```bash
# With hot reload
npm run dev

# Build and run
npm run build && npm start
```

### Testing the Server

```bash
# Test MCP initialization
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | node dist/index.js

# Test tools/list
echo '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' | node dist/index.js
```

### Building

```bash
npm run build
```

## Contributing

Contributions are welcome! Here's how you can help:

### Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/google-cloud-docs-mcp.git`
3. Create a feature branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Run tests and build: `npm run build`
6. Commit your changes: `git commit -m "Add your feature"`
7. Push to your fork: `git push origin feature/your-feature-name`
8. Open a Pull Request

### Contribution Ideas

- **Add more topic mappings**: Expand the `topicMappings` object in `src/index.ts`
- **Support more GCP products**: Add entries to `GOOGLE_CLOUD_PRODUCTS`
- **Improve content extraction**: Enhance the Cheerio parsing logic
- **Add caching**: Implement response caching to reduce API calls
- **Add tests**: Write unit tests for search and content extraction
- **Documentation**: Improve README or add usage examples

### Code Style

- Use TypeScript
- Follow existing code patterns
- Add comments for complex logic
- Test your changes before submitting

### Reporting Issues

Found a bug or have a suggestion? Please [open an issue](https://github.com/yourusername/google-cloud-docs-mcp/issues) with:

- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Your environment (Node.js version, OS)

## Acknowledgments

- [Model Context Protocol](https://github.com/modelcontextprotocol) - The protocol that enables AI-tool communication
- [Cheerio](https://cheerio.js.org/) - Fast HTML parsing
- [Google Cloud Documentation](https://cloud.google.com/docs) - The source of all documentation

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Made with love for the GCP and AI community**

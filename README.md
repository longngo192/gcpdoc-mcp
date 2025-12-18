# Google Cloud Docs MCP Server

MCP Server để lấy thông tin từ Google Cloud API documentation.

## Cài đặt

```bash
npm install
npm run build
```

## Sử dụng

### Chạy trực tiếp

```bash
npm start
```

### Chạy trong môi trường phát triển

```bash
npm run dev
```

### Thêm vào Claude Code

```bash
# Windows
claude mcp add --transport stdio google-cloud-docs -- cmd /c node "c:\Users\longns\Documents\ggdoc\dist\index.js"

# macOS/Linux
claude mcp add --transport stdio google-cloud-docs -- node /path/to/dist/index.js
```

## Tools có sẵn

### 1. `fetch_google_cloud_doc`

Lấy nội dung từ một trang tài liệu Google Cloud cụ thể.

**Parameters:**
- `path` (required): Đường dẫn tài liệu sau `cloud.google.com/`

**Ví dụ:**
```
path: "compute/docs/instances/create-start-instance"
path: "storage/docs/creating-buckets"
path: "bigquery/docs/quickstarts"
```

### 2. `search_google_cloud_docs`

Tìm kiếm tài liệu Google Cloud theo từ khóa.

**Parameters:**
- `query` (required): Từ khóa tìm kiếm
- `product` (optional): Lọc theo sản phẩm Google Cloud

**Ví dụ:**
```
query: "create vm instance"
query: "cloud storage bucket", product: "storage"
```

### 3. `list_google_cloud_products`

Liệt kê các sản phẩm Google Cloud có sẵn và đường dẫn tài liệu.

### 4. `get_api_reference`

Lấy tài liệu tham chiếu API cho một dịch vụ Google Cloud.

**Parameters:**
- `service` (required): Tên dịch vụ (compute, storage, bigquery, etc.)
- `resource` (optional): Resource cụ thể (instances, buckets, etc.)

**Ví dụ:**
```
service: "compute", resource: "instances"
service: "storage", resource: "buckets"
```

## Các sản phẩm Google Cloud được hỗ trợ

| ID | Tên | Mô tả |
|---|---|---|
| compute | Compute Engine | Virtual machines |
| storage | Cloud Storage | Object storage |
| bigquery | BigQuery | Data warehouse |
| kubernetes | GKE | Managed Kubernetes |
| functions | Cloud Functions | Serverless functions |
| run | Cloud Run | Serverless containers |
| pubsub | Pub/Sub | Messaging service |
| sql | Cloud SQL | Managed databases |
| firestore | Firestore | NoSQL database |
| spanner | Cloud Spanner | Global database |
| ai | Vertex AI | ML platform |
| iam | IAM | Access management |
| vpc | VPC | Networking |
| logging | Cloud Logging | Log management |
| monitoring | Cloud Monitoring | Infrastructure monitoring |

## Cấu trúc project

```
ggdoc/
├── src/
│   └── index.ts        # MCP server implementation
├── dist/               # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

## License

MIT

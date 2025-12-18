# Google Cloud Docs MCP Server - Progress

## Project Overview
MCP Server để lấy thông tin từ Google Cloud API documentation (docs.cloud.google.com)

## Completed Features

### 1. Core Tools (4 tools)
- **fetch_google_cloud_doc**: Fetch và extract content từ một trang tài liệu GCP cụ thể
- **search_google_cloud_docs**: Search tự do với bất kỳ query nào (không giới hạn keyword)
- **list_google_cloud_products**: Liệt kê 20+ sản phẩm GCP
- **get_api_reference**: Lấy API reference cho các service

### 2. Search Functionality (Improved!)
- Hỗ trợ search bất kỳ query tự do (ví dụ: "how to share encrypted bucket cross account")
- Sử dụng Google Search để tìm docs liên quan
- **NEW**: Relevance scoring để sắp xếp kết quả theo độ liên quan
- **NEW**: Kết hợp Google Search results với topic mappings
- Tự động fetch content từ top 3 kết quả tìm kiếm

### 3. Content Extraction
- Extract content dạng markdown sạch từ trang Google Cloud docs
- Loại bỏ navigation, breadcrumbs, scripts, styles
- Hỗ trợ code blocks, tables, lists, headings
- Giới hạn 20,000 ký tự để tránh quá tải

### 4. Topic Mappings (80+ mappings!)
Đã thêm mappings cho các chủ đề phổ biến:
- **Storage & Encryption**: encrypt, bucket, cmek, kms, customer managed, object storage
- **IAM & Security**: iam, role, service account, impersonation, workload identity
- **Networking**: vpc, peering, shared vpc, firewall, load balancer, dns, nat, private access
- **Database (Cloud SQL)**: cloud sql, high availability, ha, mysql, postgres, replica, failover
- **BigQuery**: partition, cluster, materialized view, schedule
- **GKE & Kubernetes**: gke, autoscaling, node pool, horizontal pod autoscaler, helm
- **Serverless**: cloud run, environment variable, cloud function, app engine, deploy
- **Container**: docker, artifact registry, cloud build
- **Pub/Sub & Messaging**: pubsub, topic, subscription
- **Data Processing**: dataflow, dataproc, composer, airflow, spark
- **Monitoring & Logging**: logging, monitoring, metric, alert, dashboard, trace
- **Infrastructure**: terraform, deployment manager, gcloud, cloud shell
- **Misc**: backup, snapshot, budget, cost

## Project Structure
```
c:\Users\longns\Documents\ggdoc\
├── src/
│   └── index.ts          # Main MCP server implementation
├── dist/                  # Compiled JavaScript
├── package.json
├── tsconfig.json
├── README.md
└── PROGRESS.md           # This file
```

## Configuration

### Claude Desktop Config
Đã thêm vào `c:\Users\longns\AppData\Roaming\Claude\claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "google-cloud-docs": {
      "command": "node",
      "args": [
        "c:\\Users\\longns\\Documents\\ggdoc\\dist\\index.js"
      ]
    }
  }
}
```

## Usage Examples

### Search với query tự do
```
search_google_cloud_docs("how to share encrypted bucket cross account")
search_google_cloud_docs("vpc peering between two projects")
search_google_cloud_docs("cloud sql high availability setup")
```

### Fetch specific doc
```
fetch_google_cloud_doc("storage/docs/encryption")
fetch_google_cloud_doc("sql/docs/high-availability")
```

### Get API reference
```
get_api_reference("storage")
get_api_reference("compute", "instances")
```

## Test Results
- ✅ Build TypeScript thành công
- ✅ MCP Protocol initialize hoạt động
- ✅ tools/list trả về 4 tools
- ✅ tools/call hoạt động với tất cả tools
- ✅ Search với query tự do trả về content thực tế
- ✅ Fetch docs trả về markdown format

### 5. Comprehensive Tool Descriptions (NEW!)
Đã thêm instructions chi tiết vào mỗi tool để Claude tự động biết khi nào và cách sử dụng:

- **fetch_google_cloud_doc**:
  - WHEN TO USE: Khi đã biết exact path
  - COMMON PATHS: compute, storage, bigquery, cloud sql, gke, iam, vpc, cloud run
  - TIP: Dùng search_google_cloud_docs nếu không biết exact path

- **search_google_cloud_docs** (PRIMARY TOOL):
  - WHEN TO USE: ALWAYS use cho bất kỳ câu hỏi về GCP
  - TRIGGERS: GCP services, configuration, best practices, troubleshooting
  - EXAMPLE QUERIES: 9 ví dụ queries
  - SUPPORTED TOPICS: 80+ mappings được liệt kê

- **list_google_cloud_products**:
  - WHEN TO USE: User muốn xem available GCP services
  - PRODUCTS INCLUDED: 20+ products

- **get_api_reference**:
  - WHEN TO USE: User cần API endpoints, methods, parameters
  - SUPPORTED SERVICES & RESOURCES: 9 services với resources

## Next Steps (Optional Improvements)
1. Thêm caching để giảm số lần fetch
2. Cải thiện Google Search parsing (Google thường thay đổi HTML structure)
3. Thêm pagination cho search results
4. Hỗ trợ thêm nhiều Google Cloud products

## Dependencies
- @modelcontextprotocol/sdk: ^1.0.0
- cheerio: ^1.0.0
- node-fetch: ^3.3.2
- typescript: ^5.3.0

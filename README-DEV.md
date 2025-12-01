# Development Environment Setup

This project includes a complete development environment that mimics production using Docker Compose with nginx reverse proxy.

## 🚀 Quick Start

```bash
# Start the development stack
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop the stack
docker-compose down
```

## 🌐 Access URLs

- **Frontend**: http://dev.local
- **API**: http://dev.local/api/v2/
- **Direct API**: http://dev.local:4010 (for debugging)

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Browser       │    │   nginx         │    │   Services      │
│   dev.local     │───▶│   Reverse Proxy │───▶│                 │
└─────────────────┘    └─────────────────┘    │  ┌─────────────┐│
                                              │  │ frontend    ││
                                              │  │ (nginx)     ││
                                              │  └─────────────┘│
                                              │  ┌─────────────┐│
                                              │  │ api-server  ││
                                              │  │ (node.js)   ││
                                              │  └─────────────┘│
                                              │  ┌─────────────┐│
                                              │  │ redis       ││
                                              │  └─────────────┘│
                                              └─────────────────┘
```

## 📁 Directory Structure

```
├── nginx/
│   ├── nginx.conf              # Main nginx config
│   ├── conf.d/
│   │   └── dev.local.conf      # Domain-specific config
│   ├── ssl/                    # SSL certificates (future)
│   └── frontend.conf           # Frontend nginx config
├── api-server/
│   ├── server.js               # Express API server
│   ├── package.json            # Node.js dependencies
│   └── Dockerfile              # API container config
├── docker-compose.yml          # Orchestration config
└── js/
    ├── auth.js                 # Authentication service
    └── api.js                  # API service
```

## 🔧 Configuration

### nginx Routing

- `/api/*` → API server (port 4010)
- `/auth/*` → API server (port 4010)  
- `/*` → Frontend (port 80)

### Environment Variables

- `NODE_ENV=development`
- `PORT=4010`
- `JWT_SECRET=your-super-secret-jwt-key-change-in-production`

## 🧪 Testing

### Test API Endpoints

```bash
# Login
curl -X POST http://dev.local/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"administrative@admin.com","password":"Admin@123"}'

# Get users (requires auth token)
curl -X GET http://dev.local/api/v2/users \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get groups
curl -X GET http://dev.local/api/v2/groups \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get roles
curl -X GET http://dev.local/api/v2/roles \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Frontend

Visit http://dev.local in your browser to access the frontend application.

## 🔐 Authentication

**Test Credentials:**
- Email: `administrative@admin.com`
- Password: `Admin@123`

## 🐛 Debugging

### View Container Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api-server
docker-compose logs -f nginx
docker-compose logs -f frontend
```

### Access Container Shell

```bash
# API server
docker-compose exec api-server sh

# nginx
docker-compose exec nginx sh
```

### Check Container Status

```bash
docker-compose ps
```

## 🔄 Development Workflow

1. **Code Changes**: Edit files in your IDE
2. **Auto-reload**: API server uses nodemon for auto-restart
3. **Frontend**: Refresh browser to see changes
4. **API**: Changes are immediately available

## 📝 Notes

- The development environment uses realistic domain names (`dev.local`)
- All services communicate through Docker network
- nginx handles CORS and security headers
- SSL support can be added later for HTTPS
- Redis is available for session storage (future use)

## 🚨 Troubleshooting

### Domain Not Resolving

```bash
# Check hosts file
cat /etc/hosts | grep dev.local

# Should show:
# 127.0.0.1 dev.local www.dev.local
```

### Port Conflicts

```bash
# Check what's using port 80
sudo netstat -tlnp | grep :80

# Stop conflicting services
sudo systemctl stop apache2  # if using Apache
sudo systemctl stop nginx   # if using system nginx
```

### Container Issues

```bash
# Rebuild containers
docker-compose down
docker-compose up --build -d

# Clean up
docker-compose down -v
docker system prune -f
```

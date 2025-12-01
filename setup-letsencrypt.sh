#!/bin/bash

# Let's Encrypt SSL Certificate Setup Script
# This script will obtain a free SSL certificate from Let's Encrypt for dev007.webaimpetus.com

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="dev007.webaimpetus.com"
EMAIL="admin@webaimpetus.com"  # Change this to your email
NGINX_CONF_DIR="./nginx/conf.d"
SSL_DIR="./nginx/ssl"
CERT_DIR="/etc/letsencrypt/live/$DOMAIN"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_error "This script should not be run as root for security reasons."
        print_status "Please run as a regular user with sudo privileges."
        exit 1
    fi
}

# Function to check if domain is accessible
check_domain() {
    print_status "Checking if domain $DOMAIN is accessible..."
    
    if ! ping -c 1 $DOMAIN > /dev/null 2>&1; then
        print_error "Domain $DOMAIN is not accessible."
        print_status "Please ensure:"
        print_status "1. Domain DNS points to this server"
        print_status "2. Port 80 and 443 are open"
        print_status "3. Domain is publicly accessible"
        exit 1
    fi
    
    print_success "Domain $DOMAIN is accessible"
}

# Function to install certbot
install_certbot() {
    print_status "Installing certbot..."
    
    if command -v certbot > /dev/null 2>&1; then
        print_success "Certbot is already installed"
        return
    fi
    
    # Update package list
    sudo apt update
    
    # Install certbot
    sudo apt install -y certbot python3-certbot-nginx
    
    print_success "Certbot installed successfully"
}

# Function to stop nginx temporarily
stop_nginx() {
    print_status "Stopping nginx temporarily for certificate generation..."
    
    if docker-compose ps nginx | grep -q "Up"; then
        docker-compose stop nginx
        print_success "Nginx stopped"
    else
        print_warning "Nginx was not running"
    fi
}

# Function to start nginx temporarily with HTTP only
start_nginx_http_only() {
    print_status "Starting nginx with HTTP only configuration..."
    
    # Create temporary HTTP-only config
    cat > $NGINX_CONF_DIR/temp-http.conf << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    location / {
        return 200 'OK';
        add_header Content-Type text/plain;
    }
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
}
EOF
    
    # Start nginx with HTTP only
    docker-compose up -d nginx
    
    # Wait for nginx to start
    sleep 5
    
    print_success "Nginx started with HTTP only configuration"
}

# Function to obtain SSL certificate
obtain_certificate() {
    print_status "Obtaining SSL certificate for $DOMAIN..."
    
    # Create webroot directory
    sudo mkdir -p /var/www/certbot
    
    # Obtain certificate using webroot method
    sudo certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        --domains $DOMAIN \
        --non-interactive
    
    if [ $? -eq 0 ]; then
        print_success "SSL certificate obtained successfully"
    else
        print_error "Failed to obtain SSL certificate"
        exit 1
    fi
}

# Function to copy certificates to project directory
copy_certificates() {
    print_status "Copying certificates to project directory..."
    
    # Create SSL directory if it doesn't exist
    mkdir -p $SSL_DIR
    
    # Copy certificates
    sudo cp $CERT_DIR/fullchain.pem $SSL_DIR/$DOMAIN.crt
    sudo cp $CERT_DIR/privkey.pem $SSL_DIR/$DOMAIN.key
    
    # Change ownership
    sudo chown $USER:$USER $SSL_DIR/$DOMAIN.crt $SSL_DIR/$DOMAIN.key
    
    print_success "Certificates copied to $SSL_DIR"
}

# Function to update nginx configuration
update_nginx_config() {
    print_status "Updating nginx configuration..."
    
    # Remove temporary HTTP config
    rm -f $NGINX_CONF_DIR/temp-http.conf
    
    # Update main nginx config with Let's Encrypt certificates
    cat > $NGINX_CONF_DIR/$DOMAIN.conf << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;
    
    # SSL Configuration
    ssl_certificate /etc/ssl/certs/$DOMAIN.crt;
    ssl_certificate_key /etc/ssl/private/$DOMAIN.key;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # Proxy to API server
    location / {
        proxy_pass http://api-server:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
}
EOF
    
    print_success "Nginx configuration updated"
}

# Function to setup certificate renewal
setup_renewal() {
    print_status "Setting up automatic certificate renewal..."
    
    # Create renewal script
    sudo tee /etc/cron.d/certbot-renewal > /dev/null << EOF
# Renew Let's Encrypt certificates twice daily
0 12 * * * root certbot renew --quiet --post-hook "docker-compose restart nginx"
0 0 * * * root certbot renew --quiet --post-hook "docker-compose restart nginx"
EOF
    
    # Test renewal
    sudo certbot renew --dry-run
    
    if [ $? -eq 0 ]; then
        print_success "Certificate renewal setup completed"
    else
        print_warning "Certificate renewal test failed, but setup is complete"
    fi
}

# Function to restart services
restart_services() {
    print_status "Restarting services..."
    
    # Restart nginx with new configuration
    docker-compose restart nginx
    
    # Wait for services to start
    sleep 5
    
    print_success "Services restarted"
}

# Function to verify SSL certificate
verify_certificate() {
    print_status "Verifying SSL certificate..."
    
    # Wait a moment for services to start
    sleep 10
    
    # Check if HTTPS is working
    if curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN | grep -q "200\|301\|302"; then
        print_success "SSL certificate is working correctly"
        print_status "You can now access your site at: https://$DOMAIN"
    else
        print_warning "SSL certificate verification failed, but certificate was installed"
        print_status "Please check your domain configuration and try accessing https://$DOMAIN"
    fi
}

# Main execution
main() {
    print_status "Starting Let's Encrypt SSL certificate setup for $DOMAIN"
    print_status "=================================================="
    
    # Check prerequisites
    check_root
    check_domain
    
    # Install certbot
    install_certbot
    
    # Stop nginx
    stop_nginx
    
    # Start nginx with HTTP only
    start_nginx_http_only
    
    # Obtain certificate
    obtain_certificate
    
    # Copy certificates
    copy_certificates
    
    # Update nginx configuration
    update_nginx_config
    
    # Setup renewal
    setup_renewal
    
    # Restart services
    restart_services
    
    # Verify certificate
    verify_certificate
    
    print_success "=================================================="
    print_success "Let's Encrypt SSL certificate setup completed!"
    print_success "Your site is now available at: https://$DOMAIN"
    print_success "Certificate will auto-renew every 12 hours"
    print_status "=================================================="
}

# Run main function
main "$@"




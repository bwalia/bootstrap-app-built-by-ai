#!/bin/bash

# Prerequisites Check Script for Let's Encrypt Setup
# Run this script first to verify your environment is ready

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="dev007.webaimpetus.com"

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

# Function to check if domain resolves
check_dns() {
    print_status "Checking DNS resolution for $DOMAIN..."
    
    if nslookup $DOMAIN > /dev/null 2>&1; then
        IP=$(nslookup $DOMAIN | grep -A1 "Name:" | tail -1 | awk '{print $2}')
        print_success "Domain resolves to: $IP"
        
        # Check if IP is publicly accessible
        if [[ $IP =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            print_success "Domain has valid IP address"
        else
            print_warning "Domain resolution may not be correct"
        fi
    else
        print_error "Domain $DOMAIN does not resolve"
        print_status "Please ensure DNS is properly configured"
        return 1
    fi
}

# Function to check if ports are open
check_ports() {
    print_status "Checking if ports 80 and 443 are accessible..."
    
    # Check port 80
    if timeout 5 bash -c "</dev/tcp/$DOMAIN/80" 2>/dev/null; then
        print_success "Port 80 is accessible"
    else
        print_warning "Port 80 is not accessible"
        print_status "Make sure your firewall allows HTTP traffic"
    fi
    
    # Check port 443
    if timeout 5 bash -c "</dev/tcp/$DOMAIN/443" 2>/dev/null; then
        print_success "Port 443 is accessible"
    else
        print_warning "Port 443 is not accessible"
        print_status "Make sure your firewall allows HTTPS traffic"
    fi
}

# Function to check if domain is publicly accessible
check_public_access() {
    print_status "Checking if domain is publicly accessible..."
    
    # Try to access the domain
    if curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN | grep -q "200\|301\|302\|404"; then
        print_success "Domain is publicly accessible"
    else
        print_warning "Domain may not be publicly accessible"
        print_status "This could be due to:"
        print_status "- Firewall blocking access"
        print_status "- Server not running"
        print_status "- Incorrect DNS configuration"
    fi
}

# Function to check system requirements
check_system() {
    print_status "Checking system requirements..."
    
    # Check if running on supported OS
    if [ -f /etc/debian_version ] || [ -f /etc/ubuntu_version ]; then
        print_success "Running on Debian/Ubuntu (supported)"
    else
        print_warning "Not running on Debian/Ubuntu - certbot installation may differ"
    fi
    
    # Check if docker-compose is available
    if command -v docker-compose > /dev/null 2>&1; then
        print_success "Docker Compose is available"
    else
        print_error "Docker Compose is not available"
        print_status "Please install Docker Compose first"
        return 1
    fi
    
    # Check if nginx container exists
    if docker-compose ps nginx > /dev/null 2>&1; then
        print_success "Nginx container is configured"
    else
        print_error "Nginx container is not configured"
        print_status "Please ensure docker-compose.yml includes nginx service"
        return 1
    fi
}

# Function to check current SSL setup
check_current_ssl() {
    print_status "Checking current SSL setup..."
    
    if [ -f "./nginx/ssl/$DOMAIN.crt" ]; then
        print_warning "SSL certificate already exists for $DOMAIN"
        print_status "Current certificate info:"
        openssl x509 -in "./nginx/ssl/$DOMAIN.crt" -text -noout | grep -E "Subject:|Not Before:|Not After:" || true
    else
        print_success "No existing SSL certificate found"
    fi
}

# Function to provide recommendations
provide_recommendations() {
    print_status "=================================================="
    print_status "RECOMMENDATIONS:"
    print_status "=================================================="
    
    print_status "1. Ensure your domain DNS points to this server's public IP"
    print_status "2. Make sure ports 80 and 443 are open in your firewall"
    print_status "3. Verify the domain is publicly accessible"
    print_status "4. Run the setup script: ./setup-letsencrypt.sh"
    print_status ""
    print_status "If you encounter issues:"
    print_status "- Check firewall settings: sudo ufw status"
    print_status "- Check DNS: nslookup $DOMAIN"
    print_status "- Test connectivity: curl -I http://$DOMAIN"
    print_status "=================================================="
}

# Main execution
main() {
    print_status "Let's Encrypt Prerequisites Check"
    print_status "=================================="
    
    local all_checks_passed=true
    
    # Run all checks
    check_dns || all_checks_passed=false
    check_ports || all_checks_passed=false
    check_public_access || all_checks_passed=false
    check_system || all_checks_passed=false
    check_current_ssl
    
    print_status "=================================="
    
    if [ "$all_checks_passed" = true ]; then
        print_success "All prerequisites checks passed!"
        print_status "You can now run: ./setup-letsencrypt.sh"
    else
        print_warning "Some prerequisites checks failed"
        print_status "Please address the issues above before running the setup script"
    fi
    
    provide_recommendations
}

# Run main function
main "$@"




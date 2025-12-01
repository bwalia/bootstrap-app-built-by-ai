# Let's Encrypt SSL Certificate Setup

This guide will help you set up a free, trusted SSL certificate from Let's Encrypt for your `dev007.webaimpetus.com` domain.

## Prerequisites

Before running the setup script, ensure:

1. **Domain Configuration**: Your domain `dev007.webaimpetus.com` must point to your server's public IP address
2. **Port Access**: Ports 80 (HTTP) and 443 (HTTPS) must be open and accessible
3. **Public Access**: The domain must be publicly accessible from the internet
4. **System Requirements**: Ubuntu/Debian system with Docker Compose

## Quick Start

### Step 1: Check Prerequisites
```bash
./check-prerequisites.sh
```

This script will verify:
- DNS resolution
- Port accessibility
- Public domain access
- System requirements
- Current SSL setup

### Step 2: Run SSL Setup
```bash
./setup-letsencrypt.sh
```

This script will:
- Install certbot
- Obtain SSL certificate from Let's Encrypt
- Configure nginx with the new certificate
- Set up automatic renewal
- Restart services

## What the Scripts Do

### `check-prerequisites.sh`
- Verifies DNS resolution
- Checks port accessibility (80, 443)
- Tests public domain access
- Validates system requirements
- Provides recommendations

### `setup-letsencrypt.sh`
- Installs certbot and dependencies
- Temporarily stops nginx
- Obtains SSL certificate using webroot method
- Copies certificates to project directory
- Updates nginx configuration
- Sets up automatic renewal
- Restarts services
- Verifies SSL certificate

## Configuration

The scripts use these default settings:
- **Domain**: `dev007.webaimpetus.com`
- **Email**: `admin@webaimpetus.com` (change in script if needed)
- **SSL Directory**: `./nginx/ssl/`
- **Nginx Config**: `./nginx/conf.d/`

## Troubleshooting

### Common Issues

1. **Domain not accessible**
   ```bash
   # Check DNS
   nslookup dev007.webaimpetus.com
   
   # Check connectivity
   curl -I http://dev007.webaimpetus.com
   ```

2. **Ports blocked**
   ```bash
   # Check firewall status
   sudo ufw status
   
   # Open ports if needed
   sudo ufw allow 80
   sudo ufw allow 443
   ```

3. **Certificate generation fails**
   - Ensure domain is publicly accessible
   - Check that port 80 is open
   - Verify DNS points to correct server

4. **Nginx won't start**
   ```bash
   # Check nginx configuration
   docker-compose logs nginx
   
   # Test configuration
   docker-compose exec nginx nginx -t
   ```

### Manual Certificate Renewal

If automatic renewal fails:
```bash
# Test renewal
sudo certbot renew --dry-run

# Force renewal
sudo certbot renew --force-renewal

# Restart nginx
docker-compose restart nginx
```

## Security Features

The updated nginx configuration includes:
- **SSL/TLS**: TLSv1.2 and TLSv1.3 only
- **Security Headers**: HSTS, X-Frame-Options, X-Content-Type-Options
- **HTTP to HTTPS Redirect**: Automatic redirect from HTTP to HTTPS
- **Modern Ciphers**: Strong encryption ciphers only

## Certificate Renewal

Certificates automatically renew every 12 hours via cron job:
```bash
# Check renewal status
sudo certbot certificates

# View renewal logs
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

## Files Created/Modified

- `./nginx/ssl/dev007.webaimpetus.com.crt` - SSL certificate
- `./nginx/ssl/dev007.webaimpetus.com.key` - Private key
- `./nginx/conf.d/dev007.webaimpetus.com.conf` - Nginx configuration
- `/etc/cron.d/certbot-renewal` - Renewal cron job

## Verification

After setup, verify SSL certificate:
```bash
# Check certificate details
openssl s_client -connect dev007.webaimpetus.com:443 -servername dev007.webaimpetus.com

# Test HTTPS access
curl -I https://dev007.webaimpetus.com
```

## Support

If you encounter issues:
1. Run the prerequisites check first
2. Check the troubleshooting section
3. Review nginx logs: `docker-compose logs nginx`
4. Check certbot logs: `sudo tail -f /var/log/letsencrypt/letsencrypt.log`

## Notes

- Let's Encrypt certificates are valid for 90 days
- Automatic renewal happens twice daily
- Certificates are stored in `/etc/letsencrypt/live/`
- Project copies are in `./nginx/ssl/`
- The setup is production-ready and secure




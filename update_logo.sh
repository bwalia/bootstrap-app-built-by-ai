#!/bin/bash

# Update logo in all HTML files
for file in *.html; do
    if [ -f "$file" ]; then
        echo "Updating logo in $file..."
        
        # Replace navbar-brand with logo
        sed -i 's|<i class="fas fa-building"></i> Bootstrap App|<img src="assets/logo-icon.svg" alt="Bootstrap App" height="32" class="me-2">\n                Bootstrap App Suite|g' "$file"
        
        # Replace other common navbar-brand patterns
        sed -i 's|<i class="fas fa-tachometer-alt"></i> <span data-i18n="nav.dashboard">Dashboard</span>|<img src="assets/logo-icon.svg" alt="Bootstrap App" height="32" class="me-2">\n                Bootstrap App Suite|g' "$file"
        
        echo "Updated $file"
    fi
done

echo "Logo update complete!"

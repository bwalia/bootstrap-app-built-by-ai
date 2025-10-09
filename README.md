# Bootstrap Dashboard with DataTables

A simple, responsive dashboard application built with Bootstrap 5 and DataTables that displays user data from the OpsAPI.

## Features

- 🔐 Secure authentication with JWT tokens
- 📊 Interactive DataTables with search, sort, and pagination
- 📱 Responsive Bootstrap 5 design
- 🎨 Modern UI with Font Awesome icons
- 🔄 Real-time data refresh
- 💾 Token persistence with localStorage

## Technologies Used

- Bootstrap 5.3.0
- jQuery 3.7.0
- DataTables 1.13.6
- Font Awesome 6.4.0

## Project Structure

```
bootstrap-app-built-by-ai/
├── index.html          # Main dashboard page
├── css/
│   └── style.css      # Custom styles
├── js/
│   ├── auth.js        # Authentication service
│   ├── api.js         # API service
│   └── app.js         # Main application logic
└── README.md
```

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- Internet connection (for CDN resources)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd bootstrap-app-built-by-ai
```

2. Open `index.html` in your web browser:
```bash
# Using Python's built-in server
python3 -m http.server 8000

# Or using PHP
php -S localhost:8000

# Or using Node.js http-server
npx http-server
```

3. Navigate to `http://localhost:8000` in your browser

### Usage

1. **Login**: The application will automatically show a login modal on first visit
   - Default credentials are pre-filled:
     - Email: `administrative@admin.com`
     - Password: `Admin@123`

2. **View Users**: After successful login, the dashboard will display a table of users from the API

3. **Interact with the Table**:
   - Search for users using the search box
   - Sort columns by clicking on headers
   - Change the number of entries displayed
   - Navigate through pages

4. **Refresh Data**: Click the "Refresh" button to reload user data from the API

5. **Logout**: Click the "Logout" link in the navigation bar to clear your session

## API Configuration

The application connects to: `https://opsapi.workstation.co.uk/`

### API Endpoints Used:
- `POST /auth/login` - Authentication
- `GET /users` - Fetch users data (or `/api/users`, `/user`, `/api/user`)

### Authentication Flow:
1. User submits credentials via login form
2. Application sends POST request to `/auth/login`
3. Receives JWT token in response
4. Token is stored in localStorage
5. Token is sent with all subsequent API requests in the Authorization header

## Customization

### Changing API URL
Edit the `API_URL` constant in both [js/auth.js](js/auth.js) and [js/api.js](js/api.js):

```javascript
API_URL: 'https://your-api-url.com'
```

### Modifying Table Columns
Update the table structure in [js/app.js](js/app.js) in the `formatUsersData()` and `initializeDataTable()` functions.

### Styling
Customize the appearance by editing [css/style.css](css/style.css).

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Security Notes

- Tokens are stored in localStorage (consider using httpOnly cookies for production)
- HTTPS should be used in production
- Never commit sensitive credentials to version control
- Consider implementing token refresh mechanisms
- Add CORS configuration on the API server if needed

## Troubleshooting

### Login Issues
- Check browser console for error messages
- Verify API credentials are correct
- Ensure API server is accessible

### DataTable Not Loading
- Check if the API response format matches expected structure
- Verify token is valid and not expired
- Check browser console for errors

### CORS Errors
- Ensure the API server has proper CORS headers configured
- Contact API administrator if needed

## License

MIT License

## Support

For issues and questions, please open an issue in the repository.

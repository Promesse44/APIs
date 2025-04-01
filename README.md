# Hotel Search & Booking Application

## Project Overview
This application provides a user-friendly interface to search for hotels worldwide, view detailed information about specific hotels, and explore available room options. It leverages the Booking.com API through RapidAPI to deliver real, up-to-date information about hotel availability, pricing, and features.


## Demo Video
[Watch the demo video here](https://drive.google.com/file/d/1_Cqe3k6oWq-z2ksYmVkpCYEg_p5_rRZW/view?usp=sharing)

## Features
- **Hotel Search**: Search hotels by city name or destination code
- **Geolocation**: Find hotels near your current location
- **Advanced Filtering**: Sort hotels by price, rating, and distance
- **Price Range Filter**: Set maximum price filter to see hotels within your budget
- **Detailed Hotel View**: View comprehensive information about each hotel
- **Room Comparison**: Browse different room types with detailed information
- **Booking Options**: See cancellation policies, meal plans, and pricing for each room
- **Responsive Design**: Works on both desktop and mobile devices

## Technologies Used
- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **APIs**: Booking.com API via RapidAPI
- **Deployment**: Nginx, PM2, Load Balancer

## API Information
This application uses the Booking.com API available through RapidAPI. The API provides comprehensive hotel data, including:
- Hotel searches by location
- Detailed hotel information
- Room availability and pricing
- Photos and amenities

**API Credit**: [Booking.com API on RapidAPI](https://rapidapi.com/booking.com/api/booking-com)

## Local Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)
- RapidAPI key for Booking.com API

### Installation Steps
1. Clone the repository
   ```
   git clone https://github.com/yourusername/hotel-search-app.git
   cd hotel-search-app
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create a `.env` file in the project root and add your RapidAPI key
   ```
   RAPIDAPI_KEY=your_rapidapi_key_here
   PORT=4000
   ```

4. Start the application
   ```
   npm start
   ```

5. Open your browser and navigate to `http://localhost:4000`

## Deployment Instructions

### Server Configuration
This application has been deployed on two web servers (Web01 and Web02) with a load balancer (Lb01) distributing traffic between them.

### Web Server Setup (Web01 and Web02)

1. Connect to each server via SSH
   ```
   ssh username@web01_ip
   ssh username@web02_ip
   ```

2. Install required software
   ```
   sudo apt update
   sudo apt install nodejs npm nginx
   ```

3. Install PM2 globally for process management
   ```
   sudo npm install -g pm2
   ```

4. Clone the repository
   ```
   git clone https://github.com/yourusername/hotel-search-app.git
   cd hotel-search-app
   ```

5. Install dependencies and create environment file
   ```
   npm install
   echo "RAPIDAPI_KEY=your_rapidapi_key_here" > .env
   echo "PORT=4000" >> .env
   ```

6. Start the application with PM2
   ```
   pm2 start backend/server.js
   pm2 save
   pm2 startup
   ```

7. Configure Nginx as a reverse proxy
   ```
   sudo nano /etc/nginx/sites-available/hotel-app
   ```

8. Add the following configuration
   ```nginx
   server {
       listen 80;
       server_name your_server_domain_or_ip;

       location / {
           proxy_pass http://localhost:4000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

9. Enable the site and restart Nginx
   ```
   sudo ln -s /etc/nginx/sites-available/hotel-app /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### Load Balancer Configuration (Lb01)

1. Connect to the load balancer server
   ```
   ssh username@lb01_ip
   ```

2. Install Nginx
   ```
   sudo apt update
   sudo apt install nginx
   ```

3. Configure Nginx as a load balancer
   ```
   sudo nano /etc/nginx/sites-available/load-balancer
   ```

4. Add the following configuration
   ```nginx
   upstream hotel_backend {
       server web01_ip:80;
       server web02_ip:80;
   }

   server {
       listen 80;
       server_name your_load_balancer_domain_or_ip;

       location / {
           proxy_pass http://hotel_backend;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

5. Enable the site and restart Nginx
   ```
   sudo ln -s /etc/nginx/sites-available/load-balancer /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

6. Verify the load balancer is working by visiting `http://your_load_balancer_domain_or_ip` in your browser

### Testing the Deployment
After setting up both web servers and the load balancer, you can test the deployment by:

1. Accessing the application through the load balancer URL
2. Checking if your searches and hotel details load correctly
3. Verifying that traffic is being distributed between Web01 and Web02 by checking the logs on both servers
   ```
   sudo tail -f /var/log/nginx/access.log
   ```

## Development Challenges and Solutions

### Challenge 1: API Rate Limiting
**Issue**: The Booking.com API has strict rate limiting that restricted our development testing.
**Solution**: Implemented caching for API responses to reduce the number of calls and added retry logic with exponential backoff.

### Challenge 2: Complex Data Structure
**Issue**: The API returns deeply nested JSON structures that were difficult to parse efficiently.
**Solution**: Created helper functions to normalize the data and extract only the necessary information for display.

### Challenge 3: Cross-Origin Resource Sharing (CORS)
**Issue**: Encountered CORS errors when making direct API calls from the frontend.
**Solution**: Implemented a proxy server in our backend to make API requests on behalf of the frontend.

### Challenge 4: Load Balancer Session Persistence
**Issue**: User sessions were being disrupted when requests switched between servers.
**Solution**: Configured the load balancer to use IP-based session persistence and implemented client-side storage for user preferences.

## Future Enhancements
- User authentication and profile management
- Booking history and favorite hotels
- Advanced filtering options (amenities, review scores, etc.)
- Hotel reviews and ratings
- Mobile application version
- Payment integration for direct booking

## Contributors
- [Promesse Irakoze](https://github.com/Promesse44)

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements
- [Booking.com API](https://rapidapi.com/booking.com/api/booking-com) for providing hotel data
- [Express.js](https://expressjs.com/) for the backend framework
- All open-source libraries and tools used in this project
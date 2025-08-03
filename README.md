# Shipment Tracker Backend

A robust Backend API for the Cargo Shipment Tracker application built with Node.js, Express, and MongoDB. This RESTful API provides comprehensive shipment management, real-time location tracking, and ETA calculations for cargo logistics operations.

## 🌐 Live Demo & Repositories

- 🚀 **Deployed App**: [https://shipment-tracker-1b7s.onrender.com/](https://shipment-tracker-1b7s.onrender.com/)  
- 🚀 **Deployed Backend**: [https://shipment-tracker-backend-c76e.onrender.com/api](https://shipment-tracker-backend-c76e.onrender.com/api)  
- 🧠 **Frontend Repository**: [https://github.com/amitmore-007/Shipment-Tracker](https://github.com/amitmore-007/Shipment-Tracker)

## 🚀 Features

- **RESTful API Architecture**: Clean, scalable API design following REST principles
- **Real-time Location Tracking**: Live updates of shipment locations with timestamp tracking
- **Intelligent ETA Calculations**: Dynamic estimated arrival time based on current location and route
- **MongoDB Data Persistence**: Robust data storage with efficient querying
- **CORS Enabled**: Cross-origin resource sharing for seamless frontend integration
- **Input Validation**: Comprehensive request validation and sanitization
- **Error Handling**: Structured error responses with appropriate HTTP status codes
- **Status Management**: Automated status updates based on location and timeline

## 📊 Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │────│   Backend API   │────│   MongoDB       │
│   (React)       │    │   (Express.js)  │    │   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠 API Endpoints

### Shipments Management
- `GET /api/shipments` - Get all shipments with filtering and sorting
  - Query parameters: `status`, `sortBy`, `order`
- `GET /api/shipments/:id` - Get specific shipment details
- `POST /api/shipments` - Create new shipment
- `PUT /api/shipments/:id` - Update shipment details
- `PUT /api/shipments/:id/location` - Update shipment location
- `PUT /api/shipments/:id/status` - Update shipment status
- `GET /api/shipments/:id/eta` - Get ETA information
- `DELETE /api/shipments/:id` - Delete shipment

### Health Check
- `GET /health` - Server health status

## 🔧 Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

### Local Development Setup

1. **Clone the repository**:
```bash
git clone <backend-repository-url>
cd shipment-tracker-backend
```

2. **Install dependencies**:
```bash
npm install
```

3. **Environment Configuration**:
Create a `.env` file in the root directory:
```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/shipment-tracker

# Server Configuration
PORT=5000
NODE_ENV=development
```

4. **Database Setup**:
```bash
# Start MongoDB service (if running locally)
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI with your Atlas connection string
```

5. **Run the application**:
```bash
# Development mode with auto-reload
node server.js
# or with nodemon
nodemon server.js

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## 📋 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `MONGODB_URI` | MongoDB connection string | Yes | `mongodb://localhost:27017/shipment-tracker` |
| `PORT` | Server port | No | `5000` |
| `NODE_ENV` | Environment mode | No | `development` |

## 📊 Data Models

### Shipment Model
```javascript
{
  _id: ObjectId,
  shipmentId: String (auto-generated, unique),
  containerId: String (required),
  currentLocation: {
    name: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    timestamp: Date
  },
  destination: {
    name: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  status: String (pending, in-transit, delivered, delayed),
  estimatedArrival: Date,
  cargo: {
    description: String,
    weight: Number,
    value: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

## 🔍 API Usage Examples

### Create a new shipment
```bash
curl -X POST http://localhost:5000/api/shipments \
  -H "Content-Type: application/json" \
  -d '{
    "containerId": "CONT123456789",
    "currentLocation": {
      "name": "Port of Mumbai",
      "coordinates": {"latitude": 19.0760, "longitude": 72.8777}
    },
    "destination": {
      "name": "Port of New York",
      "coordinates": {"latitude": 40.7128, "longitude": -74.0060}
    },
    "cargo": {
      "description": "Electronics Equipment",
      "weight": 15000,
      "value": 50000
    }
  }'
```

### Update shipment location
```bash
curl -X PUT http://localhost:5000/api/shipments/SHIP123/location \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Suez Canal",
    "coordinates": {"latitude": 30.0444, "longitude": 31.2357}
  }'
```

### Get shipments with filtering
```bash
# Get all in-transit shipments
curl "http://localhost:5000/api/shipments?status=in-transit"

# Get shipments sorted by creation date
curl "http://localhost:5000/api/shipments?sortBy=createdAt&order=desc"
```

### Update shipment status
```bash
curl -X PUT http://localhost:5000/api/shipments/SHIP123/status \
  -H "Content-Type: application/json" \
  -d '{"status": "delivered"}'
```

## 🚨 Error Handling

The API returns standardized error responses:

```json
{
  "success": false,
  "message": "Shipment not found",
  "error": "Shipment with ID SHIP123 does not exist"
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error

## 🌐 Production Deployment

### Render Deployment

This application is deployed on Render. The backend requires:
- Node.js environment
- MongoDB Atlas connection
- Environment variables configuration

## 📁 Project Structure

```
backend/
├── models/              # MongoDB models
│   └── Shipment.js     # Shipment data model
├── routes/              # API routes
│   └── shipments.js    # Shipment endpoints
├── middleware/          # Express middleware
├── utils/              # Utility functions
├── config/             # Configuration files
├── app.js              # Express app setup
├── server.js           # Server entry point
└── package.json        # Dependencies and scripts
```

## 🔮 Future Enhancements

### Planned Features
- **Real-time WebSocket Updates**: Live location streaming
- **Advanced Analytics**: Shipment performance metrics
- **Authentication System**: JWT-based user management
- **External API Integration**: Weather and traffic data
- **Automated Notifications**: Email/SMS alerts for status changes

### Database Enhancements
- **Indexing**: Optimize query performance
- **Data Validation**: Enhanced schema validation
- **Backup Strategy**: Automated database backups

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Check code quality
npm run lint
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a Pull Request

## 📞 Support

For issues and questions:
- Create an issue in the GitHub repository
- Check existing documentation
- Review API examples

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built for efficient cargo tracking and logistics management**

*Simple, reliable shipment tracking API with real-time capabilities.*

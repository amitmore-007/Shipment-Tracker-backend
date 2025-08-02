const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://shipment-tracker-1b7s.onrender.com/', // Your frontend URL
    'https://shipment-tracker-frontend.onrender.com', // Alternative frontend URL
    'https://shipment-tracker-backend-c76e.onrender.com', // Add your new backend URL
    // Add any other domains you might use
  ],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shipment-tracker', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Import routes
const shipmentRoutes = require('./routes/shipments');

// Routes
app.use('/api', shipmentRoutes);

// Root route - Add this new route
app.get('/', (req, res) => {
  res.json({
    message: 'Shipment Tracker API',
    version: '1.0.0',
    status: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    availableEndpoints: {
      health: 'GET /health',
      shipments: 'GET /api/shipments',
      shipmentDetails: 'GET /api/shipment/:id',
      createShipment: 'POST /api/shipment',
      updateLocation: 'POST /api/shipment/:id/update-location',
      getETA: 'GET /api/shipment/:id/eta',
      updateStatus: 'PUT /api/shipment/:id/status',
      updateShipment: 'PUT /api/shipment/:id',
      deleteShipment: 'DELETE /api/shipment/:id'
    },
    documentation: 'Visit the frontend application for the full interface'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'Server is running', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  if (!req.originalUrl.includes('/favicon.ico')) {
    console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  }
  
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    url: req.originalUrl,
    availableRoutes: [
      'GET /',
      'GET /health',
      'GET /api/shipments',
      'GET /api/shipment/:id',
      'POST /api/shipment',
      'POST /api/shipment/:id/update-location',
      'GET /api/shipment/:id/eta',
      'PUT /api/shipment/:id/status',
      'PUT /api/shipment/:id',
      'DELETE /api/shipment/:id'
    ]
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
console.log(`Server is running on port ${PORT}`);
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  coordinates: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    }
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  distanceCovered: {
    type: Number,
    default: 0
  }
});

const shipmentSchema = new mongoose.Schema({
  shipmentId: {
    type: String,
    unique: true
  },
  containerId: {
    type: String,
    required: true
  },
  route: [locationSchema],
  currentLocation: {
    type: locationSchema,
    required: true
  },
  destination: {
    type: locationSchema,
    required: true
  },
  estimatedArrival: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-transit', 'delivered', 'delayed'],
    default: 'pending'
  },
  cargo: {
    type: String,
    required: true
  },
  weight: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate shipment ID before saving
shipmentSchema.pre('save', function(next) {
  if (!this.shipmentId) {
    this.shipmentId = 'SH' + Date.now() + Math.floor(Math.random() * 1000);
  }
  next();
});

module.exports = mongoose.model('Shipment', shipmentSchema);

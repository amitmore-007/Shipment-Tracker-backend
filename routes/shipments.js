const express = require('express');
const router = express.Router();
const Shipment = require('../models/Shipment');

// GET /shipments - Retrieve all shipments
router.get('/shipments', async (req, res) => {
  try {
    const { status, sortBy = 'createdAt', order = 'desc' } = req.query;
    let query = {};
    
    if (status) {
      query.status = status;
    }

    const shipments = await Shipment.find(query)
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 });
    
    res.json(shipments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /shipment/:id - Retrieve details of a specific shipment
router.get('/shipment/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Fetching shipment with ID:', id);
    
    let shipment;
    
    // First try to find by shipmentId (string)
    shipment = await Shipment.findOne({ shipmentId: id });
    
    // If not found and the id looks like a MongoDB ObjectId, try finding by _id
    if (!shipment && id.match(/^[0-9a-fA-F]{24}$/)) {
      shipment = await Shipment.findById(id);
    }
    
    if (!shipment) {
      console.log('Shipment not found for ID:', id);
      return res.status(404).json({ error: 'Shipment not found' });
    }
    
    console.log('Shipment found:', shipment.shipmentId);
    res.json(shipment);
  } catch (error) {
    console.error('Error fetching shipment:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /shipment/:id/update-location - Update current location
router.post('/shipment/:id/update-location', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, coordinates } = req.body;
    
    if (!name || !coordinates || !coordinates.latitude || !coordinates.longitude) {
      return res.status(400).json({ error: 'Location name and coordinates are required' });
    }

    let shipment;
    
    // First try to find by shipmentId (string)
    shipment = await Shipment.findOne({ shipmentId: id });
    
    // If not found and the id looks like a MongoDB ObjectId, try finding by _id
    if (!shipment && id.match(/^[0-9a-fA-F]{24}$/)) {
      shipment = await Shipment.findById(id);
    }
    
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    // Don't allow updates if already delivered
    if (shipment.status === 'delivered') {
      return res.status(400).json({ error: 'Cannot update location for delivered shipment' });
    }

    // Calculate distance to destination
    const distanceToDestination = calculateDistance(
      coordinates.latitude,
      coordinates.longitude,
      shipment.destination.coordinates.latitude,
      shipment.destination.coordinates.longitude
    );

    // Check if the shipment has reached destination (within 5km radius)
    const isAtDestination = distanceToDestination <= 5;

    // Calculate total distance covered
    let totalDistanceCovered = 0;
    if (shipment.route.length > 0) {
      // Calculate distance from last known position to new position
      const lastPosition = shipment.route[shipment.route.length - 1];
      totalDistanceCovered = calculateDistance(
        lastPosition.coordinates.latitude,
        lastPosition.coordinates.longitude,
        coordinates.latitude,
        coordinates.longitude
      );
    }

    // Add to route history first
    shipment.route.push({
      name,
      coordinates,
      timestamp: new Date(),
      distanceCovered: totalDistanceCovered
    });

    // Update current location
    shipment.currentLocation = {
      name,
      coordinates,
      timestamp: new Date()
    };

    // Update status based on location and previous status
    if (isAtDestination) {
      shipment.status = 'delivered';
      shipment.estimatedArrival = new Date(); // Set actual arrival time
    } else {
      // If not delivered and not already in transit, set to in-transit
      if (shipment.status === 'pending') {
        shipment.status = 'in-transit';
      }
      
      // Calculate new ETA if not at destination
      const averageSpeed = 50; // km/h
      const hoursToDestination = distanceToDestination / averageSpeed;
      shipment.estimatedArrival = new Date(Date.now() + hoursToDestination * 60 * 60 * 1000);
      
      // Check if shipment is delayed (if current time is past original ETA and not delivered)
      const originalETA = new Date(shipment.estimatedArrival);
      const now = new Date();
      if (now > originalETA && shipment.status === 'in-transit') {
        shipment.status = 'delayed';
      }
    }

    await shipment.save();
    
    // Return updated shipment with additional info
    const response = {
      ...shipment.toObject(),
      distanceToDestination,
      totalDistanceCovered: shipment.route.reduce((total, point) => total + (point.distanceCovered || 0), 0),
      isAtDestination
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error updating shipment location:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /shipment/:id/eta - Get estimated time of arrival with detailed journey info
router.get('/shipment/:id/eta', async (req, res) => {
  try {
    const { id } = req.params;
    
    let shipment;
    
    // First try to find by shipmentId (string)
    shipment = await Shipment.findOne({ shipmentId: id });
    
    // If not found and the id looks like a MongoDB ObjectId, try finding by _id
    if (!shipment && id.match(/^[0-9a-fA-F]{24}$/)) {
      shipment = await Shipment.findById(id);
    }
    
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    const distanceToDestination = calculateDistance(
      shipment.currentLocation.coordinates.latitude,
      shipment.currentLocation.coordinates.longitude,
      shipment.destination.coordinates.latitude,
      shipment.destination.coordinates.longitude
    );

    // Calculate total journey distance (from origin to destination)
    const totalJourneyDistance = shipment.route.length > 0 ? 
      calculateDistance(
        shipment.route[0].coordinates.latitude,
        shipment.route[0].coordinates.longitude,
        shipment.destination.coordinates.latitude,
        shipment.destination.coordinates.longitude
      ) : distanceToDestination;

    // Calculate total distance covered
    const totalDistanceCovered = shipment.route.reduce((total, point) => total + (point.distanceCovered || 0), 0);

    // Calculate progress percentage
    const progressPercentage = totalJourneyDistance > 0 ? 
      Math.min(((totalJourneyDistance - distanceToDestination) / totalJourneyDistance) * 100, 100) : 0;

    // Calculate average speed based on journey so far
    const journeyStartTime = shipment.route.length > 0 ? new Date(shipment.route[0].timestamp) : new Date(shipment.createdAt);
    const journeyTimeHours = (new Date() - journeyStartTime) / (1000 * 60 * 60);
    const averageSpeed = journeyTimeHours > 0 ? totalDistanceCovered / journeyTimeHours : 50;

    // Estimate remaining time
    const estimatedRemainingHours = averageSpeed > 0 ? distanceToDestination / Math.max(averageSpeed, 20) : distanceToDestination / 50;

    res.json({
      estimatedArrival: shipment.estimatedArrival,
      distanceRemaining: distanceToDestination,
      totalJourneyDistance,
      totalDistanceCovered,
      progressPercentage: Math.round(progressPercentage),
      averageSpeed: Math.round(averageSpeed * 10) / 10,
      estimatedRemainingTime: Math.round(estimatedRemainingHours * 10) / 10,
      currentLocation: shipment.currentLocation,
      destination: shipment.destination,
      status: shipment.status,
      isAtDestination: distanceToDestination <= 5
    });
  } catch (error) {
    console.error('Error fetching shipment ETA:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /shipment/:id/status - Manually update shipment status
router.put('/shipment/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'in-transit', 'delivered', 'delayed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') });
    }

    let shipment;
    
    shipment = await Shipment.findOne({ shipmentId: id });
    if (!shipment && id.match(/^[0-9a-fA-F]{24}$/)) {
      shipment = await Shipment.findById(id);
    }
    
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    shipment.status = status;
    
    // If marking as delivered, set arrival time to now
    if (status === 'delivered') {
      shipment.estimatedArrival = new Date();
    }
    
    await shipment.save();
    res.json(shipment);
  } catch (error) {
    console.error('Error updating shipment status:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /shipment - Create a new shipment
router.post('/shipment', async (req, res) => {
  try {
    const {
      containerId,
      currentLocation,
      destination,
      cargo,
      weight
    } = req.body;

    if (!containerId || !currentLocation || !destination || !cargo || !weight) {
      return res.status(400).json({ 
        error: 'Container ID, current location, destination, cargo, and weight are required' 
      });
    }

    // Validate coordinates
    if (!currentLocation.coordinates || !destination.coordinates) {
      return res.status(400).json({ 
        error: 'Location coordinates are required' 
      });
    }

    // Calculate initial ETA
    const distance = calculateDistance(
      currentLocation.coordinates.latitude,
      currentLocation.coordinates.longitude,
      destination.coordinates.latitude,
      destination.coordinates.longitude
    );

    const hoursToDestination = distance / 50; // Assume 50 km/h average speed
    const estimatedArrival = new Date(Date.now() + hoursToDestination * 60 * 60 * 1000);

    // Generate unique shipment ID
    const shipmentId = 'SH' + Date.now() + Math.floor(Math.random() * 1000);

    const shipment = new Shipment({
      shipmentId,
      containerId,
      currentLocation: {
        ...currentLocation,
        timestamp: new Date()
      },
      destination,
      estimatedArrival,
      cargo,
      weight,
      route: [{
        ...currentLocation,
        timestamp: new Date()
      }],
      status: 'pending'
    });

    await shipment.save();
    res.status(201).json(shipment);
  } catch (error) {
    console.error('Error creating shipment:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /shipment/:id - Update shipment details
router.put('/shipment/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    let shipment = await Shipment.findById(id);
    if (!shipment && id.match(/^[0-9a-fA-F]{24}$/)) {
      shipment = await Shipment.findById(id);
    }
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    // Only allow updating certain fields
    if (updateData.containerId !== undefined) shipment.containerId = updateData.containerId;
    if (updateData.cargo !== undefined) shipment.cargo = updateData.cargo;
    if (updateData.weight !== undefined) shipment.weight = updateData.weight;
    if (updateData.destination !== undefined) shipment.destination = updateData.destination;
    // Optionally allow updating estimatedArrival, etc.

    await shipment.save();
    res.json(shipment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /shipment/:id - Delete a shipment
router.delete('/shipment/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let shipment = await Shipment.findById(id);
    if (!shipment && id.match(/^[0-9a-fA-F]{24}$/)) {
      shipment = await Shipment.findById(id);
    }
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    await shipment.deleteOne();
    res.json({ _id: id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
}

module.exports = router;

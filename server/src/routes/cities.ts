import express, { Request, Response } from 'express';
import City from '../models/City';
import Post from '../models/Post';
import User from '../models/User';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import axios from 'axios';

const router = express.Router();

// Helper: Calculate distance between two coordinates (Haversine formula)
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

// Get city info from coordinates (does NOT save to DB - only for viewing)
// Cities are only saved when a post is created for them
router.post('/from-coordinates', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      res.status(400).json({ error: 'Latitude and longitude are required' });
      return;
    }

    const PROXIMITY_THRESHOLD_KM = 20; // Cities within 20km are considered the same

    // Check if a city already exists nearby in the database
    const allCities = await City.find({});
    const nearbyCity = allCities.find(city => {
      const distance = getDistance(
        lat,
        lng,
        city.coordinates.coordinates[1],
        city.coordinates.coordinates[0]
      );
      return distance < PROXIMITY_THRESHOLD_KM;
    });

    if (nearbyCity) {
      res.json(nearbyCity);
      return;
    }

    // No nearby city in DB, use reverse geocoding to get city info
    // This city data is returned but NOT saved to DB
    // It will only be saved when a user creates a post for it
    const nominatimResponse = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`,
      {
        headers: {
          'User-Agent': 'CulturalX-App/1.0'
        }
      }
    );

    const data = nominatimResponse.data;
    const address = data.address;

    // Extract city name with priority order
    let cityName = address.city || address.town || address.village || address.municipality || address.suburb;

    if (!cityName || cityName === 'Unknown') {
      cityName = address.state || address.region || address.county;
      if (cityName) {
        cityName = `${cityName} Region`;
      } else {
        cityName = 'Unknown Location';
      }
    }

    const country = address.country || 'Unknown';

    // Return city data WITHOUT saving to database
    // Frontend can view Wikipedia/YouTube/News for this city
    // City will only be added to DB when someone creates a post for it
    const tempCityData = {
      name: cityName,
      country: country,
      coordinates: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      isSeed: false,
      contentCount: 0,
      hasContent: false,
      _isTemporary: true // Flag to indicate this is not in DB yet
    };

    res.json(tempCityData);
  } catch (error) {
    console.error('Get city from coordinates error:', error);
    res.status(500).json({ error: 'Failed to get city information' });
  }
});

// Get all cities (seed cities + cities with content only)
router.get('/', async (req, res: Response) => {
  try {
    const { search, limit = 1000 } = req.query;
    const query: any = {
      $or: [
        { isSeed: true },         // Show all seed cities
        { hasContent: true }      // Show cities with posts
      ]
    };

    if (search) {
      query.$and = [
        { $or: query.$or },
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { country: { $regex: search, $options: 'i' } }
          ]
        }
      ];
      delete query.$or;
    }

    const cities = await City.find(query).limit(Number(limit));
    res.json(cities);
  } catch (error) {
    console.error('Get cities error:', error);
    res.status(500).json({ error: 'Failed to get cities' });
  }
});

// Get single city
router.get('/:id', async (req, res: Response) => {
  try {
    const city = await City.findById(req.params.id).populate('moderators', 'username');
    if (!city) {
      res.status(404).json({ error: 'City not found' });
      return;
    }
    res.json(city);
  } catch (error) {
    console.error('Get city error:', error);
    res.status(500).json({ error: 'Failed to get city' });
  }
});

// Get random city
router.get('/random/pick', async (req, res: Response) => {
  try {
    const { continent } = req.query;
    const query: any = {};

    // Optional continent filter (would need continent field in City model)
    const count = await City.countDocuments(query);
    const random = Math.floor(Math.random() * count);

    const city = await City.findOne(query).skip(random);
    if (!city) {
      res.status(404).json({ error: 'No cities found' });
      return;
    }

    res.json(city);
  } catch (error) {
    console.error('Get random city error:', error);
    res.status(500).json({ error: 'Failed to get random city' });
  }
});

// Get city posts with cursor pagination
router.get('/:id/posts', async (req, res: Response) => {
  try {
    const { type, status = 'approved', cursor, limit = '20' } = req.query;
    const query: any = { cityId: req.params.id, status };

    if (type) {
      query.type = type;
    }

    // Cursor pagination
    if (cursor && typeof cursor === 'string') {
      query._id = { $lt: cursor };
    }

    const limitNum = parseInt(limit as string, 10);
    const posts = await Post.find(query)
      .populate('userId', 'username profile.photos profile.cityLocation')
      .sort({ _id: -1 })
      .limit(limitNum + 1);

    const hasMore = posts.length > limitNum;
    const postsToReturn = hasMore ? posts.slice(0, limitNum) : posts;
    const nextCursor = hasMore && postsToReturn.length > 0
      ? postsToReturn[postsToReturn.length - 1]._id.toString()
      : null;

    res.json({
      posts: postsToReturn,
      pagination: {
        hasMore,
        nextCursor
      }
    });
  } catch (error) {
    console.error('Get city posts error:', error);
    res.status(500).json({ error: 'Failed to get city posts' });
  }
});

// Get users in city
router.get('/:id/users', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find({ 'profile.cityLocation': req.params.id })
      .select('username profile.bio profile.languages profile.photos lastActive')
      .limit(50);

    res.json(users);
  } catch (error) {
    console.error('Get city users error:', error);
    res.status(500).json({ error: 'Failed to get city users' });
  }
});

export default router;

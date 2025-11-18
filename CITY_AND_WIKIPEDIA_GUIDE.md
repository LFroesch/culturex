# City Auto-Generation & Wikipedia Integration Guide

## 🗺️ City Auto-Generation (On-Demand)

### How It Works

1. **User clicks anywhere on the map**
2. System checks if a city exists within 20km radius
3. If **YES** → Returns existing city (prevents duplicates like "Paris 1", "Paris 2")
4. If **NO** → Creates new city:
   - Calls Nominatim (OpenStreetMap) reverse geocoding API
   - Gets city name and country
   - Saves to database
   - Returns the new city

### Benefits
- ✅ **No manual seeding required** - Cities created on demand
- ✅ **Prevents duplicates** - 20km proximity check
- ✅ **Unlimited cities** - Any location worldwide
- ✅ **Free** - Uses OSM Nominatim (no API key needed)
- ✅ **User-driven** - Cities only created where users are interested

### API Endpoint

**POST** `/api/cities/from-coordinates`

**Request:**
```json
{
  "lat": 48.8566,
  "lng": 2.3522
}
```

**Response:**
```json
{
  "_id": "...",
  "name": "Paris",
  "country": "France",
  "coordinates": {
    "type": "Point",
    "coordinates": [2.3522, 48.8566]
  },
  "contentCount": 0,
  "hasContent": false
}
```

### Proximity Logic

**20km radius rule:**
- If you click in central Paris, you get "Paris"
- If you click 5km away, you still get the same "Paris" city
- If you click 30km away (outside the radius), you might get "Versailles"

This prevents:
- ❌ Paris Downtown
- ❌ Paris North
- ❌ Paris #1, Paris #2, etc.

And ensures:
- ✅ One "Paris" city
- ✅ Clean, unique city list
- ✅ Nearby clicks return same city

### Usage in Frontend

```typescript
// Map component already handles this!
// User clicks map → city auto-created → marker appears → user can post
```

---

## 📚 Wikipedia Integration (Free!)

### No API Key Needed!

Wikipedia's REST API is **completely free** and requires **no authentication**. Just need to set a proper User-Agent header.

### API Endpoints

#### 1. Get Wikipedia Summary

**GET** `/api/wikipedia/summary/:title?language=en`

**Example:**
```bash
GET /api/wikipedia/summary/Paris
GET /api/wikipedia/summary/Tokyo?language=ja
```

**Response:**
```json
{
  "title": "Paris",
  "extract": "Paris is the capital and most populous city of France...",
  "description": "Capital of France",
  "thumbnail": {
    "source": "https://upload.wikimedia.org/...",
    "width": 640,
    "height": 480
  },
  "url": "https://en.wikipedia.org/wiki/Paris"
}
```

#### 2. Search Wikipedia

**GET** `/api/wikipedia/search?q=searchterm&language=en&limit=5`

**Example:**
```bash
GET /api/wikipedia/search?q=cultural%20exchange
```

**Response:**
```json
[
  {
    "title": "Cultural exchange",
    "description": "Exchange of cultural artifacts, traditions..."
  },
  {
    "title": "Student exchange program",
    "description": "Program where students study abroad..."
  }
]
```

### Use Cases

**1. City Information**
```typescript
// When user selects a city, show Wikipedia summary
const response = await api.get(`/wikipedia/summary/${cityName}`);
// Display: summary, image, link to full article
```

**2. Cultural Content**
```typescript
// Search for cultural topics
const results = await api.get('/wikipedia/search?q=Japanese tea ceremony');
```

**3. Multi-Language Support**
```typescript
// Get article in user's language
const summaryEN = await api.get('/wikipedia/summary/Paris?language=en');
const summaryJA = await api.get('/wikipedia/summary/Paris?language=ja');
const summaryES = await api.get('/wikipedia/summary/Paris?language=es');
```

### Service Functions (Backend)

Located in `/server/src/services/wikipediaService.ts`:

```typescript
// Get summary for a topic
getWikipediaSummary(title: string, language: string)

// Search Wikipedia
searchWikipedia(query: string, language: string, limit: number)

// Get article in multiple languages at once
getMultiLanguageSummary(title: string, languages: string[])
```

### Rate Limits

Wikipedia's **fair use policy**:
- ✅ Reasonable use is free
- ✅ Set proper User-Agent header (already done)
- ✅ Don't spam requests
- ✅ Cache responses when possible

**Current User-Agent:**
```
CulturalX-App/1.0 (https://culturalx.com; contact@culturalx.com)
```

---

## 🎯 Example Use Cases

### 1. User Discovers New City
```
User clicks map in Tokyo
→ System checks: no city within 20km
→ Calls Nominatim: gets "Tokyo, Japan"
→ Creates city in DB
→ Calls Wikipedia: gets Tokyo summary
→ Shows city info card with summary + image
→ User can now post about Tokyo
```

### 2. User Explores Existing City
```
User clicks near existing "Paris" marker (15km away)
→ System checks: found "Paris" within 20km
→ Returns existing Paris city
→ Calls Wikipedia: gets fresh Paris summary
→ Shows updated info + recent posts
```

### 3. Cultural Post Enhancement
```
User posts about "Eiffel Tower"
→ System searches Wikipedia for "Eiffel Tower"
→ Auto-enriches post with:
  - Summary snippet
  - Historical photo
  - Link to learn more
```

---

## 🚀 Implementation Status

### ✅ Completed
- City auto-generation endpoint with reverse geocoding
- 20km proximity check (prevents duplicates)
- Wikipedia summary endpoint
- Wikipedia search endpoint
- Wikipedia service with multi-language support
- Map click handler (frontend)
- Auto-marker creation on click

### 🔄 How to Test

**Test City Creation:**
1. Open the app
2. Click anywhere on the map
3. Wait ~1 second (API call)
4. City marker should appear
5. Click nearby (within 20km) → Same city returned
6. Click far away → New city created

**Test Wikipedia:**
```bash
# Test summary
curl http://localhost:5005/api/wikipedia/summary/Paris

# Test search
curl "http://localhost:5005/api/wikipedia/search?q=sushi"

# Test different language
curl http://localhost:5005/api/wikipedia/summary/Tokyo?language=ja
```

---

## 📝 Notes

- **Nominatim** has a 1 request/second rate limit (respectful usage)
- **Wikipedia** has no hard limits, just fair use policy
- Cities are cached in your DB after creation
- Wikipedia responses can be cached for better performance
- Both services are **100% free** - no API keys needed!

---

## 🔮 Future Enhancements

1. **Add loading states** - Show spinner while creating city
2. **Add city preview** - Show Wikipedia summary before creating
3. **Batch nearby cities** - Pre-load cities in viewport
4. **Cache Wikipedia** - Store summaries in DB for faster load
5. **Add city images** - Use Wikipedia images for city cards
6. **Translation layer** - Auto-translate Wikipedia content

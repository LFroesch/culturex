# Map Tiles Configuration Guide

## Current Implementation

The map currently uses **CARTO Voyager tiles** which provide:
- ✅ **Full English labels** on all countries, cities, and features
- ✅ **Clean, modern design** with good readability
- ✅ **Free to use** (no API key required)
- ✅ **High zoom levels** (up to zoom 20)
- ✅ **Fast loading** from CDN

## English Tile Options

### 1. CARTO Voyager (Currently Implemented) ⭐
**Best free option for English labels**

```typescript
url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
```

**Pros:**
- Free, no API key needed
- Clean English labels
- Modern styling
- Fast CDN delivery

**Cons:**
- Not as many customization options as Mapbox

### 2. Mapbox (Premium - Requires API Key)
**Best for multiple languages with parameters**

```typescript
// Get free token at https://www.mapbox.com/
url: 'https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=YOUR_TOKEN'
// With language parameter:
url: 'https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?language=en&access_token=YOUR_TOKEN'
```

**Pros:**
- Language parameter support (en, ja, es, fr, etc.)
- Highly customizable
- Best quality and features

**Cons:**
- Requires API key
- Free tier has usage limits
- More complex setup

### 3. CARTO Positron (Alternative Free Option)
**Lighter style with English labels**

```typescript
url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
```

**Pros:**
- Free, no API key
- Light, minimal design
- Good for data overlay

**Cons:**
- Less detailed than Voyager
- Very light styling may lack contrast

## How to Switch Tile Providers

Edit `/client/src/components/Map.tsx`:

```typescript
const tileConfigs = {
  en: {
    url: 'YOUR_TILE_URL_HERE',
    attribution: 'YOUR_ATTRIBUTION',
    maxZoom: 20
  }
};
```

## Adding Mapbox Support

### Step 1: Get API Key
1. Sign up at https://www.mapbox.com/
2. Create a new access token
3. Copy the token

### Step 2: Add to Environment
Add to `/client/.env`:
```
VITE_MAPBOX_TOKEN=pk.your_token_here
```

### Step 3: Update Map Configuration
In `Map.tsx`:

```typescript
const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

const tileConfigs = {
  en: mapboxToken ? {
    url: `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?language=en&access_token=${mapboxToken}`,
    attribution: '&copy; Mapbox',
    maxZoom: 22
  } : {
    // Fallback to CARTO if no token
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    maxZoom: 20
  }
};
```

## Language-Specific Tiles

### Japanese (日本語)
```typescript
ja: {
  url: 'https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png',
  attribution: '&copy; GSI Japan',
  maxZoom: 18
}
```

### Chinese (中文)
```typescript
zh: {
  url: 'https://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineCommunity/MapServer/tile/{z}/{y}/{x}',
  attribution: '&copy; GeoQ',
  maxZoom: 18
}
```

### German (Deutsch)
```typescript
de: {
  url: 'https://tile.openstreetmap.de/{z}/{x}/{y}.png',
  attribution: '&copy; OpenStreetMap Deutschland',
  maxZoom: 18
}
```

## Testing Different Tiles

To test a tile provider:

1. Open browser DevTools (F12)
2. Go to Network tab
3. Filter by "png" or "xyz"
4. Zoom/pan the map
5. Check if tiles load correctly

## Troubleshooting

### Tiles Not Loading
- Check browser console for CORS errors
- Verify tile URL is correct
- Check if provider requires API key
- Test tile URL directly in browser

### Wrong Language Labels
- Verify language parameter in URL (if supported)
- Check if provider supports your language
- Consider switching to language-specific provider

### Slow Loading
- Check CDN availability in your region
- Consider using a different tile provider
- Check network throttling in DevTools

## Free Tile Providers with English Labels

1. **CARTO Voyager** (Current) - ⭐ Best free option
2. CARTO Positron/Dark Matter
3. OpenStreetMap Standard
4. Stamen Terrain/Toner/Watercolor

## Premium Providers (Better Features)

1. **Mapbox** - Best overall, language parameters
2. **Google Maps** - Requires API key
3. **Here Maps** - Enterprise features
4. **Thunderforest** - Specialized styles

## Recommendation

**Stick with CARTO Voyager** for:
- Free usage
- English labels
- Good performance
- No API key hassle

**Upgrade to Mapbox** if you need:
- Multiple language support
- Custom styling
- Advanced features
- Better mobile optimization

---

Current tiles are working great with full English labels! No action needed unless you want premium features.

# Internationalization (i18n) Guide

This app uses `react-i18next` for internationalization support. The system is modular and easy to expand.

## 📁 File Structure

```
src/i18n/
├── config.ts           # i18n configuration
├── locales/
│   ├── en.json        # English translations (template)
│   ├── ja.json        # Japanese translations (add as needed)
│   ├── es.json        # Spanish translations (add as needed)
│   └── ...            # Add more languages here
└── README.md          # This file
```

## 🌍 Adding a New Language

### Step 1: Create Translation File

1. Copy `locales/en.json` to create a new language file:
   ```bash
   cp locales/en.json locales/ja.json  # for Japanese
   ```

2. Translate all strings in the new file:
   ```json
   {
     "common": {
       "appName": "CulturalX",
       "welcome": "ようこそ",
       "loading": "読み込み中...",
       ...
     }
   }
   ```

### Step 2: Register Language in Config

Open `config.ts` and:

1. Import the translation file:
   ```typescript
   import jaTranslations from './locales/ja.json';
   ```

2. Add it to resources:
   ```typescript
   resources: {
     en: { translation: enTranslations },
     ja: { translation: jaTranslations },  // Add this
   }
   ```

### Step 3: Add to Language Switcher

Open `components/LanguageSwitcher.tsx` and add the language:

```typescript
const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },  // Add this
];
```

That's it! The new language is now available.

## 🔧 Using Translations in Components

### Basic Usage

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('common.welcome')}</h1>
      <button>{t('common.save')}</button>
    </div>
  );
}
```

### With Variables

```typescript
// In translation file:
{
  "greeting": "Hello {{name}}!"
}

// In component:
{t('greeting', { name: 'John' })}
// Output: "Hello John!"
```

### Pluralization

```typescript
// In translation file:
{
  "posts_one": "{{count}} post",
  "posts_other": "{{count}} posts"
}

// In component:
{t('posts', { count: 1 })}  // "1 post"
{t('posts', { count: 5 })}  // "5 posts"
```

## 🗺️ Map Tiles in Different Languages

To show map labels in different languages, we can use different tile providers:

### Option 1: OpenStreetMap with Language Parameter
Some tile servers support language parameters. Update Map.tsx:

```typescript
const { i18n } = useTranslation();
const tileUrl = `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`;
// For language-specific: Use Mapbox or similar with language parameter
```

### Option 2: Multiple Tile Providers
Use different tile providers for different languages:

```typescript
const tileProviders = {
  en: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  ja: 'https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png',
  // Add more as needed
};

<TileLayer url={tileProviders[i18n.language] || tileProviders.en} />
```

## 🤖 Auto-Translation (Future Enhancement)

For user-generated content, you can integrate translation APIs:

### Option 1: Google Translate API
```typescript
const translateText = async (text: string, targetLang: string) => {
  const response = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`,
    {
      method: 'POST',
      body: JSON.stringify({
        q: text,
        target: targetLang,
      }),
    }
  );
  const data = await response.json();
  return data.data.translations[0].translatedText;
};
```

### Option 2: LibreTranslate (Free & Open Source)
```typescript
const translateText = async (text: string, targetLang: string) => {
  const response = await fetch('https://libretranslate.com/translate', {
    method: 'POST',
    body: JSON.stringify({
      q: text,
      source: 'auto',
      target: targetLang,
    }),
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await response.json();
  return data.translatedText;
};
```

## 📝 Translation Keys Organization

Keep translations organized by feature:

- `common.*` - Shared UI elements
- `navigation.*` - Navigation items
- `auth.*` - Authentication pages
- `map.*` - Map-related strings
- `feed.*` - Feed page
- `post.*` - Post-related strings
- `profile.*` - Profile page
- `connections.*` - Connections page
- `messages.*` - Messages page
- `validation.*` - Form validation messages

## 🌐 Supported Languages (Currently)

- 🇬🇧 English (en) - Base language

## 📦 Easy to Add

- 🇯🇵 Japanese (ja)
- 🇪🇸 Spanish (es)
- 🇫🇷 French (fr)
- 🇩🇪 German (de)
- 🇨🇳 Chinese (zh)
- 🇰🇷 Korean (ko)
- 🇵🇹 Portuguese (pt)
- 🇸🇦 Arabic (ar)
- 🇮🇳 Hindi (hi)
- And many more...

## 💾 Language Persistence

User language preference is automatically saved in `localStorage` and persists across sessions.

## 🔍 Testing Translations

1. Switch language using the language switcher in the header
2. Check that all UI elements update
3. Verify that the selection persists after page reload
4. Test with browser language detection (clear localStorage)

## 🎯 Best Practices

1. **Keep keys semantic**: Use descriptive keys like `auth.loginTitle` instead of `text1`
2. **Organize by feature**: Group related strings together
3. **Use namespaces**: Separate large features into their own translation files if needed
4. **Test all languages**: Ensure translations fit in the UI without breaking layout
5. **Use variables**: For dynamic content, use interpolation instead of string concatenation

## 🚀 Quick Start for Contributors

Want to add a new language? Just:
1. Copy `en.json` → `yourlang.json`
2. Translate the strings
3. Add it to `config.ts` and `LanguageSwitcher.tsx`
4. Submit a PR!

---

For more info, see: https://react.i18next.com/

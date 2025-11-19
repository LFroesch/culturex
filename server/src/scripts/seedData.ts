import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User';
import Post from '../models/Post';
import City from '../models/City';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/culturex';

// Dummy users data
const dummyUsers = [
  {
    username: 'sarah_traveler',
    email: 'sarah@example.com',
    password: 'password123',
    profile: {
      bio: 'World traveler | Food enthusiast | Photography lover 📸',
      interests: ['Photography', 'Food', 'Hiking', 'Culture'],
      languages: ['English', 'Spanish', 'French'],
      photos: []
    }
  },
  {
    username: 'marco_chef',
    email: 'marco@example.com',
    password: 'password123',
    profile: {
      bio: 'Professional chef exploring culinary traditions around the globe 🍳',
      interests: ['Cooking', 'Local Cuisine', 'Street Food', 'Wine'],
      languages: ['Italian', 'English'],
      photos: []
    }
  },
  {
    username: 'yuki_explorer',
    email: 'yuki@example.com',
    password: 'password123',
    profile: {
      bio: 'Adventure seeker from Tokyo | Love meeting new people ✨',
      interests: ['Adventure', 'Music', 'Art', 'Languages'],
      languages: ['Japanese', 'English', 'Korean'],
      photos: []
    }
  },
  {
    username: 'alex_digital',
    email: 'alex@example.com',
    password: 'password123',
    profile: {
      bio: 'Digital nomad | Remote work enthusiast | Coffee addict ☕',
      interests: ['Technology', 'Coworking', 'Coffee', 'Travel'],
      languages: ['English', 'Portuguese'],
      photos: []
    }
  },
  {
    username: 'maria_artist',
    email: 'maria@example.com',
    password: 'password123',
    profile: {
      bio: 'Visual artist capturing the beauty of everyday life 🎨',
      interests: ['Art', 'Museums', 'Architecture', 'Design'],
      languages: ['Spanish', 'English', 'Catalan'],
      photos: []
    }
  },
  {
    username: 'david_history',
    email: 'david@example.com',
    password: 'password123',
    profile: {
      bio: 'History buff | Love exploring ancient sites and sharing stories',
      interests: ['History', 'Archaeology', 'Museums', 'Books'],
      languages: ['English', 'Latin', 'Greek'],
      photos: []
    }
  },
  {
    username: 'lisa_wellness',
    email: 'lisa@example.com',
    password: 'password123',
    profile: {
      bio: 'Yoga instructor | Wellness advocate | Plant-based food lover 🧘‍♀️',
      interests: ['Yoga', 'Meditation', 'Wellness', 'Vegan Food'],
      languages: ['English', 'Hindi'],
      photos: []
    }
  },
  {
    username: 'ahmed_music',
    email: 'ahmed@example.com',
    password: 'password123',
    profile: {
      bio: 'Traditional music collector | Documenting sounds of the world 🎵',
      interests: ['Music', 'Folk', 'Instruments', 'Recording'],
      languages: ['Arabic', 'English', 'French'],
      photos: []
    }
  }
];

// Dummy posts data (will be populated with actual city IDs)
const createPosts = (users: any[], cities: any[]) => {
  const tokyo = cities.find(c => c.name === 'Tokyo');
  const paris = cities.find(c => c.name === 'Paris');
  const barcelona = cities.find(c => c.name === 'Barcelona');
  const bangkok = cities.find(c => c.name === 'Bangkok');
  const rome = cities.find(c => c.name === 'Rome');
  const newyork = cities.find(c => c.name === 'New York');
  const bali = cities.find(c => c.name === 'Bali');
  const lisbon = cities.find(c => c.name === 'Lisbon');

  return [
    // Food posts
    {
      userId: users[1]._id, // marco_chef
      cityId: tokyo._id,
      type: 'food',
      status: 'approved',
      title: 'Best Ramen Spot in Shibuya',
      description: 'Found this incredible little ramen shop tucked away in a side street. The tonkotsu broth is absolutely perfect - rich and creamy with just the right amount of depth. Owner has been making it the same way for 40 years!',
      tags: ['ramen', 'japanese-food', 'shibuya', 'authentic'],
      metadata: {
        foodType: 'restaurant',
        locationDetails: 'Near Shibuya Station, 5 min walk from Hachiko exit'
      },
      likes: [users[0]._id, users[2]._id, users[3]._id],
      comments: [
        {
          user: users[0]._id,
          text: 'I went there last week! The pork belly is amazing too 🍜',
          createdAt: new Date()
        },
        {
          user: users[2]._id,
          text: 'Adding this to my Tokyo list, thanks for sharing!',
          createdAt: new Date()
        }
      ]
    },
    {
      userId: users[1]._id, // marco_chef
      cityId: rome._id,
      type: 'recipe',
      status: 'approved',
      title: 'Authentic Cacio e Pepe Recipe',
      description: 'Learned this from a Roman nonna. The secret is in the pasta water and constant stirring!',
      tags: ['italian', 'pasta', 'recipe', 'traditional'],
      metadata: {
        ingredients: [
          '400g tonnarelli or spaghetti',
          '200g Pecorino Romano cheese, finely grated',
          '2 tsp whole black peppercorns',
          'Salt for pasta water'
        ],
        instructions: [
          'Toast peppercorns in a dry pan, then crush coarsely',
          'Boil pasta in salted water until al dente',
          'Mix cheese with some pasta water to create a cream',
          'Toss hot pasta with pepper, then add cheese mixture',
          'Keep stirring and adding pasta water until silky'
        ],
        servings: '4 people',
        prepTime: '5 minutes',
        cookTime: '15 minutes'
      },
      likes: [users[0]._id, users[4]._id, users[6]._id],
      comments: [
        {
          user: users[4]._id,
          text: 'Made this last night - turned out perfect! The key is really the pasta water.',
          createdAt: new Date()
        }
      ]
    },
    {
      userId: users[0]._id, // sarah_traveler
      cityId: bangkok._id,
      type: 'food',
      status: 'approved',
      title: 'Street Food Paradise on Yaowarat Road',
      description: 'Chinatown at night is absolutely insane. Every few meters there\'s another incredible food stall. Had the best pad thai of my life from a cart that\'s been there for 30 years.',
      tags: ['street-food', 'thai-food', 'chinatown', 'budget-friendly'],
      metadata: {
        foodType: 'streetFood',
        locationDetails: 'Yaowarat Road, Bangkok Chinatown - best after 7pm'
      },
      likes: [users[1]._id, users[2]._id, users[3]._id, users[4]._id],
      comments: [
        {
          user: users[1]._id,
          text: 'Bangkok street food is unmatched! Did you try the mango sticky rice?',
          createdAt: new Date()
        },
        {
          user: users[0]._id,
          text: 'Yes! Got it from a cart near the flower market - absolutely incredible 🥭',
          createdAt: new Date()
        }
      ]
    },

    // Photo posts
    {
      userId: users[4]._id, // maria_artist
      cityId: barcelona._id,
      type: 'photo',
      status: 'approved',
      title: 'Sunrise at Park Güell',
      description: 'Woke up at 5am to catch this view before the crowds arrived. Gaudí\'s architecture in the golden hour light is pure magic.',
      tags: ['architecture', 'gaudi', 'barcelona', 'sunrise', 'photography'],
      metadata: {
        photoCategory: 'architecture'
      },
      likes: [users[0]._id, users[2]._id, users[5]._id],
      comments: [
        {
          user: users[5]._id,
          text: 'The colors are stunning! What time did you get there?',
          createdAt: new Date()
        },
        {
          user: users[4]._id,
          text: 'Got there around 5:30am. Totally worth the early wake-up!',
          createdAt: new Date()
        }
      ]
    },
    {
      userId: users[0]._id, // sarah_traveler
      cityId: bali._id,
      type: 'photo',
      status: 'approved',
      title: 'Rice Terraces at Golden Hour',
      description: 'Tegallalang rice terraces never disappoint. The layers of green catching the afternoon light... breathtaking.',
      tags: ['nature', 'rice-terraces', 'bali', 'landscape'],
      metadata: {
        photoCategory: 'landscape'
      },
      likes: [users[2]._id, users[3]._id, users[4]._id, users[6]._id],
      comments: [
        {
          user: users[3]._id,
          text: 'Planning to visit Bali next month! Any tips on getting there?',
          createdAt: new Date()
        },
        {
          user: users[0]._id,
          text: 'Rent a scooter! It\'s about 20 min from Ubud. Go in the afternoon for best light.',
          createdAt: new Date()
        }
      ]
    },

    // Story posts
    {
      userId: users[5]._id, // david_history
      cityId: rome._id,
      type: 'story',
      status: 'approved',
      title: 'The Legend of Rome\'s Mouth of Truth',
      description: 'The Bocca della Verità (Mouth of Truth) has an interesting legend. It\'s said that if a liar puts their hand in the mouth, it will be bitten off. Medieval judges actually used it as a lie detector! They\'d have an executioner hidden behind ready to chop off the hand of anyone they knew was guilty. Dark but effective.',
      tags: ['history', 'legend', 'rome', 'ancient'],
      metadata: {
        storyCategory: 'legend'
      },
      likes: [users[0]._id, users[4]._id, users[7]._id],
      comments: [
        {
          user: users[0]._id,
          text: 'I visited this! Didn\'t know the executioner story though, that\'s wild 😱',
          createdAt: new Date()
        }
      ]
    },

    // Music posts
    {
      userId: users[7]._id, // ahmed_music
      cityId: paris._id,
      type: 'music',
      status: 'approved',
      title: 'Accordion Music in Montmartre',
      description: 'Street musicians in Montmartre keep the traditional French accordion music alive. This artist plays every Sunday afternoon near Sacré-Cœur. His rendition of "La Vie en Rose" brings tears to my eyes every time.',
      tags: ['accordion', 'french-music', 'street-performance', 'traditional'],
      metadata: {
        artist: 'Pierre (street musician)',
        musicType: 'traditional',
        language: 'French'
      },
      likes: [users[0]._id, users[1]._id, users[4]._id],
      comments: [
        {
          user: users[4]._id,
          text: 'Love the accordion! Such a romantic sound. Do they have recordings?',
          createdAt: new Date()
        }
      ]
    },

    // Work Exchange posts
    {
      userId: users[3]._id, // alex_digital
      cityId: lisbon._id,
      type: 'workExchange',
      status: 'approved',
      title: 'Hostel Looking for Social Media Help',
      description: 'Cool hostel in Alfama district looking for someone good with Instagram/TikTok. They offer free private room + breakfast in exchange for ~15 hours/week managing their social media. Great community, weekly dinners, perfect for digital nomads!',
      tags: ['work-exchange', 'social-media', 'hostel', 'digital-nomad'],
      metadata: {
        workType: 'creative',
        duration: '1-3 months',
        offered: 'Private room + breakfast + coworking access',
        requirements: 'Social media experience, content creation skills, English fluent',
        contactPreference: 'dm'
      },
      likes: [users[0]._id, users[2]._id, users[6]._id],
      comments: [
        {
          user: users[2]._id,
          text: 'This looks perfect! Sending you a DM 🙌',
          createdAt: new Date()
        }
      ]
    },

    // Insight posts
    {
      userId: users[0]._id, // sarah_traveler
      cityId: tokyo._id,
      type: 'insight',
      status: 'approved',
      title: 'Japanese Onsen Etiquette Guide',
      description: 'After visiting 10+ onsens, here are the unspoken rules:\n\n1. Wash THOROUGHLY before entering the bath\n2. Small towel goes on your head, NOT in the water\n3. No tattoos in most places (check first)\n4. Silence is golden - keep conversations quiet\n5. Tie up long hair\n6. Stay hydrated!\n\nThe locals really appreciate when foreigners follow the etiquette properly.',
      tags: ['onsen', 'etiquette', 'culture', 'japan', 'tips'],
      likes: [users[2]._id, users[3]._id, users[5]._id, users[6]._id],
      comments: [
        {
          user: users[2]._id,
          text: 'Super helpful! Going to Tokyo next month and was confused about onsen rules.',
          createdAt: new Date()
        },
        {
          user: users[5]._id,
          text: 'The tattoo policy is slowly changing in some modern onsens, but traditional ones are still strict.',
          createdAt: new Date()
        }
      ]
    },

    // Forum posts
    {
      userId: users[3]._id, // alex_digital
      cityId: newyork._id,
      type: 'forum',
      status: 'approved',
      title: 'Coffee Shop Meetup - Brooklyn Digital Nomads',
      description: 'Anyone working remotely in Brooklyn want to meet up? Thinking this Saturday 10am at Devoción in Williamsburg. Good wifi, great coffee, nice workspace vibe.\n\nWould be cool to connect with other remote workers!',
      tags: ['meetup', 'digital-nomad', 'brooklyn', 'coworking'],
      metadata: {
        forumCategory: 'meetup'
      },
      likes: [users[2]._id, users[6]._id],
      comments: [
        {
          user: users[6]._id,
          text: 'I\'m in! Will be there around 10:30 👋',
          createdAt: new Date()
        },
        {
          user: users[3]._id,
          text: 'Awesome! I\'ll be at the table near the window.',
          createdAt: new Date()
        }
      ]
    },
    {
      userId: users[6]._id, // lisa_wellness
      cityId: bali._id,
      type: 'forum',
      status: 'approved',
      title: 'Question: Best Yoga Studios in Ubud?',
      description: 'Moving to Ubud for 2 months and looking for good yoga studios. Interested in Vinyasa and Yin practices. Would love recommendations from locals or anyone who\'s been!',
      tags: ['yoga', 'ubud', 'wellness', 'question'],
      metadata: {
        forumCategory: 'question'
      },
      likes: [users[0]._id, users[2]._id],
      comments: [
        {
          user: users[0]._id,
          text: 'Yoga Barn is the most popular but can be crowded. I prefer Radiantly Alive - smaller classes, amazing teachers.',
          createdAt: new Date()
        },
        {
          user: users[6]._id,
          text: 'Thanks! Will check out Radiantly Alive 🙏',
          createdAt: new Date()
        }
      ]
    },

    // More varied posts
    {
      userId: users[2]._id, // yuki_explorer
      cityId: paris._id,
      type: 'insight',
      status: 'approved',
      title: 'How to Skip Lines at the Louvre',
      description: 'Pro tip: Buy tickets online in advance and enter through the Carrousel entrance (not the main pyramid). Also, Wednesday and Friday evenings they\'re open late and way less crowded. Saved me 2+ hours of waiting!',
      tags: ['louvre', 'museum', 'paris', 'travel-tips'],
      likes: [users[0]._id, users[4]._id, users[5]._id],
      comments: []
    },
    {
      userId: users[1]._id, // marco_chef
      cityId: barcelona._id,
      type: 'food',
      status: 'approved',
      title: 'La Boqueria Market - Best Breakfast Spot',
      description: 'Skip the tourist traps on La Rambla. Go inside La Boqueria market and grab breakfast at one of the counter bars. Fresh juice, jamón, pan con tomate, café con leche - all for under €8. Watch the locals do it!',
      tags: ['market', 'breakfast', 'local-food', 'barcelona'],
      metadata: {
        foodType: 'tradition',
        locationDetails: 'La Boqueria Market, counter bars in the back'
      },
      likes: [users[0]._id, users[3]._id, users[4]._id],
      comments: [
        {
          user: users[0]._id,
          text: 'The pan con tomate there is unreal! Best I\'ve had in Spain.',
          createdAt: new Date()
        }
      ]
    },
    {
      userId: users[4]._id, // maria_artist
      cityId: newyork._id,
      type: 'photo',
      status: 'approved',
      title: 'Brooklyn Bridge at Dawn',
      description: 'There\'s something magical about this bridge when the city is still waking up. Just you, the joggers, and the skyline.',
      tags: ['brooklyn-bridge', 'nyc', 'sunrise', 'photography'],
      metadata: {
        photoCategory: 'architecture'
      },
      likes: [users[0]._id, users[2]._id, users[3]._id, users[5]._id],
      comments: []
    },
    {
      userId: users[5]._id, // david_history
      cityId: bangkok._id,
      type: 'story',
      status: 'approved',
      title: 'The History Behind Wat Phra Kaew\'s Emerald Buddha',
      description: 'The Emerald Buddha isn\'t actually made of emerald - it\'s carved from a single block of jade. It has traveled across Thailand, Laos, and Cambodia over 600 years, and its robes are ceremonially changed 3 times a year by the King himself. Absolutely fascinating piece of Southeast Asian history.',
      tags: ['temple', 'buddhism', 'history', 'bangkok'],
      metadata: {
        storyCategory: 'historical'
      },
      likes: [users[0]._id, users[2]._id, users[7]._id],
      comments: [
        {
          user: users[2]._id,
          text: 'I had no idea about the robe ceremony! That\'s amazing 🙏',
          createdAt: new Date()
        }
      ]
    },

    // Some pending posts (for moderation testing)
    {
      userId: users[3]._id,
      cityId: tokyo._id,
      type: 'forum',
      status: 'pending',
      title: 'Looking for Language Exchange Partner',
      description: 'Native English speaker looking to practice Japanese. Happy to help with English in return! Anyone in Shinjuku area?',
      tags: ['language-exchange', 'japanese', 'english'],
      metadata: {
        forumCategory: 'question'
      },
      likes: [],
      comments: []
    },
    {
      userId: users[6]._id,
      cityId: lisbon._id,
      type: 'insight',
      status: 'pending',
      title: 'Vegan Food Guide to Lisbon',
      description: 'Lisbon is surprisingly vegan-friendly! Here are my top 5 spots for plant-based eating...',
      tags: ['vegan', 'food', 'lisbon', 'plant-based'],
      likes: [],
      comments: []
    }
  ];
};

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seed...');

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data (except cities - we want to keep seed cities)
    console.log('🗑️  Clearing existing users and posts...');
    await User.deleteMany({});
    await Post.deleteMany({});

    // Create users
    console.log('👥 Creating dummy users...');
    const hashedUsers = await Promise.all(
      dummyUsers.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password, 10)
      }))
    );

    const createdUsers = await User.insertMany(hashedUsers);
    console.log(`✅ Created ${createdUsers.length} users`);

    // Get some cities
    const cities = await City.find({
      name: { $in: ['Tokyo', 'Paris', 'Barcelona', 'Bangkok', 'Rome', 'New York', 'Bali', 'Lisbon'] }
    });
    console.log(`✅ Found ${cities.length} cities`);

    if (cities.length === 0) {
      console.log('⚠️  No cities found! Please run "npm run seed" first to seed cities.');
      process.exit(1);
    }

    // Create posts
    console.log('📝 Creating dummy posts...');
    const postsData = createPosts(createdUsers, cities);
    const createdPosts = await Post.insertMany(postsData);
    console.log(`✅ Created ${createdPosts.length} posts`);

    // Update city content counts
    console.log('🔄 Updating city content counts...');
    for (const city of cities) {
      const postCount = createdPosts.filter(p => p.cityId.equals(city._id)).length;
      if (postCount > 0) {
        await City.findByIdAndUpdate(city._id, {
          contentCount: postCount,
          hasContent: true
        });
      }
    }

    console.log('\n✅ Seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${createdUsers.length}`);
    console.log(`   Posts: ${createdPosts.length}`);
    console.log(`   Cities with content: ${cities.length}`);
    console.log('\n🔐 All users have password: "password123"\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();

/**
 * Seed script — run once with Node.js to populate Firestore.
 *
 * Prerequisites:
 *   npm install firebase-admin
 *   Download your Firebase service account key from:
 *   Firebase Console → Project Settings → Service Accounts → Generate new private key
 *   Save it as data/serviceAccountKey.json
 *
 * Run:
 *   node data/seed.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const destinations = [
  // — Bacolod City —
  {
    name: 'The Ruins, Talisay',
    description:
      'Known as the "Taj Mahal of Negros," this hauntingly beautiful burnt mansion was built by a sugar baron in the early 1900s for his beloved wife. The Italianate structure stands as an enduring symbol of a lost era of Negrense opulence.',
    categories: ['cultural', 'relaxation'],
    suitableFor: ['solo', 'family', 'group'],
    latitude: 10.7275,
    longitude: 122.9713,
    photos: [],
    isActive: true,
  },
  {
    name: 'MassKara Festival Hub, Bacolod',
    description:
      'Held every October, the MassKara Festival is Bacolod\'s iconic celebration — a riot of smiling masks, street dancing, and pageantry that has earned the city the title "City of Smiles." The festival grounds come alive with food stalls and live performances.',
    categories: ['festivals', 'food', 'cultural'],
    suitableFor: ['solo', 'family', 'group'],
    latitude: 10.6770,
    longitude: 122.9550,
    photos: [],
    isActive: true,
  },
  {
    name: 'Negros Museum, Bacolod',
    description:
      'A world-class museum tracing Negros history from its indigenous roots through the colonial sugar era to the present. Exhibits include Spanish artifacts, sugar industry relics, and contemporary Negrense art and photography.',
    categories: ['cultural'],
    suitableFor: ['solo', 'family', 'group'],
    latitude: 10.6793,
    longitude: 122.9552,
    photos: [],
    isActive: true,
  },
  {
    name: 'Capitol Park and Lagoon, Bacolod',
    description:
      'A beloved public park surrounding the Negros Occidental Provincial Capitol building. The scenic lagoon, wide lawns, and tree-shaded paths make it a favorite morning jog and evening stroll destination for Bacolodnons.',
    categories: ['relaxation', 'nature'],
    suitableFor: ['solo', 'family', 'group'],
    latitude: 10.6763,
    longitude: 122.9484,
    photos: [],
    isActive: true,
  },
  {
    name: 'Robinsons Place Bacolod',
    description:
      'The largest shopping mall in Negros Occidental, housing international brands, local shops, a supermarket, a cinema, and a large food court featuring both local Negrense specialties and international chains.',
    categories: ['shopping', 'food'],
    suitableFor: ['solo', 'family', 'group'],
    latitude: 10.6803,
    longitude: 122.9474,
    photos: [],
    isActive: true,
  },
  {
    name: 'Bacolod Public Plaza',
    description:
      'The social and civic heart of Bacolod City — a lively plaza flanked by the city hall, the San Sebastian Cathedral, and rows of inasal restaurants. The plaza is packed during town fiestas and the MassKara season.',
    categories: ['cultural', 'food', 'festivals'],
    suitableFor: ['solo', 'family', 'group'],
    latitude: 10.6740,
    longitude: 122.9558,
    photos: [],
    isActive: true,
  },
  // — Silay / Talisay / North Negros —
  {
    name: 'Silay Heritage District',
    description:
      'Called the "Paris of Negros," Silay City preserves over 30 ancestral houses from the Spanish era and American period. Walking its heritage streets is like stepping back into the gilded age of the sugar industry.',
    categories: ['cultural', 'festivals'],
    suitableFor: ['solo', 'family', 'group'],
    latitude: 10.8008,
    longitude: 122.9742,
    photos: [],
    isActive: true,
  },
  {
    name: 'Balay Negrense, Silay',
    description:
      'The most photographed ancestral home in Negros, this 1920s wooden mansion has been meticulously restored as a heritage museum. Guided tours reveal period furniture, sugar-baron memorabilia, and family heirlooms.',
    categories: ['cultural'],
    suitableFor: ['solo', 'family', 'group'],
    latitude: 10.8002,
    longitude: 122.9737,
    photos: [],
    isActive: true,
  },
  // — Mountain / Highland —
  {
    name: 'Campuestohan Highland Resort',
    description:
      'A sprawling highland escape at 2,500 feet elevation near Bacolod, with themed cottages, zip lines, wave pools, and panoramic views of Negros Occidental. Perfect for a full-day family adventure.',
    categories: ['adventure', 'relaxation'],
    suitableFor: ['family', 'group'],
    latitude: 10.6253,
    longitude: 122.8797,
    photos: [],
    isActive: true,
  },
  {
    name: 'Mambukal Mountain Resort, Murcia',
    description:
      'A popular highland resort in the foothills of Mt. Kanlaon, famous for seven waterfalls, natural hot spring pools, butterfly sanctuary, and lush rainforest trails. An ideal escape from the Bacolod heat.',
    categories: ['nature', 'adventure', 'relaxation'],
    suitableFor: ['solo', 'family', 'group'],
    latitude: 10.5483,
    longitude: 123.0000,
    photos: [],
    isActive: true,
  },
  {
    name: 'Mt. Kanlaon Natural Park',
    description:
      'An active stratovolcano and one of the highest peaks in the Visayas, Mt. Kanlaon is a magnet for serious trekkers and nature lovers. The national park surrounding it shelters endemic wildlife and old-growth forest.',
    categories: ['nature', 'adventure'],
    suitableFor: ['solo', 'group'],
    latitude: 10.4119,
    longitude: 123.1322,
    photos: [],
    isActive: true,
  },
  // — Coastal / Islands —
  {
    name: 'Lakawon Island Resort, Cadiz',
    description:
      'A pristine white-sand island off the coast of Cadiz City, known for its crystal-clear turquoise water, floating bar "Tobelo," and powdery beach. One of Negros Occidental\'s top beach getaways.',
    categories: ['nature', 'relaxation', 'adventure'],
    suitableFor: ['solo', 'family', 'group'],
    latitude: 11.1167,
    longitude: 123.2833,
    photos: [],
    isActive: true,
  },
  {
    name: 'Danjugan Island Marine Reserve, Cauayan',
    description:
      'An uninhabited sanctuary island off the coast of Cauayan, accessible only through organized eco-tours. Home to rare bird species, mangroves, lagoons, and a coral reef system in pristine condition.',
    categories: ['nature', 'adventure'],
    suitableFor: ['solo', 'group'],
    latitude: 9.9700,
    longitude: 122.5333,
    photos: [],
    isActive: true,
  },
  {
    name: 'Sagay Marine Reserve',
    description:
      'One of the largest marine reserves in the Philippines, protecting over 32,000 hectares of coral reefs, seagrass beds, and mangroves in Sagay City. A UNESCO-recognized biodiversity hotspot ideal for snorkeling and eco-tours.',
    categories: ['nature', 'adventure'],
    suitableFor: ['solo', 'group'],
    latitude: 11.0000,
    longitude: 123.4167,
    photos: [],
    isActive: true,
  },
  // — Food & Local Culture —
  {
    name: 'Bacolod Chicken Inasal Strip',
    description:
      'The stretch of inasal restaurants along Manokan Country inside the Bacolod City Commercial Complex is the birthplace of the famous Bacolod chicken inasal. Grilled over coconut husks and served with garlic rice, it\'s the definitive Negrense dining experience.',
    categories: ['food', 'cultural'],
    suitableFor: ['solo', 'family', 'group'],
    latitude: 10.6741,
    longitude: 122.9530,
    photos: [],
    isActive: true,
  },
];

const amenities = [
  // — ATMs —
  {
    type: 'atm',
    name: 'BDO ATM — SM City Bacolod',
    description: 'BDO Unibank ATM inside SM City Bacolod, ground floor near the main entrance.',
    latitude: 10.6812,
    longitude: 122.9498,
    isLocalRestaurant: false,
    isActive: true,
  },
  {
    type: 'atm',
    name: 'BPI ATM — Bacolod Lacson St.',
    description: 'Bank of the Philippine Islands ATM along Lacson Street, Bacolod City center.',
    latitude: 10.6748,
    longitude: 122.9543,
    isLocalRestaurant: false,
    isActive: true,
  },
  {
    type: 'atm',
    name: 'Metrobank ATM — Robinsons Bacolod',
    description: 'Metrobank ATM inside Robinsons Place Bacolod, ground level near the main mall entrance.',
    latitude: 10.6805,
    longitude: 122.9471,
    isLocalRestaurant: false,
    isActive: true,
  },
  {
    type: 'atm',
    name: 'Landbank ATM — Silay City Hall',
    description: 'Landbank of the Philippines ATM near the Silay City Hall, convenient for heritage district visitors.',
    latitude: 10.8010,
    longitude: 122.9730,
    isLocalRestaurant: false,
    isActive: true,
  },
  // — Hotels —
  {
    type: 'hotel',
    name: "L'Fisher Hotel, Bacolod",
    description:
      "One of Bacolod's most established hotels, centrally located with full amenities, a pool, and a popular restaurant. Walking distance to the plaza and heritage sites.",
    latitude: 10.6756,
    longitude: 122.9534,
    isLocalRestaurant: false,
    isActive: true,
  },
  {
    type: 'hotel',
    name: 'The Suites at Calle Nueva, Bacolod',
    description:
      'A modern boutique hotel in the heart of Bacolod, offering spacious rooms, a rooftop lounge, and easy access to Lacson Street dining and SM City.',
    latitude: 10.6770,
    longitude: 122.9510,
    isLocalRestaurant: false,
    isActive: true,
  },
  {
    type: 'hotel',
    name: 'Planta Hotel, Bacolod',
    description:
      'A stylish mid-range hotel near the Bacolod airport and business district, popular with both business travelers and tourists exploring northern Negros Occidental.',
    latitude: 10.6835,
    longitude: 122.9411,
    isLocalRestaurant: false,
    isActive: true,
  },
  {
    type: 'hotel',
    name: 'Baldevia Garden Resort, Murcia',
    description:
      'A nature-themed resort near Mambukal, offering nipa cottages, a river pool, and lush garden grounds — a good base for exploring the mountain resorts of Murcia.',
    latitude: 10.5720,
    longitude: 122.9850,
    isLocalRestaurant: false,
    isActive: true,
  },
  // — Restaurants —
  {
    type: 'restaurant',
    name: "Aboy's Restaurant, Bacolod",
    description:
      "A beloved Bacolod institution serving authentic Negrense chicken inasal and local comfort food since 1969. No chains — just honest cooking and heaping servings.",
    latitude: 10.6765,
    longitude: 122.9541,
    isLocalRestaurant: true,
    isActive: true,
  },
  {
    type: 'restaurant',
    name: 'Manokan Country, Bacolod',
    description:
      "The legendary open-air inasal village inside the Bacolod City Commercial Complex — a row of family-run stalls grilling chicken over coconut husks. The original Bacolod inasal experience.",
    latitude: 10.6741,
    longitude: 122.9530,
    isLocalRestaurant: true,
    isActive: true,
  },
  {
    type: 'restaurant',
    name: "Sharyn's Cansi House, Bacolod",
    description:
      "Famous for cansi — Bacolod's signature bone marrow and beef shank soup — this no-frills local eatery has been a fixture for decades. A must-try for any food-focused visitor.",
    latitude: 10.6792,
    longitude: 122.9501,
    isLocalRestaurant: true,
    isActive: true,
  },
  {
    type: 'restaurant',
    name: 'Bob\'s Kitchen, Silay',
    description:
      'A charming heritage house converted into a restaurant serving traditional Ilonggo dishes and Negrense comfort food. Popular with tourists exploring the Silay heritage district.',
    latitude: 10.8003,
    longitude: 122.9740,
    isLocalRestaurant: true,
    isActive: true,
  },
];

async function seed() {
  console.log('Seeding destinations...');
  for (const dest of destinations) {
    const ref = await db.collection('destinations').add({
      ...dest,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`  Added destination: ${dest.name} (${ref.id})`);
  }

  console.log('Seeding amenities...');
  for (const amenity of amenities) {
    const ref = await db.collection('amenities').add({
      ...amenity,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`  Added amenity: ${amenity.name} (${ref.id})`);
  }

  console.log('Seed complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

// All preference / category options used in onboarding, filters, and chips.

export const CATEGORY_IDS = {
  NATURE: 'nature',
  BEACH: 'beach',
  FOOD: 'food',
  CULTURE: 'culture',
  ADVENTURE: 'adventure',
  SHOPPING: 'shopping',
  ACCOMMODATION: 'accommodation',
};

export const categories = [
  {
    id: CATEGORY_IDS.NATURE,
    label: 'Nature & Parks',
    icon: 'leaf',           // maps to icon name in your icon set
    color: '#2E7D52',
    description: 'Mountains, waterfalls, forests, and reserves',
  },
  {
    id: CATEGORY_IDS.BEACH,
    label: 'Beaches & Bays',
    icon: 'umbrella-beach',
    color: '#1B7FA6',
    description: 'White sand beaches, coves, snorkeling spots',
  },
  {
    id: CATEGORY_IDS.FOOD,
    label: 'Food & Dining',
    icon: 'utensils',
    color: '#C9973A',
    description: 'Local cuisine, cafes, restaurants, street food',
  },
  {
    id: CATEGORY_IDS.CULTURE,
    label: 'Culture & Heritage',
    icon: 'landmark',
    color: '#7B4EA0',
    description: 'Churches, museums, festivals, heritage sites',
  },
  {
    id: CATEGORY_IDS.ADVENTURE,
    label: 'Adventure',
    icon: 'mountain',
    color: '#C0392B',
    description: 'Hiking, canyoneering, diving, extreme sports',
  },
  {
    id: CATEGORY_IDS.SHOPPING,
    label: 'Shopping & Markets',
    icon: 'shopping-bag',
    color: '#E67E22',
    description: 'Public markets, local crafts, pasalubong shops',
  },
  {
    id: CATEGORY_IDS.ACCOMMODATION,
    label: 'Stay & Resorts',
    icon: 'bed',
    color: '#5D6D7E',
    description: 'Hotels, resorts, homestays, and lodges',
  },
];

// Flat list of IDs — handy for validation
export const CATEGORY_ID_LIST = categories.map((c) => c.id);

// Lookup by ID
export const categoryById = Object.fromEntries(categories.map((c) => [c.id, c]));

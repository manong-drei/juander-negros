import { colors } from './colors';

export const CATEGORIES = [
  {
    id: 'nature',
    label: 'Nature',
    icon: 'park',
    color: colors.category.nature,
    description: 'Parks, mountains, waterfalls, and natural wonders',
  },
  {
    id: 'adventure',
    label: 'Adventure',
    icon: 'hiking',
    color: colors.category.adventure,
    description: 'Hiking, diving, extreme sports, and outdoor thrills',
  },
  {
    id: 'cultural',
    label: 'Cultural Sites',
    icon: 'account-balance',
    color: colors.category.cultural,
    description: 'Museums, heritage sites, churches, and historical spots',
  },
  {
    id: 'festivals',
    label: 'Festivals',
    icon: 'celebration',
    color: colors.category.festivals,
    description: 'Local celebrations, fiestas, and seasonal events',
  },
  {
    id: 'food',
    label: 'Food',
    icon: 'restaurant',
    color: colors.category.food,
    description: 'Restaurants, markets, street food, and local cuisine',
  },
  {
    id: 'shopping',
    label: 'Shopping',
    icon: 'shopping-bag',
    color: colors.category.shopping,
    description: 'Markets, malls, souvenir shops, and local crafts',
  },
  {
    id: 'relaxation',
    label: 'Relaxation',
    icon: 'beach-access',
    color: colors.category.relaxation,
    description: 'Beaches, spas, resorts, and peaceful retreats',
  },
];

export const categoryById = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

export const CATEGORY_ID_LIST = CATEGORIES.map((c) => c.id);

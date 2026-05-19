import { colors } from './colors';

export const CATEGORIES = [
  {
    id: 'nature',
    label: 'Nature',
    icon: '🌿',
    color: colors.category.nature,
    description: 'Parks, mountains, waterfalls, and natural wonders',
  },
  {
    id: 'adventure',
    label: 'Adventure',
    icon: '🧗',
    color: colors.category.adventure,
    description: 'Hiking, diving, extreme sports, and outdoor thrills',
  },
  {
    id: 'cultural',
    label: 'Cultural Sites',
    icon: '🏛️',
    color: colors.category.cultural,
    description: 'Museums, heritage sites, churches, and historical spots',
  },
  {
    id: 'festivals',
    label: 'Festivals',
    icon: '🎉',
    color: colors.category.festivals,
    description: 'Local celebrations, fiestas, and seasonal events',
  },
  {
    id: 'food',
    label: 'Food',
    icon: '🍽️',
    color: colors.category.food,
    description: 'Restaurants, markets, street food, and local cuisine',
  },
  {
    id: 'shopping',
    label: 'Shopping',
    icon: '🛍️',
    color: colors.category.shopping,
    description: 'Markets, malls, souvenir shops, and local crafts',
  },
  {
    id: 'relaxation',
    label: 'Relaxation',
    icon: '🏖️',
    color: colors.category.relaxation,
    description: 'Beaches, spas, resorts, and peaceful retreats',
  },
];

export const categoryById = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

export const CATEGORY_ID_LIST = CATEGORIES.map((c) => c.id);

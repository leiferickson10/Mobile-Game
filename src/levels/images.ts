// Level pictures for the HUD minimap and chapter cards (app only; Node can't load images).
import type { ImageSourcePropType } from 'react-native';

export const LEVEL_IMAGES: Record<string, ImageSourcePropType> = {
  'rural-1': require('../../assets/levels/rural-1-map.png'),
  'rural-2': require('../../assets/levels/rural-2-map.png'),
  'rural-3': require('../../assets/levels/rural-3-map.png'),
  'track-1': require('../../assets/levels/track-1-map.png'),
};

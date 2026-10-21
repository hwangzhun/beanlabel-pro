
export type LabelSize = '105x74' | '60x85';
export type BackgroundTheme = 'default' | 'kraft' | 'dark' | 'minimal';

export interface CoffeeBean {
  id: string;
  
  // 1. Country & Origin
  country: string;
  
  // 2. Chinese Name (Split)
  nameCnPrefix: string; // Light font
  nameCnSuffix: string; // Bold font
  
  // 3. English Name (Split)
  nameEnPrefix: string; // Light font
  nameEnSuffix: string; // Bold font
  
  // 4. Parameters
  process: string;
  roastLevel: string;
  altitude: string;
  
  // 5 & 6. Flavor Notes
  flavorCn: string;
  flavorEn: string;
  
  // 7. Acidity/Bitterness Slider (0-6: 酸3, 酸2, 酸1, 中性, 苦1, 苦2, 苦3)
  acidityValue: number; // 0-6，对应7个刻度 
  
  // 8. Brewing Method
  brewingMethod: 'espresso' | 'pour_over';

  // System/Print specific
  labelSize: LabelSize;
  backgroundTheme: BackgroundTheme;
  weight?: string;
  roastDate?: string;
  
  // Legacy/Computed fields for list view compatibility
  name?: string; 
  origin?: string;
}

export const INITIAL_BEAN: CoffeeBean = {
  id: 'new',
  country: '',
  nameCnPrefix: '',
  nameCnSuffix: '',
  nameEnPrefix: '',
  nameEnSuffix: '',
  process: '',
  roastLevel: '极浅烘', // 默认使用烘焙度列表的第一项
  altitude: '',
  flavorCn: '',
  flavorEn: '',
  acidityValue: 3, // 默认中性
  brewingMethod: 'pour_over',
  labelSize: '105x74',
  backgroundTheme: 'default',
  name: '', // Fallback
  origin: '' // Fallback
};

export interface PrintJobItem {
  id: string;
  bean: CoffeeBean;
  quantity: number;
}

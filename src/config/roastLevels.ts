// 烘焙度配置
// PNG文件应放在 public/roast_level/ 目录下，文件名为 {code}.png

export interface RoastLevel {
  code: string; // 烘焙度代码，用于匹配PNG文件名
  name: string; // 中文名称
}

export const ROAST_LEVELS: RoastLevel[] = [
  { code: 'light', name: '极浅烘' },
  { code: 'medium_light', name: '浅烘' },
  { code: 'medium', name: '中烘' },
  { code: 'medium_dark', name: '中深烘' },
  { code: 'dark', name: '深烘' },
  { code: 'very_dark', name: '极深烘' },
  { code: 'japanese_dark', name: '日式深烘' },
  { code: 'soe', name: 'SOE烘焙度' },
];

// 根据烘焙度代码获取烘焙度信息
export const getRoastLevelByCode = (code: string): RoastLevel | undefined => {
  return ROAST_LEVELS.find(r => r.code === code);
};

// 根据烘焙度名称获取烘焙度信息
export const getRoastLevelByName = (name: string): RoastLevel | undefined => {
  return ROAST_LEVELS.find(r => r.name === name);
};

// 获取烘焙度PNG路径
// 生产环境下，PNG 文件放在 public/roast_level/ 目录下，构建后可通过 /roast_level/{code}.png 访问
export const getRoastLevelSvgPath = (code: string): string => {
  return `/roast_level/${code}.png`;
};


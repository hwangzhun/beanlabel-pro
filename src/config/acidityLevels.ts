// 酸苦度配置
// PNG文件应放在 public/acid_and_bitter/ 目录下

export interface AcidityLevel {
  value: number; // 0-6，对应7个刻度
  code: string; // 用于匹配PNG文件名
  nameCn: string; // 中文名称
  nameEn: string; // 英文名称
}

export const ACIDITY_LEVELS: AcidityLevel[] = [
  { value: 0, code: 'acid_3', nameCn: '酸3', nameEn: 'Acid 3' },
  { value: 1, code: 'acid_2', nameCn: '酸2', nameEn: 'Acid 2' },
  { value: 2, code: 'acid_1', nameCn: '酸1', nameEn: 'Acid 1' },
  { value: 3, code: 'neutral', nameCn: '中性', nameEn: 'Neutral' },
  { value: 4, code: 'bitter_1', nameCn: '苦1', nameEn: 'Bitter 1' },
  { value: 5, code: 'bitter_2', nameCn: '苦2', nameEn: 'Bitter 2' },
  { value: 6, code: 'bitter_3', nameCn: '苦3', nameEn: 'Bitter 3' },
];

// 根据值获取酸苦度级别
export const getAcidityLevelByValue = (value: number): AcidityLevel | undefined => {
  return ACIDITY_LEVELS.find(level => level.value === value);
};

// 获取酸苦度PNG路径
// 生产环境下，PNG 文件放在 public/acid_and_bitter/ 目录下，构建后可通过 /acid_and_bitter/{code}.png 访问
export const getAcidityLevelPngPath = (code: string): string => {
  return `/acid_and_bitter/${code}.png`;
};


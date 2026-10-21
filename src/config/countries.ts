// 咖啡产国配置
// PNG文件应放在 public/flags/ 目录下，文件名为 {code}.png

export interface Country {
  code: string; // 国家代码，用于匹配PNG文件名
  nameCn: string; // 中文名称
  nameEn: string; // 英文名称
}

export const COUNTRIES: Country[] = [
  { code: 'ethiopia', nameCn: '埃塞俄比亚', nameEn: 'Ethiopia' },
  { code: 'colombia', nameCn: '哥伦比亚', nameEn: 'Colombia' },
  { code: 'brazil', nameCn: '巴西', nameEn: 'Brazil' },
  { code: 'guatemala', nameCn: '危地马拉', nameEn: 'Guatemala' },
  { code: 'costa_rica', nameCn: '哥斯达黎加', nameEn: 'Costa Rica' },
  { code: 'kenya', nameCn: '肯尼亚', nameEn: 'Kenya' },
  { code: 'tanzania', nameCn: '坦桑尼亚', nameEn: 'Tanzania' },
  { code: 'rwanda', nameCn: '卢旺达', nameEn: 'Rwanda' },
  { code: 'indonesia', nameCn: '印度尼西亚', nameEn: 'Indonesia' },
  { code: 'vietnam', nameCn: '越南', nameEn: 'Vietnam' },
  { code: 'panama', nameCn: '巴拿马', nameEn: 'Panama' },
  { code: 'honduras', nameCn: '洪都拉斯', nameEn: 'Honduras' }, 
  { code: 'peru', nameCn: '秘鲁', nameEn: 'Peru' },
  { code: 'ecuador', nameCn: '厄瓜多尔', nameEn: 'Ecuador' },
  { code: 'bolivia', nameCn: '玻利维亚', nameEn: 'Bolivia' },
  { code: 'jamaica', nameCn: '牙买加', nameEn: 'Jamaica' },
  { code: 'mexico', nameCn: '墨西哥', nameEn: 'Mexico' },
  { code: 'china', nameCn: '中国', nameEn: 'China' },
  { code: 'imprint', nameCn: '记忆拼配', nameEn: 'Imprint' },
];

// 根据国家代码获取国家信息
export const getCountryByCode = (code: string): Country | undefined => {
  return COUNTRIES.find(c => c.code === code);
};

// 根据国家名称（中文或英文）获取国家信息
export const getCountryByName = (name: string): Country | undefined => {
  return COUNTRIES.find(c => c.nameCn === name || c.nameEn === name);
};

// 获取国家PNG路径
// 生产环境下，PNG 文件放在 public/flags/ 目录下，构建后可通过 /flags/{code}.png 访问
export const getCountryFlagPath = (code: string): string => {
  return `/flags/${code}.png`;
};


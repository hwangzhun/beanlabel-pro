// 处理法配置
// PNG文件应放在 public/process/ 目录下，文件名为 {code}.png

export interface ProcessMethod {
  code: string; // 处理法代码，用于匹配PNG文件名
  name: string; // 中文名称
}

export const PROCESS_METHODS: ProcessMethod[] = [
  { code: 'washed', name: '水洗' },
  { code: 'double_washed', name: '双重水洗' },
  { code: 'anaerobic', name: '厌氧水洗' },
  { code: 'semi-anaerobic_natural', name: '日晒半厌氧' },
  { code: 'natural', name: '日晒' },
  { code: 'honey', name: '蜜处理' },
  { code: 'red_honey', name: '红蜜处理' },
  { code: 'cold_barrel_fermentation', name: '酒桶低温发酵' },
  { code: 'aged', name: '陈年处理' },
  { code: 'wet-hulled', name: '湿刨' },
];

// 根据处理法代码获取处理法信息
export const getProcessMethodByCode = (code: string): ProcessMethod | undefined => {
  return PROCESS_METHODS.find(p => p.code === code);
};

// 根据处理法名称获取处理法信息
export const getProcessMethodByName = (name: string): ProcessMethod | undefined => {
  return PROCESS_METHODS.find(p => p.name === name);
};

// 获取处理法PNG路径
// 生产环境下，PNG 文件放在 public/process/ 目录下，构建后可通过 /process/{code}.png 访问
export const getProcessMethodPath = (code: string): string => {
  return `/process/${code}.png`;
};


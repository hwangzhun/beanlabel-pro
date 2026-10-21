
// Label Configuration
// Canvas Resolution: 1240px x 877px (Approx 105mm x 74mm @ 300 DPI)
// 2列×4行布局：1240×2=2480px, 877×4=3508px，刚好填满A4 (2480×3508px)

export const LABEL_CONFIG = {
  width: 1240,
  height: 877,
  
  // Coordinates are (x, y) relative to the top-left corner in pixels.
  // Modify these values to adjust the position of elements.
  elements: {
    // 1. 国家 (Country Name + Flag)
    country: { x: 35, y: 80 },
    
    // 2. 中文名 (Prefix + Suffix)
    nameCn: { x: 35, y: 550 },
    
    // 3. 英文名 (Prefix + Suffix)
    nameEn: { x: 35, y: 320 },
    
    // 4. 参数组 (Process, Roast, Altitude) - 统一管理，自动排列
    params: { x: 35, y: 440 },
    
    // 4.5. 分割线（参数下方）
    divider: { x: 35, y: 575 },
    
    // 5. 中文风味
    flavorCn: { x: 35, y: 600 },
    
    // 6. 英文风味
    flavorEn: { x: 35, y: 706 },
    
    // 7. 酸苦度滑块
    slider: { x: 695, y: 780 },
    
    // 8. 冲煮方式图标
    method: { x: 690, y: 140 },
    
    // 9. 最佳赏味期限
    bestBefore: { x: 35, y: 830 },
    
    // 10. 烘焙日期
    roastDate: { x: 35, y: 800 },
    
    // 11. 重量（净含量）
    weight: { x: 527, y: 487 },
  },
  
  // Font sizes (in pixels) and other styles
  styles: {
    countryFontSize: 32,
    nameCnFontSize: 69,
    nameEnFontSize: 29,
    paramFontSize: 28,
    paramGap: 48, // 参数之间的间距（像素），对应 gap-12 (3rem = 48px)
    flavorCnFontSize: 42,
    flavorEnFontSize: 26,
    sliderWidth: 300,
    // 分割线样式
    dividerWidth: 600, // 宽度（像素）
    dividerHeight: 2, // 高度（像素）
    dividerColor: '#cccccc', // 颜色
    // 中文风味文本框尺寸（宽度为画布的一半，考虑起始位置）
    // flavorCnBoxWidth 将在组件中动态计算为 width / 2 - elements.flavorCn.x
    flavorCnBoxHeight: 100, // 初始高度，实际高度由内容决定
    // 中文风味文本框边框显示
    flavorCnBoxShowBorder: false, // 是否显示边框

    // 中文风味文字样式
    flavorCnFontWeight: 500, // 字重：normal(400), medium(500), semibold(600), bold(700)
    flavorCnLetterSpacing: 0, // 字距（像素）
    flavorCnLineHeight: 1.07, // 行距（倍数）

    // 英文风味文本框尺寸（宽度为画布的一半，考虑起始位置）
    // flavorEnBoxWidth 将在组件中动态计算为 width / 2 - elements.flavorCn.x
    flavorEnBoxHeight: 100, // 初始高度，实际高度由内容决定
    flavorGap: 8, // 中文和英文风味描述之间的间距（像素）
    // 英文风味文本框边框显示
    flavorEnBoxShowBorder: false, // 是否显示边框
    // 英文风味文字样式
    flavorEnFontWeight: 200, // 字重：normal(400), medium(500), semibold(600), bold(700)
    flavorEnLetterSpacing: 0, // 字距（像素）
    flavorEnLineHeight: 1.07, // 行距（倍数）
    // 最佳赏味期限文字样式
    bestBeforeFontSize: 20, // 字体大小（像素）
    bestBeforeFontWeight: 400, // 字重：normal(400), medium(500), semibold(600), bold(700)
    // 烘焙日期文字样式
    roastDateFontSize: 20, // 字体大小（像素）
    roastDateFontWeight: 400, // 字重：normal(400), medium(500), semibold(600), bold(700)
    
    // 重量文字样式
    weightFontSize: 29, // 字体大小（像素）
    weightFontWeight: 500, // 字重：normal(400), medium(500), semibold(600), bold(700)
    
    // 字体颜色配置
    colors: {
      // 中文名
      nameCnPrefix: '#000000', // coffee-900
      nameCnDivider: '#000000', // coffee-600
      nameCnSuffix: '#000000', // coffee-900
      // 英文名
      nameEnPrefix: '#000000', // coffee-700
      nameEnDivider: '#000000', // coffee-400
      nameEnSuffix: '#000000', // coffee-800
      // 参数文字
      paramText: '#000000', // coffee-800
      paramIcon: '#000000', // coffee-600
      // 中文风味描述
      flavorCn: '#000000', // coffee-900
      // 英文风味描述
      flavorEn: '#000000', // coffee-600
      // 冲煮方法
      methodIcon: '#000000', // coffee-800
      methodText: '#000000', // coffee-800
      // 重量
      weight: '#000000', // coffee-900
      // 烘焙日期
      roastDate: '#7e463a', // coffee-600
      // 最佳赏味期限
      bestBefore: '#000000', // 文字颜色
    },
  },
  
  // 字符数量限制配置
  maxLength: {
    // 中文名字符限制
    nameCnPrefix: 6,   // 中文前缀最大字符数
    nameCnSuffix: 6,   // 中文后缀最大字符数
    // 英文名字符限制
    nameEnPrefix: 20,  // 英文前缀最大字符数
    nameEnSuffix: 20,   // 英文后缀最大字符数
    // 风味描述字符限制
    flavorCn: 25,      // 中文风味描述最大字符数
    flavorEn: 100,     // 英文风味描述最大字符数
  },
  
  // 打印配置
  print: {
    maxQuantityPerAdd: 15, // 单次添加到队列的最大张数
  },
  
  // AI处理配置
  ai: {
    // AI处理风味描述的提示词
    // 用户输入中文，AI返回整理好的中文和英文描述
    flavorPrompt: '你是一个专业的咖啡风味描述翻译专家。用户会输入中文风味描述，你需要：1. 整理和规范化中文描述，每个词语之间用中文顿号(、)分隔；2. 将中文描述翻译成英文描述，保持原意不变，单词或词组的首字母要大写，每个词语之间用英文逗号(,+1个空格)分隔。你需要给我整理好的，格式为：中文描述：..... 和 英文描述：..... 两个部分，不要有其他内容。',
    // AI翻译英文名的提示词（留空等待用户填写）
    namePrompt: '你是咖啡豆标签英文名生成器。用户会提供中文前缀和中文后缀。请只输出两行，不要其他内容：英文前缀：<英文前缀>英文后缀：<英文后缀>。加入只有前缀或者只有后缀，则输出空。确保只有这两行，无额外文字或标点。',
  }
};

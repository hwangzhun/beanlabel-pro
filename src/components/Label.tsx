
import React from 'react';
import { CoffeeBean } from '../types';
import { LABEL_CONFIG } from '../config/labelConfig';
import { Mountain, Flame, Droplets, Bean, Coffee } from 'lucide-react';
import { getCountryByCode, getCountryFlagPath } from '../config/countries';
import { getRoastLevelByName, getRoastLevelSvgPath } from '../config/roastLevels';
import { getProcessMethodByName, getProcessMethodPath } from '../config/processMethods';
import { getAcidityLevelByValue, getAcidityLevelPngPath } from '../config/acidityLevels';
import { calculateAdjustedFontSize } from '../utils/textMeasurement';
import { LABEL_FONT_FAMILY } from '../utils/printAssets';

interface LabelProps {
  bean: CoffeeBean;
  scale?: number; // Optional external scale, though we handle auto-scaling via container mostly
  showBorder?: boolean;
}

export const Label: React.FC<LabelProps> = ({ bean, showBorder = true }) => {
  const { width, height, elements, styles } = LABEL_CONFIG;
  const [fontRevision, setFontRevision] = React.useState(0);
  React.useEffect(() => {
    let active = true;
    const refresh = () => { if (active) setFontRevision(value => value + 1); };
    document.fonts.ready.then(refresh);
    document.fonts.addEventListener('loadingdone', refresh);
    return () => { active = false; document.fonts.removeEventListener('loadingdone', refresh); };
  }, []);
  const [roastLevelSvgError, setRoastLevelSvgError] = React.useState(false);
  const [processMethodError, setProcessMethodError] = React.useState(false);
  const [altitudeImgError, setAltitudeImgError] = React.useState(false);
  const [acidityImgError, setAcidityImgError] = React.useState(false);
  
  // 用于测量中文风味描述的实际高度
  const flavorCnRef = React.useRef<HTMLDivElement>(null);
  const [flavorCnHeight, setFlavorCnHeight] = React.useState(0);
  
  // 计算风味描述框的宽度（画布的一半，考虑起始位置）
  const flavorBoxWidth = width / 2 - elements.flavorCn.x;

  // 严格避首尾的文本格式化
  // 规则：标点符号不能单独在行首或行尾
  const formatTextWithStrictLineBreak = (text: string, isChinese: boolean = true) => {
    if (!text) return null;
    
    // 中文标点符号：，。、；：？！""''（）【】《》
    // 英文标点符号：, . ; : ? ! " ' ( ) [ ] { }
    const chinesePunctuation = /[，。、；：？！""''（）【】《》]/g;
    const englishPunctuation = /[,.;:?!\"'()[\]{}]/g;
    const punctuation = isChinese ? chinesePunctuation : englishPunctuation;
    
    // 将文本按标点符号分割，但保留标点符号
    const parts: Array<{ text: string; isPunctuation: boolean }> = [];
    let lastIndex = 0;
    let match;
    
    // 重置正则表达式
    const regex = new RegExp(punctuation.source, punctuation.flags);
    
    while ((match = regex.exec(text)) !== null) {
      // 添加标点符号前的文本
      if (match.index > lastIndex) {
        parts.push({ text: text.substring(lastIndex, match.index), isPunctuation: false });
      }
      // 添加标点符号
      parts.push({ text: match[0], isPunctuation: true });
      lastIndex = match.index + match[0].length;
    }
    
    // 添加剩余文本
    if (lastIndex < text.length) {
      parts.push({ text: text.substring(lastIndex), isPunctuation: false });
    }
    
    // 如果文本中没有标点符号，直接返回
    if (parts.length === 0) {
      return <span>{text}</span>;
    }
    
    // 将文本和标点符号组合，确保标点符号不会单独在行首
    return parts.map((part, index) => {
      if (part.isPunctuation) {
        // 标点符号：使用零宽非断字符（\u2060）连接，确保不会单独在行首
        return <span key={index} style={{ whiteSpace: 'nowrap' }}>{part.text}</span>;
      } else {
        // 普通文本：可以换行
        return <span key={index}>{part.text}</span>;
      }
    });
  };
  
  // 测量中文风味描述的实际高度
  React.useLayoutEffect(() => {
    if (flavorCnRef.current) {
      const height = flavorCnRef.current.offsetHeight;
      setFlavorCnHeight(height);
    }
  }, [bean.flavorCn, flavorBoxWidth, fontRevision]);
  
  // 计算英文风味描述的位置（中文描述底部 + 间距）
  const flavorEnTop = elements.flavorCn.y + flavorCnHeight + styles.flavorGap;

  // 切换烘焙度时重置错误态（避免选到不存在的SVG后切回仍不显示）
  React.useEffect(() => {
    setRoastLevelSvgError(false);
  }, [bean.roastLevel]);

  // 切换处理法时重置错误态
  React.useEffect(() => {
    setProcessMethodError(false);
  }, [bean.process]);

  // 切换海拔时重置错误态
  React.useEffect(() => {
    setAltitudeImgError(false);
  }, [bean.altitude]);

  // 切换酸苦度时重置错误态
  React.useEffect(() => {
    setAcidityImgError(false);
  }, [bean.acidityValue]);

  // 生成名称的展示逻辑：空时显示占位，输入后只展示实际内容，并按规则显示分隔符
  const buildNameDisplay = (prefix: string, suffix: string, placeholderPrefix: string, placeholderSuffix: string) => {
    const safePrefix = prefix || '';
    const safeSuffix = suffix || '';
    const hasPrefix = safePrefix.trim().length > 0;
    const hasSuffix = safeSuffix.trim().length > 0;
    const hasAny = hasPrefix || hasSuffix;

    return {
      prefixText: hasPrefix ? safePrefix : (hasAny ? '' : placeholderPrefix),
      suffixText: hasSuffix ? safeSuffix : (hasAny ? '' : placeholderSuffix),
      divider: (hasPrefix && hasSuffix) || !hasAny ? '·' : ''
    };
  };

  const cnNameDisplay = buildNameDisplay(bean.nameCnPrefix, bean.nameCnSuffix, '前缀', '后缀');
  const enNameDisplay = buildNameDisplay(bean.nameEnPrefix, bean.nameEnSuffix, 'Prefix', 'Suffix');

  // 计算最大可用宽度（画面宽度的一半减去起始位置）
  const maxNameWidth = width / 2 - elements.nameCn.x;

  // 计算中文名调整后的字体大小
  const cnAdjustedFontSize = React.useMemo(() => {
    return calculateAdjustedFontSize(
      cnNameDisplay.prefixText || '',
      cnNameDisplay.suffixText || '',
      cnNameDisplay.divider || '',
      styles.nameCnFontSize,
      LABEL_FONT_FAMILY,
      300, // font-light
      700, // font-bold (分隔符)
      700, // font-bold (后缀)
      maxNameWidth - (cnNameDisplay.divider ? 16 : 0)
    );
  }, [cnNameDisplay.prefixText, cnNameDisplay.suffixText, cnNameDisplay.divider, styles.nameCnFontSize, maxNameWidth, fontRevision]);

  // 计算英文名调整后的字体大小
  const enAdjustedFontSize = React.useMemo(() => {
    return calculateAdjustedFontSize(
      enNameDisplay.prefixText || '',
      enNameDisplay.suffixText || '',
      enNameDisplay.divider || '',
      styles.nameEnFontSize,
      LABEL_FONT_FAMILY,
      300, // font-light
      700, // font-bold (分隔符)
      700, // font-bold (后缀)
      maxNameWidth - (enNameDisplay.divider ? 16 : 0)
    );
  }, [enNameDisplay.prefixText, enNameDisplay.suffixText, enNameDisplay.divider, styles.nameEnFontSize, maxNameWidth, fontRevision]);

  // 国家国旗组件
  const CountryFlag = () => {
    const [flagError, setFlagError] = React.useState(false);

    // 切换国家时重置错误态（同理避免错误态粘住）
    React.useEffect(() => {
      setFlagError(false);
    }, [bean.country]);
    
    if (!bean.country) {
      return (
        <div className="w-32 h-20 bg-gray-200 border border-gray-400 flex items-center justify-center text-[10px] text-gray-500 rounded-sm">
          FLAG
        </div>
      );
    }
    
    const country = getCountryByCode(bean.country);
    if (!country || flagError) {
      return (
        <div className="w-32 h-20 bg-gray-200 border border-gray-400 flex items-center justify-center text-[10px] text-gray-500 rounded-sm">
          FLAG
        </div>
      );
    }
    
    const flagPath = getCountryFlagPath(country.code);
    return (
      <img 
        key={flagPath}
        src={flagPath} 
        alt={country.nameCn}
        className="object-contain"
        onError={() => setFlagError(true)}
      />
    );
  };

  const ParamIconPlaceholder = ({ type }: { type: string }) => {
     // Using Lucide icons as placeholders for now
     if (type === 'process') return <Droplets size={24} style={{ color: styles.colors.paramIcon }} />;
     if (type === 'roast') return <Flame size={24} style={{ color: styles.colors.paramIcon }} />;
     if (type === 'altitude') return <Mountain size={24} style={{ color: styles.colors.paramIcon }} />;
     return <div className="w-6 h-6 bg-gray-300 rounded-full" />;
  };

  const MethodIcon = ({ method }: { method: 'espresso' | 'pour_over' }) => {
      const [imgError, setImgError] = React.useState(false);
      
      // 切换冲煮方法时重置错误态
      React.useEffect(() => {
        setImgError(false);
      }, [method]);
      
      const imgPath = method === 'espresso' 
        ? '/brewing_suggestions/espresso.png'
        : '/brewing_suggestions/pour-over.png';
      
      if (imgError) {
        return (
          <div className="flex flex-col items-center gap-1">
              <div className="w-24 h-24 border-2 border-coffee-800 rounded-full flex items-center justify-center bg-coffee-50">
                  {method === 'espresso' ? <Coffee size={48} style={{ color: styles.colors.methodIcon }}/> : <Bean size={48} style={{ color: styles.colors.methodIcon }}/>}
              </div>
              <span className="text-2xl font-bold uppercase tracking-widest" style={{ color: styles.colors.methodText }}>
                  {method === 'espresso' ? 'ESPRESSO' : 'POUR OVER'}
              </span>
          </div>
        );
      }
      
      return (
          <img 
              key={imgPath}
              src={imgPath} 
              alt={method === 'espresso' ? 'Espresso' : 'Pour Over'}
              // 保持原尺寸，不设置width/height
              onError={() => {
                  setImgError(true);
              }}
          />
      )
  };

  return (
    <div onErrorCapture={event => {
          if (event.target instanceof HTMLImageElement) event.currentTarget.setAttribute('data-asset-error', 'true');
        }} 
        className={`label-artwork relative bg-white overflow-hidden origin-top-left ${showBorder ? 'shadow-lg' : ''}`}
        style={{
            width: `${width}px`,
            height: `${height}px`,
            // If used in a context that expects the CSS mm size, we might need to handle scaling externally
            // But for the 'Preview' and 'Editor', we usually wrap this component in a scale-down container.
        }}
    >
        {/* Debug Grid/Border */}
        {showBorder && <div className="absolute inset-0 border border-gray-200 pointer-events-none z-50"></div>}

        {/* 1. Country */}
        <div 
            className="absolute flex items-center"
            style={{ left: elements.country.x, top: elements.country.y }}
        >
            <CountryFlag />
        </div>

        {/* 2. CN Name */}
        <div 
            className="absolute flex items-baseline"
            style={{ left: elements.nameCn.x, bottom: elements.nameCn.y }}
        >
            {cnNameDisplay.prefixText && (
              <span className="font-sans font-light" style={{ fontSize: cnAdjustedFontSize, color: styles.colors.nameCnPrefix }}>
                  {cnNameDisplay.prefixText}
              </span>
            )}
            {cnNameDisplay.divider && (
              <span className="mx-2 font-bold" style={{ fontSize: cnAdjustedFontSize, color: styles.colors.nameCnDivider }}>
                  {cnNameDisplay.divider}
              </span>
            )}
            {cnNameDisplay.suffixText && (
              <span className="font-sans font-bold" style={{ fontSize: cnAdjustedFontSize, color: styles.colors.nameCnSuffix }}>
                  {cnNameDisplay.suffixText}
              </span>
            )}
        </div>

        {/* 3. EN Name */}
        <div 
            className="absolute flex items-baseline"
            style={{ left: elements.nameEn.x, top: elements.nameEn.y }}
        >
            {enNameDisplay.prefixText && (
              <span className="font-serif font-light" style={{ fontSize: enAdjustedFontSize, color: styles.colors.nameEnPrefix }}>
                  {enNameDisplay.prefixText}
              </span>
            )}
            {enNameDisplay.divider && (
              <span className="mx-2 font-bold" style={{ fontSize: enAdjustedFontSize, color: styles.colors.nameEnDivider }}>
                  {enNameDisplay.divider}
              </span>
            )}
            {enNameDisplay.suffixText && (
              <span className="font-serif font-bold" style={{ fontSize: enAdjustedFontSize, color: styles.colors.nameEnSuffix }}>
                  {enNameDisplay.suffixText}
              </span>
            )}
        </div>

        {/* 4. Parameters */}
        <div 
            className="absolute flex items-center"
            style={{ 
                left: elements.params.x, 
                top: elements.params.y,
                gap: `${styles.paramGap}px`
            }}
        >
            {/* 处理法 - 条件渲染，为空时不显示 */}
            {bean.process && bean.process.trim() !== '' && (
                <div className="flex items-center gap-3">
                    {processMethodError ? (
                        <>
                            <ParamIconPlaceholder type="process" />
                            <span className="font-sans font-medium" style={{ fontSize: styles.paramFontSize, color: styles.colors.paramText }}>
                                {bean.process}
                            </span>
                        </>
                    ) : (() => {
                        const processMethod = getProcessMethodByName(bean.process);
                        if (!processMethod) {
                            return (
                                <>
                                    <ParamIconPlaceholder type="process" />
                                    <span className="font-sans font-medium" style={{ fontSize: styles.paramFontSize, color: styles.colors.paramText }}>
                                        {bean.process}
                                    </span>
                                </>
                            );
                        }
                        const processPath = getProcessMethodPath(processMethod.code);
                        return (
                            <img 
                                key={processPath}
                                src={processPath} 
                                alt={processMethod.name}
                                className="object-contain"
                                onError={() => {
                                    setProcessMethodError(true);
                                }}
                            />
                        );
                    })()}
                </div>
            )}
            
            {/* 烘焙度 - 条件渲染，为空时不显示 */}
            {bean.roastLevel && (
                <div className="flex items-center gap-3">
                    {roastLevelSvgError ? (
                        <>
                            <ParamIconPlaceholder type="roast" />
                            <span className="font-sans font-medium" style={{ fontSize: styles.paramFontSize, color: styles.colors.paramText }}>
                                {bean.roastLevel || "烘焙度"}
                            </span>
                        </>
                    ) : (() => {
                        const roastLevel = getRoastLevelByName(bean.roastLevel);
                        if (!roastLevel) {
                            return (
                                <>
                                    <ParamIconPlaceholder type="roast" />
                                    <span className="font-sans font-medium" style={{ fontSize: styles.paramFontSize, color: styles.colors.paramText }}>
                                        {bean.roastLevel}
                                    </span>
                                </>
                            );
                        }
                        const svgPath = getRoastLevelSvgPath(roastLevel.code);
                        return (
                            <img 
                                key={svgPath}
                                src={svgPath} 
                                alt={roastLevel.name}
                                className="object-contain"
                                onError={() => {
                                    setRoastLevelSvgError(true);
                                }}
                            />
                        );
                    })()}
                </div>
            )}
            
            {/* 海拔 - 条件渲染，为空时不显示 */}
            {bean.altitude && bean.altitude.trim() !== '' && (
                <div className="flex items-center gap-3">
                    {altitudeImgError ? (
                        <>
                            <ParamIconPlaceholder type="altitude" />
                            <span className="font-sans font-medium" style={{ fontSize: styles.paramFontSize, color: styles.colors.paramText }}>
                                {bean.altitude ? `${bean.altitude}m` : "海拔"}
                            </span>
                        </>
                    ) : (
                        <div className="relative inline-block">
                            <img 
                                key="/other/altitude.png"
                                src="/other/altitude.png" 
                                alt="海拔"
                                className="object-contain"
                                onError={() => {
                                    setAltitudeImgError(true);
                                }}
                            />
                            {bean.altitude && (
                                <div 
                                    className="absolute left-1/2 transform -translate-x-1/2 font-sans font-medium"
                                    style={{ 
                                        top: '6px',
                                        fontSize: styles.paramFontSize,
                                        color: styles.colors.paramText,
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {bean.altitude}m
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* 4.5. Divider */}
        <div 
            className="absolute"
            style={{ 
                left: elements.divider.x, 
                top: elements.divider.y,
                width: styles.dividerWidth,
                height: styles.dividerHeight,
                backgroundColor: styles.dividerColor
            }}
        />

        {/* 5. Flavor CN */}
        <div 
            ref={flavorCnRef}
            className="absolute"
            style={{ 
                left: elements.flavorCn.x, 
                top: elements.flavorCn.y,
                width: flavorBoxWidth,
                minHeight: styles.flavorCnBoxHeight
            }}
        >
            <div 
                className={`w-full rounded-lg overflow-hidden ${styles.flavorCnBoxShowBorder ? 'border-2 border-coffee-800' : ''}`}
                style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    padding: 0
                }}
            >
                <p 
                    className="font-serif" 
                    style={{ 
                        fontSize: styles.flavorCnFontSize,
                        fontWeight: styles.flavorCnFontWeight,
                        color: styles.colors.flavorCn,
                        letterSpacing: `${styles.flavorCnLetterSpacing}px`,
                        lineHeight: styles.flavorCnLineHeight,
                        margin: 0,
                        padding: 0,
                        wordBreak: 'keep-all',
                        overflowWrap: 'break-word',
                        whiteSpace: 'normal',
                        width: '100%'
                    }}
                >
                    {formatTextWithStrictLineBreak(bean.flavorCn || "风味描述中文...", true) || bean.flavorCn || "风味描述中文..."}
                </p>
            </div>
        </div>

        {/* 6. Flavor EN - 位置根据中文描述高度动态计算 */}
        <div 
            className="absolute"
            style={{ 
                left: elements.flavorEn.x, 
                top: flavorEnTop,
                width: flavorBoxWidth,
                minHeight: styles.flavorEnBoxHeight
            }}
        >
            <div 
                className={`w-full rounded-lg overflow-hidden ${styles.flavorEnBoxShowBorder ? 'border-2 border-coffee-800' : ''}`}
                style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    padding: 0
                }}
            >
                <p 
                    className="font-serif" 
                    style={{ 
                        fontSize: styles.flavorEnFontSize,
                        fontWeight: styles.flavorEnFontWeight,
                        color: styles.colors.flavorEn,
                        letterSpacing: `${styles.flavorEnLetterSpacing}px`,
                        lineHeight: styles.flavorEnLineHeight,
                        margin: 0,
                        padding: 0,
                        wordBreak: 'keep-all',
                        overflowWrap: 'break-word',
                        whiteSpace: 'normal',
                        width: '100%'
                    }}
                >
                    {formatTextWithStrictLineBreak(bean.flavorEn || "Flavor notes in English...", false) || bean.flavorEn || "Flavor notes in English..."}
                </p>
            </div>
        </div>

        {/* 7. 酸苦度PNG图片 */}
        <div 
            className="absolute"
            style={{ left: elements.slider.x, top: elements.slider.y }}
        >
            {(() => {
              const acidityLevel = getAcidityLevelByValue(bean.acidityValue);
              if (!acidityLevel || acidityImgError) {
                return null;
              }
              const imgPath = getAcidityLevelPngPath(acidityLevel.code);
              return (
                <img 
                  key={imgPath}
                  src={imgPath} 
                  alt={acidityLevel.nameCn}
                  // 保持原尺寸，不设置width/height
                  onError={() => {
                    setAcidityImgError(true);
                  }}
                />
              );
            })()}
        </div>

        {/* 8. Method */}
        <div 
            className="absolute"
            style={{ left: elements.method.x, top: elements.method.y }}
        >
            <MethodIcon method={bean.brewingMethod} />
        </div>

        {/* 9. 最佳赏味期限 */}
        <div 
            className="absolute"
            style={{ 
                left: elements.bestBefore.x, 
                top: elements.bestBefore.y
            }}
        >
            <span 
                className="font-sans"
                style={{ 
                    fontSize: styles.bestBeforeFontSize,
                    fontWeight: styles.bestBeforeFontWeight,
                    color: styles.colors.bestBefore
                }}
            >
                最佳赏味期限:请于2个月内享用
            </span>
        </div>

        {/* 10. 烘焙日期 */}
        {bean.roastDate && (
            <div 
                className="absolute"
                style={{ 
                    left: elements.roastDate.x, 
                    top: elements.roastDate.y
                }}
            >
                <span 
                    className="font-sans"
                    style={{ 
                        fontSize: styles.roastDateFontSize,
                        fontWeight: styles.roastDateFontWeight,
                        color: styles.colors.roastDate
                    }}
                >
                    烘焙日期：{(() => {
                        // 格式化日期为年月日格式
                        const date = new Date(bean.roastDate);
                        if (isNaN(date.getTime())) {
                            // 如果不是有效日期，直接显示原文本
                            return bean.roastDate;
                        }
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        return `${year}年${month}月${day}日`;
                    })()}
                </span>
            </div>
        )}

        {/* Extra: Weight (Print Instance specific) */}
        {bean.weight && (
             <div 
                 className="absolute text-right"
                 style={{ 
                     left: elements.weight.x, 
                     top: elements.weight.y 
                 }}
             >
                 <div 
                     style={{ 
                         fontSize: styles.weightFontSize,
                         fontWeight: styles.weightFontWeight,
                         color: styles.colors.weight 
                     }}
                 >
                     {bean.weight}
                 </div>
             </div>
        )}
    </div>
  );
};

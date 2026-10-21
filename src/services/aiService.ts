import { SILICONFLOW_CONFIG } from '../config/api';
import { LABEL_CONFIG } from '../config/labelConfig';

export interface AIResponse {
  success: boolean;
  flavorCn?: string;
  flavorEn?: string;
  error?: string;
}

export interface AINameResponse {
  success: boolean;
  nameEnPrefix?: string;
  nameEnSuffix?: string;
  error?: string;
}

/**
 * 解析AI返回的文本，提取中文描述和英文描述
 * @param text AI返回的原始文本
 * @returns 解析后的中文和英文描述
 */
function parseAIResponse(text: string): { flavorCn: string; flavorEn: string } | null {
  const cleanedText = text.trim();
  
  // 方法1：尝试匹配 "中文描述：..." 和 "英文描述：..." 的格式（支持中文冒号和英文冒号）
  const cnMatch1 = cleanedText.match(/中文描述[：:]\s*([^]*?)(?=\s*(?:英文描述|$))/s);
  const enMatch1 = cleanedText.match(/英文描述[：:]\s*([^]*?)$/s);
  
  if (cnMatch1 && enMatch1) {
    return {
      flavorCn: cnMatch1[1].trim(),
      flavorEn: enMatch1[1].trim(),
    };
  }

  // 方法2：尝试匹配换行分隔的格式
  const lines = cleanedText.split(/[\n\r]+/).map(line => line.trim()).filter(line => line);
  
  let flavorCn = '';
  let flavorEn = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 匹配中文描述
    if (line.match(/^中文描述[：:]/) || line.match(/^中文[：:]/)) {
      const cnContent = line.replace(/^中文描述[：:]\s*/, '').replace(/^中文[：:]\s*/, '').trim();
      if (cnContent) {
        flavorCn = cnContent;
      } else if (i + 1 < lines.length && !lines[i + 1].match(/英文/)) {
        // 如果当前行只有"中文描述："，下一行是内容
        flavorCn = lines[i + 1];
        i++; // 跳过下一行
      }
    }
    
    // 匹配英文描述
    if (line.match(/^英文描述[：:]/) || line.match(/^英文[：:]/)) {
      const enContent = line.replace(/^英文描述[：:]\s*/, '').replace(/^英文[：:]\s*/, '').trim();
      if (enContent) {
        flavorEn = enContent;
      } else if (i + 1 < lines.length) {
        // 如果当前行只有"英文描述："，下一行是内容
        flavorEn = lines[i + 1];
        i++; // 跳过下一行
      }
    }
  }

  if (flavorCn && flavorEn) {
    return { flavorCn, flavorEn };
  }

  return null;
}

function parseAINameResponse(text: string): { nameEnPrefix: string; nameEnSuffix: string } | null {
  const cleanedText = text.trim();

  // 先按行解析，更稳妥地兼容「两行输出」的情况
  const lines = cleanedText
    .split(/[\n\r]+/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  let nameEnPrefix = '';
  let nameEnSuffix = '';

  for (const line of lines) {
    if (/^英文前缀[：:]/.test(line)) {
      nameEnPrefix = line.replace(/^英文前缀[：:]\s*/, '').trim();
    } else if (/^英文后缀[：:]/.test(line)) {
      nameEnSuffix = line.replace(/^英文后缀[：:]\s*/, '').trim();
    }
  }

  // 只要至少识别到一行，就返回（另一行保持为空字符串）
  if (nameEnPrefix !== '' || nameEnSuffix !== '') {
    return { nameEnPrefix, nameEnSuffix };
  }

  // 兜底：尝试匹配单行 "英文名：前缀 · 后缀" 的格式
  const fullMatch = cleanedText.match(/英文名[：:]\s*([^·]+)[·.、,，-](.+)$/);
  if (fullMatch) {
    return {
      nameEnPrefix: fullMatch[1].trim(),
      nameEnSuffix: fullMatch[2].trim(),
    };
  }

  return null;
}

/**
 * 使用硅基流动API处理风味描述
 * 用户输入中文，AI返回整理好的中文和英文描述
 * @param inputText 用户输入的中文文本
 * @returns 处理后的中文和英文描述
 */
export async function processFlavorWithAI(inputText: string): Promise<AIResponse> {
  try {
    // 检查API Key
    if (!SILICONFLOW_CONFIG.apiKey) {
      return {
        success: false,
        error: '未配置硅基流动API Key，请在 .env.local 文件中设置 VITE_SILICONFLOW_API_KEY',
      };
    }

    // 检查输入文本
    if (!inputText || inputText.trim().length === 0) {
      return {
        success: false,
        error: '请输入要处理的风味描述文本',
      };
    }

    // 获取提示词
    const prompt = LABEL_CONFIG.ai.flavorPrompt;
    if (!prompt || prompt.trim().length === 0) {
      return {
        success: false,
        error: '提示词未配置，请在 labelConfig.ts 中配置 flavorPrompt',
      };
    }

    // 构建请求消息
    const messages = [
      {
        role: 'system',
        content: prompt,
      },
      {
        role: 'user',
        content: inputText,
      },
    ];

    // 调用硅基流动API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SILICONFLOW_CONFIG.timeout);

    try {
      const response = await fetch(`${SILICONFLOW_CONFIG.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SILICONFLOW_CONFIG.apiKey}`,
        },
        body: JSON.stringify({
          model: SILICONFLOW_CONFIG.model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 1000,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      const result = data.choices?.[0]?.message?.content?.trim();

      if (!result) {
        throw new Error('AI返回结果为空');
      }

      // 解析AI返回的结果，提取中文和英文描述
      const parsed = parseAIResponse(result);
      if (!parsed) {
        throw new Error('AI返回格式不正确，无法解析中文描述和英文描述');
      }

      return {
        success: true,
        flavorCn: parsed.flavorCn,
        flavorEn: parsed.flavorEn,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('请求超时，请稍后重试');
      }
      throw error;
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
}

/**
 * 使用硅基流动API翻译英文名
 * 输入中文前缀/后缀，返回英文前缀/后缀
 */
export async function processNameWithAI(
  nameCnPrefix: string,
  nameCnSuffix: string
): Promise<AINameResponse> {
  try {
    if (!SILICONFLOW_CONFIG.apiKey) {
      return {
        success: false,
        error: '未配置硅基流动API Key，请在 .env.local 文件中设置 VITE_SILICONFLOW_API_KEY',
      };
    }

    if ((!nameCnPrefix || nameCnPrefix.trim().length === 0) && (!nameCnSuffix || nameCnSuffix.trim().length === 0)) {
      return { success: false, error: '请先输入中文名称，再尝试AI翻译英文名' };
    }

    const prompt = LABEL_CONFIG.ai.namePrompt;
    if (!prompt || prompt.trim().length === 0) {
      return {
        success: false,
        error: '提示词未配置，请在 labelConfig.ts 中配置 namePrompt',
      };
    }

    const userContent = `中文前缀：${nameCnPrefix || ''}\n中文后缀：${nameCnSuffix || ''}`;

    const messages = [
      {
        role: 'system',
        content: prompt,
      },
      {
        role: 'user',
        content: userContent,
      },
    ];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SILICONFLOW_CONFIG.timeout);

    try {
      const response = await fetch(`${SILICONFLOW_CONFIG.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SILICONFLOW_CONFIG.apiKey}`,
        },
        body: JSON.stringify({
          model: SILICONFLOW_CONFIG.model,
          messages: messages,
          temperature: 0.4,
          max_tokens: 400,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      const result = data.choices?.[0]?.message?.content?.trim();

      if (!result) {
        throw new Error('AI返回结果为空');
      }

      const parsed = parseAINameResponse(result);
      if (!parsed) {
        throw new Error('AI返回格式不正确，无法解析英文前缀和英文后缀');
      }

      return {
        success: true,
        nameEnPrefix: parsed.nameEnPrefix,
        nameEnSuffix: parsed.nameEnSuffix,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('请求超时，请稍后重试');
      }
      throw error;
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
}

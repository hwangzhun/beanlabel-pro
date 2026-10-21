
import React from 'react';
import { Alert, Badge, Button, Group, Select, SimpleGrid, Slider, Stack, Text, Textarea, TextInput, Title } from '@mantine/core';
import { CoffeeBean } from '../types';
import { MapPin, Coffee, Sliders, Type, Sparkles } from 'lucide-react';
import { COUNTRIES } from '../config/countries';
import { ROAST_LEVELS } from '../config/roastLevels';
import { PROCESS_METHODS } from '../config/processMethods';
import { ACIDITY_LEVELS, getAcidityLevelByValue } from '../config/acidityLevels';
import { processFlavorWithAI, processNameWithAI } from '../services/aiService';
import { LABEL_CONFIG } from '../config/labelConfig';

interface BeanFormProps {
  bean: CoffeeBean;
  onChange: (bean: CoffeeBean) => void;
  onProcessingChange: (processing: boolean) => void;
  saving?: boolean;
}

export const BeanForm: React.FC<BeanFormProps> = ({ bean, onChange, onProcessingChange, saving }) => {
  const [isProcessingFlavorAI, setIsProcessingFlavorAI] = React.useState(false);
  const [flavorAiError, setFlavorAiError] = React.useState<string | null>(null);
  const [isProcessingNameAI, setIsProcessingNameAI] = React.useState(false);
  const [nameAiError, setNameAiError] = React.useState<string | null>(null);
  
  const processing = isProcessingFlavorAI || isProcessingNameAI;
  React.useEffect(() => { onProcessingChange(processing); }, [processing, onProcessingChange]);

  // 获取字符限制配置
  const { maxLength } = LABEL_CONFIG;

  const patch = (updates: Partial<CoffeeBean>) => onChange({ ...bean, ...updates });

  // 同步旧的 name 字段，且仅在前后缀都存在时才带分隔符
  const updateName = (prefix: string, suffix: string, isCn: boolean) => {
      setNameAiError(null);
      const safePrefix = prefix ?? '';
      const safeSuffix = suffix ?? '';
      const hasPrefix = safePrefix.trim().length > 0;
      const hasSuffix = safeSuffix.trim().length > 0;
      const combined = hasPrefix && hasSuffix
        ? `${safePrefix}·${safeSuffix}`
        : (safePrefix || safeSuffix || '');

      const updates: Partial<CoffeeBean> = isCn 
        ? { nameCnPrefix: safePrefix, nameCnSuffix: safeSuffix, name: combined }
        : { nameEnPrefix: safePrefix, nameEnSuffix: safeSuffix };

      onChange({ ...bean, ...updates });
  };

  // AI处理风味描述（输入中文，返回中文和英文）
  const handleFlavorAIProcess = async () => {
    if (!bean.flavorCn || bean.flavorCn.trim().length === 0) {
      setFlavorAiError('请先输入要处理的中文风味描述文本');
      return;
    }

    setIsProcessingFlavorAI(true);
    setFlavorAiError(null);

    try {
      const result = await processFlavorWithAI(bean.flavorCn);
      if (result.success && result.flavorCn && result.flavorEn) {
        // 同时更新中文和英文描述
        onChange({ 
          ...bean, 
          flavorCn: result.flavorCn,
          flavorEn: result.flavorEn
        });
      } else {
        setFlavorAiError(result.error || 'AI处理失败');
      }
    } catch (error) {
      setFlavorAiError(error instanceof Error ? error.message : 'AI处理出错');
    } finally {
      setIsProcessingFlavorAI(false);
    }
  };

  const handleNameAIProcess = async () => {
    const hasCnName = (bean.nameCnPrefix && bean.nameCnPrefix.trim().length > 0) || (bean.nameCnSuffix && bean.nameCnSuffix.trim().length > 0);
    if (!hasCnName) {
      setNameAiError('请先填写中文名，再使用AI翻译英文名');
      return;
    }

    setIsProcessingNameAI(true);
    setNameAiError(null);

    try {
      const result = await processNameWithAI(bean.nameCnPrefix, bean.nameCnSuffix);
      if (result.success && result.nameEnPrefix !== undefined && result.nameEnSuffix !== undefined) {
        updateName(result.nameEnPrefix, result.nameEnSuffix, false);
      } else {
        setNameAiError(result.error || 'AI翻译失败');
      }
    } catch (error) {
      setNameAiError(error instanceof Error ? error.message : 'AI翻译出错');
    } finally {
      setIsProcessingNameAI(false);
    }
  };

  return <fieldset disabled={saving || isProcessingFlavorAI || isProcessingNameAI} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}><Stack gap={0}>
    <section className="manage-form-section">
      <Stack gap="md">
        <Group gap="xs"><Type size={17} /><Title order={2} size="h5">咖啡豆名称</Title></Group>
        <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="sm">
          <TextInput label="中文名前缀" placeholder="前缀 (Light)" maxLength={maxLength.nameCnPrefix} value={bean.nameCnPrefix} onChange={e => updateName(e.target.value, bean.nameCnSuffix, true)} />
          <TextInput label="中文名后缀" placeholder="后缀 (Bold)" maxLength={maxLength.nameCnSuffix} value={bean.nameCnSuffix} onChange={e => updateName(bean.nameCnPrefix, e.target.value, true)} />
        </SimpleGrid>
        <Group justify="space-between"><Text size="sm" fw={500}>英文名称</Text><Button size="xs" variant="light" leftSection={<Sparkles size={14} />} onClick={handleNameAIProcess} loading={isProcessingNameAI} disabled={!bean.nameCnPrefix.trim() && !bean.nameCnSuffix.trim()}>AI翻译</Button></Group>
        <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="sm">
          <TextInput aria-label="英文名前缀" placeholder="Prefix" maxLength={maxLength.nameEnPrefix} value={bean.nameEnPrefix} onChange={e => updateName(e.target.value, bean.nameEnSuffix, false)} />
          <TextInput aria-label="英文名后缀" placeholder="Suffix" maxLength={maxLength.nameEnSuffix} value={bean.nameEnSuffix} onChange={e => updateName(bean.nameEnPrefix, e.target.value, false)} />
        </SimpleGrid>
        {nameAiError && <Alert color="red" role="alert">{nameAiError}</Alert>}
      </Stack>
    </section>
    <section className="manage-form-section">
      <Stack gap="md">
        <Group gap="xs"><MapPin size={17} /><Title order={2} size="h5">产地与处理方式</Title></Group>
        <Select name="country" label="国家 / 产地" placeholder="请选择国家/产地" searchable clearable value={bean.country || null} data={COUNTRIES.map(c => ({ value: c.code, label: `${c.nameCn} (${c.nameEn})` }))} onChange={value => patch({ country: value || '' })} />
        <SimpleGrid cols={{ base: 1, xs: 2 }}>
          <Select name="process" label="处理法" placeholder="请选择处理法" searchable clearable value={bean.process || null} data={PROCESS_METHODS.map(m => m.name)} onChange={value => patch({ process: value || '' })} description="留空则不在标签中显示" />
          <TextInput name="altitude" label="海拔" rightSection={<Text size="sm" c="dimmed">m</Text>} value={bean.altitude} onChange={e => patch({ altitude: e.target.value })} />
        </SimpleGrid>
      </Stack>
    </section>
    <section className="manage-form-section">
      <Stack gap="md">
        <Group gap="xs"><Coffee size={17} /><Title order={2} size="h5">风味与烘焙</Title></Group>
        <Select name="roastLevel" label="烘焙度" value={bean.roastLevel} data={ROAST_LEVELS.map(l => l.name)} onChange={value => { if (value) patch({ roastLevel: value }); }} />
        <Group justify="space-between"><Text size="sm" fw={500}>风味描述（中文）</Text><Button size="xs" variant="light" leftSection={<Sparkles size={14} />} onClick={handleFlavorAIProcess} loading={isProcessingFlavorAI} disabled={!bean.flavorCn?.trim()}>AI处理</Button></Group>
        <Textarea name="flavorCn" aria-label="风味描述（中文）" placeholder="输入中文风味描述..." rows={3} maxLength={maxLength.flavorCn} value={bean.flavorCn || ''} onChange={e => { patch({ flavorCn: e.target.value }); setFlavorAiError(null); }} error={flavorAiError} />
        <Textarea name="flavorEn" label="风味描述（英文）" placeholder="输入英文风味描述..." rows={3} maxLength={maxLength.flavorEn} value={bean.flavorEn || ''} onChange={e => patch({ flavorEn: e.target.value })} />
        <Group justify="space-between"><Text size="sm" fw={500}>酸苦度</Text><Badge variant="light">{getAcidityLevelByValue(bean.acidityValue)?.nameCn}</Badge></Group>
        <Slider aria-label="酸苦度" min={0} max={6} step={1} value={bean.acidityValue} onChange={value => patch({ acidityValue: value })} marks={ACIDITY_LEVELS.map(l => ({ value: l.value, label: l.nameCn }))} label={value => getAcidityLevelByValue(value)?.nameCn} mb="lg" mx="xs" />
      </Stack>
    </section>
    <section className="manage-form-section">
      <Stack gap="md">
        <Group gap="xs"><Sliders size={17} /><Title order={2} size="h5">标签规格与冲煮</Title></Group>
        <SimpleGrid cols={{ base: 1, xs: 2 }}>
        <Select label="标签尺寸" value={bean.labelSize} data={[{ value: '105x74', label: '105 × 74 mm · 横版' }, { value: '60x85', label: '60 × 85 mm · 竖版' }]} onChange={value => { if (value) patch({ labelSize: value as CoffeeBean['labelSize'] }); }} />
        <Select label="冲煮建议" value={bean.brewingMethod} data={[{ value: 'pour_over', label: '手冲 (Pour-over)' }, { value: 'espresso', label: '意式 (Espresso)' }]} onChange={value => { if (value) patch({ brewingMethod: value as CoffeeBean['brewingMethod'] }); }} />
        </SimpleGrid>
        <Text size="xs" c="dimmed">烘焙日期、净含量和打印数量在加入队列时设置。</Text>
      </Stack>
    </section>
  </Stack></fieldset>;
};

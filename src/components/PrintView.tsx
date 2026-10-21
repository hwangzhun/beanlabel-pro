import React, { useEffect, useRef, useState } from 'react';
import { Alert, Anchor, Badge, Button, Card, Group, Loader, Modal, NumberInput, Stack, Tabs, Text, TextInput, Title } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import type { CoffeeBean, PrintJobItem } from '../types';
import { A4PrintLayout } from './A4PrintLayout';
import { ResponsiveScalePreview } from './ResponsiveScalePreview';
import { Download, Plus, Edit3, Eye, Trash2, LayoutGrid, Printer, Search } from 'lucide-react';
import { templateService } from '../services/db';
import { createId } from '../utils/id';
import { setNavigationGuard } from '../utils/navigationGuard';
import { exportQueuePdf } from '../services/exportPdf';
import { LABEL_CONFIG } from '../config/labelConfig';
import { paginateQueue } from '../utils/printLayout';
import { localToday, QUEUE_STORAGE_KEY, restorePrintQueue } from '../utils/printQueue';
import { matchesTemplate, templateName, templateOrigin } from '../utils/templateDisplay';

const tabs = [{ id: 'templates', label: '选择标签', icon: LayoutGrid }, { id: 'queue', label: '打印队列', icon: Printer }, { id: 'preview', label: '预览', icon: Eye }] as const;

export const PrintView: React.FC = () => {
  const [templates, setTemplates] = useState<CoffeeBean[]>([]);
  const [queue, setQueue] = useState<PrintJobItem[]>(restorePrintQueue);
  const [activeTab, setActiveTab] = useState<'templates' | 'queue' | 'preview'>('templates');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [storageError, setStorageError] = useState('');
  const [parameters, setParameters] = useState<{ bean: CoffeeBean; jobId?: string } | null>(null);
  const [quantity, setQuantity] = useState<number | string>(1);
  const [parameterError, setParameterError] = useState('');
  const submittingRef = useRef(false);
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState(localToday());
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const exportingRef = useRef(false);
  const urlRef = useRef('');
  const downloadName = useRef('');

  const loadTemplates = async () => {
    setLoading(true); setLoadError('');
    try { setTemplates(await templateService.getAll()); }
    catch (err) { setLoadError(`标签加载失败：${err instanceof Error ? err.message : '请重试'}`); }
    finally { setLoading(false); }
  };
  useEffect(() => { void loadTemplates(); }, []);
  useEffect(() => setNavigationGuard(() => !exportingRef.current), []);
  useEffect(() => {
    if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = ''; setDownloadUrl(''); }
    try { sessionStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue)); setStorageError(''); }
    catch { setStorageError('浏览器无法保存队列，刷新或离开后可能丢失。当前仍可下载 PDF。'); }
  }, [queue]);
  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);

  const openParameters = (bean: CoffeeBean, job?: PrintJobItem) => {
    setParameterError(''); submittingRef.current = false;
    setParameters({ bean, jobId: job?.id });
    setQuantity(job?.quantity || 1);
    setWeight((bean.weight || '').replace(/g$/, ''));
    setDate(job ? bean.roastDate || localToday() : localToday());
  };
  const saveParameters = (event: React.FormEvent) => {
    event.preventDefault();
    if (!parameters || exportingRef.current || submittingRef.current) return;
    const count = Number(quantity);
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isSafeInteger(count) || count < 1 || count > LABEL_CONFIG.print.maxQuantityPerAdd || (weight.trim() && (!Number.isSafeInteger(Number(weight)) || Number(weight) < 0))) {
      setParameterError('请填写有效的烘焙日期、非负整数净含量和允许范围内的打印数量。'); return;
    }
    submittingRef.current = true;
    const bean = { ...parameters.bean, roastDate: date, weight: `${weight.trim() || '0'}g` };
    setQueue(current => parameters.jobId
      ? current.map(item => item.id === parameters.jobId ? { ...item, bean, quantity: count } : item)
      : [...current, { id: createId(), bean, quantity: count }]);
    setParameters(null); setActiveTab('queue'); setError('');
  };
  const removeOne = (uniqueId: string) => {
    if (exportingRef.current) return;
    const jobId = uniqueId.slice(0, uniqueId.lastIndexOf('-'));
    setQueue(current => current.flatMap(item => item.id !== jobId ? [item] : item.quantity > 1 ? [{ ...item, quantity: item.quantity - 1 }] : []));
  };
  const download = async () => {
    if (!queue.length || exportingRef.current) return;
    exportingRef.current = true; setExporting(true); setError(''); setProgress('准备字体和图片…');
    try {
      const blob = await exportQueuePdf(queue, (current, total) => setProgress(`正在生成 ${current} / ${total} 页…`));
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const url = URL.createObjectURL(blob);
      urlRef.current = url; downloadName.current = `coffee_labels_${localToday()}.pdf`;
      setDownloadUrl(url);
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = downloadName.current; anchor.rel = 'noopener';
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
    } catch (err) { setError(`PDF 生成失败：${err instanceof Error ? err.message : '请重试'}`); }
    finally { exportingRef.current = false; setExporting(false); setProgress(''); }
  };
  const totalLabels = queue.reduce((sum, item) => sum + item.quantity, 0);
  const pages = paginateQueue(queue);
  const visibleTemplates = templates.filter(bean => matchesTemplate(bean, query));

  return <div className="workspace print-workspace">
    <header className="workspace-header">
      <Group justify="space-between" gap="sm">
        <div><Group gap="xs"><Title order={1} size="h3" c="coffee.9">打印台</Title><Badge variant="light">{pages.length} 页 · {totalLabels} 张</Badge></Group><Text size="xs" c="dimmed" mt={4}>选择咖啡标签，轻松准备每一份出品</Text></div>
        <Button variant="light" disabled={exporting} onClick={() => { window.location.hash = '#/edit'; }} leftSection={<Edit3 size={16} />}>标签管理</Button>
      </Group>
    </header>
    <Tabs value={activeTab} onChange={value => setActiveTab(value as typeof activeTab)} className="workspace-nav" variant="pills">
      <Tabs.List grow aria-label="打印页面导航">{tabs.map(tab => <Tabs.Tab key={tab.id} value={tab.id} leftSection={<tab.icon size={16} />}>{tab.label}{tab.id === 'queue' && totalLabels > 0 ? ` (${totalLabels})` : ''}</Tabs.Tab>)}</Tabs.List>
    </Tabs>
    {(error || storageError) && <Alert color="red" role="alert">{error || storageError}</Alert>}
    <main className="workspace-main">
      <section aria-label="选择标签" className="workspace-panel" data-visible={activeTab === 'templates'}>
        <Stack gap="md">
          <Group justify="space-between"><Title order={2} size="h5">选择标签</Title><Badge color="gray" variant="light">{visibleTemplates.length} 款</Badge></Group>
          <TextInput id="print-search" type="search" label="查找标签" placeholder="搜索名称或产地" leftSection={<Search size={17} />} value={query} onChange={event => setQuery(event.target.value)} />
          {loading ? <Group role="status" py="lg"><Loader size="sm" /><Text size="sm" c="dimmed">正在加载标签…</Text></Group>
            : loadError ? <Alert color="red" role="alert">{loadError}<Button onClick={loadTemplates} variant="subtle" size="xs">重新加载</Button></Alert>
            : visibleTemplates.length === 0 ? <Text py="xl" ta="center" c="dimmed">{templates.length ? '没有匹配的标签' : '暂无标签，请前往标签管理创建。'}</Text>
            : visibleTemplates.map(bean => <Card component="article" key={bean.id} withBorder radius="lg" padding="md">
              <Text fw={700} c="coffee.9" className="template-title">{templateName(bean)}</Text>
              <Text size="xs" c="dimmed" mt={6}>{templateOrigin(bean)} · {bean.roastLevel}</Text>
              <Group gap="xs" mt="xs"><Badge variant="light">{bean.brewingMethod === 'espresso' ? '意式' : '手冲'}</Badge><Badge variant="outline" color="gray">{bean.labelSize || '105x74'} mm</Badge></Group>
              <Group gap="xs" mt="md" grow>
                <Button disabled={exporting} onClick={() => openParameters(bean)} leftSection={<Plus size={15} />}>加入队列</Button>
                <Button variant="default" disabled={exporting} onClick={() => { window.location.hash = `#/edit?id=${encodeURIComponent(bean.id)}`; }}>编辑</Button>
              </Group>
            </Card>)}
        </Stack>
      </section>
      <section aria-label="打印队列" className="workspace-panel" data-visible={activeTab === 'queue'}>
        <Stack gap="md">
          <Group justify="space-between"><Title order={2} size="h5">打印队列</Title><Button size="xs" color="red" variant="subtle" disabled={!queue.length || exporting} onClick={() => setQueue([])} leftSection={<Trash2 size={14} />}>清空</Button></Group>
          {!queue.length ? <Stack align="center" gap="xs" py="xl"><Printer size={32} color="var(--mantine-color-coffee-4)" /><Text c="dimmed" size="sm">队列为空，请先选择标签。</Text></Stack> : queue.map(item => <Card component="article" key={item.id} withBorder radius="lg" padding="md">
            <Group justify="space-between" wrap="nowrap" align="start"><Text fw={700} className="template-title">{templateName(item.bean)}</Text><Badge variant="light" style={{ flexShrink: 0 }}>{item.quantity} 张</Badge></Group>
            <Text size="xs" c="dimmed" mt="sm">日期：{item.bean.roastDate}</Text>
            <Text size="xs" c="dimmed" mt={4}>净含量：{item.bean.weight} · {item.bean.labelSize || '105x74'} mm</Text>
            <Group gap="xs" mt="md" grow><Button variant="light" disabled={exporting} onClick={() => openParameters(item.bean, item)}>修改参数</Button>
              <Button variant="subtle" color="red" disabled={exporting} onClick={() => setQueue(current => current.filter(job => job.id !== item.id))}>删除</Button></Group>
          </Card>)}
        </Stack>
      </section>
      <section aria-label="A4 打印预览" className="workspace-panel preview-panel" data-visible={activeTab === 'preview'}>
        <Title order={2} size="h5" c="coffee.9" mb="xs">A4 打印预览</Title>
        <Text size="xs" c="dimmed" mb="md">下载后请选择实际大小 / 100% 打印</Text>
        <ResponsiveScalePreview fit="width" maxScale={1} className="w-full"><A4PrintLayout queue={queue} onRemoveItem={exporting ? undefined : removeOne} /></ResponsiveScalePreview>
      </section>
    </main>
    <footer className="workspace-footer">
      <Group justify="space-between" gap="sm">
        <Text size="sm" c="dimmed" visibleFrom="sm">共 {queue.length} 项 · {totalLabels} 张标签 · {pages.length} 页 A4</Text>
        <Button size="md" onClick={download} disabled={!queue.length || exporting} loading={exporting} leftSection={<Download size={18} />} className="export-button">{exporting ? progress : '下载 PDF'}</Button>
      </Group>
      {downloadUrl && <Anchor size="xs" display="block" ta="right" mt="xs" href={downloadUrl} download={downloadName.current} target="_blank" rel="noopener noreferrer">PDF 已生成，点此下载或打开</Anchor>}
    </footer>
    <Modal opened={parameters !== null} onClose={() => setParameters(null)} title="打印参数" closeButtonProps={{ 'aria-label': '关闭打印参数' }}>
      {parameters && <form onSubmit={saveParameters}>
        <Stack gap="md">
          <Text size="sm" c="dimmed" className="template-title">{templateName(parameters.bean)}</Text>
          <DateInput id="print-roast-date" label="烘焙日期" name="roastDate" value={date || null} onChange={value => setDate(value || '')} valueFormat="YYYY-MM-DD" required clearable={false} ariaLabels={{ monthLevelControl: '选择月份', yearLevelControl: '选择年份', nextMonth: '下个月', previousMonth: '上个月', nextYear: '下一年', previousYear: '上一年', nextDecade: '下十年', previousDecade: '上十年' }} popoverProps={{ withinPortal: false }} />
          <NumberInput label="净含量（g）" name="weight" type="text" inputMode="numeric" min={0} step={1} allowDecimal={false} allowNegative={false} value={weight} onChange={value => setWeight(String(value))} placeholder="0" />
          <NumberInput label="数量（张）" name="quantity" inputMode="numeric" min={1} max={LABEL_CONFIG.print.maxQuantityPerAdd} step={1} allowDecimal={false} allowNegative={false} value={quantity} onChange={value => setQuantity(typeof value === 'bigint' ? String(value) : value)} required description={`每次最多 ${LABEL_CONFIG.print.maxQuantityPerAdd} 张`} />
          {parameterError && <Alert color="red" role="alert">{parameterError}</Alert>}
          <Button type="submit" disabled={exporting} fullWidth size="md">{parameters.jobId ? '保存参数' : '确认加入队列'}</Button>
        </Stack>
      </form>}
    </Modal>
  </div>;
};

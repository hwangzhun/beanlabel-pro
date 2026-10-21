import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ActionIcon, Alert, Button, Group, Loader, Modal, Stack, Tabs, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { CoffeeBean, INITIAL_BEAN } from '../types';
import { BeanForm } from './BeanForm';
import { TemplateList } from './TemplateList';
import { Label } from './Label';
import { ResponsiveScalePreview } from './ResponsiveScalePreview';
import { Plus, Printer, LogOut, ArrowLeft, Edit3, Eye, Maximize2, Save } from 'lucide-react';
import { templateService } from '../services/db';
import { createId } from '../utils/id';
import { logout } from './AuthGuard';
import { templateName } from '../utils/templateDisplay';
import { getCountryByCode } from '../config/countries';
import { clearNavigationGuard, setNavigationGuard } from '../utils/navigationGuard';

export const DesktopView: React.FC = () => {
  const [bean, setBean] = useState<CoffeeBean>({ ...INITIAL_BEAN });
  const [baseline, setBaseline] = useState(JSON.stringify(INITIAL_BEAN));
  const [templates, setTemplates] = useState<CoffeeBean[]>([]);
  const [view, setView] = useState<'library' | 'editor'>('library');
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [expanded, setExpanded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const processingRef = useRef(false);
  const libraryRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const libraryScrollRef = useRef(0);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState('');
  const dirty = JSON.stringify(bean) !== baseline;
  const busyRef = useRef(false);
  const busyOrProcessing = () => busyRef.current || processingRef.current;
  const locked = busy || processing;
  const onProcessingChange = useCallback((value: boolean) => { processingRef.current = value; setProcessing(value); }, []);
  const allowDiscard = () => !dirty || confirm('有未保存的修改，确定放弃这些修改吗？');

  useEffect(() => setNavigationGuard(() => !busyOrProcessing() && allowDiscard()), [dirty, busy, processing]);
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (dirty || busyOrProcessing()) { event.preventDefault(); event.returnValue = ''; }
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [dirty]);

  const selectBean = (next: CoffeeBean) => {
    libraryScrollRef.current = libraryRef.current?.scrollTop || 0;
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setBean({ ...next }); setBaseline(JSON.stringify(next)); setView('editor'); setActiveTab('edit'); setError('');
  };
  const loadTemplates = async () => {
    setLoading(true); setLoadError('');
    try {
      const records = await templateService.getAll();
      setTemplates(records);
      const id = new URLSearchParams(window.location.hash.split('?')[1]).get('id');
      if (id) {
        const record = records.find(item => item.id === id);
        if (!record) throw new Error('标签不存在，请从列表重新选择');
        selectBean(record);
      }
    } catch (err) { setLoadError(`标签加载失败：${err instanceof Error ? err.message : '请重试'}`); }
    finally { setLoading(false); }
  };
  useEffect(() => { void loadTemplates(); }, []);

  const save = async () => {
    if (busyOrProcessing() || loading) return;
    if (![bean.nameCnPrefix, bean.nameCnSuffix, bean.nameEnPrefix, bean.nameEnSuffix, bean.name].some(value => value?.trim())) {
      setError('标签名称不能为空'); return;
    }
    busyRef.current = true; setBusy(true); setError('');
    const next = { ...bean, id: !bean.id || bean.id === 'new' ? createId() : bean.id,
      name: templateName(bean), origin: getCountryByCode(bean.country)?.nameCn || bean.country };
    // Keep the assigned ID for retries if the server committed before a timeout.
    setBean(next);
    try {
      const saved = await templateService.save(next);
      setBean(saved); setBaseline(JSON.stringify(saved));
      setTemplates(current => current.some(item => item.id === saved.id) ? current.map(item => item.id === saved.id ? saved : item) : [...current, saved]);
      notifications.show({ role: 'status', closeButtonProps: { 'aria-label': '关闭通知' }, title: '标签已保存', message: '可继续编辑或前往打印台。', color: 'green' });
    } catch (err) { setError(`保存失败：${err instanceof Error ? err.message : '请重试'}`); }
    finally { busyRef.current = false; setBusy(false); }
  };
  const remove = async (id: string) => {
    if (busyOrProcessing()) return;
    if (bean.id === id && !allowDiscard()) return;
    busyRef.current = true; setBusy(true); setError('');
    try {
      await templateService.delete(id);
      setTemplates(current => current.filter(item => item.id !== id));
      if (bean.id === id) { setBean({ ...INITIAL_BEAN }); setBaseline(JSON.stringify(INITIAL_BEAN)); }
      setDeleteId(null);
      notifications.show({ role: 'status', closeButtonProps: { 'aria-label': '关闭通知' }, title: '标签已删除', message: '已加入打印队列的副本会保留。', color: 'green' });
    } catch (err) { setError(`删除失败：${err instanceof Error ? err.message : '请重试'}`); }
    finally { busyRef.current = false; setBusy(false); }
  };
  const newBean = () => { if (!busyOrProcessing() && allowDiscard()) selectBean({ ...INITIAL_BEAN }); };
  const backToLibrary = () => {
    if (busyOrProcessing() || !allowDiscard()) return;
    setBean({ ...INITIAL_BEAN }); setBaseline(JSON.stringify(INITIAL_BEAN)); setError(''); setView('library');
  };
  useLayoutEffect(() => {
    if (view === 'editor') titleRef.current?.focus();
    else {
      if (libraryRef.current) libraryRef.current.scrollTop = libraryScrollRef.current;
      if (returnFocusRef.current?.isConnected) returnFocusRef.current.focus({ preventScroll: true });
    }
  }, [view]);
  const leave = () => { if (!busyOrProcessing()) window.location.hash = '#/print'; };
  const signOut = () => {
    if (busyOrProcessing() || !allowDiscard()) return;
    clearNavigationGuard(); logout(); window.location.hash = '#/print';
  };

  const preview = (large = false) => <div className={large ? 'manage-preview-stage manage-preview-expanded' : 'manage-preview-stage'}>
    <ResponsiveScalePreview fit="contain" maxScale={large ? 2 : 1.25} className="manage-preview-fit">
      <div className="manage-label-paper"><Label bean={bean} /></div>
    </ResponsiveScalePreview>
  </div>;

  return <div className="workspace manage-workspace" data-view={view}>
    <header className="workspace-header manage-header">
      <div className="manage-heading">
        {view === 'editor' && <Button disabled={locked} variant="subtle" onClick={backToLibrary} leftSection={<ArrowLeft size={16} />}>返回标签库</Button>}
        <div className="manage-title-block">
          <Title ref={titleRef} tabIndex={-1} order={1} size="h3" c="coffee.9" className="manage-page-title">{view === 'library' ? '标签库' : (bean.id === 'new' ? '新建标签' : templateName(bean))}</Title>
          <Text size="xs" c="dimmed" mt={4}>{view === 'library' ? `共 ${templates.length} 个标签 · 为每一款咖啡留住风味` : '编辑标签 · 日期和重量在打印队列中设置'}</Text>
        </div>
      </div>
      <Group gap="xs" className="manage-header-actions">
        {view === 'library' ? <Button disabled={locked || loading} onClick={newBean} leftSection={<Plus size={16} />}>新建标签</Button>
          : <><Text size="xs" c={dirty ? 'orange.8' : 'dimmed'} className="manage-save-status" aria-live="polite">{busy ? '正在保存…' : processing ? 'AI 处理中…' : dirty ? '未保存' : bean.id === 'new' ? '待填写' : '已保存'}</Text>
            <Button disabled={processing || loading} loading={busy} onClick={save} leftSection={<Save size={16} />}>保存标签</Button></>}
        <Button disabled={locked} onClick={leave} variant="light" leftSection={<Printer size={16} />}>打印台</Button>
        <ActionIcon disabled={locked} variant="subtle" size="lg" onClick={signOut} aria-label="退出标签管理" title="退出标签管理"><LogOut size={18} /></ActionIcon>
      </Group>
    </header>
    {error && deleteId === null && <Alert color="red" role="alert" className="manage-error">{error}</Alert>}
    {loadError && <Alert color="red" role="alert">{loadError}<Button variant="subtle" size="xs" onClick={loadTemplates}>重新加载</Button></Alert>}
    <main className="manage-main">
      <section ref={libraryRef} aria-label="标签列表" className="manage-library" hidden={view !== 'library'}>
        {loading ? <Group role="status"><Loader size="sm" /><Text size="sm">正在加载标签…</Text></Group> : <TemplateList templates={templates} disabled={locked} onSelect={next => { if (!busyOrProcessing() && allowDiscard()) selectBean(next); }} onDelete={id => { setError(''); setDeleteId(id); }} />}
      </section>
      {view === 'editor' && <div className="manage-editor">
        <Tabs value={activeTab} onChange={value => { if (value) setActiveTab(value as typeof activeTab); }} className="manage-editor-tabs" variant="pills">
          <Tabs.List grow aria-label="编辑页面导航"><Tabs.Tab value="edit" leftSection={<Edit3 size={16} />}>信息</Tabs.Tab><Tabs.Tab value="preview" leftSection={<Eye size={16} />}>预览</Tabs.Tab></Tabs.List>
        </Tabs>
        <section aria-label="编辑标签" className="manage-form-panel" data-visible={activeTab === 'edit'}>
          <fieldset disabled={busy || loading} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}><BeanForm bean={bean} onChange={setBean} saving={busy} onProcessingChange={onProcessingChange} /></fieldset>
        </section>
        <section aria-label="标签实时预览" className="manage-preview-panel" data-visible={activeTab === 'preview'}>
          <Group justify="space-between" gap="xs" wrap="nowrap">
            <div><Title order={2} size="h5" c="coffee.9">标签实时预览</Title><Text size="xs" c="dimmed" mt={6}>{(bean.labelSize || '105x74').replace('x', ' × ')} mm · {bean.labelSize === '60x85' ? '竖版' : '横版'}</Text></div>
            <Button size="xs" variant="subtle" leftSection={<Maximize2 size={14} />} onClick={() => setExpanded(true)}>放大预览</Button>
          </Group>
          {preview()}
          <Text size="xs" c="dimmed" ta="center">预览随编辑实时更新 · 打印尺寸以标签规格为准</Text>
        </section>
      </div>}
    </main>
    <Modal opened={expanded} onClose={() => setExpanded(false)} title="标签放大预览" size="calc(100vw - 48px)" className="manage-preview-modal" closeButtonProps={{ 'aria-label': '关闭放大预览' }}>
      {expanded && preview(true)}
    </Modal>
    <Modal opened={deleteId !== null} onClose={() => { if (!busy) setDeleteId(null); }} title="删除标签" closeOnEscape={!busy} closeOnClickOutside={!busy} withCloseButton={!busy}>
      <Stack><Text size="sm">确定删除这个标签吗？已加入打印队列的副本会保留。</Text>{error && <Alert color="red" role="alert">{error}</Alert>}
        <Group justify="flex-end"><Button variant="default" disabled={busy} onClick={() => setDeleteId(null)}>取消</Button><Button color="red" loading={busy} onClick={() => { if (deleteId) void remove(deleteId); }}>确认删除</Button></Group>
      </Stack>
    </Modal>
  </div>;
};

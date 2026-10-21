import React, { useState } from 'react';
import { ActionIcon, Badge, Button, Card, Group, Menu, Stack, Text, TextInput, Title } from '@mantine/core';
import { ArrowUpRight, Coffee, MoreHorizontal, Search, Trash2 } from 'lucide-react';
import type { CoffeeBean } from '../types';
import { matchesTemplate, templateName, templateOrigin } from '../utils/templateDisplay';

interface TemplateListProps {
  templates: CoffeeBean[];
  onSelect: (bean: CoffeeBean) => void;
  onDelete: (id: string) => void;
  disabled?: boolean;
}
export const TemplateList: React.FC<TemplateListProps> = ({ templates, onSelect, onDelete, disabled }) => {
  const [query, setQuery] = useState('');
  const visible = templates.filter(bean => matchesTemplate(bean, query));
  return <Stack gap="xl" className="manage-library-content">
    <Group justify="space-between" align="flex-end" className="manage-library-toolbar">
      <TextInput id="manage-search" type="search" label="查找标签" leftSection={<Search size={17} />} value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索名称或产地" />
      <Text size="sm" c="dimmed" aria-live="polite">{query ? `找到 ${visible.length} 个标签` : '你的咖啡标签收藏'}</Text>
    </Group>
    {!visible.length ? <div className="manage-empty"><Coffee size={32} strokeWidth={1.3} /><Title order={2} size="h4" mt="md">{templates.length ? '没有匹配的标签' : '创建第一款咖啡标签'}</Title><Text c="dimmed" size="sm" mt="xs">{templates.length ? '试试其他名称或产地，或清空搜索。' : '从右上方新建标签，记录这款咖啡的名字与风味。'}</Text>{query && <Button variant="subtle" mt="md" onClick={() => setQuery('')}>清空搜索</Button>}</div>
      : <div className="manage-label-grid">{visible.map(bean => <Card component="article" key={bean.id} withBorder padding="xl" radius="lg" className="manage-template-card">
        <Group justify="space-between" wrap="nowrap" align="flex-start">
          <Text size="xs" c="coffee.7" fw={600}>{bean.brewingMethod === 'espresso' ? 'ESPRESSO / 意式' : 'POUR OVER / 手冲'}</Text>
          <Menu position="bottom-end" withinPortal>
            <Menu.Target><ActionIcon disabled={disabled} variant="subtle" color="coffee" aria-label={`更多操作：${templateName(bean)}`}><MoreHorizontal size={19} /></ActionIcon></Menu.Target>
            <Menu.Dropdown><Menu.Item color="red" leftSection={<Trash2 size={14} />} onClick={() => onDelete(bean.id)}>删除</Menu.Item></Menu.Dropdown>
          </Menu>
        </Group>
        <Title order={2} size="h4" c="coffee.9" className="template-title" mt="md">{templateName(bean)}</Title>
        <Text size="sm" c="dimmed" mt="xs">{templateOrigin(bean) || '未设置产地'}</Text>
        {(bean.process?.trim() || bean.altitude?.trim()) && <Group gap="sm" mt="sm" align="flex-start">
          {bean.process?.trim() && <Text size="xs" c="dimmed" style={{ overflowWrap: 'anywhere' }}>处理法：{bean.process.trim()}</Text>}
          {bean.altitude?.trim() && <Text size="xs" c="dimmed" style={{ overflowWrap: 'anywhere' }}>海拔：{bean.altitude.trim()} m</Text>}
        </Group>}
        <Group gap="xs" mt="lg"><Badge variant="light" color="coffee">{bean.roastLevel}</Badge><Badge variant="outline" color="gray">{(bean.labelSize || '105x74').replace('x', ' × ')} mm</Badge></Group>
        <div className="manage-card-action"><Button disabled={disabled} variant="light" fullWidth rightSection={<ArrowUpRight size={15} />} onClick={() => onSelect(bean)}>编辑标签</Button></div>
      </Card>)}</div>}
  </Stack>;
};

import type { CoffeeBean } from '../types';
import { getCountryByCode } from '../config/countries';
export function templateName(bean: CoffeeBean) {
  return [bean.nameCnPrefix, bean.nameCnSuffix].filter(Boolean).join('·')
    || [bean.nameEnPrefix, bean.nameEnSuffix].filter(Boolean).join('·') || bean.name || '未命名标签';
}
export function templateOrigin(bean: CoffeeBean) {
  return getCountryByCode(bean.country)?.nameCn || bean.origin || bean.country || '未填写产地';
}
export function matchesTemplate(bean: CoffeeBean, query: string) {
  return [templateName(bean), templateOrigin(bean), bean.name, bean.origin, bean.nameEnPrefix, bean.nameEnSuffix]
    .join(' ').toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
}

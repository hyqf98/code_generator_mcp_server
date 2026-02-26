/**
 * Handlebars 模板解析器
 */

import Handlebars from 'handlebars';

/**
 * 注册 Handlebars helpers
 */
function registerHelpers(): void {
  // 转换为首字母大写
  Handlebars.registerHelper('capitalize', (str: string) => {
    if (typeof str !== 'string') return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  });

  // 转换为驼峰命名
  Handlebars.registerHelper('camelCase', (str: string) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
      .replace(/^(.)/, (c) => c.toLowerCase());
  });

  // 转换为 PascalCase
  Handlebars.registerHelper('pascalCase', (str: string) => {
    if (typeof str !== 'string') return str;
    const camel = str
      .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''));
    return camel.charAt(0).toUpperCase() + camel.slice(1);
  });

  // 转换为 snake_case
  Handlebars.registerHelper('snakeCase', (str: string) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[-\s]+/g, '_')
      .toLowerCase();
  });

  // 转换为 kebab-case
  Handlebars.registerHelper('kebabCase', (str: string) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[_\s]+/g, '-')
      .toLowerCase();
  });

  // 转换为下划线命名
  Handlebars.registerHelper('underscore', (str: string) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .toLowerCase();
  });

  // 判断相等
  Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);

  // 判断不等
  Handlebars.registerHelper('ne', (a: unknown, b: unknown) => a !== b);

  // 逻辑与
  Handlebars.registerHelper('and', (...args: unknown[]) => {
    // 最后一个参数是 options
    const values = args.slice(0, -1);
    return values.every(Boolean);
  });

  // 逻辑或
  Handlebars.registerHelper('or', (...args: unknown[]) => {
    const values = args.slice(0, -1);
    return values.some(Boolean);
  });

  // 包含
  Handlebars.registerHelper('includes', (arr: unknown[], value: unknown) => {
    if (!Array.isArray(arr)) return false;
    return arr.includes(value);
  });

  // 字符串连接
  Handlebars.registerHelper('concat', (...args: unknown[]) => {
    const values = args.slice(0, -1);
    return values.join('');
  });

  // 默认值
  Handlebars.registerHelper('default', (value: unknown, defaultValue: unknown) => {
    return value ?? defaultValue;
  });

  // 类型判断
  Handlebars.registerHelper('isString', (value: unknown) => typeof value === 'string');
  Handlebars.registerHelper('isNumber', (value: unknown) => typeof value === 'number');
  Handlebars.registerHelper('isArray', (value: unknown) => Array.isArray(value));
  Handlebars.registerHelper('isObject', (value: unknown) =>
    typeof value === 'object' && value !== null && !Array.isArray(value)
  );
}

// 注册 helpers
registerHelpers();

/**
 * 编译并渲染 Handlebars 模板
 * @param templateContent 模板内容
 * @param data 模板数据
 * @returns 渲染后的内容
 */
export function renderHandlebars(templateContent: string, data: Record<string, unknown>): string {
  const template = Handlebars.compile(templateContent);
  return template(data);
}

/**
 * 注册自定义 helper
 * @param name helper 名称
 * @param fn helper 函数
 */
export function registerHelper(name: string, fn: Handlebars.HelperDelegate): void {
  Handlebars.registerHelper(name, fn);
}

/**
 * 注册 partial
 * @param name partial 名称
 * @param partial partial 内容
 */
export function registerPartial(name: string, partial: string): void {
  Handlebars.registerPartial(name, partial);
}

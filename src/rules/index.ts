/**
 * 规则解析器入口
 * 整合所有内置规则，提供统一的解析接口
 */

import type { RuleDefinition, RuleDefinition as RuleDef, TemplateConfig } from '../types.js';
import { ENUM_RULE, parseEnumRule } from './enum.js';
import { DICT_RULE, parseDictRule } from './dict.js';
import { IGNORE_RULE, parseIgnoreRule } from './ignore.js';

// 内置规则列表
export const BUILTIN_RULES: RuleDefinition[] = [
  ENUM_RULE,
  DICT_RULE,
  IGNORE_RULE
];

/**
 * 获取所有规则（内置 + 自定义）
 * @param config 模板配置（包含自定义规则）
 * @returns 合并后的规则列表
 */
export function getAllRules(config?: TemplateConfig): RuleDefinition[] {
  const customRules = config?.rules ?? [];

  // 创建规则名称映射，自定义规则优先
  const ruleMap = new Map<string, RuleDefinition>();

  // 先添加内置规则
  for (const rule of BUILTIN_RULES) {
    ruleMap.set(rule.name, rule);
  }

  // 自定义规则覆盖内置规则
  for (const rule of customRules) {
    ruleMap.set(rule.name, rule);
  }

  return Array.from(ruleMap.values());
}

/**
 * 解析单个字符串中的所有规则
 * @param text 要解析的文本
 * @param rules 使用的规则列表
 * @returns 解析结果
 */
export function parseTextRules(
  text: string,
  rules: RuleDefinition[]
): {
  comment: string;
  rules: Record<string, unknown>;
} {
  let comment = text;
  const parsedRules: Record<string, unknown> = {};

  for (const rule of rules) {
    const regex = new RegExp(rule.pattern);
    const match = comment.match(regex);

    if (match) {
      // 根据规则类型使用对应的解析器
      switch (rule.name) {
        case 'enum': {
          const result = parseEnumRule(comment);
          comment = result.comment;
          if (result.rule) {
            parsedRules.enum = result.rule;
          }
          break;
        }
        case 'dict': {
          const result = parseDictRule(comment);
          comment = result.comment;
          if (result.rule) {
            parsedRules.dict = result.rule;
          }
          break;
        }
        case 'ignore': {
          const result = parseIgnoreRule(comment);
          comment = result.comment;
          if (result.rule) {
            parsedRules.ignore = true;
          }
          break;
        }
        default:
          // 自定义规则的通用解析
          comment = comment.replace(regex, '').trim();
          if (rule.parse.output) {
            parsedRules[rule.name] = parseGenericRule(match, rule);
          }
      }
    }
  }

  return { comment, rules: parsedRules };
}

/**
 * 通用的规则解析（用于自定义规则）
 */
function parseGenericRule(match: RegExpMatchArray, rule: RuleDefinition): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const output = rule.parse.output;

  if (!output) return result;

  // 简单映射：直接使用正则捕获组
  if (rule.params) {
    for (const param of rule.params) {
      const value = match[param.group];
      if (value !== undefined) {
        result[param.name] = value;
      }
    }
  }

  return result;
}

/**
 * 递归解析对象中的所有规则
 * @param data 要解析的数据对象
 * @param rules 使用的规则列表
 * @returns 解析后的数据
 */
export function parseObjectRules(
  data: unknown,
  rules: RuleDefinition[]
): {
  data: unknown;
  parsedRules: Record<string, unknown>;
} {
  if (typeof data === 'string') {
    const result = parseTextRules(data, rules);
    return {
      data: result.comment,
      parsedRules: result.rules
    };
  }

  if (Array.isArray(data)) {
    const allRules: Record<string, unknown> = {};
    const parsedArray = data.map(item => {
      const result = parseObjectRules(item, rules);
      Object.assign(allRules, result.parsedRules);
      return result.data;
    });
    return { data: parsedArray, parsedRules: allRules };
  }

  if (data !== null && typeof data === 'object') {
    const allRules: Record<string, unknown> = {};
    const parsedObj: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const result = parseObjectRules(value, rules);
      parsedObj[key] = result.data;
      Object.assign(allRules, result.parsedRules);
    }

    // 如果有解析出规则，添加到对象中
    if (Object.keys(allRules).length > 0) {
      parsedObj._rules = allRules;
    }

    return { data: parsedObj, parsedRules: allRules };
  }

  return { data, parsedRules: {} };
}

// 导出各个规则解析器
export { ENUM_RULE, parseEnumRule } from './enum.js';
export { DICT_RULE, parseDictRule } from './dict.js';
export { IGNORE_RULE, parseIgnoreRule } from './ignore.js';

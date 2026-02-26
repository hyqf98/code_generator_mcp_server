/**
 * @dict 规则解析器
 * 格式: @dict(字典编码)
 * 示例: @dict(STATUS_TYPE)
 */

import type { RuleDefinition } from '../types.js';

export const DICT_RULE: RuleDefinition = {
  name: 'dict',
  pattern: '@dict\\(([\\w]+)\\)',
  description: '解析字典引用',
  params: [
    { name: 'dictCode', group: 1, description: '字典编码' }
  ],
  parse: {
    output: {
      code: 'dictCode'
    }
  },
  examples: [
    {
      input: '状态 @dict(STATUS_TYPE)',
      output: {
        comment: '状态',
        rules: {
          dict: { code: 'STATUS_TYPE' }
        }
      }
    }
  ]
};

/**
 * 解析字典规则
 * @param text 包含字典规则的文本
 * @returns 解析结果
 */
export function parseDictRule(text: string): {
  comment: string;
  rule: { code: string } | null;
} {
  const regex = new RegExp(DICT_RULE.pattern);
  const match = text.match(regex);

  if (!match) {
    return { comment: text, rule: null };
  }

  const dictCode = match[1];

  // 移除规则标记
  const comment = text.replace(regex, '').trim();

  return {
    comment,
    rule: { code: dictCode }
  };
}

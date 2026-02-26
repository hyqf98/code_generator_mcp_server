/**
 * @ignore 规则解析器
 * 格式: @ignore
 * 示例: 内部字段 @ignore
 */

import type { RuleDefinition } from '../types.js';

export const IGNORE_RULE: RuleDefinition = {
  name: 'ignore',
  pattern: '@ignore',
  description: '标记字段忽略，不参与代码生成',
  params: [],
  parse: {
    output: { ignore: true }
  },
  examples: [
    {
      input: '内部字段 @ignore',
      output: {
        comment: '内部字段',
        rules: { ignore: true }
      }
    }
  ]
};

/**
 * 解析忽略规则
 * @param text 包含忽略规则的文本
 * @returns 解析结果
 */
export function parseIgnoreRule(text: string): {
  comment: string;
  rule: boolean;
} {
  const regex = new RegExp(IGNORE_RULE.pattern);
  const match = text.match(regex);

  if (!match) {
    return { comment: text, rule: false };
  }

  // 移除规则标记
  const comment = text.replace(regex, '').trim();

  return {
    comment,
    rule: true
  };
}

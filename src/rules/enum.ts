/**
 * @enum 规则解析器
 * 格式: @enum(枚举名:值1:描述1,值2:描述2,...)
 * 示例: @enum(GENDER:male:男,female:女)
 */

import type { RuleDefinition } from '../types.js';

export const ENUM_RULE: RuleDefinition = {
  name: 'enum',
  pattern: '@enum\\(([\\w]+):([^)]+)\\)',
  description: '解析字段 comment 中的枚举定义',
  params: [
    { name: 'enumName', group: 1, description: '枚举名称' },
    { name: 'values', group: 2, separator: ',', description: '枚举值列表' }
  ],
  parse: {
    valueFormat: '{code}:{desc}',
    output: {
      name: 'enumName',
      values: [
        { code: 'valueCode', desc: 'valueDesc' }
      ]
    }
  },
  examples: [
    {
      input: '性别 @enum(GENDER:male:男,female:女)',
      output: {
        comment: '性别',
        rules: {
          enum: {
            name: 'GENDER',
            values: [
              { code: 'male', desc: '男' },
              { code: 'female', desc: '女' }
            ]
          }
        }
      }
    }
  ]
};

/**
 * 解析枚举值字符串
 * @param valuesStr 枚举值字符串，如 "male:男,female:女"
 * @returns 解析后的枚举值数组
 */
export function parseEnumValues(valuesStr: string): Array<{ code: string; desc: string }> {
  const values: Array<{ code: string; desc: string }> = [];
  const parts = valuesStr.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    const colonIndex = trimmed.indexOf(':');

    if (colonIndex > 0) {
      const code = trimmed.substring(0, colonIndex).trim();
      const desc = trimmed.substring(colonIndex + 1).trim();
      values.push({ code, desc });
    }
  }

  return values;
}

/**
 * 解析枚举规则
 * @param text 包含枚举规则的文本
 * @returns 解析结果，包含原始文本（去除规则标记）和规则数据
 */
export function parseEnumRule(text: string): {
  comment: string;
  rule: { name: string; values: Array<{ code: string; desc: string }> } | null;
} {
  const regex = new RegExp(ENUM_RULE.pattern);
  const match = text.match(regex);

  if (!match) {
    return { comment: text, rule: null };
  }

  const enumName = match[1];
  const valuesStr = match[2];
  const values = parseEnumValues(valuesStr);

  // 移除规则标记，保留原始注释
  const comment = text.replace(regex, '').trim();

  return {
    comment,
    rule: { name: enumName, values }
  };
}

/**
 * parse_rules 工具
 * 解析数据中的自定义规则（可单独调用预览解析结果）
 */

import { z } from 'zod';
import * as path from 'path';
import { loadConfig } from '../utils/config.js';
import { loadTemplateConfig } from '../utils/file.js';
import { parseObjectRules, getAllRules } from '../rules/index.js';

// 输入 Schema
export const ParseRulesInputSchema = z.object({
  group: z.string()
    .min(1, '分组名称不能为空')
    .describe('模板分组名称（用于加载该分组的规则定义）'),
  data: z.record(z.unknown())
    .describe('要解析的数据')
}).strict();

export type ParseRulesInput = z.infer<typeof ParseRulesInputSchema>;

// 输出类型
export interface ParseRulesOutput {
  original: unknown;
  parsed: unknown;
  rules: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * 执行 parse_rules 工具
 */
export async function parseRulesTool(input: ParseRulesInput): Promise<ParseRulesOutput> {
  const config = loadConfig();

  // 获取规则配置
  let rules = getAllRules(); // 默认使用内置规则

  if (config) {
    const groupPath = path.join(config.templatePath, input.group);
    const templateConfig = loadTemplateConfig(groupPath);

    if (templateConfig) {
      // 使用分组的规则配置
      rules = getAllRules(templateConfig);
    }
  }

  // 解析数据中的规则
  const { data: parsedData, parsedRules } = parseObjectRules(input.data, rules);

  return {
    original: input.data,
    parsed: parsedData,
    rules: parsedRules
  };
}

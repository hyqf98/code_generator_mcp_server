/**
 * get_template_config 工具
 * 获取模板分组的配置信息
 */

import { z } from 'zod';
import * as path from 'path';
import { loadTemplateConfig, getTemplateType } from '../utils/file.js';
import { loadConfig } from '../utils/config.js';
import type { TemplateDefinition, RuleDefinition } from '../types.js';
import { BUILTIN_RULES } from '../rules/index.js';

// 输入 Schema
export const GetTemplateConfigInputSchema = z.object({
  group: z.string()
    .min(1, '分组名称不能为空')
    .describe('模板分组名称'),
  template: z.string()
    .optional()
    .describe('模板名称（可选，不传则返回整个分组配置）')
}).strict();

export type GetTemplateConfigInput = z.infer<typeof GetTemplateConfigInputSchema>;

// 输出类型
export interface GetTemplateConfigOutput {
  group: string;
  name?: string;
  description?: string;
  version?: string;
  templates: Array<{
    name: string;
    file: string;
    type: 'handlebars' | 'velocity';
    description?: string;
    inputParams?: TemplateDefinition['inputParams'];
    output?: TemplateDefinition['output'];
  }>;
  rules?: RuleDefinition[];
  [key: string]: unknown;
}

/**
 * 执行 get_template_config 工具
 */
export async function getTemplateConfigTool(
  input: GetTemplateConfigInput
): Promise<GetTemplateConfigOutput | null> {
  const config = loadConfig();

  if (!config) {
    return null;
  }

  const groupPath = path.join(config.templatePath, input.group);
  const templateConfig = loadTemplateConfig(groupPath);

  if (!templateConfig) {
    // 返回基本信息
    return {
      group: input.group,
      templates: []
    };
  }

  // 构建模板信息
  let templates = templateConfig.templates.map(t => ({
    name: t.name,
    file: t.file,
    type: (getTemplateType(t.file) ?? 'handlebars') as 'handlebars' | 'velocity',
    description: t.description,
    inputParams: t.inputParams,
    output: t.output
  }));

  // 如果指定了模板名称，只返回该模板
  if (input.template) {
    templates = templates.filter(t => t.name === input.template);
  }

  // 合并内置规则和自定义规则
  const customRules = templateConfig.rules ?? [];
  const ruleMap = new Map<string, RuleDefinition>();

  // 先添加内置规则
  for (const rule of BUILTIN_RULES) {
    ruleMap.set(rule.name, rule);
  }

  // 自定义规则覆盖内置规则
  for (const rule of customRules) {
    ruleMap.set(rule.name, rule);
  }

  const allRules = Array.from(ruleMap.values());

  return {
    group: input.group,
    name: templateConfig.name,
    description: templateConfig.description,
    version: templateConfig.version,
    templates,
    rules: allRules
  };
}

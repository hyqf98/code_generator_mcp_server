/**
 * list_templates 工具
 * 列出指定分组下的所有模板
 */

import { z } from 'zod';
import * as path from 'path';
import { listTemplateFiles, loadTemplateConfig, getTemplateType } from '../utils/file.js';
import { loadConfig } from '../utils/config.js';
import type { TemplateInfo } from '../types.js';

// 输入 Schema
export const ListTemplatesInputSchema = z.object({
  group: z.string()
    .min(1, '分组名称不能为空')
    .describe('模板分组名称')
}).strict();

export type ListTemplatesInput = z.infer<typeof ListTemplatesInputSchema>;

// 输出类型
export interface ListTemplatesOutput {
  group: string;
  templates: TemplateInfo[];
  [key: string]: unknown;
}

/**
 * 执行 list_templates 工具
 */
export async function listTemplatesTool(input: ListTemplatesInput): Promise<ListTemplatesOutput> {
  const config = loadConfig();

  if (!config) {
    return { group: input.group, templates: [] };
  }

  const groupPath = path.join(config.templatePath, input.group);

  // 获取模板文件列表
  const templateFiles = listTemplateFiles(groupPath);

  // 加载 template.json 配置
  const templateConfig = loadTemplateConfig(groupPath);

  // 构建模板信息列表
  const templates: TemplateInfo[] = templateFiles.map(file => {
    const type = getTemplateType(file);
    const baseName = path.basename(file, path.extname(file));

    // 从配置中查找对应的模板定义
    const templateDef = templateConfig?.templates?.find(t => t.file === file);

    return {
      name: templateDef?.name ?? baseName,
      file,
      type: type!,
      description: templateDef?.description,
      inputParams: templateDef?.inputParams
    };
  });

  return {
    group: input.group,
    templates
  };
}

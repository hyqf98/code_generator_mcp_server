/**
 * list_groups 工具
 * 列出所有可用的模板分组
 */

import { z } from 'zod';
import { listGroups, listTemplateFiles } from '../utils/file.js';
import { loadConfig } from '../utils/config.js';

// 输入 Schema（无参数）
export const ListGroupsInputSchema = z.object({}).strict();

export type ListGroupsInput = z.infer<typeof ListGroupsInputSchema>;

// 输出类型
export interface ListGroupsOutput {
  groups: Array<{
    name: string;
    templateCount: number;
  }>;
  [key: string]: unknown;
}

/**
 * 执行 list_groups 工具
 */
export async function listGroupsTool(): Promise<ListGroupsOutput> {
  const config = loadConfig();

  if (!config) {
    return { groups: [] };
  }

  const groupNames = listGroups(config.templatePath);

  const groups = groupNames.map(name => {
    const groupPath = `${config.templatePath}/${name}`;
    const templateFiles = listTemplateFiles(groupPath);

    return {
      name,
      templateCount: templateFiles.length
    };
  });

  return { groups };
}

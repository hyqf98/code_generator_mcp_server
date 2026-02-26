/**
 * generate_code 工具
 * 根据模板和数据生成代码，保存到指定文件
 */

import { z } from 'zod';
import * as path from 'path';
import { loadConfig } from '../utils/config.js';
import { readTemplateFile, writeGeneratedFile, loadTemplateConfig, getTemplateType } from '../utils/file.js';
import { renderHandlebars } from '../parsers/handlebars.js';
import { renderVelocity } from '../parsers/velocity.js';
import { parseObjectRules, getAllRules } from '../rules/index.js';
import type { GenerateResult } from '../types.js';

// 输入 Schema
export const GenerateCodeInputSchema = z.object({
  group: z.string()
    .min(1, '分组名称不能为空')
    .describe('模板分组名称'),
  template: z.string()
    .min(1, '模板名称不能为空')
    .describe('模板名称'),
  data: z.record(z.unknown())
    .describe('模板数据（JSON 对象）'),
  outputPath: z.string()
    .min(1, '输出路径不能为空')
    .describe('输出文件路径')
}).strict();

export type GenerateCodeInput = z.infer<typeof GenerateCodeInputSchema>;

/**
 * 执行 generate_code 工具
 */
export async function generateCodeTool(input: GenerateCodeInput): Promise<GenerateResult> {
  const config = loadConfig();

  if (!config) {
    return {
      success: false,
      outputPath: input.outputPath,
      message: '未找到模板配置。请创建 .code-generator 目录或设置 CODE_GENERATOR_PATH 环境变量'
    };
  }

  const groupPath = path.join(config.templatePath, input.group);

  // 加载分组配置
  const templateConfig = loadTemplateConfig(groupPath);

  // 查找模板定义
  const templateDef = templateConfig?.templates?.find(t => t.name === input.template);

  if (!templateDef) {
    return {
      success: false,
      outputPath: input.outputPath,
      message: `未找到模板: ${input.template} (分组: ${input.group})`
    };
  }

  // 获取模板文件路径
  const templatePath = path.join(groupPath, templateDef.file);
  const templateType = getTemplateType(templateDef.file);

  if (!templateType) {
    return {
      success: false,
      outputPath: input.outputPath,
      message: `不支持的模板类型: ${templateDef.file}`
    };
  }

  try {
    // 读取模板内容
    const templateContent = readTemplateFile(templatePath);

    // 获取所有规则（内置 + 自定义）
    const rules = getAllRules(templateConfig ?? undefined);

    // 解析数据中的规则
    const { data: parsedData } = parseObjectRules(input.data, rules);

    // 渲染模板
    let generatedCode: string;

    if (templateType === 'handlebars') {
      generatedCode = renderHandlebars(templateContent, parsedData as Record<string, unknown>);
    } else {
      generatedCode = renderVelocity(templateContent, parsedData as Record<string, unknown>);
    }

    // 写入文件
    writeGeneratedFile(input.outputPath, generatedCode);

    return {
      success: true,
      outputPath: input.outputPath,
      message: '代码生成成功'
    };
  } catch (error) {
    return {
      success: false,
      outputPath: input.outputPath,
      message: `代码生成失败: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

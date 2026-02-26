/**
 * 文件操作工具
 */

import * as fs from 'fs';
import * as path from 'path';
import type { TemplateConfig } from '../types.js';

/**
 * 获取模板类型
 */
export function getTemplateType(filename: string): 'handlebars' | 'velocity' | null {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.hbs') return 'handlebars';
  if (ext === '.vm') return 'velocity';
  return null;
}

/**
 * 列出目录下的所有分组（第一级子目录）
 */
export function listGroups(templatePath: string): string[] {
  if (!fs.existsSync(templatePath)) {
    return [];
  }

  const entries = fs.readdirSync(templatePath, { withFileTypes: true });
  return entries
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);
}

/**
 * 列出分组下的所有模板文件
 */
export function listTemplateFiles(groupPath: string): string[] {
  if (!fs.existsSync(groupPath)) {
    return [];
  }

  const entries = fs.readdirSync(groupPath, { withFileTypes: true });
  return entries
    .filter(entry => entry.isFile())
    .filter(entry => {
      const ext = path.extname(entry.name).toLowerCase();
      return ext === '.hbs' || ext === '.vm';
    })
    .map(entry => entry.name);
}

/**
 * 加载分组配置文件 template.json
 */
export function loadTemplateConfig(groupPath: string): TemplateConfig | null {
  const configPath = path.join(groupPath, 'template.json');

  if (!fs.existsSync(configPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(content) as TemplateConfig;
  } catch (error) {
    console.error(`加载配置文件失败: ${configPath}`, error);
    return null;
  }
}

/**
 * 读取模板文件内容
 */
export function readTemplateFile(templatePath: string): string {
  if (!fs.existsSync(templatePath)) {
    throw new Error(`模板文件不存在: ${templatePath}`);
  }

  return fs.readFileSync(templatePath, 'utf-8');
}

/**
 * 确保目录存在
 */
export function ensureDirectory(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * 写入生成的代码文件
 */
export function writeGeneratedFile(outputPath: string, content: string): void {
  // 确保父目录存在
  const parentDir = path.dirname(outputPath);
  ensureDirectory(parentDir);

  // 写入文件
  fs.writeFileSync(outputPath, content, 'utf-8');
}

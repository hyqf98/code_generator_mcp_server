/**
 * 配置加载器
 * 支持：
 * 1. 当前项目下的 .code-generator 目录
 * 2. 环境变量 CODE_GENERATOR_PATH
 */

import * as fs from 'fs';
import * as path from 'path';
import type { Config } from '../types.js';

/**
 * 加载配置
 * 优先级：1. 当前项目下的 .code-generator 目录 2. 环境变量 CODE_GENERATOR_PATH
 */
export function loadConfig(): Config | null {
  // 1. 查找当前项目下的 .code-generator 目录
  const cwd = process.cwd();
  const localPath = path.join(cwd, '.code-generator');
  if (fs.existsSync(localPath)) {
    return { templatePath: localPath };
  }

  // 2. 读取环境变量 CODE_GENERATOR_PATH
  const envPath = process.env.CODE_GENERATOR_PATH;
  if (envPath && fs.existsSync(envPath)) {
    return { templatePath: envPath };
  }

  // 3. 都没有返回 null
  return null;
}

/**
 * 获取模板路径
 */
export function getTemplatePath(): string | null {
  const config = loadConfig();
  return config?.templatePath ?? null;
}

/**
 * 检查配置是否有效
 */
export function validateConfig(): { valid: boolean; message: string; path?: string } {
  const config = loadConfig();

  if (!config) {
    return {
      valid: false,
      message: '未找到配置。请创建 .code-generator 目录或设置 CODE_GENERATOR_PATH 环境变量'
    };
  }

  if (!fs.existsSync(config.templatePath)) {
    return {
      valid: false,
      message: `模板路径不存在: ${config.templatePath}`
    };
  }

  return {
    valid: true,
    message: '配置有效',
    path: config.templatePath
  };
}

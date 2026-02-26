/**
 * Velocity 模板解析器
 */

import Velocity from 'velocityjs';

/**
 * 渲染 Velocity 模板
 * @param templateContent 模板内容
 * @param data 模板数据
 * @returns 渲染后的内容
 */
export function renderVelocity(templateContent: string, data: Record<string, unknown>): string {
  try {
    const result = Velocity.render(templateContent, data);
    return result;
  } catch (error) {
    console.error('Velocity 渲染错误:', error);
    throw new Error(`Velocity 模板渲染失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 编译 Velocity 模板（返回渲染函数）
 * @param templateContent 模板内容
 * @returns 渲染函数
 */
export function compileVelocity(
  templateContent: string
): (data: Record<string, unknown>) => string {
  return (data: Record<string, unknown>) => renderVelocity(templateContent, data);
}

/**
 * 验证 Velocity 模板语法
 * @param templateContent 模板内容
 * @returns 是否有效及错误信息
 */
export function validateVelocity(templateContent: string): { valid: boolean; error?: string } {
  try {
    // 尝试用空对象渲染，检查语法
    Velocity.render(templateContent, {});
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

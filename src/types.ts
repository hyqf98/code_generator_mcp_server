/**
 * Code Generator MCP Server 类型定义
 */

// 配置接口
export interface Config {
  templatePath: string;
  rulesPath?: string;
}

// 模板分组信息
export interface TemplateGroup {
  name: string;
  templateCount: number;
}

// 输入参数定义
export interface InputParam {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  description?: string;
  defaultValue?: unknown;
  /**
   * 当 type 为 array 时，定义数组元素的结构
   */
  items?: InputParam;
  /**
   * 当 type 为 object 时，定义对象的属性列表
   */
  properties?: InputParam[];
  /**
   * 示例值，帮助大模型理解参数格式
   */
  example?: unknown;
}

// 输出配置
export interface OutputConfig {
  extension?: string;
  suffix?: string;
  prefix?: string;
  namingRule?: 'PascalCase' | 'camelCase' | 'snake_case' | 'kebab-case';
  pathTemplate?: string;
}

// 模板定义
export interface TemplateDefinition {
  name: string;
  file: string;
  description?: string;
  inputParams?: InputParam[];
  output?: OutputConfig;
}

// 规则参数定义
export interface RuleParam {
  name: string;
  group: number;
  description?: string;
  separator?: string;
}

// 规则输出映射
export interface RuleOutputMapping {
  [key: string]: string | boolean | RuleOutputMapping[] | Record<string, string>;
}

// 规则解析配置
export interface RuleParseConfig {
  valueFormat?: string;
  separator?: string;
  output: RuleOutputMapping;
}

// 规则示例
export interface RuleExample {
  input: string;
  output: Record<string, unknown>;
}

// 规则定义
export interface RuleDefinition {
  name: string;
  pattern: string;
  description?: string;
  params?: RuleParam[];
  parse: RuleParseConfig;
  examples?: RuleExample[];
}

// 模板配置文件
export interface TemplateConfig {
  name: string;
  description?: string;
  version?: string;
  templates: TemplateDefinition[];
  rules?: RuleDefinition[];
}

// 模板信息（用于 list_templates 输出）
export interface TemplateInfo {
  name: string;
  file: string;
  type: 'handlebars' | 'velocity';
  description?: string;
  inputParams?: InputParam[];
}

// 解析后的规则结果
export interface ParsedRule {
  [ruleName: string]: unknown;
}

// 解析后的数据
export interface ParsedData {
  original: unknown;
  parsed: unknown;
  rules?: ParsedRule;
}

// 代码生成结果
export interface GenerateResult {
  success: boolean;
  outputPath: string;
  message: string;
  [key: string]: unknown;
}

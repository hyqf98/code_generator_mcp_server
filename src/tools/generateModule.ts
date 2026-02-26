/**
 * generate_module 工具
 * 批量生成完整模块代码
 *
 * 参数由AI根据模板规则描述从SQL中解析
 */

import { z } from 'zod';
import * as path from 'path';
import { loadConfig } from '../utils/config.js';
import { readTemplateFile, writeGeneratedFile, loadTemplateConfig, getTemplateType } from '../utils/file.js';
import { renderVelocity } from '../parsers/velocity.js';

// 字段输入 Schema - AI解析后的完整字段结构
const FieldSchema = z.object({
  columnName: z.string().describe('数据库列名'),
  fieldName: z.string().describe('Java字段名（驼峰）'),
  fieldType: z.string().describe('Java字段类型'),
  comment: z.string().optional().describe('字段注释'),
  isPrimaryKey: z.boolean().optional().describe('是否主键'),
  isQueryField: z.boolean().optional().describe('是否查询字段'),
  ignore: z.boolean().optional().describe('是否忽略'),
  atomEnum: z.object({
    name: z.string().describe('枚举类名'),
    valueType: z.string().describe('枚举值类型'),
    values: z.array(z.object({
      code: z.string(),
      desc: z.string()
    })).describe('枚举值列表')
  }).optional().nullable().describe('Atom枚举定义'),
  dict: z.object({
    code: z.string()
  }).optional().nullable().describe('字典引用'),
});

// 输入 Schema
export const GenerateModuleInputSchema = z.object({
  // 模板配置
  group: z.string().min(1).describe('模板分组名称'),

  // 模块基础信息
  basePackage: z.string().min(1).describe('基础包名（不包含模块名）'),
  moduleName: z.string().min(1).describe('模块名（小写）'),
  className: z.string().min(1).describe('类名（大驼峰）'),
  tableName: z.string().min(1).describe('数据库表名'),
  comment: z.string().optional().describe('模块注释'),

  // 输出路径
  outputDir: z.string().min(1).describe('Java代码输出目录'),
  resourcesDir: z.string().optional().describe('资源文件输出目录'),

  // 字段列表（AI已解析）
  fields: z.array(FieldSchema).min(1).describe('字段列表'),

  // 可选元信息
  author: z.string().optional().describe('作者'),
  date: z.string().optional().describe('日期'),
  version: z.string().optional().describe('版本号'),
  email: z.string().optional().describe('邮箱后缀'),

  // 可选：指定要生成的模板
  templates: z.array(z.string()).optional().describe('要生成的模板列表'),
}).strict();

export type GenerateModuleInput = z.infer<typeof GenerateModuleInputSchema>;

// 生成结果
interface GenerateResult {
  template: string;
  outputPath: string;
  success: boolean;
  message: string;
}

// 输出
export interface GenerateModuleOutput {
  success: boolean;
  results: GenerateResult[];
  message: string;
  [key: string]: unknown;
}

// 预处理模板 - 将嵌套的rules访问扁平化
function preprocessTemplate(template: string): string {
  let result = template;

  // 条件判断
  result = result.replace(/#if\s*\(\s*\$field\.rules\.atomEnum\s*\)/g, '#if($field.atomEnum)');
  result = result.replace(/#if\s*\(\s*\$!field\.rules\.atomEnum\s*\)/g, '#if($field.atomEnum)');
  result = result.replace(/#if\s*\(\s*!\s*\$field\.rules\.atomEnum\s*\)/g, '#if(!$field.atomEnum)');
  result = result.replace(/#if\s*\(\s*!\s*\$!field\.rules\.atomEnum\s*\)/g, '#if(!$field.atomEnum)');
  result = result.replace(/#if\s*\(\s*!\s*\$field\.rules\.ignore\s*\)/g, '#if(!$field.ignore)');
  result = result.replace(/#if\s*\(\s*!\s*\$!field\.rules\.ignore\s*\)/g, '#if(!$field.ignore)');
  result = result.replace(/#if\s*\(\s*!\s*\$field\.rules\.isPrimaryKey\s*\)/g, '#if(!$field.isPrimaryKey)');
  result = result.replace(/#if\s*\(\s*!\s*\$!field\.rules\.isPrimaryKey\s*\)/g, '#if(!$field.isPrimaryKey)');
  result = result.replace(/#if\s*\(\s*\$field\.rules\.dict\s*\)/g, '#if($field.dict)');
  result = result.replace(/#if\s*\(\s*\$!field\.rules\.dict\s*\)/g, '#if($field.dict)');

  // 属性访问 - 不带花括号
  result = result.replace(/\$field\.rules\.atomEnum\.name/g, '$field.atomEnum.name');
  result = result.replace(/\$field\.rules\.atomEnum/g, '$field.atomEnum');
  result = result.replace(/\$field\.rules\.ignore/g, '$field.ignore');
  result = result.replace(/\$field\.rules\.isPrimaryKey/g, '$field.isPrimaryKey');
  result = result.replace(/\$field\.rules\.isQueryField/g, '$field.isQueryField');
  result = result.replace(/\$field\.rules\.dict/g, '$field.dict');

  result = result.replace(/\$!field\.rules\.atomEnum\.name/g, '$!field.atomEnum.name');
  result = result.replace(/\$!field\.rules\.atomEnum/g, '$!field.atomEnum');
  result = result.replace(/\$!field\.rules\.ignore/g, '$!field.ignore');
  result = result.replace(/\$!field\.rules\.isPrimaryKey/g, '$!field.isPrimaryKey');
  result = result.replace(/\$!field\.rules\.isQueryField/g, '$!field.isQueryField');
  result = result.replace(/\$!field\.rules\.dict/g, '$!field.dict');

  // 属性访问 - 带花括号
  result = result.replace(/\$\{field\.rules\.atomEnum\.name\}/g, '${field.atomEnum.name}');
  result = result.replace(/\$\{field\.rules\.atomEnum\}/g, '${field.atomEnum}');
  result = result.replace(/\$\{field\.rules\.ignore\}/g, '${field.ignore}');
  result = result.replace(/\$\{field\.rules\.isPrimaryKey\}/g, '${field.isPrimaryKey}');
  result = result.replace(/\$\{field\.rules\.isQueryField\}/g, '${field.isQueryField}');
  result = result.replace(/\$\{field\.rules\.dict\}/g, '${field.dict}');

  result = result.replace(/\$\{!field\.rules\.atomEnum\.name\}/g, '${!field.atomEnum.name}');
  result = result.replace(/\$\{!field\.rules\.atomEnum\}/g, '${!field.atomEnum}');
  result = result.replace(/\$\{!field\.rules\.ignore\}/g, '${!field.ignore}');
  result = result.replace(/\$\{!field\.rules\.isPrimaryKey\}/g, '${!field.isPrimaryKey}');
  result = result.replace(/\$\{!field\.rules\.isQueryField\}/g, '${!field.isQueryField}');
  result = result.replace(/\$\{!field\.rules\.dict\}/g, '${!field.dict}');

  return result;
}

// 收集导入
function collectImports(fields: z.infer<typeof FieldSchema>[], enumPackage: string): string[] {
  const importSet = new Set<string>();

  fields.forEach(f => {
    // 基础类型导入
    if (f.fieldType === 'BigDecimal') importSet.add('java.math.BigDecimal');
    if (f.fieldType === 'LocalDate') importSet.add('java.time.LocalDate');
    if (f.fieldType === 'LocalDateTime') importSet.add('java.time.LocalDateTime');
    // 枚举导入
    if (f.atomEnum) {
      importSet.add(`${enumPackage}.${f.atomEnum.name}`);
    }
  });

  return Array.from(importSet);
}

/**
 * 执行 generate_module 工具
 */
export async function generateModuleTool(input: GenerateModuleInput): Promise<GenerateModuleOutput> {
  const config = loadConfig();

  if (!config) {
    return {
      success: false,
      results: [],
      message: '未找到模板配置'
    };
  }

  const groupPath = path.join(config.templatePath, input.group);
  const templateConfig = loadTemplateConfig(groupPath);

  if (!templateConfig) {
    return {
      success: false,
      results: [],
      message: `未找到分组配置: ${input.group}`
    };
  }

  // 默认值
  const author = input.author || 'Code Generator';
  const date = input.date || new Date().toISOString().split('T')[0];
  const version = input.version || '1.0.0';
  const email = input.email || 'example.com';
  const comment = input.comment || input.className;

  // 处理字段 - 确保所有属性都有默认值
  const processedFields = input.fields.map(f => ({
    columnName: f.columnName,
    fieldName: f.fieldName,
    fieldType: f.fieldType,
    comment: f.comment || '',
    stringType: f.fieldType === 'String',
    isPrimaryKey: f.isPrimaryKey || false,
    isQueryField: f.isQueryField || false,
    ignore: f.ignore || false,
    atomEnum: f.atomEnum || null,
    dict: f.dict || null,
  }));

  // 过滤字段
  const queryFields = processedFields.filter(f => f.isQueryField);
  const poFields = processedFields.filter(f => !f.isPrimaryKey);
  const dtoFields = processedFields.filter(f => !f.isPrimaryKey && !f.ignore);
  const formFields = dtoFields;

  // 包路径
  const fullPackage = `${input.basePackage}.${input.moduleName}`;
  const entityPackage = `${fullPackage}.entity`;
  const poPackage = `${entityPackage}.po`;
  const dtoPackage = `${entityPackage}.dto`;
  const formPackage = `${entityPackage}.form`;
  const queryPackage = `${entityPackage}.query`;
  const converterPackage = `${entityPackage}.converter`;
  const mapperPackage = `${fullPackage}.mapper`;
  const servicePackage = `${fullPackage}.service`;
  const serviceImplPackage = `${servicePackage}.impl`;
  const controllerPackage = `${fullPackage}.controller`;
  const enumPackage = `${entityPackage}.enums`;

  // 导入收集
  const poImports = collectImports(poFields, enumPackage);
  const dtoImports = collectImports(dtoFields, enumPackage);
  const formImports = collectImports(formFields, enumPackage);
  const queryImports = collectImports(queryFields, enumPackage);

  // 输出路径
  const outputBase = path.join(input.outputDir, ...fullPackage.split('.'));
  const resourcesBase = input.resourcesDir || path.join(path.dirname(input.outputDir), 'resources');

  // 收集枚举
  const enums: Array<NonNullable<z.infer<typeof FieldSchema>['atomEnum']>> = [];
  processedFields.forEach(f => {
    if (f.atomEnum && !enums.find(e => e.name === f.atomEnum!.name)) {
      enums.push(f.atomEnum);
    }
  });

  // 公共上下文
  const baseContext = {
    className: input.className,
    classNameLower: input.className.charAt(0).toLowerCase() + input.className.slice(1),
    tableName: input.tableName,
    comment,
    author,
    date,
    version,
    email,
    fields: processedFields,
    queryFields,
  };

  // 模板配置
  const templateConfigs = [
    { name: 'entity', file: 'entity.java.vm', outputSubDir: 'entity/po', outputFileName: `${input.className}.java`, contextExtras: { packageName: poPackage, imports: poImports } },
    { name: 'dto', file: 'dto.java.vm', outputSubDir: 'entity/dto', outputFileName: `${input.className}DTO.java`, contextExtras: { packageName: dtoPackage, imports: dtoImports } },
    { name: 'form', file: 'form.java.vm', outputSubDir: 'entity/form', outputFileName: `${input.className}Form.java`, contextExtras: { packageName: formPackage, imports: formImports } },
    { name: 'query', file: 'query.java.vm', outputSubDir: 'entity/query', outputFileName: `${input.className}Query.java`, contextExtras: { packageName: queryPackage, imports: queryImports } },
    { name: 'converter', file: 'converter.java.vm', outputSubDir: 'entity/converter', outputFileName: `${input.className}Converter.java`, contextExtras: { packageName: converterPackage, entityPackage: poPackage, dtoPackage, formPackage } },
    { name: 'mapper', file: 'mapper.java.vm', outputSubDir: 'mapper', outputFileName: `${input.className}Mapper.java`, contextExtras: { packageName: mapperPackage, entityPackage: poPackage } },
    { name: 'mapper-xml', file: 'mapper.xml.vm', outputSubDir: 'mapper', outputFileName: `${input.className}Mapper.xml`, contextExtras: { namespace: `${mapperPackage}.${input.className}Mapper`, entityPackage: poPackage, dtoPackage, queryPackage }, useResourcesDir: true },
    { name: 'service', file: 'service.java.vm', outputSubDir: 'service', outputFileName: `${input.className}Service.java`, contextExtras: { packageName: servicePackage, entityPackage: poPackage, dtoPackage, formPackage, queryPackage } },
    { name: 'service-impl', file: 'serviceImpl.java.vm', outputSubDir: 'service/impl', outputFileName: `${input.className}ServiceImpl.java`, contextExtras: { packageName: serviceImplPackage, entityPackage: poPackage, dtoPackage, formPackage, queryPackage, mapperPackage, servicePackage, converterPackage } },
    { name: 'controller', file: 'controller.java.vm', outputSubDir: 'controller', outputFileName: `${input.className}Controller.java`, contextExtras: { packageName: controllerPackage, entityPackage: poPackage, dtoPackage, formPackage, queryPackage, servicePackage, converterPackage, requestMapping: input.tableName.replace(/_/g, '-') } },
  ];

  const results: GenerateResult[] = [];

  // 过滤要生成的模板
  const templatesToGenerate = input.templates
    ? templateConfigs.filter(t => input.templates!.includes(t.name))
    : templateConfigs;

  // 生成代码
  for (const tplConfig of templatesToGenerate) {
    const templateDef = templateConfig.templates.find(t => t.name === tplConfig.name);

    if (!templateDef) {
      results.push({
        template: tplConfig.name,
        outputPath: '',
        success: false,
        message: `未找到模板定义: ${tplConfig.name}`
      });
      continue;
    }

    const templatePath = path.join(groupPath, templateDef.file);
    const templateType = getTemplateType(templateDef.file);

    if (!templateType) {
      results.push({
        template: tplConfig.name,
        outputPath: '',
        success: false,
        message: `不支持的模板类型: ${templateDef.file}`
      });
      continue;
    }

    try {
      let templateContent = readTemplateFile(templatePath);

      if (templateType === 'velocity') {
        templateContent = preprocessTemplate(templateContent);
      }

      const context = {
        ...baseContext,
        ...tplConfig.contextExtras
      };

      let generatedCode: string;
      if (templateType === 'velocity') {
        generatedCode = renderVelocity(templateContent, context);
      } else {
        throw new Error('Handlebars 模板暂不支持');
      }

      // 输出路径
      const outputDir = tplConfig.useResourcesDir ? resourcesBase : outputBase;
      const outputPath = path.join(outputDir, tplConfig.outputSubDir, tplConfig.outputFileName);

      writeGeneratedFile(outputPath, generatedCode);

      results.push({
        template: tplConfig.name,
        outputPath,
        success: true,
        message: '生成成功'
      });
    } catch (error) {
      results.push({
        template: tplConfig.name,
        outputPath: '',
        success: false,
        message: `生成失败: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  // 生成枚举类
  const enumTemplateDef = templateConfig.templates.find(t => t.name === 'enum');

  if (enumTemplateDef) {
    const templatePath = path.join(groupPath, enumTemplateDef.file);

    try {
      let templateContent = readTemplateFile(templatePath);
      // 预处理枚举模板中的枚举值名称
      templateContent = templateContent.replace(/\$\{item\.code\.toUpperCase\(\)\}/g, '${item.enumCodeName}');

      for (const enumDef of enums) {
        // 为每个枚举值生成枚举代码名
        const valuesWithCodeName = enumDef.values.map(v => ({
          ...v,
          enumCodeName: `V${v.code}`
        }));

        const context = {
          packageName: enumPackage,
          enumName: enumDef.name,
          valueType: enumDef.valueType,
          comment: enumDef.name,
          values: valuesWithCodeName,
          author,
          date,
          version,
          email,
        };

        const generatedCode = renderVelocity(templateContent, context);
        const outputPath = path.join(outputBase, 'entity/enums', `${enumDef.name}.java`);

        writeGeneratedFile(outputPath, generatedCode);

        results.push({
          template: 'enum',
          outputPath,
          success: true,
          message: `生成枚举: ${enumDef.name}`
        });
      }
    } catch (error) {
      results.push({
        template: 'enum',
        outputPath: '',
        success: false,
        message: `生成枚举失败: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  const successCount = results.filter(r => r.success).length;
  const failCount = results.length - successCount;

  return {
    success: failCount === 0,
    results,
    message: `生成完成: 成功 ${successCount} 个，失败 ${failCount} 个`
  };
}

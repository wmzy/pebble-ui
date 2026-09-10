import type {StandardSchemaV1} from 'react-f0rm/resolvers/standard-schema';

import type {FormValidateFn} from 'react-f0rm';

import {VALIDATION_OUTCOME} from 'react-f0rm';
import {
  hasStandardProps,
  standardSchemaFormValidator as f0rmStandardSchemaFormValidator,
  standardSchemaResolver
} from 'react-f0rm/resolvers/standard-schema';

export {hasStandardProps, standardSchemaResolver};
export type {StandardSchemaV1} from 'react-f0rm/resolvers/standard-schema';

/**
 * react-f0rm 1.3.0 的表单级 Standard Schema 适配器，附带一个 dist 打包
 * 缺陷的兜底：共享块被内联进主入口，`Symbol('validation-outcome')` 品牌
 * 因此存在两份 —— resolvers 子路径用 errors 块的那份给 `ValidationOutcome`
 * 打品牌，而主入口里内联的核心校验管线检查的是自己那份，品牌对不上时
 * outcome 被当成普通错误记录处理，`errors`（`FieldError` 对象数组）被
 * 静默丢弃。这里用主入口导出的 `VALIDATION_OUTCOME`（核心实际检查的
 * symbol）给结果重新打品牌；品牌一致（上游修复后）时原样透传。
 *
 * 其余行为与 `react-f0rm/resolvers/standard-schema` 的同名函数一致：
 * 任何实现 `~standard` 的 schema（zod v3.24+/v4、valibot v1、arktype…）
 * 整表校验，失败时每个 issue 映射为对应路径的 `FieldError`，成功时
 * schema 的解析结果（coerce/transform）成为表单的 parsedValues 基线。
 *
 * 注意与 `createForm` 的 `validateDeps` 搭配：表单级校验轮对字段是
 * 只设不清的，把参与校验的字段列进 `validateDeps`（如
 * `['title', 'email']`）后，这些字段的用户修改会重跑整表 schema，
 * 且上一轮的旧错误在下一轮按快照清理——react-f0rm 的跨字段依赖
 * 机制，也是 schema 校验错误随输入消除的正路。
 *
 * 提交时的校验顺序：先跑已注册的字段级 validator（FormItem 的
 * `validate`/`rules`），有失败即短路，表单级 schema 那一轮不再执行
 * ——同一字段两种来源混用时以字段级为准，别在同一场表单里重复覆盖。
 */
export function standardSchemaFormValidator<T extends Record<string, any>>(
  schema: StandardSchemaV1<T, any>
): FormValidateFn<T> {
  const validate = f0rmStandardSchemaFormValidator(schema);
  return async (values) => {
    const result = await validate(values);
    // The subpath bundle brands outcomes with its own copy of the
    // Symbol('validation-outcome') key; the core pipeline looks for the
    // main-entry copy (`VALIDATION_OUTCOME`). Compare by value: same
    // brand (upstream fixed) pass through, otherwise re-brand.
    const symbols: symbol[] = Object.getOwnPropertySymbols(result);
    const branded = symbols.includes(VALIDATION_OUTCOME);
    if (symbols.length === 0 || branded) return result;
    return {...result, [VALIDATION_OUTCOME]: true};
  };
}

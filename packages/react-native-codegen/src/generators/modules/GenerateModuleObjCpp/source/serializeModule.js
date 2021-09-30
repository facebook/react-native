/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

import type {Struct} from '../StructCollector';
import type {
  MethodSerializationOutput,
  StructParameterRecord,
} from '../serializeMethod';

const ModuleTemplate = ({
  codegenModuleName,
  structs,
  methodSerializationOutputs,
}: $ReadOnly<{|
  codegenModuleName: string,
  structs: $ReadOnlyArray<Struct>,
  methodSerializationOutputs: $ReadOnlyArray<MethodSerializationOutput>,
|}>) => `${structs
  .map(struct =>
    RCTCxxConvertCategoryTemplate({codegenModuleName, structName: struct.name}),
  )
  .join('\n')}
namespace facebook {
  namespace react {
    ${methodSerializationOutputs
      .map(serializedMethodParts =>
        InlineHostFunctionTemplate({
          codegenModuleName,
          methodName: serializedMethodParts.methodName,
          returnJSType: serializedMethodParts.returnJSType,
          selector: serializedMethodParts.selector,
        }),
      )
      .join('\n')}

    ${codegenModuleName}SpecJSI::${codegenModuleName}SpecJSI(const ObjCTurboModule::InitParams &params)
      : ObjCTurboModule(params) {
        ${methodSerializationOutputs
          .map(({methodName, structParamRecords, argCount}) =>
            MethodMapEntryTemplate({
              codegenModuleName,
              methodName,
              structParamRecords,
              argCount,
            }),
          )
          .join('\n' + ' '.repeat(8))}
    }
  } // namespace react
} // namespace facebook`;

const RCTCxxConvertCategoryTemplate = ({
  codegenModuleName,
  structName,
}: $ReadOnly<{|
  codegenModuleName: string,
  structName: string,
|}>) => `@implementation RCTCxxConvert (${codegenModuleName}_${structName})
+ (RCTManagedPointer *)JS_${codegenModuleName}_${structName}:(id)json
{
  return facebook::react::managedPointer<JS::${codegenModuleName}::${structName}>(json);
}
@end`;

const InlineHostFunctionTemplate = ({
  codegenModuleName,
  methodName,
  returnJSType,
  selector,
}: $ReadOnly<{|
  codegenModuleName: string,
  methodName: string,
  returnJSType: string,
  selector: string,
|}>) => `
    static facebook::jsi::Value __hostFunction_${codegenModuleName}SpecJSI_${methodName}(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
      return static_cast<ObjCTurboModule&>(turboModule).invokeObjCMethod(rt, ${returnJSType}, "${methodName}", ${selector}, args, count);
    }`;

const MethodMapEntryTemplate = ({
  codegenModuleName,
  methodName,
  structParamRecords,
  argCount,
}: $ReadOnly<{|
  codegenModuleName: string,
  methodName: string,
  structParamRecords: $ReadOnlyArray<StructParameterRecord>,
  argCount: number,
|}>) => `
        methodMap_["${methodName}"] = MethodMetadata {${argCount}, __hostFunction_${codegenModuleName}SpecJSI_${methodName}};
        ${structParamRecords
          .map(({paramIndex, structName}) => {
            return `setMethodArgConversionSelector(@"${methodName}", ${paramIndex}, @"JS_${codegenModuleName}_${structName}:");`;
          })
          .join('\n' + ' '.repeat(8))}`;

function serializeModuleSource(
  codegenModuleName: string,
  structs: $ReadOnlyArray<Struct>,
  methodSerializationOutputs: $ReadOnlyArray<MethodSerializationOutput>,
): string {
  return ModuleTemplate({
    codegenModuleName,
    structs: structs.filter(({context}) => context !== 'CONSTANTS'),
    methodSerializationOutputs,
  });
}

module.exports = {
  serializeModuleSource,
};

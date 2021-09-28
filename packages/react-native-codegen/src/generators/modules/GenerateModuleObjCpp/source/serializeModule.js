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
  moduleName,
  structs,
  methodSerializationOutputs,
}: $ReadOnly<{|
  moduleName: string,
  structs: $ReadOnlyArray<Struct>,
  methodSerializationOutputs: $ReadOnlyArray<MethodSerializationOutput>,
|}>) => `${structs
  .map(struct =>
    RCTCxxConvertCategoryTemplate({moduleName, structName: struct.name}),
  )
  .join('\n')}
namespace facebook {
  namespace react {
    ${methodSerializationOutputs
      .map(serializedMethodParts =>
        InlineHostFunctionTemplate({
          moduleName,
          methodName: serializedMethodParts.methodName,
          returnJSType: serializedMethodParts.returnJSType,
          selector: serializedMethodParts.selector,
        }),
      )
      .join('\n')}

    Native${moduleName}SpecJSI::Native${moduleName}SpecJSI(const ObjCTurboModule::InitParams &params)
      : ObjCTurboModule(params) {
        ${methodSerializationOutputs
          .map(({methodName, structParamRecords, argCount}) =>
            MethodMapEntryTemplate({
              moduleName,
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
  moduleName,
  structName,
}: $ReadOnly<{|
  moduleName: string,
  structName: string,
|}>) => `@implementation RCTCxxConvert (Native${moduleName}_${structName})
+ (RCTManagedPointer *)JS_Native${moduleName}_${structName}:(id)json
{
  return facebook::react::managedPointer<JS::Native${moduleName}::${structName}>(json);
}
@end`;

const InlineHostFunctionTemplate = ({
  moduleName,
  methodName,
  returnJSType,
  selector,
}: $ReadOnly<{|
  moduleName: string,
  methodName: string,
  returnJSType: string,
  selector: string,
|}>) => `
    static facebook::jsi::Value __hostFunction_Native${moduleName}SpecJSI_${methodName}(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
      return static_cast<ObjCTurboModule&>(turboModule).invokeObjCMethod(rt, ${returnJSType}, "${methodName}", ${selector}, args, count);
    }`;

const MethodMapEntryTemplate = ({
  moduleName,
  methodName,
  structParamRecords,
  argCount,
}: $ReadOnly<{|
  moduleName: string,
  methodName: string,
  structParamRecords: $ReadOnlyArray<StructParameterRecord>,
  argCount: number,
|}>) => `
        methodMap_["${methodName}"] = MethodMetadata {${argCount}, __hostFunction_Native${moduleName}SpecJSI_${methodName}};
        ${structParamRecords
          .map(({paramIndex, structName}) => {
            return `setMethodArgConversionSelector(@"${methodName}", ${paramIndex}, @"JS_Native${moduleName}_${structName}:");`;
          })
          .join('\n' + ' '.repeat(8))}`;

function serializeModuleSource(
  moduleName: string,
  structs: $ReadOnlyArray<Struct>,
  methodSerializationOutputs: $ReadOnlyArray<MethodSerializationOutput>,
): string {
  return ModuleTemplate({
    moduleName,
    structs: structs.filter(({context}) => context !== 'CONSTANTS'),
    methodSerializationOutputs,
  });
}

module.exports = {
  serializeModuleSource,
};

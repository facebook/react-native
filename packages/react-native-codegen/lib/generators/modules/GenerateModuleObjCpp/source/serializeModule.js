/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 * @format
 */

'use strict';

const ModuleTemplate = ({
  hasteModuleName,
  structs,
  methodSerializationOutputs,
}) => `${structs
  .map(struct =>
    RCTCxxConvertCategoryTemplate({
      hasteModuleName,
      structName: struct.name,
    }),
  )
  .join('\n')}
namespace facebook {
  namespace react {
    ${methodSerializationOutputs
      .map(serializedMethodParts =>
        InlineHostFunctionTemplate({
          hasteModuleName,
          methodName: serializedMethodParts.methodName,
          returnJSType: serializedMethodParts.returnJSType,
          selector: serializedMethodParts.selector,
        }),
      )
      .join('\n')}

    ${hasteModuleName}SpecJSI::${hasteModuleName}SpecJSI(const ObjCTurboModule::InitParams &params)
      : ObjCTurboModule(params) {
        ${methodSerializationOutputs
          .map(({methodName, structParamRecords, argCount}) =>
            MethodMapEntryTemplate({
              hasteModuleName,
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
  hasteModuleName,
  structName,
}) => `@implementation RCTCxxConvert (${hasteModuleName}_${structName})
+ (RCTManagedPointer *)JS_${hasteModuleName}_${structName}:(id)json
{
  return facebook::react::managedPointer<JS::${hasteModuleName}::${structName}>(json);
}
@end`;
const InlineHostFunctionTemplate = ({
  hasteModuleName,
  methodName,
  returnJSType,
  selector,
}) => `
    static facebook::jsi::Value __hostFunction_${hasteModuleName}SpecJSI_${methodName}(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
      return static_cast<ObjCTurboModule&>(turboModule).invokeObjCMethod(rt, ${returnJSType}, "${methodName}", ${selector}, args, count);
    }`;
const MethodMapEntryTemplate = ({
  hasteModuleName,
  methodName,
  structParamRecords,
  argCount,
}) => `
        methodMap_["${methodName}"] = MethodMetadata {${argCount}, __hostFunction_${hasteModuleName}SpecJSI_${methodName}};
        ${structParamRecords
          .map(({paramIndex, structName}) => {
            return `setMethodArgConversionSelector(@"${methodName}", ${paramIndex}, @"JS_${hasteModuleName}_${structName}:");`;
          })
          .join('\n' + ' '.repeat(8))}`;
function serializeModuleSource(
  hasteModuleName,
  structs,
  methodSerializationOutputs,
) {
  return ModuleTemplate({
    hasteModuleName,
    structs: structs.filter(({context}) => context !== 'CONSTANTS'),
    methodSerializationOutputs,
  });
}
module.exports = {
  serializeModuleSource,
};

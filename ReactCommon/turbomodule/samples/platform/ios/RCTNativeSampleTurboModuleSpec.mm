/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTNativeSampleTurboModuleSpec.h"

namespace facebook {
namespace react {

static facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_voidFunc(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
  return turboModule.invokeMethod(rt, VoidKind, "voidFunc", args, count);
}

static facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getBool(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
  return turboModule.invokeMethod(rt, BooleanKind, "getBool", args, count);
}

static facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getNumber(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
  return turboModule.invokeMethod(rt, NumberKind, "getNumber", args, count);
}

static facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getString(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
  return turboModule.invokeMethod(rt, StringKind, "getString", args, count);
}

static facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getArray(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
  return turboModule.invokeMethod(rt, ArrayKind, "getArray", args, count);
}

static facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getObject(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
  return turboModule.invokeMethod(rt, ObjectKind, "getObject", args, count);
}

static facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getValue(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
  return turboModule.invokeMethod(rt, ObjectKind, "getValue", args, count);
}

static facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getValueWithCallback(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
  return turboModule.invokeMethod(rt, VoidKind, "getValueWithCallback", args, count);
}

static facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getValueWithPromise(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
  return turboModule.invokeMethod(rt, PromiseKind, "getValueWithPromise", args, count);
}

static facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getConstants(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
  return turboModule.invokeMethod(rt, ObjectKind, "getConstants", args, count);
}

NativeSampleTurboModuleSpecJSI::NativeSampleTurboModuleSpecJSI(id<RCTTurboModule> instance, std::shared_ptr<JSCallInvoker> jsInvoker)
    : ObjCTurboModule("SampleTurboModule", instance, jsInvoker) {
  methodMap_["voidFunc"] = MethodMetadata {0, __hostFunction_NativeSampleTurboModuleSpecJSI_voidFunc};
  methodMap_["getBool"] = MethodMetadata {1, __hostFunction_NativeSampleTurboModuleSpecJSI_getBool};
  methodMap_["getNumber"] = MethodMetadata {1, __hostFunction_NativeSampleTurboModuleSpecJSI_getNumber};
  methodMap_["getString"] = MethodMetadata {1, __hostFunction_NativeSampleTurboModuleSpecJSI_getString};
  methodMap_["getArray"] = MethodMetadata {1, __hostFunction_NativeSampleTurboModuleSpecJSI_getArray};
  methodMap_["getObject"] = MethodMetadata {1, __hostFunction_NativeSampleTurboModuleSpecJSI_getObject};
  methodMap_["getValue"] = MethodMetadata {3, __hostFunction_NativeSampleTurboModuleSpecJSI_getValue};
  methodMap_["getValueWithCallback"] = MethodMetadata {1, __hostFunction_NativeSampleTurboModuleSpecJSI_getValueWithCallback};
  methodMap_["getValueWithPromise"] = MethodMetadata {1, __hostFunction_NativeSampleTurboModuleSpecJSI_getValueWithPromise};
  methodMap_["getConstants"] = MethodMetadata {0, __hostFunction_NativeSampleTurboModuleSpecJSI_getConstants};
}

} // namespace react
} // namespace facebook

/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NativeSampleTurboCxxModuleSpecJSI.h"

// NOTE: This entire file should be codegen'ed.

namespace facebook {
namespace react {

static jsi::Value __hostFunction_NativeSampleTurboCxxModuleSpecJSI_voidFunc(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t count) {
  static_cast<NativeSampleTurboCxxModuleSpecJSI *>(&turboModule)->voidFunc(rt);
  return jsi::Value::undefined();
}

static jsi::Value __hostFunction_NativeSampleTurboCxxModuleSpecJSI_getBool(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t count) {
  return jsi::Value(
      static_cast<NativeSampleTurboCxxModuleSpecJSI *>(&turboModule)
          ->getBool(rt, args[0].getBool()));
}

static jsi::Value __hostFunction_NativeSampleTurboCxxModuleSpecJSI_getNumber(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t count) {
  return jsi::Value(
      static_cast<NativeSampleTurboCxxModuleSpecJSI *>(&turboModule)
          ->getNumber(rt, args[0].getNumber()));
}

static jsi::Value __hostFunction_NativeSampleTurboCxxModuleSpecJSI_getString(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t count) {
  return static_cast<NativeSampleTurboCxxModuleSpecJSI *>(&turboModule)
      ->getString(rt, args[0].getString(rt));
}

static jsi::Value __hostFunction_NativeSampleTurboCxxModuleSpecJSI_getArray(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t count) {
  return static_cast<NativeSampleTurboCxxModuleSpecJSI *>(&turboModule)
      ->getArray(rt, args[0].getObject(rt).getArray(rt));
}

static jsi::Value __hostFunction_NativeSampleTurboCxxModuleSpecJSI_getObject(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t count) {
  return static_cast<NativeSampleTurboCxxModuleSpecJSI *>(&turboModule)
      ->getObject(rt, args[0].getObject(rt));
}

static jsi::Value __hostFunction_NativeSampleTurboCxxModuleSpecJSI_getValue(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t count) {
  return static_cast<NativeSampleTurboCxxModuleSpecJSI *>(&turboModule)
      ->getValue(
          rt,
          args[0].getNumber(),
          args[1].getString(rt),
          args[2].getObject(rt));
}

static jsi::Value
__hostFunction_NativeSampleTurboCxxModuleSpecJSI_getValueWithCallback(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t count) {
  static_cast<NativeSampleTurboCxxModuleSpecJSI *>(&turboModule)
      ->getValueWithCallback(
          rt, std::move(args[0].getObject(rt).getFunction(rt)));
  return jsi::Value::undefined();
}

static jsi::Value
__hostFunction_NativeSampleTurboCxxModuleSpecJSI_getValueWithPromise(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t count) {
  return static_cast<NativeSampleTurboCxxModuleSpecJSI *>(&turboModule)
      ->getValueWithPromise(rt, args[0].getBool());
}

static jsi::Value __hostFunction_NativeSampleTurboCxxModuleSpecJSI_getConstants(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t count) {
  return static_cast<NativeSampleTurboCxxModuleSpecJSI *>(&turboModule)
      ->getConstants(rt);
}

NativeSampleTurboCxxModuleSpecJSI::NativeSampleTurboCxxModuleSpecJSI(
    std::shared_ptr<CallInvoker> jsInvoker)
    : TurboModule("SampleTurboCxxModule", jsInvoker) {
  methodMap_["voidFunc"] = MethodMetadata{
      0, __hostFunction_NativeSampleTurboCxxModuleSpecJSI_voidFunc};
  methodMap_["getBool"] = MethodMetadata{
      1, __hostFunction_NativeSampleTurboCxxModuleSpecJSI_getBool};
  methodMap_["getNumber"] = MethodMetadata{
      1, __hostFunction_NativeSampleTurboCxxModuleSpecJSI_getNumber};
  methodMap_["getString"] = MethodMetadata{
      1, __hostFunction_NativeSampleTurboCxxModuleSpecJSI_getString};
  methodMap_["getArray"] = MethodMetadata{
      1, __hostFunction_NativeSampleTurboCxxModuleSpecJSI_getArray};
  methodMap_["getObject"] = MethodMetadata{
      1, __hostFunction_NativeSampleTurboCxxModuleSpecJSI_getObject};
  methodMap_["getValue"] = MethodMetadata{
      3, __hostFunction_NativeSampleTurboCxxModuleSpecJSI_getValue};
  methodMap_["getValueWithCallback"] = MethodMetadata{
      1, __hostFunction_NativeSampleTurboCxxModuleSpecJSI_getValueWithCallback};
  methodMap_["getValueWithPromise"] = MethodMetadata{
      1, __hostFunction_NativeSampleTurboCxxModuleSpecJSI_getValueWithPromise};
  methodMap_["getConstants"] = MethodMetadata{
      0, __hostFunction_NativeSampleTurboCxxModuleSpecJSI_getConstants};
}

} // namespace react
} // namespace facebook

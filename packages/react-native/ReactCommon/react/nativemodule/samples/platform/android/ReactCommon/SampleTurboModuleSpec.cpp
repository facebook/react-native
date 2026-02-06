/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// NOTE: This entire file should be codegen'ed.

#include <ReactCommon/SampleTurboModuleSpec.h>

namespace facebook::react {
static facebook::jsi::Value
__hostFunction_NativeSampleTurboModuleSpecJSI_getConstants(
    facebook::jsi::Runtime& rt,
    TurboModule& turboModule,
    const facebook::jsi::Value* args,
    size_t count) {
  static jmethodID cachedMethodId = nullptr;
  return static_cast<JavaTurboModule&>(turboModule)
      .invokeJavaMethod(
          rt,
          ObjectKind,
          "getConstants",
          "()Ljava/util/Map;",
          args,
          count,
          cachedMethodId);
}

static facebook::jsi::Value
__hostFunction_NativeSampleTurboModuleSpecJSI_voidFunc(
    facebook::jsi::Runtime& rt,
    TurboModule& turboModule,
    const facebook::jsi::Value* args,
    size_t count) {
  static jmethodID cachedMethodId = nullptr;
  return static_cast<JavaTurboModule&>(turboModule)
      .invokeJavaMethod(
          rt, VoidKind, "voidFunc", "()V", args, count, cachedMethodId);
}

static facebook::jsi::Value
__hostFunction_NativeSampleTurboModuleSpecJSI_getBool(
    facebook::jsi::Runtime& rt,
    TurboModule& turboModule,
    const facebook::jsi::Value* args,
    size_t count) {
  static jmethodID cachedMethodId = nullptr;
  return static_cast<JavaTurboModule&>(turboModule)
      .invokeJavaMethod(
          rt, BooleanKind, "getBool", "(Z)Z", args, count, cachedMethodId);
}

static facebook::jsi::Value
__hostFunction_NativeSampleTurboModuleSpecJSI_getEnum(
    facebook::jsi::Runtime& rt,
    TurboModule& turboModule,
    const facebook::jsi::Value* args,
    size_t count) {
  static jmethodID cachedMethodId = nullptr;
  return static_cast<JavaTurboModule&>(turboModule)
      .invokeJavaMethod(
          rt, NumberKind, "getEnum", "(D)D", args, count, cachedMethodId);
}

static facebook::jsi::Value
__hostFunction_NativeSampleTurboModuleSpecJSI_getNumber(
    facebook::jsi::Runtime& rt,
    TurboModule& turboModule,
    const facebook::jsi::Value* args,
    size_t count) {
  static jmethodID cachedMethodId = nullptr;
  return static_cast<JavaTurboModule&>(turboModule)
      .invokeJavaMethod(
          rt, NumberKind, "getNumber", "(D)D", args, count, cachedMethodId);
}

static facebook::jsi::Value
__hostFunction_NativeSampleTurboModuleSpecJSI_getString(
    facebook::jsi::Runtime& rt,
    TurboModule& turboModule,
    const facebook::jsi::Value* args,
    size_t count) {
  static jmethodID cachedMethodId = nullptr;
  return static_cast<JavaTurboModule&>(turboModule)
      .invokeJavaMethod(
          rt,
          StringKind,
          "getString",
          "(Ljava/lang/String;)Ljava/lang/String;",
          args,
          count,
          cachedMethodId);
}

static facebook::jsi::Value
__hostFunction_NativeSampleTurboModuleSpecJSI_getArray(
    facebook::jsi::Runtime& rt,
    TurboModule& turboModule,
    const facebook::jsi::Value* args,
    size_t count) {
  static jmethodID cachedMethodId = nullptr;
  return static_cast<JavaTurboModule&>(turboModule)
      .invokeJavaMethod(
          rt,
          ArrayKind,
          "getArray",
          "(Lcom/facebook/react/bridge/ReadableArray;)Lcom/facebook/react/bridge/WritableArray;",
          args,
          count,
          cachedMethodId);
}

static facebook::jsi::Value
__hostFunction_NativeSampleTurboModuleSpecJSI_getObject(
    facebook::jsi::Runtime& rt,
    TurboModule& turboModule,
    const facebook::jsi::Value* args,
    size_t count) {
  static jmethodID cachedMethodId = nullptr;
  return static_cast<JavaTurboModule&>(turboModule)
      .invokeJavaMethod(
          rt,
          ObjectKind,
          "getObject",
          "(Lcom/facebook/react/bridge/ReadableMap;)Lcom/facebook/react/bridge/WritableMap;",
          args,
          count,
          cachedMethodId);
}

static facebook::jsi::Value
__hostFunction_NativeSampleTurboModuleSpecJSI_getUnsafeObject(
    facebook::jsi::Runtime& rt,
    TurboModule& turboModule,
    const facebook::jsi::Value* args,
    size_t count) {
  static jmethodID cachedMethodId = nullptr;
  return static_cast<JavaTurboModule&>(turboModule)
      .invokeJavaMethod(
          rt,
          ObjectKind,
          "getUnsafeObject",
          "(Lcom/facebook/react/bridge/ReadableMap;)Lcom/facebook/react/bridge/WritableMap;",
          args,
          count,
          cachedMethodId);
}

static facebook::jsi::Value
__hostFunction_NativeSampleTurboModuleSpecJSI_getRootTag(
    facebook::jsi::Runtime& rt,
    TurboModule& turboModule,
    const facebook::jsi::Value* args,
    size_t count) {
  static jmethodID cachedMethodId = nullptr;
  return static_cast<JavaTurboModule&>(turboModule)
      .invokeJavaMethod(
          rt, NumberKind, "getRootTag", "(D)D", args, count, cachedMethodId);
}

static facebook::jsi::Value
__hostFunction_NativeSampleTurboModuleSpecJSI_getValue(
    facebook::jsi::Runtime& rt,
    TurboModule& turboModule,
    const facebook::jsi::Value* args,
    size_t count) {
  static jmethodID cachedMethodId = nullptr;
  return static_cast<JavaTurboModule&>(turboModule)
      .invokeJavaMethod(
          rt,
          ObjectKind,
          "getValue",
          "(DLjava/lang/String;Lcom/facebook/react/bridge/ReadableMap;)Lcom/facebook/react/bridge/WritableMap;",
          args,
          count,
          cachedMethodId);
}

static facebook::jsi::Value
__hostFunction_NativeSampleTurboModuleSpecJSI_getValueWithCallback(
    facebook::jsi::Runtime& rt,
    TurboModule& turboModule,
    const facebook::jsi::Value* args,
    size_t count) {
  static jmethodID cachedMethodId = nullptr;
  return static_cast<JavaTurboModule&>(turboModule)
      .invokeJavaMethod(
          rt,
          VoidKind,
          "getValueWithCallback",
          "(Lcom/facebook/react/bridge/Callback;)V",
          args,
          count,
          cachedMethodId);
}

static facebook::jsi::Value
__hostFunction_NativeSampleTurboModuleSpecJSI_getValueWithPromise(
    facebook::jsi::Runtime& rt,
    TurboModule& turboModule,
    const facebook::jsi::Value* args,
    size_t count) {
  static jmethodID cachedMethodId = nullptr;
  return static_cast<JavaTurboModule&>(turboModule)
      .invokeJavaMethod(
          rt,
          PromiseKind,
          "getValueWithPromise",
          "(ZLcom/facebook/react/bridge/Promise;)V",
          args,
          count,
          cachedMethodId);
}

static facebook::jsi::Value
__hostFunction_NativeSampleTurboModuleSpecJSI_voidFuncThrows(
    facebook::jsi::Runtime& rt,
    TurboModule& turboModule,
    const facebook::jsi::Value* args,
    size_t count) {
  static jmethodID cachedMethodId = nullptr;
  return static_cast<JavaTurboModule&>(turboModule)
      .invokeJavaMethod(
          rt, VoidKind, "voidFuncThrows", "()V", args, count, cachedMethodId);
}

static facebook::jsi::Value
__hostFunction_NativeSampleTurboModuleSpecJSI_getObjectThrows(
    facebook::jsi::Runtime& rt,
    TurboModule& turboModule,
    const facebook::jsi::Value* args,
    size_t count) {
  static jmethodID cachedMethodId = nullptr;
  return static_cast<JavaTurboModule&>(turboModule)
      .invokeJavaMethod(
          rt,
          ObjectKind,
          "getObjectThrows",
          "(Lcom/facebook/react/bridge/ReadableMap;)Lcom/facebook/react/bridge/WritableMap;",
          args,
          count,
          cachedMethodId);
}

static facebook::jsi::Value
__hostFunction_NativeSampleTurboModuleSpecJSI_promiseThrows(
    facebook::jsi::Runtime& rt,
    TurboModule& turboModule,
    const facebook::jsi::Value* args,
    size_t count) {
  static jmethodID cachedMethodId = nullptr;
  return static_cast<JavaTurboModule&>(turboModule)
      .invokeJavaMethod(
          rt,
          PromiseKind,
          "promiseThrows",
          "(Lcom/facebook/react/bridge/Promise;)V",
          args,
          count,
          cachedMethodId);
}

static facebook::jsi::Value
__hostFunction_NativeSampleTurboModuleSpecJSI_voidFuncAssert(
    facebook::jsi::Runtime& rt,
    TurboModule& turboModule,
    const facebook::jsi::Value* args,
    size_t count) {
  static jmethodID cachedMethodId = nullptr;
  return static_cast<JavaTurboModule&>(turboModule)
      .invokeJavaMethod(
          rt, VoidKind, "voidFuncAssert", "()V", args, count, cachedMethodId);
}

static facebook::jsi::Value
__hostFunction_NativeSampleTurboModuleSpecJSI_getObjectAssert(
    facebook::jsi::Runtime& rt,
    TurboModule& turboModule,
    const facebook::jsi::Value* args,
    size_t count) {
  static jmethodID cachedMethodId = nullptr;
  return static_cast<JavaTurboModule&>(turboModule)
      .invokeJavaMethod(
          rt,
          ObjectKind,
          "getObjectAssert",
          "(Lcom/facebook/react/bridge/ReadableMap;)Lcom/facebook/react/bridge/WritableMap;",
          args,
          count,
          cachedMethodId);
}

static facebook::jsi::Value
__hostFunction_NativeSampleTurboModuleSpecJSI_promiseAssert(
    facebook::jsi::Runtime& rt,
    TurboModule& turboModule,
    const facebook::jsi::Value* args,
    size_t count) {
  static jmethodID cachedMethodId = nullptr;
  return static_cast<JavaTurboModule&>(turboModule)
      .invokeJavaMethod(
          rt,
          PromiseKind,
          "promiseAssert",
          "(Lcom/facebook/react/bridge/Promise;)V",
          args,
          count,
          cachedMethodId);
}

static facebook::jsi::Value
__hostFunction_NativeSampleTurboModuleSpecJSI_getImageUrl(
    facebook::jsi::Runtime& rt,
    TurboModule& turboModule,
    const facebook::jsi::Value* args,
    size_t count) {
  static jmethodID cachedMethodId = nullptr;
  return static_cast<JavaTurboModule&>(turboModule)
      .invokeJavaMethod(
          rt,
          PromiseKind,
          "getImageUrl",
          "(Lcom/facebook/react/bridge/Promise;)V",
          args,
          count,
          cachedMethodId);
}

NativeSampleTurboModuleSpecJSI::NativeSampleTurboModuleSpecJSI(
    const JavaTurboModule::InitParams& params)
    : JavaTurboModule(params) {
  methodMap_["getConstants"] = MethodMetadata{
      .argCount = 0,
      .invoker = __hostFunction_NativeSampleTurboModuleSpecJSI_getConstants};
  methodMap_["voidFunc"] = MethodMetadata{
      .argCount = 0,
      .invoker = __hostFunction_NativeSampleTurboModuleSpecJSI_voidFunc};
  methodMap_["getBool"] = MethodMetadata{
      .argCount = 1,
      .invoker = __hostFunction_NativeSampleTurboModuleSpecJSI_getBool};
  methodMap_["getEnum"] = MethodMetadata{
      .argCount = 1,
      .invoker = __hostFunction_NativeSampleTurboModuleSpecJSI_getEnum};
  methodMap_["getNumber"] = MethodMetadata{
      .argCount = 1,
      .invoker = __hostFunction_NativeSampleTurboModuleSpecJSI_getNumber};
  methodMap_["getString"] = MethodMetadata{
      .argCount = 1,
      .invoker = __hostFunction_NativeSampleTurboModuleSpecJSI_getString};
  methodMap_["getArray"] = MethodMetadata{
      .argCount = 1,
      .invoker = __hostFunction_NativeSampleTurboModuleSpecJSI_getArray};
  methodMap_["getObject"] = MethodMetadata{
      .argCount = 1,
      .invoker = __hostFunction_NativeSampleTurboModuleSpecJSI_getObject};
  methodMap_["getUnsafeObject"] = MethodMetadata{
      .argCount = 1,
      .invoker = __hostFunction_NativeSampleTurboModuleSpecJSI_getUnsafeObject};
  methodMap_["getRootTag"] = MethodMetadata{
      .argCount = 1,
      .invoker = __hostFunction_NativeSampleTurboModuleSpecJSI_getRootTag};
  methodMap_["getValue"] = MethodMetadata{
      .argCount = 3,
      .invoker = __hostFunction_NativeSampleTurboModuleSpecJSI_getValue};
  methodMap_["getValueWithCallback"] = MethodMetadata{
      .argCount = 1,
      .invoker =
          __hostFunction_NativeSampleTurboModuleSpecJSI_getValueWithCallback};
  methodMap_["getValueWithPromise"] = MethodMetadata{
      .argCount = 1,
      .invoker =
          __hostFunction_NativeSampleTurboModuleSpecJSI_getValueWithPromise};
  methodMap_["voidFuncThrows"] = MethodMetadata{
      .argCount = 0,
      .invoker = __hostFunction_NativeSampleTurboModuleSpecJSI_voidFuncThrows};
  methodMap_["getObjectThrows"] = MethodMetadata{
      .argCount = 1,
      .invoker = __hostFunction_NativeSampleTurboModuleSpecJSI_getObjectThrows};
  methodMap_["promiseThrows"] = MethodMetadata{
      .argCount = 0,
      .invoker = __hostFunction_NativeSampleTurboModuleSpecJSI_promiseThrows};
  methodMap_["voidFuncAssert"] = MethodMetadata{
      .argCount = 0,
      .invoker = __hostFunction_NativeSampleTurboModuleSpecJSI_voidFuncAssert};
  methodMap_["getObjectAssert"] = MethodMetadata{
      .argCount = 1,
      .invoker = __hostFunction_NativeSampleTurboModuleSpecJSI_getObjectAssert};
  methodMap_["promiseAssert"] = MethodMetadata{
      .argCount = 0,
      .invoker = __hostFunction_NativeSampleTurboModuleSpecJSI_promiseAssert};
  methodMap_["getImageUrl"] = MethodMetadata{
      .argCount = 0,
      .invoker = __hostFunction_NativeSampleTurboModuleSpecJSI_getImageUrl};
  eventEmitterMap_["onPress"] =
      std::make_shared<AsyncEventEmitter<folly::dynamic>>();
  eventEmitterMap_["onClick"] =
      std::make_shared<AsyncEventEmitter<folly::dynamic>>();
  eventEmitterMap_["onChange"] =
      std::make_shared<AsyncEventEmitter<folly::dynamic>>();
  eventEmitterMap_["onSubmit"] =
      std::make_shared<AsyncEventEmitter<folly::dynamic>>();
  configureEventEmitterCallback();
}

std::shared_ptr<TurboModule> SampleTurboModuleSpec_ModuleProvider(
    const std::string& moduleName,
    const JavaTurboModule::InitParams& params) {
  if (moduleName == "SampleTurboModule") {
    return std::make_shared<NativeSampleTurboModuleSpecJSI>(params);
  }
  return nullptr;
}

} // namespace facebook::react

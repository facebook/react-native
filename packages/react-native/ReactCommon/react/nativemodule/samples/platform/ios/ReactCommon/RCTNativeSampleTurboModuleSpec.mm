/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTNativeSampleTurboModuleSpec.h"

namespace facebook::react {

static facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_voidFunc(
    facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, VoidKind, "voidFunc", @selector(voidFunc), args, count);
}

static facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getBool(
    facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, BooleanKind, "getBool", @selector(getBool:), args, count);
}

static facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getEnum(
    facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, NumberKind, "getEnum", @selector(getEnum:), args, count);
}

static facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getNumber(
    facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, NumberKind, "getNumber", @selector(getNumber:), args, count);
}

static facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getString(
    facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, StringKind, "getString", @selector(getString:), args, count);
}

static facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getArray(
    facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, ArrayKind, "getArray", @selector(getArray:), args, count);
}

static facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getObject(
    facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, ObjectKind, "getObject", @selector(getObject:), args, count);
}

static facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getUnsafeObject(
    facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, ObjectKind, "getUnsafeObject", @selector(getUnsafeObject:), args, count);
}

static facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getRootTag(
    facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, NumberKind, "getRootTag", @selector(getRootTag:), args, count);
}

static facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getValue(
    facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, ObjectKind, "getValue", @selector(getValue:y:z:), args, count);
}

static facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getValueWithCallback(
    facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, VoidKind, "getValueWithCallback", @selector(getValueWithCallback:), args, count);
}

static facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getValueWithPromise(
    facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(
          rt, PromiseKind, "getValueWithPromise", @selector(getValueWithPromise:resolve:reject:), args, count);
}

static facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_voidFuncThrows(
    facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, VoidKind, "voidFuncThrows", @selector(voidFuncThrows), args, count);
}

static facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getObjectThrows(
    facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, ObjectKind, "getObjectThrows", @selector(getObjectThrows:), args, count);
}

static facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_promiseThrows(
    facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, PromiseKind, "promiseThrows", @selector(promiseThrows:reject:), args, count);
}

static facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_voidFuncAssert(
    facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, VoidKind, "voidFuncAssert", @selector(voidFuncAssert), args, count);
}

static facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getObjectAssert(
    facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, ObjectKind, "getObjectAssert", @selector(getObjectAssert:), args, count);
}

static facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_promiseAssert(
    facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, PromiseKind, "promiseAssert", @selector(promiseAssert:reject:), args, count);
}

static facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getConstants(
    facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, ObjectKind, "getConstants", @selector(getConstants), args, count);
}

NativeSampleTurboModuleSpecJSI::NativeSampleTurboModuleSpecJSI(const ObjCTurboModule::InitParams &params)
    : ObjCTurboModule(params)
{
  methodMap_["voidFunc"] =
      MethodMetadata{.argCount = 0, .invoker = __hostFunction_NativeSampleTurboModuleSpecJSI_voidFunc};
  methodMap_["getBool"] =
      MethodMetadata{.argCount = 1, .invoker = __hostFunction_NativeSampleTurboModuleSpecJSI_getBool};
  methodMap_["getEnum"] =
      MethodMetadata{.argCount = 1, .invoker = __hostFunction_NativeSampleTurboModuleSpecJSI_getEnum};
  methodMap_["getNumber"] =
      MethodMetadata{.argCount = 1, .invoker = __hostFunction_NativeSampleTurboModuleSpecJSI_getNumber};
  methodMap_["getString"] =
      MethodMetadata{.argCount = 1, .invoker = __hostFunction_NativeSampleTurboModuleSpecJSI_getString};
  methodMap_["getArray"] =
      MethodMetadata{.argCount = 1, .invoker = __hostFunction_NativeSampleTurboModuleSpecJSI_getArray};
  methodMap_["getObject"] =
      MethodMetadata{.argCount = 1, .invoker = __hostFunction_NativeSampleTurboModuleSpecJSI_getObject};
  methodMap_["getUnsafeObject"] =
      MethodMetadata{.argCount = 1, .invoker = __hostFunction_NativeSampleTurboModuleSpecJSI_getUnsafeObject};
  methodMap_["getRootTag"] =
      MethodMetadata{.argCount = 1, .invoker = __hostFunction_NativeSampleTurboModuleSpecJSI_getRootTag};
  methodMap_["getValue"] =
      MethodMetadata{.argCount = 3, .invoker = __hostFunction_NativeSampleTurboModuleSpecJSI_getValue};
  methodMap_["getValueWithCallback"] =
      MethodMetadata{.argCount = 1, .invoker = __hostFunction_NativeSampleTurboModuleSpecJSI_getValueWithCallback};
  methodMap_["getValueWithPromise"] =
      MethodMetadata{.argCount = 1, .invoker = __hostFunction_NativeSampleTurboModuleSpecJSI_getValueWithPromise};
  methodMap_["voidFuncThrows"] =
      MethodMetadata{.argCount = 0, .invoker = __hostFunction_NativeSampleTurboModuleSpecJSI_voidFuncThrows};
  methodMap_["getObjectThrows"] =
      MethodMetadata{.argCount = 1, .invoker = __hostFunction_NativeSampleTurboModuleSpecJSI_getObjectThrows};
  methodMap_["promiseThrows"] =
      MethodMetadata{.argCount = 0, .invoker = __hostFunction_NativeSampleTurboModuleSpecJSI_promiseThrows};
  methodMap_["voidFuncAssert"] =
      MethodMetadata{.argCount = 0, .invoker = __hostFunction_NativeSampleTurboModuleSpecJSI_voidFuncAssert};
  methodMap_["getObjectAssert"] =
      MethodMetadata{.argCount = 1, .invoker = __hostFunction_NativeSampleTurboModuleSpecJSI_getObjectAssert};
  methodMap_["promiseAssert"] =
      MethodMetadata{.argCount = 0, .invoker = __hostFunction_NativeSampleTurboModuleSpecJSI_promiseAssert};
  methodMap_["getConstants"] =
      MethodMetadata{.argCount = 0, .invoker = __hostFunction_NativeSampleTurboModuleSpecJSI_getConstants};
  eventEmitterMap_["onPress"] = std::make_shared<AsyncEventEmitter<id>>();
  eventEmitterMap_["onClick"] = std::make_shared<AsyncEventEmitter<id>>();
  eventEmitterMap_["onChange"] = std::make_shared<AsyncEventEmitter<id>>();
  eventEmitterMap_["onSubmit"] = std::make_shared<AsyncEventEmitter<id>>();
  setEventEmitterCallback([&](const std::string &name, id value) {
    static_cast<AsyncEventEmitter<id> &>(*eventEmitterMap_[name]).emit(value);
  });
}

} // namespace facebook::react

@implementation NativeSampleTurboModuleSpecBase
- (void)setEventEmitterCallback:(EventEmitterCallbackWrapper *_Nonnull)eventEmitterCallbackWrapper
{
  _eventEmitterCallback = std::move(eventEmitterCallbackWrapper->_eventEmitterCallback);
}

- (void)emitOnPress
{
  _eventEmitterCallback("onPress", nil);
}

- (void)emitOnClick:(NSString *)value
{
  _eventEmitterCallback("onClick", value);
}

- (void)emitOnChange:(NSDictionary *)value
{
  _eventEmitterCallback("onChange", value);
}

- (void)emitOnSubmit:(NSArray *)value
{
  _eventEmitterCallback("onSubmit", value);
}
@end

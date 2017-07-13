/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#pragma once

#include <jschelpers/JSCWrapper.h>

#if defined(__APPLE__)

// Use for methods that are taking JSContextRef as a first param
#define __jsc_wrapper(method, ctx, ...)   \
  (facebook::react::isCustomJSCPtr(ctx) ? \
    facebook::react::customJSCWrapper() : \
    facebook::react::systemJSCWrapper()   \
  )->method(ctx, ## __VA_ARGS__)

// Use for methods that don't take a JSContextRef as a first param. The wrapped version
// of this method will require context as an additional param, but it will be dropped
// before calling into the JSC method.
#define __jsc_drop_ctx_wrapper(method, ctx, ...) \
  (facebook::react::isCustomJSCPtr(ctx) ?        \
    facebook::react::customJSCWrapper() :        \
    facebook::react::systemJSCWrapper()          \
  )->method(__VA_ARGS__)

// Use for methods were access to a JSContextRef is impractical. The first bool param
// will be dropped before the JSC method is invoked.
#define __jsc_bool_wrapper(method, useCustomJSC, ...) \
  (useCustomJSC ?                                     \
    facebook::react::customJSCWrapper() :             \
    facebook::react::systemJSCWrapper()               \
  )->method(__VA_ARGS__)

// Used for wrapping properties
#define __jsc_prop_wrapper(prop, ctx)     \
  (facebook::react::isCustomJSCPtr(ctx) ? \
    facebook::react::customJSCWrapper() : \
    facebook::react::systemJSCWrapper()   \
  )->prop

// Poison all regular versions of the JSC API in shared code. This prevents accidental
// mixed usage of regular and custom JSC methods.
// See https://gcc.gnu.org/onlinedocs/gcc-3.3/cpp/Pragmas.html for details
#define jsc_pragma(x) _Pragma(#x)
#define jsc_poison(methods) jsc_pragma(GCC poison methods)

#else

#define __jsc_wrapper(method, ctx, ...) method(ctx, ## __VA_ARGS__)
#define __jsc_drop_ctx_wrapper(method, ctx, ...) ((void)ctx, method(__VA_ARGS__))
#define __jsc_bool_wrapper(method, useCustomJSC, ...) \
  ((void)useCustomJSC, method(__VA_ARGS__))
#define __jsc_prop_wrapper(prop, ctx) prop

#define jsc_pragma(x)
#define jsc_poison(methods)

#endif

// JSGlobalContext
#define JSC_JSGlobalContextCreateInGroup(...) __jsc_bool_wrapper(JSGlobalContextCreateInGroup, __VA_ARGS__)
#define JSC_JSGlobalContextRelease(...) __jsc_wrapper(JSGlobalContextRelease, __VA_ARGS__)
#define JSC_JSGlobalContextSetName(...) __jsc_wrapper(JSGlobalContextSetName, __VA_ARGS__)

jsc_poison(JSContextGroupCreate JSContextGroupRelease JSContextGroupRetain
           JSGlobalContextCreate JSGlobalContextCreateInGroup JSGlobalContextCopyName
           JSGlobalContextRelease JSGlobalContextRetain JSGlobalContextSetName)

// JSContext
#define JSC_JSContextGetGlobalContext(...) __jsc_wrapper(JSContextGetGlobalContext, __VA_ARGS__)
#define JSC_JSContextGetGlobalObject(...) __jsc_wrapper(JSContextGetGlobalObject, __VA_ARGS__)
#define JSC_FBJSContextStartGCTimers(...) __jsc_wrapper(FBJSContextStartGCTimers, __VA_ARGS__)

jsc_poison(JSContextGetGlobalContext JSContextGetGlobalObject JSContextGetGroup FBJSContextStartGCTimers)

// JSEvaluate
#define JSC_JSEvaluateScript(...) __jsc_wrapper(JSEvaluateScript, __VA_ARGS__)
#define JSC_JSEvaluateBytecodeBundle(...) __jsc_wrapper(JSEvaluateBytecodeBundle, __VA_ARGS__)

jsc_poison(JSCheckScriptSyntax JSEvaluateScript JSEvaluateBytecodeBundle JSGarbageCollect)

// JSString
#define JSC_JSStringCreateWithCFString(...) __jsc_drop_ctx_wrapper(JSStringCreateWithCFString, __VA_ARGS__)
#define JSC_JSStringCreateWithUTF8CString(...) __jsc_drop_ctx_wrapper(JSStringCreateWithUTF8CString, __VA_ARGS__)
#define JSC_JSStringCreateWithUTF8CStringExpectAscii(...) __jsc_drop_ctx_wrapper(JSStringCreateWithUTF8CStringExpectAscii, __VA_ARGS__)
#define JSC_JSStringCopyCFString(...) __jsc_drop_ctx_wrapper(JSStringCopyCFString, __VA_ARGS__)
#define JSC_JSStringGetCharactersPtr(...) __jsc_drop_ctx_wrapper(JSStringGetCharactersPtr, __VA_ARGS__)
#define JSC_JSStringGetLength(...) __jsc_drop_ctx_wrapper(JSStringGetLength, __VA_ARGS__)
#define JSC_JSStringGetMaximumUTF8CStringSize(...) __jsc_drop_ctx_wrapper(JSStringGetMaximumUTF8CStringSize, __VA_ARGS__)
#define JSC_JSStringIsEqualToUTF8CString(...) __jsc_drop_ctx_wrapper(JSStringIsEqualToUTF8CString, __VA_ARGS__)
#define JSC_JSStringRelease(...) __jsc_drop_ctx_wrapper(JSStringRelease, __VA_ARGS__)
#define JSC_JSStringRetain(...) __jsc_drop_ctx_wrapper(JSStringRetain, __VA_ARGS__)

jsc_poison(JSStringCopyCFString JSStringCreateWithCharacters JSStringCreateWithCFString
           JSStringCreateWithUTF8CString JSStringCreateWithUTF8CStringExpectAscii
           JSStringGetCharactersPtr JSStringGetLength JSStringGetMaximumUTF8CStringSize
           JSStringGetUTF8CString JSStringIsEqual JSStringIsEqualToUTF8CString
           JSStringRelease JSStringRetain)

// JSValueRef
#define JSC_JSValueCreateJSONString(...) __jsc_wrapper(JSValueCreateJSONString, __VA_ARGS__)
#define JSC_JSValueGetType(...) __jsc_wrapper(JSValueGetType, __VA_ARGS__)
#define JSC_JSValueMakeFromJSONString(...) __jsc_wrapper(JSValueMakeFromJSONString, __VA_ARGS__)
#define JSC_JSValueMakeBoolean(...) __jsc_wrapper(JSValueMakeBoolean, __VA_ARGS__)
#define JSC_JSValueMakeNull(...) __jsc_wrapper(JSValueMakeNull, __VA_ARGS__)
#define JSC_JSValueMakeNumber(...) __jsc_wrapper(JSValueMakeNumber, __VA_ARGS__)
#define JSC_JSValueMakeString(...) __jsc_wrapper(JSValueMakeString, __VA_ARGS__)
#define JSC_JSValueMakeUndefined(...) __jsc_wrapper(JSValueMakeUndefined, __VA_ARGS__)
#define JSC_JSValueProtect(...) __jsc_wrapper(JSValueProtect, __VA_ARGS__)
#define JSC_JSValueToBoolean(...) __jsc_wrapper(JSValueToBoolean, __VA_ARGS__)
#define JSC_JSValueToNumber(...) __jsc_wrapper(JSValueToNumber, __VA_ARGS__)
#define JSC_JSValueToObject(...) __jsc_wrapper(JSValueToObject, __VA_ARGS__)
#define JSC_JSValueToStringCopy(...) __jsc_wrapper(JSValueToStringCopy, __VA_ARGS__)
#define JSC_JSValueUnprotect(...) __jsc_wrapper(JSValueUnprotect, __VA_ARGS__)

jsc_poison(JSValueCreateJSONString JSValueGetType JSValueGetTypedArrayType JSValueIsArray
           JSValueIsBoolean JSValueIsDate JSValueIsEqual JSValueIsInstanceOfConstructor
           JSValueIsNull JSValueIsNumber JSValueIsObject JSValueIsObjectOfClass
           JSValueIsStrictEqual JSValueIsString JSValueIsString JSValueIsUndefined
           JSValueMakeBoolean JSValueMakeFromJSONString JSValueMakeNull JSValueMakeNumber
           JSValueMakeString JSValueMakeUndefined JSValueProtect JSValueToBoolean
           JSValueToNumber JSValueToObject JSValueToStringCopy JSValueUnprotect)

// JSClass
#define JSC_JSClassCreate(...) __jsc_bool_wrapper(JSClassCreate, __VA_ARGS__)
#define JSC_JSClassRelease(...) __jsc_bool_wrapper(JSClassRelease, __VA_ARGS__)

jsc_poison(JSClassCreate JSClassRelease JSClassRetain)

// JSObject
#define JSC_JSObjectCallAsConstructor(...) __jsc_wrapper(JSObjectCallAsConstructor, __VA_ARGS__)
#define JSC_JSObjectCallAsFunction(...) __jsc_wrapper(JSObjectCallAsFunction, __VA_ARGS__)
#define JSC_JSObjectGetPrivate(...) __jsc_bool_wrapper(JSObjectGetPrivate, __VA_ARGS__)
#define JSC_JSObjectGetProperty(...) __jsc_wrapper(JSObjectGetProperty, __VA_ARGS__)
#define JSC_JSObjectGetPropertyAtIndex(...) __jsc_wrapper(JSObjectGetPropertyAtIndex, __VA_ARGS__)
#define JSC_JSObjectIsConstructor(...) __jsc_wrapper(JSObjectIsConstructor, __VA_ARGS__)
#define JSC_JSObjectIsFunction(...) __jsc_wrapper(JSObjectIsFunction, __VA_ARGS__)
#define JSC_JSObjectMake(...) __jsc_wrapper(JSObjectMake, __VA_ARGS__)
#define JSC_JSObjectMakeArray(...) __jsc_wrapper(JSObjectMakeArray, __VA_ARGS__)
#define JSC_JSObjectMakeError(...) __jsc_wrapper(JSObjectMakeError, __VA_ARGS__)
#define JSC_JSObjectMakeFunctionWithCallback(...) __jsc_wrapper(JSObjectMakeFunctionWithCallback, __VA_ARGS__)
#define JSC_JSObjectSetPrivate(...) __jsc_bool_wrapper(JSObjectSetPrivate, __VA_ARGS__)
#define JSC_JSObjectSetProperty(...) __jsc_wrapper(JSObjectSetProperty, __VA_ARGS__)
#define JSC_JSObjectSetPropertyAtIndex(...) __jsc_wrapper(JSObjectSetPropertyAtIndex, __VA_ARGS__)

jsc_poison(JSObjectCallAsConstructor JSObjectCallAsFunction JSObjectDeleteProperty
           JSObjectGetPrivate JSObjectGetProperty JSObjectGetPropertyAtIndex
           JSObjectGetPrototype JSObjectHasProperty JSObjectIsConstructor
           JSObjectIsFunction JSObjectMake JSObjectMakeArray JSObjectMakeConstructor
           JSObjectMakeDate JSObjectMakeError JSObjectMakeFunction
           JSObjectMakeFunctionWithCallback JSObjectMakeRegExp JSObjectSetPrivate
           JSObjectSetPrototype JSObjectSetProperty JSObjectSetPropertyAtIndex)

// JSPropertyNameArray
#define JSC_JSObjectCopyPropertyNames(...) __jsc_wrapper(JSObjectCopyPropertyNames, __VA_ARGS__)
#define JSC_JSPropertyNameArrayGetCount(...) __jsc_drop_ctx_wrapper(JSPropertyNameArrayGetCount, __VA_ARGS__)
#define JSC_JSPropertyNameArrayGetNameAtIndex(...) __jsc_drop_ctx_wrapper(JSPropertyNameArrayGetNameAtIndex, __VA_ARGS__)
#define JSC_JSPropertyNameArrayRelease(...) __jsc_drop_ctx_wrapper(JSPropertyNameArrayRelease, __VA_ARGS__)

jsc_poison(JSObjectCopyPropertyNames JSPropertyNameAccumulatorAddName
           JSPropertyNameArrayGetCount JSPropertyNameArrayGetNameAtIndex
           JSPropertyNameArrayRelease JSPropertyNameArrayRetain)

// JSTypedArray
jsc_poison(JSObjectMakeArrayBufferWithBytesNoCopy JSObjectMakeTypedArray
           JSObjectMakeTypedArrayWithArrayBuffer
           JSObjectMakeTypedArrayWithArrayBufferAndOffset
           JSObjectMakeTypedArrayWithBytesNoCopy JSObjectGetTypedArrayByteLength
           JSObjectGetTypedArrayByteOffset JSObjectGetTypedArrayBytesPtr
           JSObjectGetTypedArrayBuffer JSObjectGetTypedArrayLength
           JSObjectGetArrayBufferBytesPtr JSObjectGetArrayBufferByteLength)

// Sampling profiler
#define JSC_JSSamplingProfilerEnabled(...) __jsc_drop_ctx_wrapper(JSSamplingProfilerEnabled, __VA_ARGS__)
#define JSC_JSPokeSamplingProfiler(...) __jsc_wrapper(JSPokeSamplingProfiler, __VA_ARGS__)
#define JSC_JSStartSamplingProfilingOnMainJSCThread(...) __jsc_wrapper(JSStartSamplingProfilingOnMainJSCThread, __VA_ARGS__)

jsc_poison(JSSamplingProfilerEnabled JSPokeSamplingProfiler
           JSStartSamplingProfilingOnMainJSCThread)

#define JSC_JSInspectorGetInstance(...) __jsc_bool_wrapper(JSInspectorGetInstance, __VA_ARGS__)
// no need to poison JSInspectorGetInstance because it's not defined for System JSC / standard SDK header
// jsc_poison(JSInspectorGetInstance)


#define JSC_configureJSCForIOS(...) __jsc_bool_wrapper(configureJSCForIOS, __VA_ARGS__)

jsc_poison(configureJSCForIOS)

// Objective-C API
#define JSC_JSContext(ctx) __jsc_prop_wrapper(JSContext, ctx)
#define JSC_JSValue(ctx) __jsc_prop_wrapper(JSValue, ctx)

#undef jsc_poison
#undef jsc_pragma

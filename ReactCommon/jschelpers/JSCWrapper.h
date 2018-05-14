/**
 * Copyright (c) 2016-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <string>
#include <JavaScriptCore/JavaScript.h>

#if defined(JSCINTERNAL) || (!defined(__APPLE__))
#define JSC_IMPORT extern "C"
#else
#define JSC_IMPORT extern
#endif

#ifndef RN_EXPORT
#define RN_EXPORT __attribute__((visibility("default")))
#endif

namespace facebook {
namespace react {
  class IInspector;
}
}

JSC_IMPORT void JSGlobalContextEnableDebugger(
    JSGlobalContextRef ctx,
    facebook::react::IInspector &globalInspector,
    const char *title,
    const std::function<bool()> &checkIsInspectedRemote);
JSC_IMPORT void JSGlobalContextDisableDebugger(
    JSGlobalContextRef ctx,
    facebook::react::IInspector &globalInspector);

// This is used to substitute an alternate JSC implementation for
// testing. These calls must all be ABI compatible with the standard JSC.
JSC_IMPORT JSValueRef JSEvaluateBytecodeBundle(JSContextRef, JSObjectRef, int, JSStringRef, JSValueRef*);
JSC_IMPORT bool JSSamplingProfilerEnabled();
JSC_IMPORT void JSStartSamplingProfilingOnMainJSCThread(JSGlobalContextRef);
JSC_IMPORT JSValueRef JSPokeSamplingProfiler(JSContextRef);
#ifdef __cplusplus
extern "C" {
#endif
JSC_IMPORT void configureJSCForIOS(std::string); // TODO: replace with folly::dynamic once supported
JSC_IMPORT void FBJSContextStartGCTimers(JSContextRef);
#ifdef __cplusplus
}
#endif

#if defined(__APPLE__)
#include <objc/objc.h>
#include <JavaScriptCore/JSStringRefCF.h>
#include <string>

/**
 * JSNoBytecodeFileFormatVersion
 *
 * Version number indicating that bytecode is not supported by this runtime.
 */
RN_EXPORT extern const int32_t JSNoBytecodeFileFormatVersion;

namespace facebook {
namespace react {

#define JSC_WRAPPER_METHOD(m) decltype(&m) m

struct JSCWrapper {
  // JSGlobalContext
  JSC_WRAPPER_METHOD(JSGlobalContextCreateInGroup);
  JSC_WRAPPER_METHOD(JSGlobalContextRelease);
  JSC_WRAPPER_METHOD(JSGlobalContextSetName);

  // JSContext
  JSC_WRAPPER_METHOD(JSContextGetGlobalContext);
  JSC_WRAPPER_METHOD(JSContextGetGlobalObject);
  JSC_WRAPPER_METHOD(FBJSContextStartGCTimers);

  // JSEvaluate
  JSC_WRAPPER_METHOD(JSEvaluateScript);
  JSC_WRAPPER_METHOD(JSEvaluateBytecodeBundle);

  // JSString
  JSC_WRAPPER_METHOD(JSStringCreateWithUTF8CString);
  JSC_WRAPPER_METHOD(JSStringCreateWithCFString);
  #if WITH_FBJSCEXTENSIONS
  JSC_WRAPPER_METHOD(JSStringCreateWithUTF8CStringExpectAscii);
  #endif
  JSC_WRAPPER_METHOD(JSStringCopyCFString);
  JSC_WRAPPER_METHOD(JSStringGetCharactersPtr);
  JSC_WRAPPER_METHOD(JSStringGetLength);
  JSC_WRAPPER_METHOD(JSStringGetMaximumUTF8CStringSize);
  JSC_WRAPPER_METHOD(JSStringIsEqualToUTF8CString);
  JSC_WRAPPER_METHOD(JSStringRelease);
  JSC_WRAPPER_METHOD(JSStringRetain);

  // JSClass
  JSC_WRAPPER_METHOD(JSClassCreate);
  JSC_WRAPPER_METHOD(JSClassRelease);

  // JSObject
  JSC_WRAPPER_METHOD(JSObjectCallAsConstructor);
  JSC_WRAPPER_METHOD(JSObjectCallAsFunction);
  JSC_WRAPPER_METHOD(JSObjectGetPrivate);
  JSC_WRAPPER_METHOD(JSObjectGetProperty);
  JSC_WRAPPER_METHOD(JSObjectGetPropertyAtIndex);
  JSC_WRAPPER_METHOD(JSObjectIsConstructor);
  JSC_WRAPPER_METHOD(JSObjectIsFunction);
  JSC_WRAPPER_METHOD(JSObjectMake);
  JSC_WRAPPER_METHOD(JSObjectMakeArray);
  JSC_WRAPPER_METHOD(JSObjectMakeDate);
  JSC_WRAPPER_METHOD(JSObjectMakeError);
  JSC_WRAPPER_METHOD(JSObjectMakeFunctionWithCallback);
  JSC_WRAPPER_METHOD(JSObjectSetPrivate);
  JSC_WRAPPER_METHOD(JSObjectSetProperty);
  JSC_WRAPPER_METHOD(JSObjectSetPropertyAtIndex);

  // JSPropertyNameArray
  JSC_WRAPPER_METHOD(JSObjectCopyPropertyNames);
  JSC_WRAPPER_METHOD(JSPropertyNameArrayGetCount);
  JSC_WRAPPER_METHOD(JSPropertyNameArrayGetNameAtIndex);
  JSC_WRAPPER_METHOD(JSPropertyNameArrayRelease);

  // JSValue
  JSC_WRAPPER_METHOD(JSValueCreateJSONString);
  JSC_WRAPPER_METHOD(JSValueGetType);
  JSC_WRAPPER_METHOD(JSValueMakeFromJSONString);
  JSC_WRAPPER_METHOD(JSValueMakeBoolean);
  JSC_WRAPPER_METHOD(JSValueMakeNull);
  JSC_WRAPPER_METHOD(JSValueMakeNumber);
  JSC_WRAPPER_METHOD(JSValueMakeString);
  JSC_WRAPPER_METHOD(JSValueMakeUndefined);
  JSC_WRAPPER_METHOD(JSValueProtect);
  JSC_WRAPPER_METHOD(JSValueToBoolean);
  JSC_WRAPPER_METHOD(JSValueToNumber);
  JSC_WRAPPER_METHOD(JSValueToObject);
  JSC_WRAPPER_METHOD(JSValueToStringCopy);
  JSC_WRAPPER_METHOD(JSValueUnprotect);
  JSC_WRAPPER_METHOD(JSValueIsNull);

  // Sampling profiler
  JSC_WRAPPER_METHOD(JSSamplingProfilerEnabled);
  JSC_WRAPPER_METHOD(JSPokeSamplingProfiler);
  JSC_WRAPPER_METHOD(JSStartSamplingProfilingOnMainJSCThread);

  JSC_WRAPPER_METHOD(JSGlobalContextEnableDebugger);
  JSC_WRAPPER_METHOD(JSGlobalContextDisableDebugger);

  JSC_WRAPPER_METHOD(configureJSCForIOS);

  // Objective-C API
  Class JSContext;
  Class JSValue;

  int32_t JSBytecodeFileFormatVersion;
};

template <typename T>
bool isCustomJSCPtr(T *x) {
  return (uintptr_t)x & 0x1;
}

RN_EXPORT bool isCustomJSCWrapperSet();
RN_EXPORT void setCustomJSCWrapper(const JSCWrapper* wrapper);

// This will return a single value for the whole life of the process.
RN_EXPORT const JSCWrapper *systemJSCWrapper();
RN_EXPORT const JSCWrapper *customJSCWrapper();

} }

#else

namespace facebook {
namespace react {

template <typename T>
bool isCustomJSCPtr(T *x) {
  // Always use system JSC pointers
  return false;
}

} }

#endif

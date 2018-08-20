/**
 * Copyright (c) 2016-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <jschelpers/JSCWrapper.h>

#if defined(__APPLE__)

#include <mutex>

#include <objc/runtime.h>

// Crash the app (with a descriptive stack trace) if a function that is not supported by
// the system JSC is called.
#define UNIMPLEMENTED_SYSTEM_JSC_FUNCTION(FUNC_NAME)            \
static void Unimplemented_##FUNC_NAME(__unused void* args...) { \
  assert(false);                                                \
}

UNIMPLEMENTED_SYSTEM_JSC_FUNCTION(JSEvaluateBytecodeBundle)
#if WITH_FBJSCEXTENSIONS
UNIMPLEMENTED_SYSTEM_JSC_FUNCTION(JSStringCreateWithUTF8CStringExpectAscii)
#endif
UNIMPLEMENTED_SYSTEM_JSC_FUNCTION(JSPokeSamplingProfiler)
UNIMPLEMENTED_SYSTEM_JSC_FUNCTION(JSStartSamplingProfilingOnMainJSCThread)

UNIMPLEMENTED_SYSTEM_JSC_FUNCTION(JSGlobalContextEnableDebugger)
UNIMPLEMENTED_SYSTEM_JSC_FUNCTION(JSGlobalContextDisableDebugger)

UNIMPLEMENTED_SYSTEM_JSC_FUNCTION(configureJSCForIOS)

UNIMPLEMENTED_SYSTEM_JSC_FUNCTION(FBJSContextStartGCTimers)

bool JSSamplingProfilerEnabled() {
  return false;
}

const int32_t JSNoBytecodeFileFormatVersion = -1;

namespace facebook {
namespace react {

static JSCWrapper s_systemWrapper = {};

const JSCWrapper* systemJSCWrapper() {
  // Note that this is not used on Android. All methods are statically linked instead.
  // Some fields are lazily initialized
  static std::once_flag flag;
  std::call_once(flag, []() {
    s_systemWrapper = {
      .JSGlobalContextCreateInGroup = JSGlobalContextCreateInGroup,
      .JSGlobalContextRelease = JSGlobalContextRelease,
      .JSGlobalContextSetName = JSGlobalContextSetName,

      .JSContextGetGlobalContext = JSContextGetGlobalContext,
      .JSContextGetGlobalObject = JSContextGetGlobalObject,
      .FBJSContextStartGCTimers =
        (decltype(&FBJSContextStartGCTimers))
        Unimplemented_FBJSContextStartGCTimers,

      .JSEvaluateScript = JSEvaluateScript,
      .JSEvaluateBytecodeBundle =
        (decltype(&JSEvaluateBytecodeBundle))
        Unimplemented_JSEvaluateBytecodeBundle,

      .JSStringCreateWithUTF8CString = JSStringCreateWithUTF8CString,
      .JSStringCreateWithCFString = JSStringCreateWithCFString,
      #if WITH_FBJSCEXTENSIONS
      .JSStringCreateWithUTF8CStringExpectAscii =
        (decltype(&JSStringCreateWithUTF8CStringExpectAscii))
        Unimplemented_JSStringCreateWithUTF8CStringExpectAscii,
      #endif
      .JSStringCopyCFString = JSStringCopyCFString,
      .JSStringGetCharactersPtr = JSStringGetCharactersPtr,
      .JSStringGetLength = JSStringGetLength,
      .JSStringGetMaximumUTF8CStringSize = JSStringGetMaximumUTF8CStringSize,
      .JSStringIsEqualToUTF8CString = JSStringIsEqualToUTF8CString,
      .JSStringRelease = JSStringRelease,
      .JSStringRetain = JSStringRetain,

      .JSClassCreate = JSClassCreate,
      .JSClassRetain = JSClassRetain,
      .JSClassRelease = JSClassRelease,

      .JSObjectCallAsConstructor = JSObjectCallAsConstructor,
      .JSObjectCallAsFunction = JSObjectCallAsFunction,
      .JSObjectGetPrivate = JSObjectGetPrivate,
      .JSObjectGetProperty = JSObjectGetProperty,
      .JSObjectGetPropertyAtIndex = JSObjectGetPropertyAtIndex,
      .JSObjectIsConstructor = JSObjectIsConstructor,
      .JSObjectIsFunction = JSObjectIsFunction,
      .JSObjectMake = JSObjectMake,
      .JSObjectMakeArray = JSObjectMakeArray,
      .JSObjectMakeDate = JSObjectMakeDate,
      .JSObjectMakeError = JSObjectMakeError,
      .JSObjectMakeFunctionWithCallback = JSObjectMakeFunctionWithCallback,
      .JSObjectSetPrivate = JSObjectSetPrivate,
      .JSObjectSetProperty = JSObjectSetProperty,
      .JSObjectSetPropertyAtIndex = JSObjectSetPropertyAtIndex,

      .JSObjectCopyPropertyNames = JSObjectCopyPropertyNames,
      .JSPropertyNameArrayGetCount = JSPropertyNameArrayGetCount,
      .JSPropertyNameArrayGetNameAtIndex = JSPropertyNameArrayGetNameAtIndex,
      .JSPropertyNameArrayRelease = JSPropertyNameArrayRelease,

      .JSValueCreateJSONString = JSValueCreateJSONString,
      .JSValueGetType = JSValueGetType,
      .JSValueMakeFromJSONString = JSValueMakeFromJSONString,
      .JSValueMakeBoolean = JSValueMakeBoolean,
      .JSValueMakeNull = JSValueMakeNull,
      .JSValueMakeNumber = JSValueMakeNumber,
      .JSValueMakeString = JSValueMakeString,
      .JSValueMakeUndefined = JSValueMakeUndefined,
      .JSValueProtect = JSValueProtect,
      .JSValueToBoolean = JSValueToBoolean,
      .JSValueToNumber = JSValueToNumber,
      .JSValueToObject = JSValueToObject,
      .JSValueToStringCopy = JSValueToStringCopy,
      .JSValueUnprotect = JSValueUnprotect,
      .JSValueIsNull = JSValueIsNull,

      .JSSamplingProfilerEnabled = JSSamplingProfilerEnabled,
      .JSPokeSamplingProfiler =
        (decltype(&JSPokeSamplingProfiler))
        Unimplemented_JSPokeSamplingProfiler,
      .JSStartSamplingProfilingOnMainJSCThread =
        (decltype(&JSStartSamplingProfilingOnMainJSCThread))
        Unimplemented_JSStartSamplingProfilingOnMainJSCThread,

      .JSGlobalContextEnableDebugger =
        (decltype(&JSGlobalContextEnableDebugger))
        Unimplemented_JSGlobalContextEnableDebugger,
      .JSGlobalContextDisableDebugger =
        (decltype(&JSGlobalContextDisableDebugger))
        Unimplemented_JSGlobalContextDisableDebugger,

      .configureJSCForIOS =
        (decltype(&configureJSCForIOS))Unimplemented_configureJSCForIOS,

      .JSContext = objc_getClass("JSContext"),
      .JSValue = objc_getClass("JSValue"),

      .JSBytecodeFileFormatVersion = JSNoBytecodeFileFormatVersion,
    };
  });
  return &s_systemWrapper;
}

} }

#endif

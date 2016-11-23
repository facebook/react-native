/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <JavaScriptCore/JavaScriptCore.h>

#import "RCTDefines.h"

typedef void (*voidWithNoParamsFuncType)();
typedef JSStringRef (*JSStringCreateWithCFStringFuncType)(CFStringRef);
typedef JSStringRef (*JSStringCreateWithUTF8CStringFuncType)(const char *);
typedef CFStringRef (*JSStringCopyCFStringFuncType)(CFAllocatorRef, JSStringRef);
typedef void (*JSStringReleaseFuncType)(JSStringRef);
typedef void (*JSGlobalContextSetNameFuncType)(JSGlobalContextRef, JSStringRef);
typedef void (*JSObjectSetPropertyFuncType)(JSContextRef, JSObjectRef, JSStringRef, JSValueRef, JSPropertyAttributes, JSValueRef *);
typedef JSObjectRef (*JSContextGetGlobalObjectFuncType)(JSContextRef);
typedef JSValueRef (*JSObjectGetPropertyFuncType)(JSContextRef, JSObjectRef, JSStringRef, JSValueRef *);
typedef bool (*JSObjectIsFunctionFuncType)(JSContextRef, JSObjectRef);
typedef bool (*JSObjectIsConstructorFuncType)(JSContextRef, JSObjectRef);
typedef JSPropertyNameArrayRef (*JSObjectCopyPropertyNamesFuncType)(JSContextRef, JSObjectRef);
typedef size_t (*JSPropertyNameArrayGetCountFuncType)(JSPropertyNameArrayRef);
typedef JSStringRef (*JSPropertyNameArrayGetNameAtIndexFuncType)(JSPropertyNameArrayRef, size_t);
typedef void (*JSPropertyNameArrayReleaseFuncType)(JSPropertyNameArrayRef);
typedef JSValueRef (*JSValueMakeFromJSONStringFuncType)(JSContextRef, JSStringRef);
typedef JSValueRef (*JSObjectCallAsFunctionFuncType)(JSContextRef, JSObjectRef, JSObjectRef, size_t, const JSValueRef *, JSValueRef *);
typedef JSValueRef (*JSValueRefWithJSContextRefFuncType)(JSContextRef);
typedef JSStringRef (*JSValueCreateJSONStringFuncType)(JSContextRef, JSValueRef, unsigned, JSValueRef *);
typedef bool (*JSValueIsUndefinedFuncType)(JSContextRef, JSValueRef);
typedef bool (*JSValueIsNullFuncType)(JSContextRef, JSValueRef);
typedef JSObjectRef (*JSValueToObjectFuncType)(JSContextRef, JSValueRef, JSValueRef *);
typedef JSValueRef (*JSEvaluateScriptFuncType)(JSContextRef, JSStringRef, JSObjectRef, JSStringRef, int, JSValueRef *);
typedef JSValueRef (*JSEvaluateBytecodeBundleFuncType)(JSContextRef, JSObjectRef, int, JSStringRef, JSValueRef *);
typedef bool (*JSSamplingProfilerEnabledFuncType)();
typedef void (*JSStartSamplingProfilingOnMainJSCThreadFuncType)(JSGlobalContextRef);

/**
 * JSNoBytecodeFileFormatVersion
 *
 * Version number indicating that bytecode is not supported by this runtime.
 */
extern const int32_t JSNoBytecodeFileFormatVersion;

typedef struct RCTJSCWrapper {
  JSStringCreateWithCFStringFuncType JSStringCreateWithCFString;
  JSStringCreateWithUTF8CStringFuncType JSStringCreateWithUTF8CString;
  JSStringCopyCFStringFuncType JSStringCopyCFString;
  JSStringReleaseFuncType JSStringRelease;
  JSGlobalContextSetNameFuncType JSGlobalContextSetName;
  JSObjectSetPropertyFuncType JSObjectSetProperty;
  JSContextGetGlobalObjectFuncType JSContextGetGlobalObject;
  JSObjectGetPropertyFuncType JSObjectGetProperty;
  JSObjectIsFunctionFuncType JSObjectIsFunction;
  JSObjectIsConstructorFuncType JSObjectIsConstructor;
  JSObjectCopyPropertyNamesFuncType JSObjectCopyPropertyNames;
  JSPropertyNameArrayGetCountFuncType JSPropertyNameArrayGetCount;
  JSPropertyNameArrayGetNameAtIndexFuncType JSPropertyNameArrayGetNameAtIndex;
  JSPropertyNameArrayReleaseFuncType JSPropertyNameArrayRelease;
  JSValueMakeFromJSONStringFuncType JSValueMakeFromJSONString;
  JSObjectCallAsFunctionFuncType JSObjectCallAsFunction;
  JSValueRefWithJSContextRefFuncType JSValueMakeNull;
  JSValueCreateJSONStringFuncType JSValueCreateJSONString;
  JSValueIsUndefinedFuncType JSValueIsUndefined;
  JSValueIsNullFuncType JSValueIsNull;
  JSValueToObjectFuncType JSValueToObject;
  JSEvaluateScriptFuncType JSEvaluateScript;
  JSEvaluateBytecodeBundleFuncType JSEvaluateBytecodeBundle;
  voidWithNoParamsFuncType configureJSCForIOS;
  JSSamplingProfilerEnabledFuncType JSSamplingProfilerEnabled;
  JSValueRefWithJSContextRefFuncType JSPokeSamplingProfiler;
  JSStartSamplingProfilingOnMainJSCThreadFuncType JSStartSamplingProfilingOnMainJSCThread;
  const int32_t JSBytecodeFileFormatVersion;
  Class JSContext;
  Class JSValue;
} RCTJSCWrapper;

RCT_EXTERN RCTJSCWrapper *RCTJSCWrapperCreate(BOOL useCustomJSC);
RCT_EXTERN void RCTJSCWrapperRelease(RCTJSCWrapper *wrapper);

/**
 * Link time overridable initialization function to execute custom
 * initialization code when loading custom JSC.
 *
 * By default it does nothing.
 *
 * @param handle to the dlopen'd JSC library.
 */
void __attribute__((visibility("hidden"))) RCTCustomJSCInit(void *handle);

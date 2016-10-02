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

typedef JSStringRef (*JSStringCreateWithCFStringFuncType)(CFStringRef);
typedef JSStringRef (*JSStringCreateWithUTF8CStringFuncType)(const char *);
typedef void (*JSStringReleaseFuncType)(JSStringRef);
typedef void (*JSGlobalContextSetNameFuncType)(JSGlobalContextRef, JSStringRef);
typedef void (*JSObjectSetPropertyFuncType)(JSContextRef, JSObjectRef, JSStringRef, JSValueRef, JSPropertyAttributes, JSValueRef *);
typedef JSObjectRef (*JSContextGetGlobalObjectFuncType)(JSContextRef);
typedef JSValueRef (*JSObjectGetPropertyFuncType)(JSContextRef, JSObjectRef, JSStringRef, JSValueRef *);
typedef JSValueRef (*JSValueMakeFromJSONStringFuncType)(JSContextRef, JSStringRef);
typedef JSValueRef (*JSObjectCallAsFunctionFuncType)(JSContextRef, JSObjectRef, JSObjectRef, size_t, const JSValueRef *, JSValueRef *);
typedef JSValueRef (*JSValueMakeNullFuncType)(JSContextRef);
typedef JSStringRef (*JSValueCreateJSONStringFuncType)(JSContextRef, JSValueRef, unsigned, JSValueRef *);
typedef bool (*JSValueIsUndefinedFuncType)(JSContextRef, JSValueRef);
typedef bool (*JSValueIsNullFuncType)(JSContextRef, JSValueRef);
typedef JSValueRef (*JSEvaluateScriptFuncType)(JSContextRef, JSStringRef, JSObjectRef, JSStringRef, int, JSValueRef *);
typedef void (*configureJSContextForIOSFuncType)(JSContextRef ctx, const char *cacheDir);

typedef struct RCTJSCWrapper {
  JSStringCreateWithCFStringFuncType JSStringCreateWithCFString;
  JSStringCreateWithUTF8CStringFuncType JSStringCreateWithUTF8CString;
  JSStringReleaseFuncType JSStringRelease;
  JSGlobalContextSetNameFuncType JSGlobalContextSetName;
  JSObjectSetPropertyFuncType JSObjectSetProperty;
  JSContextGetGlobalObjectFuncType JSContextGetGlobalObject;
  JSObjectGetPropertyFuncType JSObjectGetProperty;
  JSValueMakeFromJSONStringFuncType JSValueMakeFromJSONString;
  JSObjectCallAsFunctionFuncType JSObjectCallAsFunction;
  JSValueMakeNullFuncType JSValueMakeNull;
  JSValueCreateJSONStringFuncType JSValueCreateJSONString;
  JSValueIsUndefinedFuncType JSValueIsUndefined;
  JSValueIsNullFuncType JSValueIsNull;
  JSEvaluateScriptFuncType JSEvaluateScript;
  Class JSContext;
  Class JSValue;
  configureJSContextForIOSFuncType configureJSContextForIOS;
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

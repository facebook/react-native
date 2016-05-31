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
#import <string>

typedef JSStringRef (*JSValueToStringCopyFuncType)(JSContextRef, JSValueRef, JSValueRef *);
typedef JSStringRef (*JSStringCreateWithCFStringFuncType)(CFStringRef);
typedef CFStringRef (*JSStringCopyCFStringFuncType)(CFAllocatorRef, JSStringRef);
typedef JSStringRef (*JSStringCreateWithUTF8CStringFuncType)(const char *);
typedef void (*JSStringReleaseFuncType)(JSStringRef);
typedef void (*JSGlobalContextSetNameFuncType)(JSGlobalContextRef, JSStringRef);
typedef JSGlobalContextRef (*JSContextGetGlobalContextFuncType)(JSContextRef);
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
typedef void (*configureJSContextForIOSFuncType)(JSContextRef ctx, const std::string &cacheDir);

typedef struct RCTJSCWrapper {
  JSValueToStringCopyFuncType JSValueToStringCopy;
  JSStringCreateWithCFStringFuncType JSStringCreateWithCFString;
  JSStringCopyCFStringFuncType JSStringCopyCFString;
  JSStringCreateWithUTF8CStringFuncType JSStringCreateWithUTF8CString;
  JSStringReleaseFuncType JSStringRelease;
  JSGlobalContextSetNameFuncType JSGlobalContextSetName;
  JSContextGetGlobalContextFuncType JSContextGetGlobalContext;
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

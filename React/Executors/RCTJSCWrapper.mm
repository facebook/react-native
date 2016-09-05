/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTJSCWrapper.h"

#import <UIKit/UIKit.h>
#import <JavaScriptCore/JavaScriptCore.h>

#import "RCTLog.h"

#include <dlfcn.h>

#if HAS_FBGLOG
#import <FBGLog/FBGLogSink.h>

typedef void (*configureJSCLoggingForIOSFuncType)(int32_t, std::unique_ptr<google::LogSink>, void (*)());
#endif

static void *RCTCustomLibraryHandler(void)
{
  static dispatch_once_t token;
  static void *handler;
  dispatch_once(&token, ^{
    handler = dlopen("@executable_path/Frameworks/JSC.framework/JSC", RTLD_LAZY | RTLD_LOCAL);
    if (!handler) {
      const char *err = dlerror();

      // Ignore the dlopen failure if custom JSC wasn't included in our app
      // bundle. Unfortunately dlopen only provides string based errors.
      if (err != nullptr && strstr(err, "image not found") == nullptr) {
        RCTLogWarn(@"Can't load custom JSC library: %s", err);
      }
    }
  });

  return handler;
}

static void RCTSetUpSystemLibraryPointers(RCTJSCWrapper *wrapper)
{
  wrapper->JSValueToStringCopy = JSValueToStringCopy;
  wrapper->JSStringCreateWithCFString = JSStringCreateWithCFString;
  wrapper->JSStringCopyCFString = JSStringCopyCFString;
  wrapper->JSStringCreateWithUTF8CString = JSStringCreateWithUTF8CString;
  wrapper->JSStringRelease = JSStringRelease;
  wrapper->JSGlobalContextSetName = JSGlobalContextSetName;
  wrapper->JSContextGetGlobalContext = JSContextGetGlobalContext;
  wrapper->JSObjectSetProperty = JSObjectSetProperty;
  wrapper->JSContextGetGlobalObject = JSContextGetGlobalObject;
  wrapper->JSObjectGetProperty = JSObjectGetProperty;
  wrapper->JSValueMakeFromJSONString = JSValueMakeFromJSONString;
  wrapper->JSObjectCallAsFunction = JSObjectCallAsFunction;
  wrapper->JSValueMakeNull = JSValueMakeNull;
  wrapper->JSValueCreateJSONString = JSValueCreateJSONString;
  wrapper->JSValueIsUndefined = JSValueIsUndefined;
  wrapper->JSValueIsNull = JSValueIsNull;
  wrapper->JSEvaluateScript = JSEvaluateScript;
  wrapper->JSContext = [JSContext class];
  wrapper->JSValue = [JSValue class];
  wrapper->configureJSContextForIOS = NULL;
}

static void RCTSetUpCustomLibraryPointers(RCTJSCWrapper *wrapper)
{
  void *libraryHandle = RCTCustomLibraryHandler();
  if (!libraryHandle) {
    RCTSetUpSystemLibraryPointers(wrapper);
    return;
  }

  wrapper->JSValueToStringCopy = (JSValueToStringCopyFuncType)dlsym(libraryHandle, "JSValueToStringCopy");
  wrapper->JSStringCreateWithCFString = (JSStringCreateWithCFStringFuncType)dlsym(libraryHandle, "JSStringCreateWithCFString");
  wrapper->JSStringCopyCFString = (JSStringCopyCFStringFuncType)dlsym(libraryHandle, "JSStringCopyCFString");
  wrapper->JSStringCreateWithUTF8CString = (JSStringCreateWithUTF8CStringFuncType)dlsym(libraryHandle, "JSStringCreateWithUTF8CString");
  wrapper->JSStringRelease = (JSStringReleaseFuncType)dlsym(libraryHandle, "JSStringRelease");
  wrapper->JSGlobalContextSetName = (JSGlobalContextSetNameFuncType)dlsym(libraryHandle, "JSGlobalContextSetName");
  wrapper->JSContextGetGlobalContext = (JSContextGetGlobalContextFuncType)dlsym(libraryHandle, "JSContextGetGlobalContext");
  wrapper->JSObjectSetProperty = (JSObjectSetPropertyFuncType)dlsym(libraryHandle, "JSObjectSetProperty");
  wrapper->JSContextGetGlobalObject = (JSContextGetGlobalObjectFuncType)dlsym(libraryHandle, "JSContextGetGlobalObject");
  wrapper->JSObjectGetProperty = (JSObjectGetPropertyFuncType)dlsym(libraryHandle, "JSObjectGetProperty");
  wrapper->JSValueMakeFromJSONString = (JSValueMakeFromJSONStringFuncType)dlsym(libraryHandle, "JSValueMakeFromJSONString");
  wrapper->JSObjectCallAsFunction = (JSObjectCallAsFunctionFuncType)dlsym(libraryHandle, "JSObjectCallAsFunction");
  wrapper->JSValueMakeNull = (JSValueMakeNullFuncType)dlsym(libraryHandle, "JSValueMakeNull");
  wrapper->JSValueCreateJSONString = (JSValueCreateJSONStringFuncType)dlsym(libraryHandle, "JSValueCreateJSONString");
  wrapper->JSValueIsUndefined = (JSValueIsUndefinedFuncType)dlsym(libraryHandle, "JSValueIsUndefined");
  wrapper->JSValueIsNull = (JSValueIsNullFuncType)dlsym(libraryHandle, "JSValueIsNull");
  wrapper->JSEvaluateScript = (JSEvaluateScriptFuncType)dlsym(libraryHandle, "JSEvaluateScript");
  wrapper->JSContext = (__bridge Class)dlsym(libraryHandle, "OBJC_CLASS_$_JSContext");
  wrapper->JSValue = (__bridge Class)dlsym(libraryHandle, "OBJC_CLASS_$_JSValue");
  wrapper->configureJSContextForIOS = (configureJSContextForIOSFuncType)dlsym(libraryHandle, "configureJSContextForIOS");

#if HAS_FBGLOG
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    void *handle = dlsym(libraryHandle, "configureJSCLoggingForIOS");

    if (handle) {
      configureJSCLoggingForIOSFuncType logConfigFunc = (configureJSCLoggingForIOSFuncType)handle;
      logConfigFunc(google::GLOG_INFO, FBGLogSink(), FBGLogFailureFunction);
    }
  });
#endif
}

RCTJSCWrapper *RCTJSCWrapperCreate(BOOL useCustomJSC)
{
  RCTJSCWrapper *wrapper = (RCTJSCWrapper *)malloc(sizeof(RCTJSCWrapper));
  if (useCustomJSC) {
    RCTSetUpCustomLibraryPointers(wrapper);
  } else {
    RCTSetUpSystemLibraryPointers(wrapper);
  }
  return wrapper;
}

void RCTJSCWrapperRelease(RCTJSCWrapper *wrapper)
{
  if (wrapper) {
    free(wrapper);
  }
}

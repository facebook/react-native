// Copyright 2004-present Facebook. All Rights Reserved.

#include "JSCHelpers.h"

#include <JavaScriptCore/JSStringRef.h>

namespace facebook {
namespace react {

void installGlobalFunction(
    JSGlobalContextRef ctx,
    const char* name,
    JSObjectCallAsFunctionCallback callback) {
  JSStringRef jsName = JSStringCreateWithUTF8CString(name);
  JSObjectRef functionObj = JSObjectMakeFunctionWithCallback(
      ctx, jsName, callback);
  JSObjectRef globalObject = JSContextGetGlobalObject(ctx);
  JSObjectSetProperty(ctx, globalObject, jsName, functionObj, 0, NULL);
  JSStringRelease(jsName);
}

} }

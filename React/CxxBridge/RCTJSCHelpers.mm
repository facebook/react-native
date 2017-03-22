// Copyright 2004-present Facebook. All Rights Reserved.

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include "RCTJSCHelpers.h"

#import <Foundation/Foundation.h>

#import <React/RCTBridge+Private.h>
#import <React/RCTLog.h>
#import <cxxreact/Platform.h>
#import <jschelpers/Value.h>

using namespace facebook::react;

namespace {

JSValueRef nativeLoggingHook(
    JSContextRef ctx, JSObjectRef function, JSObjectRef thisObject, size_t argumentCount,
    const JSValueRef arguments[], JSValueRef *exception) {
  RCTLogLevel level = RCTLogLevelInfo;
  if (argumentCount > 1) {
    level = MAX(level, (RCTLogLevel)Value(ctx, arguments[1]).asNumber());
  }
  if (argumentCount > 0) {
    String message = Value(ctx, arguments[0]).toString();
    _RCTLogJavaScriptInternal(level, @(message.str().c_str()));
  }
  return Value::makeUndefined(ctx);
}

JSValueRef nativePerformanceNow(
    JSContextRef ctx, JSObjectRef function, JSObjectRef thisObject, size_t argumentCount,
    const JSValueRef arguments[], JSValueRef *exception) {
  return Value::makeNumber(ctx, CACurrentMediaTime() * 1000);
}

}

void RCTPrepareJSCExecutor() {
  ReactMarker::logMarker = [](const std::string&) {};
  PerfLogging::installNativeHooks = RCTFBQuickPerformanceLoggerConfigureHooks;
  JSNativeHooks::loggingHook = nativeLoggingHook;
  JSNativeHooks::nowHook = nativePerformanceNow;
}

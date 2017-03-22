/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include <memory>

#import <React/RCTConvert.h>
#include <JavaScriptCore/JavaScriptCore.h>
#include <cxxreact/JSCExecutor.h>
#include <cxxreact/ModuleRegistry.h>
#include <folly/dynamic.h>
#include <jschelpers/JavaScriptCore.h>

@class RCTBridge;
@class RCTModuleData;

@interface RCTConvert (folly)

+ (folly::dynamic)folly_dynamic:(id)json;

@end

namespace facebook {
namespace react {

class Instance;

std::shared_ptr<ModuleRegistry> buildModuleRegistry(NSArray<RCTModuleData *> *modules, RCTBridge *bridge, const std::shared_ptr<Instance> &instance);

JSContext *contextForGlobalContextRef(JSGlobalContextRef contextRef);

/*
 * The ValueEncoder<NSArray *>::toValue is used by JSCExecutor callFunctionSync.
 * Note: Because the NSArray * is really a NSArray * __strong the toValue is
 * accepting NSArray *const __strong instead of NSArray *&&.
 */
template <>
struct ValueEncoder<NSArray *> {
  static Value toValue(JSGlobalContextRef ctx, NSArray *const __strong array)
  {
    JSValue *value = [JSC_JSValue(ctx) valueWithObject:array inContext:contextForGlobalContextRef(ctx)];
    return {ctx, [value JSValueRef]};
  }
};

NSError *tryAndReturnError(const std::function<void()>& func);

} }

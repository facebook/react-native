/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#import <JavaScriptCore/JavaScriptCore.h>

#import <cxxreact/JSCExecutor.h>
#import <jschelpers/JavaScriptCore.h>

@class RCTBridge;
@class RCTModuleData;

namespace facebook {
namespace react {

class Instance;

std::vector<std::unique_ptr<NativeModule>> createNativeModules(NSArray<RCTModuleData *> *modules, RCTBridge *bridge, const std::shared_ptr<Instance> &instance);

JSContext *contextForGlobalContextRef(JSGlobalContextRef contextRef);

template<>
struct JSCValueEncoder<id> {
  static Value toJSCValue(JSGlobalContextRef ctx, id obj) {
    JSValue *value = [JSC_JSValue(ctx) valueWithObject:obj inContext:contextForGlobalContextRef(ctx)];
    return {ctx, [value JSValueRef]};
  }
};

NSError *tryAndReturnError(const std::function<void()>& func);
NSString *deriveSourceURL(NSURL *url);

} }

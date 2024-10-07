/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#ifdef __cplusplus
#include <jsi/jsi.h>
#include <ReactCommon/CallInvoker.h>
#endif

@protocol RCTTurboModuleWithJSIBindings <NSObject>

#ifdef __cplusplus
- (void)installJSIBindingsWithRuntime:(facebook::jsi::Runtime &)runtime
                          callInvoker:(const std::shared_ptr<facebook::react::CallInvoker> &)callinvoker;

- (void)installJSIBindingsWithRuntime:(facebook::jsi::Runtime &)runtime __attribute__((deprecated("Use 'installJSIBindingsWithRuntime:callInvoker:' instead")));
#endif

@end

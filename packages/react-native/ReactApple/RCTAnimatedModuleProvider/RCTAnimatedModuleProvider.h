/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#import <memory>
#import <string>

#import <Foundation/Foundation.h>

namespace facebook::react {
class CallInvoker;
class TurboModule;
} // namespace facebook::react

@interface RCTAnimatedModuleProvider : NSObject

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
                                                      jsInvoker:
                                                          (std::shared_ptr<facebook::react::CallInvoker>)jsInvoker;

@end

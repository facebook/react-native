/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTViewManager.h>
#import <ReactCommon/RCTTurboModuleManager.h>

@interface ScreenshotManagerTurboModuleManagerDelegate : NSObject<RCTTurboModuleManagerDelegate>
- (std::shared_ptr<facebook::react::TurboModule>)
  getTurboModule:(const std::string &)name
  jsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker;

- (std::shared_ptr<facebook::react::TurboModule>)
  getTurboModule:(const std::string &)name
  instance:(id<RCTTurboModule>)instance
  jsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker;

@end

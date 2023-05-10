/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <PikaOptimizationsMacros/PikaOptimizationsMacros.h>
#import <React/RCTMessageThread.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTJSThreadManager : NSObject

- (void)dispatchToJSThread:(dispatch_block_t)block FB_OBJC_DIRECT;
- (std::shared_ptr<facebook::react::RCTMessageThread>)jsMessageThread FB_OBJC_DIRECT;

@end

NS_ASSUME_NONNULL_END

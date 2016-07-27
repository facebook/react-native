/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>
#import <QuartzCore/QuartzCore.h>

@class RCTNativeAnimatedModule;

@interface RCTViewPropertyMapper : NSObject

@property (nonatomic, readonly) NSNumber *viewTag;

- (instancetype)initWithViewTag:(NSNumber *)viewTag
                animationModule:(RCTNativeAnimatedModule *)animationModule NS_DESIGNATED_INITIALIZER;

- (void)updateViewWithProps:(NSDictionary<NSString *, NSNumber *> *)props
                     styles:(NSDictionary<NSString *, NSNumber *> *)styles
                  transform:(CATransform3D)transform;

@end

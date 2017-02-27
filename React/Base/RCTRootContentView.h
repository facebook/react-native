/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import <React/RCTInvalidating.h>
#import <React/RCTRootView.h>
#import <React/RCTView.h>

@class RCTBridge;
@class RCTTouchHandler;

@interface RCTRootContentView : RCTView <RCTInvalidating>

@property (nonatomic, readonly) BOOL contentHasAppeared;
@property (nonatomic, readonly, strong) RCTTouchHandler *touchHandler;
@property (nonatomic, assign) BOOL passThroughTouches;
@property (nonatomic, assign) RCTRootViewSizeFlexibility sizeFlexibility;

- (instancetype)initWithFrame:(CGRect)frame
                       bridge:(RCTBridge *)bridge
                     reactTag:(NSNumber *)reactTag
               sizeFlexiblity:(RCTRootViewSizeFlexibility)sizeFlexibility NS_DESIGNATED_INITIALIZER;

@end

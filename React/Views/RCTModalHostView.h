/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import "RCTInvalidating.h"
#import "RCTView.h"

@class RCTBridge;

@interface RCTModalHostView : UIView <RCTInvalidating>

@property (nonatomic, assign, getter=isAnimated) BOOL animated;
@property (nonatomic, assign, getter=isTransparent) BOOL transparent;

@property (nonatomic, copy) RCTDirectEventBlock onShow;

- (instancetype)initWithBridge:(RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

@end

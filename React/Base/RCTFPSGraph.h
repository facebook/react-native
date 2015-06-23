/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

typedef NS_ENUM(NSUInteger, RCTFPSGraphPosition) {
  RCTFPSGraphPositionLeft = 1,
  RCTFPSGraphPositionRight = 2
};

@interface RCTFPSGraph : UIView

- (instancetype)initWithFrame:(CGRect)frame graphPosition:(RCTFPSGraphPosition)position name:(NSString *)name color:(UIColor *)color NS_DESIGNATED_INITIALIZER;

- (void)onTick:(NSTimeInterval)timestamp;

@end

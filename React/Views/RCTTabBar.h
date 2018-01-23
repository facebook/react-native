/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

@interface RCTTabBar : UIView

@property (nonatomic, strong) UIColor *unselectedTintColor;
@property (nonatomic, strong) UIColor *tintColor;
@property (nonatomic, strong) UIColor *barTintColor;
@property (nonatomic, assign) BOOL translucent;
#if !TARGET_OS_TV
@property (nonatomic, assign) UIBarStyle barStyle;
#endif

- (void)uiManagerDidPerformMounting;

@end

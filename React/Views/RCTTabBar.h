/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import "RCTComponent.h"


@interface RCTTabBar : UIView

@property (nonatomic, strong) UIColor *unselectedTintColor;
@property (nonatomic, strong) UIColor *tintColor;
@property (nonatomic, strong) UIColor *barTintColor;
@property (nonatomic, assign) BOOL translucent;

/**
 * TV event handlers
 */
@property (nonatomic, copy) RCTDirectEventBlock onTVFocus; // Called when this view comes into focus when navigating via TV remote swipes or arrow keys
@property (nonatomic, copy) RCTDirectEventBlock onTVBlur; // Called when this view leaves focus when navigating via TV remote swipes or arrow keys
@property (nonatomic, copy) RCTDirectEventBlock onTVNavEvent; // Called on any TV remote action other than select (menu, play/pause, swipes or arrow keys);


@end

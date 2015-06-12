/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

@interface RCTNavItem : UIView

@property (nonatomic, copy) NSString *title;
@property (nonatomic, strong) UIImage *leftButtonIcon;
@property (nonatomic, copy) NSString *leftButtonTitle;
@property (nonatomic, strong) UIImage *rightButtonIcon;
@property (nonatomic, copy) NSString *rightButtonTitle;
@property (nonatomic, strong) UIImage *backButtonIcon;
@property (nonatomic, copy) NSString *backButtonTitle;
@property (nonatomic, assign) BOOL navigationBarHidden;
@property (nonatomic, strong) UIColor *tintColor;
@property (nonatomic, strong) UIColor *barTintColor;
@property (nonatomic, strong) UIColor *titleTextColor;
@property (nonatomic, assign) BOOL translucent;

@property (nonatomic, readonly) UIBarButtonItem *backButtonItem;
@property (nonatomic, readonly) UIBarButtonItem *leftButtonItem;
@property (nonatomic, readonly) UIBarButtonItem *rightButtonItem;

@end

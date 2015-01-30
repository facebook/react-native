// Copyright 2004-present Facebook. All Rights Reserved.

#import <UIKit/UIKit.h>

@interface RCTNavItem : UIView

@property (nonatomic, copy) NSString *title;
@property (nonatomic, copy) NSString *rightButtonTitle;
@property (nonatomic, copy) NSString *backButtonTitle;
@property (nonatomic, copy) UIColor *tintColor;
@property (nonatomic, copy) UIColor *barTintColor;
@property (nonatomic, copy) UIColor *titleTextColor;

@end

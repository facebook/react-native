// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTView.h"

#import <UIKit/UIKit.h>

#import "RCTPointerEvents.h"

@protocol RCTAutoInsetsProtocol;

@interface RCTView : UIView

@property (nonatomic, assign) RCTPointerEvents pointerEvents;

+ (void)autoAdjustInsetsForView:(UIView<RCTAutoInsetsProtocol> *)parentView
                 withScrollView:(UIScrollView *)scrollView
                   updateOffset:(BOOL)updateOffset;

+ (UIViewController *)backingViewControllerForView:(UIView *)view;

+ (UIEdgeInsets)contentInsetsForView:(UIView *)curView;

@end

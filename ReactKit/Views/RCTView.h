// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTView.h"

#import <UIKit/UIKit.h>

#import "RCTPointerEvents.h"

@protocol RCTAutoInsetsProtocol;

@interface RCTView : UIView

/**
 * Used to control how touch events are processed.
 */
@property (nonatomic, assign) RCTPointerEvents pointerEvents;

+ (void)autoAdjustInsetsForView:(UIView<RCTAutoInsetsProtocol> *)parentView
                 withScrollView:(UIScrollView *)scrollView
                   updateOffset:(BOOL)updateOffset;

/**
 * Find the first view controller whose view, or any subview is the specified view.
 */
+ (UIEdgeInsets)contentInsetsForView:(UIView *)curView;

@end

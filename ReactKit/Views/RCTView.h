// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTView.h"

#import <UIKit/UIKit.h>

// TODO: rehome this
typedef NS_ENUM(NSInteger, RCTPointerEventsValue) {
  RCTPointerEventsUnspecified = 0, // Default
  RCTPointerEventsNone,
  RCTPointerEventsBoxNone,
  RCTPointerEventsBoxOnly,
};

@protocol RCTAutoInsetsProtocol;

@interface RCTView : UIView

@property (nonatomic, assign) RCTPointerEventsValue pointerEvents;
@property (nonatomic, copy) NSString *overrideAccessibilityLabel;

+ (void)autoAdjustInsetsForView:(UIView<RCTAutoInsetsProtocol> *)parentView
                 withScrollView:(UIScrollView *)scrollView
                   updateOffset:(BOOL)updateOffset;

+ (UIViewController *)backingViewControllerForView:(UIView *)view;

+ (UIEdgeInsets)contentInsetsForView:(UIView *)curView;

@end

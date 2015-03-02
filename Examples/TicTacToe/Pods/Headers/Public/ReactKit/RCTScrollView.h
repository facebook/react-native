// Copyright 2004-present Facebook. All Rights Reserved.

#import <UIKit/UIScrollView.h>

#import "RCTAutoInsetsProtocol.h"
#import "RCTScrollableProtocol.h"
#import "RCTView.h"

@protocol UIScrollViewDelegate;

@class RCTEventDispatcher;

@interface RCTScrollView : RCTView <UIScrollViewDelegate, RCTScrollableProtocol, RCTAutoInsetsProtocol>

/**
 * If the `contentSize` is not provided, then the `contentSize` will
 * automatically be determined by the size of the `RKScrollView` subview.
 *
 * The `RCTScrollView` may have at most one single subview. This will ensure
 * that the scroll view's `contentSize` will be efficiently set to the size of
 * the single subview's frame. That frame size will be determined somewhat
 * efficiently since it will have already been computed by the off-main-thread
 * layout system.
 */
@property (nonatomic, readonly) UIScrollView *scrollView;
@property (nonatomic, readonly) UIView *contentView;

@property (nonatomic, assign) CGSize contentSize;
@property (nonatomic, assign) UIEdgeInsets contentInset;
@property (nonatomic, assign) BOOL automaticallyAdjustContentInsets;
@property (nonatomic, assign) NSUInteger throttleScrollCallbackMS;
@property (nonatomic, assign) BOOL centerContent;
@property (nonatomic, copy) NSArray *stickyHeaderIndices;

- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher;

@end

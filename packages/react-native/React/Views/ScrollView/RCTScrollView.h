/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIScrollView.h>

#ifndef RCT_FIT_RM_OLD_COMPONENT

#import <React/RCTAutoInsetsProtocol.h>
#import <React/RCTDefines.h>
#import <React/RCTEventDispatcherProtocol.h>
#import <React/RCTScrollableProtocol.h>
#import <React/RCTView.h>

@protocol UIScrollViewDelegate;

@interface RCTScrollView : RCTView <UIScrollViewDelegate, RCTScrollableProtocol, RCTAutoInsetsProtocol>

- (instancetype)initWithEventDispatcher:(id<RCTEventDispatcherProtocol>)eventDispatcher NS_DESIGNATED_INITIALIZER
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));

/**
 * The `RCTScrollView` may have at most one single subview. This will ensure
 * that the scroll view's `contentSize` will be efficiently set to the size of
 * the single subview's frame. That frame size will be determined somewhat
 * efficiently since it will have already been computed by the off-main-thread
 * layout system.
 */
@property (nonatomic, readonly) UIView *contentView
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));

/**
 * The underlying scrollView (TODO: can we remove this?)
 */
@property (nonatomic, readonly) UIScrollView *scrollView
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));

@property (nonatomic, assign) UIEdgeInsets contentInset
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) BOOL automaticallyAdjustContentInsets
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) BOOL automaticallyAdjustKeyboardInsets
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) BOOL DEPRECATED_sendUpdatedChildFrames
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) NSTimeInterval scrollEventThrottle
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) BOOL centerContent
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, copy) NSDictionary *maintainVisibleContentPosition
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) BOOL scrollToOverflowEnabled
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) int snapToInterval
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) BOOL disableIntervalMomentum
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, copy) NSArray<NSNumber *> *snapToOffsets
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) BOOL snapToStart
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) BOOL snapToEnd
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, copy) NSString *snapToAlignment
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) BOOL inverted
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
/** Focus area of newly-activated text input relative to the window to compare against UIKeyboardFrameBegin/End */
@property (nonatomic, assign) CGRect firstResponderFocus
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
/** newly-activated text input outside of the scroll view */
@property (nonatomic, weak) UIView *firstResponderViewOutsideScrollView
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));

// NOTE: currently these event props are only declared so we can export the
// event names to JS - we don't call the blocks directly because scroll events
// need to be coalesced before sending, for performance reasons.
@property (nonatomic, copy) RCTDirectEventBlock onScrollBeginDrag
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, copy) RCTDirectEventBlock onScroll
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, copy) RCTDirectEventBlock onScrollToTop
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, copy) RCTDirectEventBlock onScrollEndDrag
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, copy) RCTDirectEventBlock onMomentumScrollBegin
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, copy) RCTDirectEventBlock onMomentumScrollEnd
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));

@end

@interface UIView (RCTScrollView)

- (void)reactUpdateResponderOffsetForScrollView:(RCTScrollView *)scrollView
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));

@end

@interface RCTScrollView (Internal)

- (void)updateContentSizeIfNeeded
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));

@end

RCT_EXTERN void RCTSendFakeScrollEvent(id<RCTEventDispatcherProtocol> eventDispatcher, NSNumber *reactTag)
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));

#endif // RCT_FIT_RM_OLD_COMPONENT

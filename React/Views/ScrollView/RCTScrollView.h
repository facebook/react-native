/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // TODO(macOS GH#774)

#import <React/RCTAutoInsetsProtocol.h>
#import <React/RCTDefines.h>
#import <React/RCTEventDispatcherProtocol.h>
#import <React/RCTScrollableProtocol.h>
#import <React/RCTView.h>

@protocol UIScrollViewDelegate;

@interface RCTScrollView : RCTView <
#if TARGET_OS_IPHONE // [TODO(macOS GH#774)
	UIScrollViewDelegate,
#endif
	RCTScrollableProtocol, RCTAutoInsetsProtocol
> // ]TODO(macOS GH#774)

- (instancetype)initWithEventDispatcher:(id<RCTEventDispatcherProtocol>)eventDispatcher NS_DESIGNATED_INITIALIZER;

@property (nonatomic, readonly) RCTBridge *bridge;

/**
 * The `RCTScrollView` may have at most one single subview. This will ensure
 * that the scroll view's `contentSize` will be efficiently set to the size of
 * the single subview's frame. That frame size will be determined somewhat
 * efficiently since it will have already been computed by the off-main-thread
 * layout system.
 */
@property (nonatomic, readonly) RCTUIView *contentView; // TODO(macOS ISS#3536887)

/**
 * The underlying scrollView (TODO: can we remove this?)
 */
@property (nonatomic, readonly) RCTUIScrollView *scrollView; // TODO(macOS ISS#3536887)

@property (nonatomic, assign) UIEdgeInsets contentInset;
@property (nonatomic, assign) BOOL automaticallyAdjustContentInsets;
@property (nonatomic, assign) BOOL automaticallyAdjustKeyboardInsets;
@property (nonatomic, assign) BOOL DEPRECATED_sendUpdatedChildFrames;
@property (nonatomic, assign) NSTimeInterval scrollEventThrottle;
@property (nonatomic, assign) BOOL centerContent;
@property (nonatomic, copy) NSDictionary *maintainVisibleContentPosition;
@property (nonatomic, assign) BOOL scrollToOverflowEnabled;
@property (nonatomic, assign) int snapToInterval;
@property (nonatomic, assign) BOOL disableIntervalMomentum;
@property (nonatomic, copy) NSArray<NSNumber *> *snapToOffsets;
@property (nonatomic, assign) BOOL snapToStart;
@property (nonatomic, assign) BOOL snapToEnd;
@property (nonatomic, copy) NSString *snapToAlignment;
@property (nonatomic, assign) BOOL inverted;

// NOTE: currently these event props are only declared so we can export the
// event names to JS - we don't call the blocks directly because scroll events
// need to be coalesced before sending, for performance reasons.
@property (nonatomic, copy) RCTDirectEventBlock onScrollBeginDrag;
@property (nonatomic, copy) RCTDirectEventBlock onScroll;
@property (nonatomic, copy) RCTDirectEventBlock onScrollToTop;
@property (nonatomic, copy) RCTDirectEventBlock onScrollEndDrag;
@property (nonatomic, copy) RCTDirectEventBlock onMomentumScrollBegin;
@property (nonatomic, copy) RCTDirectEventBlock onMomentumScrollEnd;
@property (nonatomic, copy) RCTDirectEventBlock onPreferredScrollerStyleDidChange; // TODO(macOS GH#774)

- (void)flashScrollIndicators; // TODO(macOS GH#774)

@end

@interface RCTScrollView (Internal)

- (void)updateContentSizeIfNeeded;

@end

RCT_EXTERN void RCTSendFakeScrollEvent(id<RCTEventDispatcherProtocol> eventDispatcher, NSNumber *reactTag);

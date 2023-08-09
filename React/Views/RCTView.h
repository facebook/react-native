/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // [macOS]

#import <React/RCTBorderCurve.h>
#import <React/RCTBorderStyle.h>
#import <React/RCTComponent.h>
#import <React/RCTEventDispatcherProtocol.h> // [macOS]
#import <React/RCTPointerEvents.h>

#if TARGET_OS_OSX // [macOS
#import <React/RCTCursor.h>
#endif // macOS]

#if !TARGET_OS_OSX // [macOS]
extern const UIAccessibilityTraits SwitchAccessibilityTrait;
#endif // [macOS]

@protocol RCTAutoInsetsProtocol;

@class RCTHandledKey; // [macOS]

@interface RCTView : RCTUIView // [macOS]

// [macOS
- (instancetype)initWithEventDispatcher:(id<RCTEventDispatcherProtocol>)eventDispatcher;

- (BOOL)becomeFirstResponder;
- (BOOL)resignFirstResponder;

#if TARGET_OS_OSX
- (NSDictionary*)dataTransferInfoFromPasteboard:(NSPasteboard*)pasteboard;
- (BOOL)handleKeyboardEvent:(NSEvent *)event;
#endif
// macOS]

/**
 * Accessibility event handlers
 */
@property (nonatomic, copy) RCTDirectEventBlock onAccessibilityAction;
@property (nonatomic, copy) RCTDirectEventBlock onAccessibilityTap;
#if !TARGET_OS_OSX // [macOS]
@property (nonatomic, copy) RCTDirectEventBlock onMagicTap;
#endif // [macOS]
@property (nonatomic, copy) RCTDirectEventBlock onAccessibilityEscape;

/**
 * Used to control how touch events are processed.
 */
@property (nonatomic, assign) RCTPointerEvents pointerEvents;

+ (void)autoAdjustInsetsForView:(RCTUIView<RCTAutoInsetsProtocol> *)parentView // [macOS]
                 withScrollView:(RCTUIScrollView *)scrollView // [macOS]
                   updateOffset:(BOOL)updateOffset;

/**
 * Layout direction of the view.
 * This is inherited from UIView+React, but we override it here
 * to improve performance and make subclassing/overriding possible/easier.
 */
@property (nonatomic, assign) UIUserInterfaceLayoutDirection reactLayoutDirection;

/**
 * This is an optimization used to improve performance
 * for large scrolling views with many subviews, such as a
 * list or table. If set to YES, any clipped subviews will
 * be removed from the view hierarchy whenever -updateClippedSubviews
 * is called. This would typically be triggered by a scroll event
 */
@property (nonatomic, assign) BOOL removeClippedSubviews;

/**
 * Hide subviews if they are outside the view bounds.
 * This is an optimisation used predominantly with RKScrollViews
 * but it is applied recursively to all subviews that have
 * removeClippedSubviews set to YES
 */
- (void)updateClippedSubviews;

/**
 * Border radii.
 */
@property (nonatomic, assign) CGFloat borderRadius;
@property (nonatomic, assign) CGFloat borderTopLeftRadius;
@property (nonatomic, assign) CGFloat borderTopRightRadius;
@property (nonatomic, assign) CGFloat borderTopStartRadius;
@property (nonatomic, assign) CGFloat borderTopEndRadius;
@property (nonatomic, assign) CGFloat borderBottomLeftRadius;
@property (nonatomic, assign) CGFloat borderBottomRightRadius;
@property (nonatomic, assign) CGFloat borderBottomStartRadius;
@property (nonatomic, assign) CGFloat borderBottomEndRadius;
@property (nonatomic, assign) CGFloat borderEndEndRadius;
@property (nonatomic, assign) CGFloat borderEndStartRadius;
@property (nonatomic, assign) CGFloat borderStartEndRadius;
@property (nonatomic, assign) CGFloat borderStartStartRadius;

/**
 * Border colors (actually retained).
 */
@property (nonatomic, strong) RCTUIColor *borderTopColor;
@property (nonatomic, strong) RCTUIColor *borderRightColor;
@property (nonatomic, strong) RCTUIColor *borderBottomColor;
@property (nonatomic, strong) RCTUIColor *borderLeftColor;
@property (nonatomic, strong) RCTUIColor *borderStartColor;
@property (nonatomic, strong) RCTUIColor *borderEndColor;
@property (nonatomic, strong) RCTUIColor *borderColor;
@property (nonatomic, strong) RCTUIColor *borderBlockColor;
@property (nonatomic, strong) RCTUIColor *borderBlockEndColor;
@property (nonatomic, strong) RCTUIColor *borderBlockStartColor;

/**
 * Border widths.
 */
@property (nonatomic, assign) CGFloat borderTopWidth;
@property (nonatomic, assign) CGFloat borderRightWidth;
@property (nonatomic, assign) CGFloat borderBottomWidth;
@property (nonatomic, assign) CGFloat borderLeftWidth;
@property (nonatomic, assign) CGFloat borderStartWidth;
@property (nonatomic, assign) CGFloat borderEndWidth;
@property (nonatomic, assign) CGFloat borderWidth;
// TODO: Implement logical border width logic
@property (nonatomic, assign) CGFloat borderBlockWidth;
@property (nonatomic, assign) CGFloat borderBlockEndWidth;
@property (nonatomic, assign) CGFloat borderBlockStartWidth;

/**
 * Border curve.
 */
@property (nonatomic, assign) RCTBorderCurve borderCurve;

/**
 * Border styles.
 */
@property (nonatomic, assign) RCTBorderStyle borderStyle;

/**
 *  Insets used when hit testing inside this view.
 */
@property (nonatomic, assign) UIEdgeInsets hitTestEdgeInsets;

/**
 * (Experimental and unused for Paper) Pointer event handlers.
 */
@property (nonatomic, assign) RCTBubblingEventBlock onPointerCancel;
@property (nonatomic, assign) RCTBubblingEventBlock onPointerDown;
@property (nonatomic, assign) RCTBubblingEventBlock onPointerMove;
@property (nonatomic, assign) RCTBubblingEventBlock onPointerUp;
@property (nonatomic, assign) RCTCapturingEventBlock onPointerEnter;
@property (nonatomic, assign) RCTCapturingEventBlock onPointerLeave;
@property (nonatomic, assign) RCTBubblingEventBlock onPointerOver;
@property (nonatomic, assign) RCTBubblingEventBlock onPointerOut;

#if TARGET_OS_OSX // [macOS
/**
 * macOS Properties
 */
@property (nonatomic, assign) RCTCursor cursor;

@property (nonatomic, assign) CATransform3D transform3D;

// `allowsVibrancy` is readonly on NSView, so let's create a new property to make it assignable
// that we can set through JS and the getter for `allowsVibrancy` can read in RCTView.
@property (nonatomic, assign) BOOL allowsVibrancyInternal;

@property (nonatomic, copy) RCTDirectEventBlock onMouseEnter;
@property (nonatomic, copy) RCTDirectEventBlock onMouseLeave;
@property (nonatomic, copy) RCTDirectEventBlock onDragEnter;
@property (nonatomic, copy) RCTDirectEventBlock onDragLeave;
@property (nonatomic, copy) RCTDirectEventBlock onDrop;

// Keyboarding events
// NOTE does not properly work with single line text inputs (most key downs). This is because those are
// presumably handled by the window's field editor. To make it work, we'd need to look into providing
// a custom field editor for NSTextField controls.
@property (nonatomic, assign) BOOL passthroughAllKeyEvents;
@property (nonatomic, copy) RCTDirectEventBlock onKeyDown;
@property (nonatomic, copy) RCTDirectEventBlock onKeyUp;
@property (nonatomic, copy) NSArray<RCTHandledKey*> *validKeysDown;
@property (nonatomic, copy) NSArray<RCTHandledKey*> *validKeysUp;

// Shadow Properties
@property (nonatomic, strong) NSColor *shadowColor;
@property (nonatomic, assign) CGFloat shadowOpacity;
@property (nonatomic, assign) CGFloat shadowRadius;
@property (nonatomic, assign) CGSize shadowOffset;
#endif // macOS]

/**
 * Common Focus Properties
 */
@property (nonatomic, copy) RCTBubblingEventBlock onFocus;
@property (nonatomic, copy) RCTBubblingEventBlock onBlur;

@end

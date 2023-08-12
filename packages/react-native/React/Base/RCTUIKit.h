/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// [macOS]

#include <TargetConditionals.h>

#include <React/RCTAssert.h>

#if !TARGET_OS_OSX

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

//
// functionally equivalent types
//

UIKIT_STATIC_INLINE CGFloat UIImageGetScale(UIImage *image)
{
  return image.scale;
}

UIKIT_STATIC_INLINE CGImageRef UIImageGetCGImageRef(UIImage *image)
{
	return image.CGImage;
}

UIKIT_STATIC_INLINE UIImage *UIImageWithContentsOfFile(NSString *filePath)
{
  return [UIImage imageWithContentsOfFile:filePath];
}

UIKIT_STATIC_INLINE UIImage *UIImageWithData(NSData *imageData)
{
  return [UIImage imageWithData:imageData];
}

UIKIT_STATIC_INLINE UIBezierPath *UIBezierPathWithRoundedRect(CGRect rect, CGFloat cornerRadius)
{
  return [UIBezierPath bezierPathWithRoundedRect:rect cornerRadius:cornerRadius];
}

UIKIT_STATIC_INLINE void UIBezierPathAppendPath(UIBezierPath *path, UIBezierPath *appendPath)
{
  [path appendPath:appendPath];
}

UIKIT_STATIC_INLINE CGPathRef UIBezierPathCreateCGPathRef(UIBezierPath *path)
{
  return [path CGPath];
}

//
// substantially different types
//

// UIView
#define RCTPlatformView UIView
#define RCTUIView UIView
#define RCTUIScrollView UIScrollView
#define RCTPlatformWindow UIWindow

UIKIT_STATIC_INLINE RCTPlatformView *RCTUIViewHitTestWithEvent(RCTPlatformView *view, CGPoint point, __unused UIEvent *__nullable event)
{
  return [view hitTest:point withEvent:event];
}

UIKIT_STATIC_INLINE BOOL RCTUIViewSetClipsToBounds(RCTPlatformView *view)
{
  return view.clipsToBounds;
}

UIKIT_STATIC_INLINE void RCTUIViewSetContentModeRedraw(UIView *view)
{
  view.contentMode = UIViewContentModeRedraw;
}

UIKIT_STATIC_INLINE BOOL RCTUIViewIsDescendantOfView(RCTPlatformView *view, RCTPlatformView *parent)
{
  return [view isDescendantOfView:parent];
}

UIKIT_STATIC_INLINE NSValue *NSValueWithCGRect(CGRect rect)
{
  return [NSValue valueWithCGRect:rect];
}

UIKIT_STATIC_INLINE NSValue *NSValueWithCGSize(CGSize size)
{
  return [NSValue valueWithCGSize:size];
}

UIKIT_STATIC_INLINE CGRect CGRectValue(NSValue *value)
{
  return [value CGRectValue];
}

//
// semantically equivalent types
//

#define RCTUIColor UIColor

UIKIT_STATIC_INLINE UIFont *UIFontWithSize(UIFont *font, CGFloat pointSize)
{
  return [font fontWithSize:pointSize];
}

UIKIT_STATIC_INLINE CGFloat UIFontLineHeight(UIFont *font)
{
  return [font lineHeight];
}

NS_ASSUME_NONNULL_END

#else // TARGET_OS_OSX [

#import <AppKit/AppKit.h>

NS_ASSUME_NONNULL_BEGIN

//
// semantically equivalent constants
//

// UIApplication.h/NSApplication.h
#define UIApplicationDidBecomeActiveNotification      NSApplicationDidBecomeActiveNotification
#define UIApplicationDidEnterBackgroundNotification   NSApplicationDidHideNotification
#define UIApplicationDidFinishLaunchingNotification   NSApplicationDidFinishLaunchingNotification
#define UIApplicationWillResignActiveNotification     NSApplicationWillResignActiveNotification
#define UIApplicationWillEnterForegroundNotification  NSApplicationWillUnhideNotification  

// UIFontDescriptor.h/NSFontDescriptor.h
#define UIFontDescriptorFamilyAttribute          NSFontFamilyAttribute;
#define UIFontDescriptorNameAttribute            NSFontNameAttribute;
#define UIFontDescriptorFaceAttribute            NSFontFaceAttribute;
#define UIFontDescriptorSizeAttribute            NSFontSizeAttribute

#define UIFontDescriptorTraitsAttribute          NSFontTraitsAttribute
#define UIFontDescriptorFeatureSettingsAttribute NSFontFeatureSettingsAttribute

#define UIFontSymbolicTrait                      NSFontSymbolicTrait
#define UIFontWeightTrait                        NSFontWeightTrait
#define UIFontFeatureTypeIdentifierKey           NSFontFeatureTypeIdentifierKey
#define UIFontFeatureSelectorIdentifierKey       NSFontFeatureSelectorIdentifierKey

#define UIFontWeightUltraLight                   NSFontWeightUltraLight
#define UIFontWeightThin                         NSFontWeightThin
#define UIFontWeightLight                        NSFontWeightLight
#define UIFontWeightRegular                      NSFontWeightRegular
#define UIFontWeightMedium                       NSFontWeightMedium
#define UIFontWeightSemibold                     NSFontWeightSemibold
#define UIFontWeightBold                         NSFontWeightBold
#define UIFontWeightHeavy                        NSFontWeightHeavy
#define UIFontWeightBlack                        NSFontWeightBlack

// RCTActivityIndicatorView.h
#define UIActivityIndicatorView NSProgressIndicator


// UIGeometry.h/NSGeometry.h
#define UIEdgeInsetsZero NSEdgeInsetsZero

// UIView.h/NSLayoutConstraint.h
#define UIViewNoIntrinsicMetric -1
// NSViewNoIntrinsicMetric is defined to -1 but is only available on macOS 10.11 and higher.  On previous versions it was NSViewNoInstrinsicMetric (misspelled) and also defined to -1.

// UIInterface.h/NSUserInterfaceLayout.h
#define UIUserInterfaceLayoutDirection NSUserInterfaceLayoutDirection

//
// semantically equivalent enums
//

// UIGestureRecognizer.h/NSGestureRecognizer.h
enum
{
  UIGestureRecognizerStatePossible    = NSGestureRecognizerStatePossible,
  UIGestureRecognizerStateBegan       = NSGestureRecognizerStateBegan,
  UIGestureRecognizerStateChanged     = NSGestureRecognizerStateChanged,
  UIGestureRecognizerStateEnded       = NSGestureRecognizerStateEnded,
  UIGestureRecognizerStateCancelled   = NSGestureRecognizerStateCancelled,
  UIGestureRecognizerStateFailed      = NSGestureRecognizerStateFailed,
  UIGestureRecognizerStateRecognized  = NSGestureRecognizerStateRecognized,
};

// UIFontDescriptor.h/NSFontDescriptor.h
enum
{
  UIFontDescriptorTraitItalic    = NSFontItalicTrait,
  UIFontDescriptorTraitBold      = NSFontBoldTrait,
  UIFontDescriptorTraitCondensed = NSFontCondensedTrait,
};

// UIView.h/NSView.h
enum : NSUInteger
{
  UIViewAutoresizingNone                 = NSViewNotSizable,
  UIViewAutoresizingFlexibleLeftMargin   = NSViewMinXMargin,
  UIViewAutoresizingFlexibleWidth        = NSViewWidthSizable,
  UIViewAutoresizingFlexibleRightMargin  = NSViewMaxXMargin,
  UIViewAutoresizingFlexibleTopMargin    = NSViewMinYMargin,
  UIViewAutoresizingFlexibleHeight       = NSViewHeightSizable,
  UIViewAutoresizingFlexibleBottomMargin = NSViewMaxYMargin,
};

// UIView/NSView.h
typedef NS_ENUM(NSInteger, UIViewContentMode) {
  UIViewContentModeScaleAspectFill = NSViewLayerContentsPlacementScaleProportionallyToFill,
  UIViewContentModeScaleAspectFit  = NSViewLayerContentsPlacementScaleProportionallyToFit,
  UIViewContentModeScaleToFill     = NSViewLayerContentsPlacementScaleAxesIndependently,
  UIViewContentModeCenter          = NSViewLayerContentsPlacementCenter,
};

// UIInterface.h/NSUserInterfaceLayout.h
enum : NSInteger
{
	UIUserInterfaceLayoutDirectionLeftToRight = NSUserInterfaceLayoutDirectionLeftToRight,
	UIUserInterfaceLayoutDirectionRightToLeft = NSUserInterfaceLayoutDirectionRightToLeft,
};

// RCTActivityIndicatorView.h
typedef NS_ENUM(NSInteger, UIActivityIndicatorViewStyle) {
  UIActivityIndicatorViewStyleWhiteLarge,
  UIActivityIndicatorViewStyleWhite
};


//
// semantically equivalent functions
//

// UIGeometry.h/NSGeometry.h
NS_INLINE CGRect UIEdgeInsetsInsetRect(CGRect rect, NSEdgeInsets insets)
{
	rect.origin.x    += insets.left;
	rect.origin.y    += insets.top;
	rect.size.width  -= (insets.left + insets.right);
	rect.size.height -= (insets.top  + insets.bottom);
	return rect;
}

NS_INLINE BOOL UIEdgeInsetsEqualToEdgeInsets(NSEdgeInsets insets1, NSEdgeInsets insets2)
{
	return NSEdgeInsetsEqual(insets1, insets2);
}

NS_INLINE NSString *NSStringFromCGSize(CGSize size)
{
	return NSStringFromSize(NSSizeFromCGSize(size));
}

NS_INLINE NSString *NSStringFromCGRect(CGRect rect)
{
	return NSStringFromRect(NSRectFromCGRect(rect));
}

// UIGraphics.h
CGContextRef UIGraphicsGetCurrentContext(void);
void UIGraphicsBeginImageContextWithOptions(CGSize size, BOOL opaque, CGFloat scale);
NSImage *UIGraphicsGetImageFromCurrentImageContext(void);
void UIGraphicsEndImageContext(void);

//
// semantically equivalent types
//

// UIAccessibility.h/NSAccessibility.h
@compatibility_alias UIAccessibilityCustomAction NSAccessibilityCustomAction;

// UIColor.h/NSColor.h
#define RCTUIColor NSColor

// UIFont.h/NSFont.h
// Both NSFont and UIFont are toll-free bridged to CTFontRef so we'll assume they're semantically equivalent
@compatibility_alias UIFont NSFont;

// UIViewController.h/NSViewController.h
@compatibility_alias UIViewController NSViewController;

NS_INLINE NSFont *UIFontWithSize(NSFont *font, CGFloat pointSize)
{
  return [NSFont fontWithDescriptor:font.fontDescriptor size:pointSize];
}

NS_INLINE CGFloat UIFontLineHeight(NSFont *font)
{
  return ceilf(font.ascender + ABS(font.descender) + font.leading);
}

// UIFontDescriptor.h/NSFontDescriptor.h
// Both NSFontDescriptor and UIFontDescriptor are toll-free bridged to CTFontDescriptorRef so we'll assume they're semantically equivalent
@compatibility_alias UIFontDescriptor NSFontDescriptor;
typedef NSFontSymbolicTraits UIFontDescriptorSymbolicTraits;
typedef NSFontWeight UIFontWeight;

// UIGeometry.h/NSGeometry.h
typedef NSEdgeInsets UIEdgeInsets;

NS_INLINE NSEdgeInsets UIEdgeInsetsMake(CGFloat top, CGFloat left, CGFloat bottom, CGFloat right)
{
  return NSEdgeInsetsMake(top, left, bottom, right);
}

//
// functionally equivalent types
//

// These types have the same purpose but may differ semantically. Use with care!

#define UIEvent NSEvent
#define UITouchType NSTouchType
#define UIEventButtonMask NSEventButtonMask
#define UIKeyModifierFlags NSEventModifierFlags

// UIGestureRecognizer
#define UIGestureRecognizer NSGestureRecognizer
#define UIGestureRecognizerDelegate NSGestureRecognizerDelegate

// UIApplication
#define UIApplication NSApplication

// UIImage
@compatibility_alias UIImage NSImage;

typedef NS_ENUM(NSInteger, UIImageRenderingMode) {
    UIImageRenderingModeAlwaysOriginal,
    UIImageRenderingModeAlwaysTemplate,
};

#ifdef __cplusplus
extern "C"
#endif
CGFloat UIImageGetScale(NSImage *image);

CGImageRef UIImageGetCGImageRef(NSImage *image);

NS_INLINE UIImage *UIImageWithContentsOfFile(NSString *filePath)
{
  return [[NSImage alloc] initWithContentsOfFile:filePath];
}

NS_INLINE UIImage *UIImageWithData(NSData *imageData)
{
  return [[NSImage alloc] initWithData:imageData];
}

NSData *UIImagePNGRepresentation(NSImage *image);
NSData *UIImageJPEGRepresentation(NSImage *image, CGFloat compressionQuality);

// UIBezierPath
@compatibility_alias UIBezierPath NSBezierPath;

UIBezierPath *UIBezierPathWithRoundedRect(CGRect rect, CGFloat cornerRadius);

void UIBezierPathAppendPath(UIBezierPath *path, UIBezierPath *appendPath);

CGPathRef UIBezierPathCreateCGPathRef(UIBezierPath *path);

//
// substantially different types
//

// UIView
#define RCTPlatformView NSView

#define RCTPlatformWindow NSWindow

@interface RCTUIView : RCTPlatformView

@property (nonatomic, readonly) BOOL canBecomeFirstResponder;
- (BOOL)becomeFirstResponder;
@property(nonatomic, readonly) BOOL isFirstResponder;

@property (nonatomic, getter=isUserInteractionEnabled) BOOL userInteractionEnabled;

- (NSView *)hitTest:(CGPoint)point withEvent:(UIEvent *_Nullable)event;
- (BOOL)pointInside:(CGPoint)point withEvent:(UIEvent *)event;

- (void)insertSubview:(NSView *)view atIndex:(NSInteger)index;

- (void)didMoveToWindow;

- (void)setNeedsLayout;
- (void)layoutIfNeeded;

- (void)layoutSubviews;

- (void)setNeedsDisplay;

// FUTURE: When Xcode 14 is no longer supported (CI is building with Xcode 15), we can remove this override since it's now declared on NSView
@property BOOL clipsToBounds;
@property (nonatomic, copy) NSColor *backgroundColor;
@property (nonatomic) CGAffineTransform transform;

/**
 * Specifies whether the view should receive the mouse down event when the
 * containing window is in the background.
 */
@property (nonatomic, assign) BOOL acceptsFirstMouse;

@property (nonatomic, assign) BOOL mouseDownCanMoveWindow;

/**
 * Specifies whether the view participates in the key view loop as user tabs through different controls
 * This is equivalent to acceptsFirstResponder on mac OS.
 */
@property (nonatomic, assign) BOOL focusable;
/**
 * Specifies whether focus ring should be drawn when the view has the first responder status.
 */
@property (nonatomic, assign) BOOL enableFocusRing;

@end

// UIScrollView

@interface RCTUIScrollView : NSScrollView

// UIScrollView properties missing in NSScrollView
@property (nonatomic, assign) CGPoint contentOffset;
@property (nonatomic, assign) UIEdgeInsets contentInset;
@property (nonatomic, assign) CGSize contentSize;
@property (nonatomic, assign) BOOL showsHorizontalScrollIndicator;
@property (nonatomic, assign) BOOL showsVerticalScrollIndicator;
@property (nonatomic, assign) UIEdgeInsets scrollIndicatorInsets;
@property (nonatomic, assign) CGFloat zoomScale;
@property (nonatomic, assign) BOOL alwaysBounceHorizontal;
@property (nonatomic, assign) BOOL alwaysBounceVertical;
// macOS specific properties
@property (nonatomic, assign) BOOL enableFocusRing;
@property (nonatomic, assign, getter=isScrollEnabled) BOOL scrollEnabled;

@end

@interface RCTClipView : NSClipView

@property (nonatomic, assign) BOOL constrainScrolling;

@end


NS_INLINE RCTPlatformView *RCTUIViewHitTestWithEvent(RCTPlatformView *view, CGPoint point, __unused UIEvent *__nullable event)
{
  return [view hitTest:point];
}

BOOL RCTUIViewSetClipsToBounds(RCTPlatformView *view);

NS_INLINE void RCTUIViewSetContentModeRedraw(RCTPlatformView *view)
{
  view.layerContentsRedrawPolicy = NSViewLayerContentsRedrawDuringViewResize;
}

NS_INLINE BOOL RCTUIViewIsDescendantOfView(RCTPlatformView *view, RCTPlatformView *parent)
{
  return [view isDescendantOf:parent];
}

NS_INLINE NSValue *NSValueWithCGRect(CGRect rect)
{
  return [NSValue valueWithBytes:&rect objCType:@encode(CGRect)];
}

NS_INLINE NSValue *NSValueWithCGSize(CGSize size)
{
  return [NSValue valueWithBytes:&size objCType:@encode(CGSize)];
}

NS_INLINE CGRect CGRectValue(NSValue *value)
{
  CGRect rect = CGRectZero;
  [value getValue:&rect];
  return rect;
}

NS_ASSUME_NONNULL_END

#endif // ] TARGET_OS_OSX

#if !TARGET_OS_OSX
typedef UIApplication RCTUIApplication;
#else
typedef NSApplication RCTUIApplication;
#endif

//
// fabric component types
//

// RCTUISlider

#if !TARGET_OS_OSX
typedef UISlider RCTUISlider;
#else
@protocol RCTUISliderDelegate;

@interface RCTUISlider : NSSlider
NS_ASSUME_NONNULL_BEGIN
@property (nonatomic, weak) id<RCTUISliderDelegate> delegate;
@property (nonatomic, readonly) BOOL pressed;
@property (nonatomic, assign) float value;
@property (nonatomic, assign) float minimumValue;
@property (nonatomic, assign) float maximumValue;
@property (nonatomic, strong) NSColor *minimumTrackTintColor;
@property (nonatomic, strong) NSColor *maximumTrackTintColor;

- (void)setValue:(float)value animated:(BOOL)animated;
NS_ASSUME_NONNULL_END
@end
#endif

#if TARGET_OS_OSX // [macOS
@protocol RCTUISliderDelegate <NSObject>
@optional
NS_ASSUME_NONNULL_BEGIN
- (void)slider:(RCTUISlider *)slider didPress:(BOOL)press;
NS_ASSUME_NONNULL_END
@end
#endif // macOS]

// RCTUILabel

#if !TARGET_OS_OSX
typedef UILabel RCTUILabel;
#else
@interface RCTUILabel : NSTextField
NS_ASSUME_NONNULL_BEGIN
@property(nonatomic, copy) NSString* _Nullable text;
@property(nonatomic, assign) NSInteger numberOfLines;
@property(nonatomic, assign) NSTextAlignment textAlignment;
NS_ASSUME_NONNULL_END
@end
#endif

// RCTUISwitch

#if !TARGET_OS_OSX
typedef UISwitch RCTUISwitch;
#else
@interface RCTUISwitch : NSSwitch
NS_ASSUME_NONNULL_BEGIN
@property (nonatomic, getter=isOn) BOOL on;

- (void)setOn:(BOOL)on animated:(BOOL)animated;

NS_ASSUME_NONNULL_END
@end
#endif

// RCTUIActivityIndicatorView

#if !TARGET_OS_OSX
typedef UIActivityIndicatorView RCTUIActivityIndicatorView;
#else
@interface RCTUIActivityIndicatorView : NSProgressIndicator
NS_ASSUME_NONNULL_BEGIN
@property (nonatomic, assign) UIActivityIndicatorViewStyle activityIndicatorViewStyle;
@property (nonatomic, assign) BOOL hidesWhenStopped;
@property (nullable, readwrite, nonatomic, strong) RCTUIColor *color;
@property (nonatomic, readonly, getter=isAnimating) BOOL animating;

- (void)startAnimating;
- (void)stopAnimating;
NS_ASSUME_NONNULL_END
@end

#endif

// RCTUITouch

#if !TARGET_OS_OSX
typedef UITouch RCTUITouch;
#else
@interface RCTUITouch : NSEvent
@end
#endif

// RCTUIImageView

#if !TARGET_OS_OSX
typedef UIImageView RCTUIImageView;
#else
@interface RCTUIImageView : NSImageView
NS_ASSUME_NONNULL_BEGIN
// FUTURE: When Xcode 14 is no longer supported (CI is building with Xcode 15), we can remove this override since it's now declared on NSView
@property (assign) BOOL clipsToBounds;
@property (nonatomic, strong) RCTUIColor *tintColor;
@property (nonatomic, assign) UIViewContentMode contentMode;
NS_ASSUME_NONNULL_END
@end
#endif

/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTRootView.h"
#import "RCTRootViewDelegate.h"
#import "RCTRootViewInternal.h"

#import <objc/runtime.h>

#import "RCTAssert.h"
#import "RCTBridge+Private.h"
#import "RCTBridge.h"
#import "RCTConstants.h"
#import "RCTDevSettings.h" // TODO(OSS Candidate ISS#2710739)
#import "RCTEventDispatcher.h"
// TODO(OSS Candidate ISS#2710739): remove #import "RCTKeyCommands.h"
#import "RCTLog.h"
#import "RCTPerformanceLogger.h"
#import "RCTProfile.h"
#import "RCTRootContentView.h"
#import "RCTRootShadowView.h"
#import "RCTTouchHandler.h"
#import "RCTUIManager.h"
#import "RCTUIManagerUtils.h"
#import "RCTUtils.h"
#import "RCTView.h"
#import "UIView+React.h"

#if __has_include("RCTDevMenu.h") // [TODO(OSS Candidate ISS#2710739)
#import "RCTDevMenu.h"
#endif // ]TODO(OSS Candidate ISS#2710739)

#if TARGET_OS_OSX // [TODO(macOS GH#774)
#define RCT_LAYOUT_THROTTLE 0.25
#endif // ]TODO(macOS GH#774)

NSString *const RCTContentDidAppearNotification = @"RCTContentDidAppearNotification";

@interface RCTUIManager (RCTRootView)

- (NSNumber *)allocateRootTag;

@end

@implementation RCTRootView {
  RCTBridge *_bridge;
  NSString *_moduleName;
  RCTRootContentView *_contentView;
  BOOL _passThroughTouches;
  CGSize _intrinsicContentSize;

#if TARGET_OS_OSX // [TODO(macOS GH#774)
  NSDate *_lastLayout;
  BOOL _throttleLayout;
#endif // ]TODO(macOS GH#774)
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initialProperties
{
  RCTAssertMainQueue();
  RCTAssert(bridge, @"A bridge instance is required to create an RCTRootView");
  RCTAssert(moduleName, @"A moduleName is required to create an RCTRootView");

  RCT_PROFILE_BEGIN_EVENT(RCTProfileTagAlways, @"-[RCTRootView init]", nil);
  if (!bridge.isLoading) {
    [bridge.performanceLogger markStartForTag:RCTPLTTI];
  }

  if (self = [super initWithFrame:CGRectZero]) {
    /* [TODO(OSS Candidate ISS#2710739): don't set the background color on mac or ios so that the view is invisible during initial render
    self.backgroundColor = [UIColor whiteColor];
    ]TODO(OSS Candidate ISS#2710739) */

    _bridge = bridge;
    _moduleName = moduleName;
    _appProperties = [initialProperties copy];
    _loadingViewFadeDelay = 0.25;
    _loadingViewFadeDuration = 0.25;
    _sizeFlexibility = RCTRootViewSizeFlexibilityNone;
    _minimumSize = CGSizeZero;

#if TARGET_OS_OSX // [TODO(macOS GH#774)
    _lastLayout = [NSDate new];
#endif // ]TODO(macOS GH#774)

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(bridgeDidReload)
                                                 name:RCTJavaScriptWillStartLoadingNotification
                                               object:_bridge];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(javaScriptDidLoad:)
                                                 name:RCTJavaScriptDidLoadNotification
                                               object:_bridge];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(hideLoadingView)
                                                 name:RCTContentDidAppearNotification
                                               object:self];

    [self showLoadingView];

    // Immediately schedule the application to be started.
    // (Sometimes actual `_bridge` is already batched bridge here.)
    [self bundleFinishedLoading:([_bridge batchedBridge] ?: _bridge)];
  }

  RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"");

  return self;
}

- (instancetype)initWithBundleURL:(NSURL *)bundleURL
                       moduleName:(NSString *)moduleName
                initialProperties:(NSDictionary *)initialProperties
                    launchOptions:(NSDictionary *)launchOptions
{
  RCTBridge *bridge = [[RCTBridge alloc] initWithBundleURL:bundleURL moduleProvider:nil launchOptions:launchOptions];

  return [self initWithBridge:bridge moduleName:moduleName initialProperties:initialProperties];
}

RCT_NOT_IMPLEMENTED(-(instancetype)initWithFrame : (CGRect)frame)
RCT_NOT_IMPLEMENTED(-(instancetype)initWithCoder : (NSCoder *)aDecoder)

#pragma mark - passThroughTouches

- (BOOL)passThroughTouches
{
  return _contentView.passThroughTouches;
}

- (void)setPassThroughTouches:(BOOL)passThroughTouches
{
  _passThroughTouches = passThroughTouches;
  _contentView.passThroughTouches = passThroughTouches;
}

#pragma mark - Layout

- (CGSize)sizeThatFits:(CGSize)size
{
  CGSize fitSize = _intrinsicContentSize;
  CGSize currentSize = self.bounds.size;

  // Following the current `size` and current `sizeFlexibility` policy.
  fitSize = CGSizeMake(
      _sizeFlexibility & RCTRootViewSizeFlexibilityWidth ? fitSize.width : currentSize.width,
      _sizeFlexibility & RCTRootViewSizeFlexibilityHeight ? fitSize.height : currentSize.height);

  // Following the given size constraints.
  fitSize = CGSizeMake(MIN(size.width, fitSize.width), MIN(size.height, fitSize.height));

  return fitSize;
}

#if TARGET_OS_OSX // [TODO(macOS GH#774)
// TODO: https://github.com/microsoft/react-native-macos/issues/459
// This is a workaround for window resizing events overloading the shadow queue:
//  - https://github.com/microsoft/react-native-macos/issues/322
//  - https://github.com/microsoft/react-native-macos/issues/422
// We should revisit this issue when we switch over to Fabric.
- (void)layout
{
  if (self.window != nil && !_throttleLayout) {
    NSTimeInterval interval = [[NSDate date] timeIntervalSinceDate:_lastLayout];
    if (interval >= RCT_LAYOUT_THROTTLE) {
      _lastLayout = [NSDate new];
      [self layoutSubviews];
    } else {
      _throttleLayout = YES;
      __weak typeof(self) weakSelf = self;
      int64_t delta = (RCT_LAYOUT_THROTTLE - interval) * NSEC_PER_SEC;
      dispatch_after(dispatch_time(DISPATCH_TIME_NOW, delta), dispatch_get_main_queue(), ^{
        typeof(self) strongSelf = weakSelf;
        if (strongSelf != nil) {
          strongSelf->_throttleLayout = NO;
          [strongSelf setNeedsLayout];
        }
      });
    }
  }
}
#endif // ]TODO(macOS GH#774)

- (void)layoutSubviews
{
  [super layoutSubviews];
  _contentView.frame = self.bounds;
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  _loadingView.center = (CGPoint){CGRectGetMidX(self.bounds), CGRectGetMidY(self.bounds)};
#else // [TODO(macOS GH#774)
  NSRect bounds = self.bounds;
  NSSize loadingViewSize = _loadingView.frame.size;
  CGFloat scale = self.window.backingScaleFactor;
  RCTAssert(scale != 0.0, @"Layout occurs before the view is in a window?");

  _loadingView.frameOrigin = NSMakePoint(
    RCTRoundPixelValue(bounds.origin.x + ((bounds.size.width - loadingViewSize.width) / 2), scale),
    RCTRoundPixelValue(bounds.origin.y + ((bounds.size.height - loadingViewSize.height) / 2), scale)
  );
#endif // ]TODO(macOS GH#774)
}

- (void)setMinimumSize:(CGSize)minimumSize
{
  if (CGSizeEqualToSize(_minimumSize, minimumSize)) {
    return;
  }
  _minimumSize = minimumSize;
  __block NSNumber *tag = self.reactTag;
  __weak typeof(self) weakSelf = self;
  RCTExecuteOnUIManagerQueue(^{
    __strong typeof(self) strongSelf = weakSelf;
    if (strongSelf && strongSelf->_bridge.isValid) {
      RCTRootShadowView *shadowView = (RCTRootShadowView *)[strongSelf->_bridge.uiManager shadowViewForReactTag:tag];
      shadowView.minimumSize = minimumSize;
    }
  });
}

- (UIViewController *)reactViewController
{
  return _reactViewController ?: [super reactViewController];
}

- (BOOL)canBecomeFirstResponder
{
#if !TARGET_OS_OSX // [TODO(macOS GH#774)
  return YES;
#else
  return NO; // commit 01aba7e8: Merged PR 94656: Enable keyboard accessibility and support for focus ring drawing for button, textfields etc
#endif // ]TODO(macOS GH#774)
}

- (void)setLoadingView:(RCTUIView *)loadingView // TODO(macOS ISS#3536887)
{
  _loadingView = loadingView;
  if (!_contentView.contentHasAppeared) {
    [self showLoadingView];
  }
}

- (void)showLoadingView
{
  if (_loadingView && !_contentView.contentHasAppeared) {
    _loadingView.hidden = NO;
    [self addSubview:_loadingView];
  }
}

- (void)hideLoadingView
{
  if (_loadingView.superview == self && _contentView.contentHasAppeared) {
    if (_loadingViewFadeDuration > 0) {
      dispatch_after(
          dispatch_time(DISPATCH_TIME_NOW, (int64_t)(_loadingViewFadeDelay * NSEC_PER_SEC)),
          dispatch_get_main_queue(),
          ^{
#if !TARGET_OS_OSX // TODO(macOS GH#774)
            [UIView transitionWithView:self
                duration:self->_loadingViewFadeDuration
                options:UIViewAnimationOptionTransitionCrossDissolve
                animations:^{
                  self->_loadingView.hidden = YES;
                }
                completion:^(__unused BOOL finished) {
                  [self->_loadingView removeFromSuperview];
                }];
#elif TARGET_OS_OSX // [TODO(macOS GH#774)
                       [NSAnimationContext runAnimationGroup:^(__unused NSAnimationContext *context) {
                         self->_loadingView.animator.alphaValue = 0.0;
                       } completionHandler:^{
                         [self->_loadingView removeFromSuperview];
                         self->_loadingView.hidden = YES;
                         self->_loadingView.alphaValue = 1.0;
                       }];
#endif // ]TODO(macOS GH#774)
                     });
    } else {
      _loadingView.hidden = YES;
      [_loadingView removeFromSuperview];
    }
  }
}

- (NSNumber *)reactTag
{
  RCTAssertMainQueue();
  if (!super.reactTag) {
    /**
     * Every root view that is created must have a unique react tag.
     * Numbering of these tags goes from 1, 11, 21, 31, etc
     *
     * NOTE: Since the bridge persists, the RootViews might be reused, so the
     * react tag must be re-assigned every time a new UIManager is created.
     */
    self.reactTag = RCTAllocateRootViewTag();
  }
  return super.reactTag;
}

- (void)bridgeDidReload
{
  RCTAssertMainQueue();
  // Clear the reactTag so it can be re-assigned
  self.reactTag = nil;
}

- (void)javaScriptDidLoad:(NSNotification *)notification
{
  RCTAssertMainQueue();

  // Use the (batched) bridge that's sent in the notification payload, so the
  // RCTRootContentView is scoped to the right bridge
  RCTBridge *bridge = notification.userInfo[@"bridge"];
  if (bridge != _contentView.bridge) {
    [self bundleFinishedLoading:bridge];
  }
}

- (void)bundleFinishedLoading:(RCTBridge *)bridge
{
  RCTAssert(bridge != nil, @"Bridge cannot be nil");
  if (!bridge.valid) {
    return;
  }

  [_contentView removeFromSuperview];
  _contentView = [[RCTRootContentView alloc] initWithFrame:self.bounds
                                                    bridge:bridge
                                                  reactTag:self.reactTag
                                            sizeFlexiblity:_sizeFlexibility];
  [self runApplication:bridge];

  _contentView.passThroughTouches = _passThroughTouches;
  [self insertSubview:_contentView atIndex:0];

  if (_sizeFlexibility == RCTRootViewSizeFlexibilityNone) {
    self.intrinsicContentSize = self.bounds.size;
  }
}

- (void)runApplication:(RCTBridge *)bridge
{
  NSString *moduleName = _moduleName ?: @"";
  NSDictionary *appParameters = @{
    @"rootTag" : _contentView.reactTag,
    @"initialProps" : _appProperties ?: @{},
  };

  RCTLogInfo(@"Running application %@ (%@)", moduleName, appParameters);
  [bridge enqueueJSCall:@"AppRegistry" method:@"runApplication" args:@[ moduleName, appParameters ] completion:NULL];
}

- (void)setSizeFlexibility:(RCTRootViewSizeFlexibility)sizeFlexibility
{
  if (_sizeFlexibility == sizeFlexibility) {
    return;
  }

  _sizeFlexibility = sizeFlexibility;
  [self setNeedsLayout];
  _contentView.sizeFlexibility = _sizeFlexibility;
}

- (RCTPlatformView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event // TODO(macOS GH#774)
{
  // The root view itself should never receive touches
  RCTPlatformView *hitView = [super hitTest:point withEvent:event]; // TODO(macOS GH#774)
  if (self.passThroughTouches && hitView == self) {
    return nil;
  }
  return hitView;
}

- (void)setAppProperties:(NSDictionary *)appProperties
{
  RCTAssertMainQueue();

  if ([_appProperties isEqualToDictionary:appProperties]) {
    return;
  }

  _appProperties = [appProperties copy];

  if (_contentView && _bridge.valid && !_bridge.loading) {
    [self runApplication:_bridge];
  }
}

- (void)setIntrinsicContentSize:(CGSize)intrinsicContentSize
{
  BOOL oldSizeHasAZeroDimension = _intrinsicContentSize.height == 0 || _intrinsicContentSize.width == 0;
  BOOL newSizeHasAZeroDimension = intrinsicContentSize.height == 0 || intrinsicContentSize.width == 0;
  BOOL bothSizesHaveAZeroDimension = oldSizeHasAZeroDimension && newSizeHasAZeroDimension;

  BOOL sizesAreEqual = CGSizeEqualToSize(_intrinsicContentSize, intrinsicContentSize);

  _intrinsicContentSize = intrinsicContentSize;

  [self invalidateIntrinsicContentSize];
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  [self.superview setNeedsLayout];
#else // [TODO(macOS GH#774)
	[self.superview setNeedsLayout:YES];
#endif // ]TODO(macOS GH#774)

  // Don't notify the delegate if the content remains invisible or its size has not changed
  if (bothSizesHaveAZeroDimension || sizesAreEqual) {
    return;
  }

  [self invalidateIntrinsicContentSize];
  #if !TARGET_OS_OSX // TODO(macOS GH#774)
	[self.superview setNeedsLayout];
  #else // [TODO(macOS GH#774)
	  [self.superview setNeedsLayout:YES];
  #endif // ]TODO(macOS GH#774)

  [_delegate rootViewDidChangeIntrinsicSize:self];
}

- (CGSize)intrinsicContentSize
{
  return _intrinsicContentSize;
}

- (void)contentViewInvalidated
{
  [_contentView removeFromSuperview];
  _contentView = nil;
  [self showLoadingView];
}

#if !TARGET_OS_OSX // TODO(macOS GH#774)
- (void)traitCollectionDidChange:(UITraitCollection *)previousTraitCollection
{
  [super traitCollectionDidChange:previousTraitCollection];

  [[NSNotificationCenter defaultCenter]
      postNotificationName:RCTUserInterfaceStyleDidChangeNotification
                    object:self
                  userInfo:@{
                    RCTUserInterfaceStyleDidChangeNotificationTraitCollectionKey : self.traitCollection,
                  }];
}
#else // [TODO(macOS GH#774)
- (void)viewDidChangeEffectiveAppearance {
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTUserInterfaceStyleDidChangeNotification
                                                      object:self
                                                    userInfo:@{
                                                      RCTUserInterfaceStyleDidChangeNotificationTraitCollectionKey: self.effectiveAppearance,
                                                    }];

}
#endif // ]TODO(macOS GH#774)


#if TARGET_OS_OSX // [TODO(macOS GH#774)
- (NSMenu *)menuForEvent:(NSEvent *)event
{
  NSMenu *menu = nil;
#if __has_include("RCTDevMenu.h") && RCT_DEV
  if ([[_bridge devSettings] isDevModeEnabled]) {
    menu = [[_bridge devMenu] menu];
  }
#endif
  if (menu == nil) {
    menu = [super menuForEvent:event];
  }
  if (menu) {
    [[_contentView touchHandler] willShowMenuWithEvent:event];
  }
  return menu;
}
#endif // ]TODO(macOS GH#774)

- (void)dealloc
{
  [_contentView invalidate];
}
@end

@implementation RCTRootView (Deprecated)

- (CGSize)intrinsicSize
{
  RCTLogWarn(@"Calling deprecated `[-RCTRootView intrinsicSize]`.");
  return self.intrinsicContentSize;
}

- (void)cancelTouches
{
  RCTLogWarn(@"`-[RCTRootView cancelTouches]` is deprecated and will be deleted soon.");
  [[_contentView touchHandler] cancel];
}

@end

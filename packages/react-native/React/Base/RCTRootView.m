/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
#import "RCTDevSettings.h" // [macOS]
// [macOS] remove #import "RCTKeyCommands.h"
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

#if __has_include("RCTDevMenu.h") // [macOS
#import "RCTDevMenu.h"
#endif // macOS]

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
}

- (instancetype)initWithFrame:(CGRect)frame
                       bridge:(RCTBridge *)bridge
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

  if (self = [super initWithFrame:frame]) {
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

- (instancetype)initWithBridge:(RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initialProperties
{
  return [self initWithFrame:CGRectZero bridge:bridge moduleName:moduleName initialProperties:initialProperties];
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

- (BOOL)hasBridge
{
  return _bridge != nil;
}

- (RCTModuleRegistry *)moduleRegistry
{
  return _bridge.moduleRegistry;
}

- (id<RCTEventDispatcherProtocol>)eventDispatcher
{
  return [self.moduleRegistry moduleForName:"EventDispatcher"];
}

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

- (void)layoutSubviews
{
  [super layoutSubviews];
  _contentView.frame = self.bounds;
#if !TARGET_OS_OSX // [macOS]
  _loadingView.center = (CGPoint){CGRectGetMidX(self.bounds), CGRectGetMidY(self.bounds)};
#else // [macOS
  NSRect bounds = self.bounds;
  NSSize loadingViewSize = _loadingView.frame.size;
  CGFloat scale = self.window.backingScaleFactor;
  if (scale == 0.0 && RCTRunningInTestEnvironment()) {
    // When running in the test environment the view is not on screen.
    // Use a scaleFactor of 1 so that the test results are machine independent.
    scale = 1;
  }
  RCTAssert(scale != 0.0, @"Layout occurs before the view is in a window?");

  _loadingView.frameOrigin = NSMakePoint(
    RCTRoundPixelValue(bounds.origin.x + ((bounds.size.width - loadingViewSize.width) / 2), scale),
    RCTRoundPixelValue(bounds.origin.y + ((bounds.size.height - loadingViewSize.height) / 2), scale)
  );
#endif // macOS]
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
#if !TARGET_OS_OSX // [macOS]
  return YES;
#else // [macOS
  return NO; // commit 01aba7e8: Merged PR 94656: Enable keyboard accessibility and support for focus ring drawing for button, textfields etc
#endif // macOS]
}

- (void)setLoadingView:(RCTUIView *)loadingView // [macOS]
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
#if !TARGET_OS_OSX // [macOS]
            [UIView transitionWithView:self
                duration:self->_loadingViewFadeDuration
                options:UIViewAnimationOptionTransitionCrossDissolve
                animations:^{
                  self->_loadingView.hidden = YES;
                }
                completion:^(__unused BOOL finished) {
                  [self->_loadingView removeFromSuperview];
                }];
#else // [macOS
                       [NSAnimationContext runAnimationGroup:^(__unused NSAnimationContext *context) {
                         self->_loadingView.animator.alphaValue = 0.0;
                       } completionHandler:^{
                         [self->_loadingView removeFromSuperview];
                         self->_loadingView.hidden = YES;
                         self->_loadingView.alphaValue = 1.0;
                       }];
#endif // macOS]
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
                                           sizeFlexibility:_sizeFlexibility];
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

- (RCTPlatformView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event // [macOS]
{
  // The root view itself should never receive touches
  RCTPlatformView *hitView = [super hitTest:point withEvent:event]; // [macOS]
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
#if !TARGET_OS_OSX // [macOS]
  [self.superview setNeedsLayout];
#else // [macOS
	[self.superview setNeedsLayout:YES];
#endif // macOS]

  // Don't notify the delegate if the content remains invisible or its size has not changed
  if (bothSizesHaveAZeroDimension || sizesAreEqual) {
    return;
  }

  [self invalidateIntrinsicContentSize];
  #if !TARGET_OS_OSX // [macOS]
	[self.superview setNeedsLayout];
  #else // [macOS
	  [self.superview setNeedsLayout:YES];
  #endif // macOS]

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

#if !TARGET_OS_OSX // [macOS]
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
#endif // [macOS]


#if TARGET_OS_OSX // [macOS
- (NSMenu *)menuForEvent:(NSEvent *)event
{
  NSMenu *menu = nil;
#if __has_include("RCTDevMenu.h") && RCT_DEV
  menu = [[_bridge devMenu] menu];
#endif
  if (menu == nil) {
    menu = [super menuForEvent:event];
  }
  if (menu) {
    [[_contentView touchHandler] willShowMenuWithEvent:event];
  }
  return menu;
}
#endif // macOS]

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

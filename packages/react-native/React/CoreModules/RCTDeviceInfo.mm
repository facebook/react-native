/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTDeviceInfo.h"

#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import <React/RCTAccessibilityManager.h>
#import <React/RCTAssert.h>
#import <React/RCTConstants.h>
#import <React/RCTEventDispatcherProtocol.h>
#import <React/RCTInitializing.h>
#import <React/RCTUIKit.h> // [macOS]
#import <React/RCTUIUtils.h>
#import <React/RCTUtils.h>
#import "UIView+React.h" // [macOS]

#import "CoreModulesPlugins.h"

using namespace facebook::react;

@interface RCTDeviceInfo () <NativeDeviceInfoSpec, RCTInitializing>
@end

@implementation RCTDeviceInfo {
#if !TARGET_OS_OSX // [macOS]
  UIInterfaceOrientation _currentInterfaceOrientation;
  NSDictionary *_currentInterfaceDimensions;
  BOOL _isFullscreen;
#endif // [macOS]
}

@synthesize bridge = _bridge;
@synthesize moduleRegistry = _moduleRegistry;

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)initialize
{
#if !TARGET_OS_OSX // [macOS]
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(didReceiveNewContentSizeMultiplier)
                                               name:RCTAccessibilityManagerDidUpdateMultiplierNotification
                                             object:[_moduleRegistry moduleForName:"AccessibilityManager"]];

  _currentInterfaceOrientation = [RCTSharedApplication() statusBarOrientation];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(interfaceOrientationDidChange)
                                               name:UIApplicationDidChangeStatusBarOrientationNotification
                                             object:nil];

  _currentInterfaceDimensions = RCTExportedDimensions(_moduleRegistry, _bridge);

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(interfaceOrientationDidChange)
                                               name:UIApplicationDidBecomeActiveNotification
                                             object:nil];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(interfaceFrameDidChange)
                                               name:RCTUserInterfaceStyleDidChangeNotification
                                             object:nil];
#endif // [macOS]
}

static BOOL RCTIsIPhoneX()
{
  static BOOL isIPhoneX = NO;
#if !TARGET_OS_OSX // [macOS]
  static dispatch_once_t onceToken;

  dispatch_once(&onceToken, ^{
    RCTAssertMainQueue();

    CGSize screenSize = [UIScreen mainScreen].nativeBounds.size;
    CGSize iPhoneXScreenSize = CGSizeMake(1125, 2436);
    CGSize iPhoneXMaxScreenSize = CGSizeMake(1242, 2688);
    CGSize iPhoneXRScreenSize = CGSizeMake(828, 1792);
    CGSize iPhone12ScreenSize = CGSizeMake(1170, 2532);
    CGSize iPhone12MiniScreenSize = CGSizeMake(1080, 2340);
    CGSize iPhone12ProMaxScreenSize = CGSizeMake(1284, 2778);

    isIPhoneX = CGSizeEqualToSize(screenSize, iPhoneXScreenSize) ||
        CGSizeEqualToSize(screenSize, iPhoneXMaxScreenSize) || CGSizeEqualToSize(screenSize, iPhoneXRScreenSize) ||
        CGSizeEqualToSize(screenSize, iPhone12ScreenSize) || CGSizeEqualToSize(screenSize, iPhone12MiniScreenSize) ||
        CGSizeEqualToSize(screenSize, iPhone12ProMaxScreenSize);
    ;
  });
#endif // [macOS]
  return isIPhoneX;
}

#if !TARGET_OS_OSX // [macOS]
static NSDictionary *RCTExportedDimensions(RCTModuleRegistry *moduleRegistry, RCTBridge *bridge)
#else // [macOS
NSDictionary *RCTExportedDimensions(RCTPlatformView *rootView, RCTBridge *bridge)
#endif // macOS]
{
  RCTAssertMainQueue();

#if !TARGET_OS_OSX // [macOS]
  RCTDimensions dimensions;
  if (moduleRegistry) {
    RCTAccessibilityManager *accessibilityManager =
        (RCTAccessibilityManager *)[moduleRegistry moduleForName:"AccessibilityManager"];
    dimensions = RCTGetDimensions(accessibilityManager ? accessibilityManager.multiplier : 1.0);
  } else {
    RCTAssert(false, @"ModuleRegistry must be set to properly init dimensions. Bridge exists: %d", bridge != nil);
  }
#else // [macOS
  RCTDimensions dimensions = RCTGetDimensions(rootView);
#endif // macOS]

  __typeof(dimensions.window) window = dimensions.window;
  NSDictionary<NSString *, NSNumber *> *dimsWindow = @{
    @"width" : @(window.width),
    @"height" : @(window.height),
    @"scale" : @(window.scale),
    @"fontScale" : @(window.fontScale)
  };
  __typeof(dimensions.screen) screen = dimensions.screen;
  NSDictionary<NSString *, NSNumber *> *dimsScreen = @{
    @"width" : @(screen.width),
    @"height" : @(screen.height),
    @"scale" : @(screen.scale),
    @"fontScale" : @(screen.fontScale)
  };
  return @{@"window" : dimsWindow, @"screen" : dimsScreen};
}

- (NSDictionary<NSString *, id> *)constantsToExport
{
  return [self getConstants];
}

- (NSDictionary<NSString *, id> *)getConstants
{
  __block NSDictionary<NSString *, id> *constants;
  RCTModuleRegistry *moduleRegistry = _moduleRegistry;
  RCTBridge *bridge = _bridge;
  RCTUnsafeExecuteOnMainQueueSync(^{
    constants = @{
#if !TARGET_OS_OSX // [macOS]
      @"Dimensions" : RCTExportedDimensions(moduleRegistry, bridge),
#else // [macOS
      @"Dimensions": RCTExportedDimensions(nil, bridge),
#endif // macOS]
      // Note:
      // This prop is deprecated and will be removed in a future release.
      // Please use this only for a quick and temporary solution.
      // Use <SafeAreaView> instead.
      @"isIPhoneX_deprecated" : @(RCTIsIPhoneX()),
    };
  });

  return constants;
}

- (void)didReceiveNewContentSizeMultiplier
{
  RCTModuleRegistry *moduleRegistry = _moduleRegistry;
  RCTBridge *bridge = _bridge;
  RCTExecuteOnMainQueue(^{
  // Report the event across the bridge.
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [[moduleRegistry moduleForName:"EventDispatcher"]
        sendDeviceEventWithName:@"didUpdateDimensions"
#if !TARGET_OS_OSX // [macOS]
                           body:RCTExportedDimensions(moduleRegistry, bridge)];
#else // [macOS
                           body:RCTExportedDimensions(nil, bridge)];
#endif // macOS]
#pragma clang diagnostic pop
  });
}

#if !TARGET_OS_OSX // [macOS]

- (void)interfaceOrientationDidChange
{
  __weak __typeof(self) weakSelf = self;
  RCTExecuteOnMainQueue(^{
    [weakSelf _interfaceOrientationDidChange];
  });
}

- (void)_interfaceOrientationDidChange
{
  UIApplication *application = RCTSharedApplication();
  UIInterfaceOrientation nextOrientation = [application statusBarOrientation];

  BOOL isRunningInFullScreen =
      CGRectEqualToRect(application.delegate.window.frame, application.delegate.window.screen.bounds);
  // We are catching here two situations for multitasking view:
  // a) The app is in Split View and the container gets resized -> !isRunningInFullScreen
  // b) The app changes to/from fullscreen example: App runs in slide over mode and goes into fullscreen->
  // isRunningInFullScreen != _isFullscreen The above two cases a || b can be shortened to !isRunningInFullScreen ||
  // !_isFullscreen;
  BOOL isResizingOrChangingToFullscreen = !isRunningInFullScreen || !_isFullscreen;
  BOOL isOrientationChanging = (UIInterfaceOrientationIsPortrait(_currentInterfaceOrientation) &&
                                !UIInterfaceOrientationIsPortrait(nextOrientation)) ||
      (UIInterfaceOrientationIsLandscape(_currentInterfaceOrientation) &&
       !UIInterfaceOrientationIsLandscape(nextOrientation));

  // Update when we go from portrait to landscape, or landscape to portrait
  // Also update when the fullscreen state changes (multitasking) and only when the app is in active state.
  if ((isOrientationChanging || isResizingOrChangingToFullscreen) && RCTIsAppActive()) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [[_moduleRegistry moduleForName:"EventDispatcher"]
        sendDeviceEventWithName:@"didUpdateDimensions"
                           body:RCTExportedDimensions(_moduleRegistry, _bridge)];
    // We only want to track the current _currentInterfaceOrientation and _isFullscreen only
    // when it happens and only when it is published.
    _currentInterfaceOrientation = nextOrientation;
    _isFullscreen = isRunningInFullScreen;
#pragma clang diagnostic pop
  }
}

- (void)interfaceFrameDidChange
{
  __weak __typeof(self) weakSelf = self;
  RCTExecuteOnMainQueue(^{
    [weakSelf _interfaceFrameDidChange];
  });
}

- (void)_interfaceFrameDidChange
{
  NSDictionary *nextInterfaceDimensions = RCTExportedDimensions(_moduleRegistry, _bridge);

  // update and publish the even only when the app is in active state
  if (!([nextInterfaceDimensions isEqual:_currentInterfaceDimensions]) && RCTIsAppActive()) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [[_moduleRegistry moduleForName:"EventDispatcher"] sendDeviceEventWithName:@"didUpdateDimensions"
                                                                          body:nextInterfaceDimensions];
    // We only want to track the current _currentInterfaceOrientation only
    // when it happens and only when it is published.
    _currentInterfaceDimensions = nextInterfaceDimensions;
#pragma clang diagnostic pop
  }
}
#endif // [macOS]

- (std::shared_ptr<TurboModule>)getTurboModule:(const ObjCTurboModule::InitParams &)params
{
  return std::make_shared<NativeDeviceInfoSpecJSI>(params);
}

@end

Class RCTDeviceInfoCls(void)
{
  return RCTDeviceInfo.class;
}

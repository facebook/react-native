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
#import <React/RCTInvalidating.h>
#import <React/RCTUIUtils.h>
#import <React/RCTUtils.h>

#import "CoreModulesPlugins.h"

using namespace facebook::react;

@interface RCTDeviceInfo () <NativeDeviceInfoSpec, RCTInitializing, RCTInvalidating>
@end

@implementation RCTDeviceInfo {
  UIInterfaceOrientation _currentInterfaceOrientation;
  NSDictionary *_currentInterfaceDimensions;
  BOOL _isFullscreen;
  BOOL _invalidated;
}

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
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(didReceiveNewContentSizeMultiplier)
                                               name:RCTAccessibilityManagerDidUpdateMultiplierNotification
                                             object:[_moduleRegistry moduleForName:"AccessibilityManager"]];

  _currentInterfaceOrientation = [RCTSharedApplication() statusBarOrientation];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(interfaceOrientationDidChange)
                                               name:UIApplicationDidChangeStatusBarOrientationNotification
                                             object:nil];

  _currentInterfaceDimensions = [self _exportedDimensions];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(interfaceOrientationDidChange)
                                               name:UIApplicationDidBecomeActiveNotification
                                             object:nil];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(interfaceFrameDidChange)
                                               name:RCTUserInterfaceStyleDidChangeNotification
                                             object:nil];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(interfaceFrameDidChange)
                                               name:RCTWindowFrameDidChangeNotification
                                             object:nil];

  // TODO T175901725 - Registering the RCTDeviceInfo module to the notification is a short-term fix to unblock 0.73
  // The actual behavior should be that the module is properly registered in the TurboModule/Bridge infrastructure
  // and the infrastructure imperatively invoke the `invalidate` method, rather than listening to a notification.
  // This is a temporary workaround until we can investigate the issue better as there might be other modules in a
  // similar situation.
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(invalidate)
                                               name:RCTBridgeWillInvalidateModulesNotification
                                             object:nil];
}

- (void)invalidate
{
  if (_invalidated) {
    return;
  }
  _invalidated = YES;
  [self _cleanupObservers];
}

- (void)_cleanupObservers
{
  [[NSNotificationCenter defaultCenter] removeObserver:self
                                                  name:RCTAccessibilityManagerDidUpdateMultiplierNotification
                                                object:[_moduleRegistry moduleForName:"AccessibilityManager"]];

  [[NSNotificationCenter defaultCenter] removeObserver:self
                                                  name:UIApplicationDidChangeStatusBarOrientationNotification
                                                object:nil];

  [[NSNotificationCenter defaultCenter] removeObserver:self name:UIApplicationDidBecomeActiveNotification object:nil];

  [[NSNotificationCenter defaultCenter] removeObserver:self name:RCTUserInterfaceStyleDidChangeNotification object:nil];

  [[NSNotificationCenter defaultCenter] removeObserver:self name:RCTWindowFrameDidChangeNotification object:nil];

  [[NSNotificationCenter defaultCenter] removeObserver:self name:RCTBridgeWillInvalidateModulesNotification object:nil];
}

static BOOL RCTIsIPhoneNotched()
{
  static BOOL isIPhoneNotched = NO;
  static dispatch_once_t onceToken;

  dispatch_once(&onceToken, ^{
    RCTAssertMainQueue();

    // 20pt is the top safeArea value in non-notched devices
    isIPhoneNotched = RCTSharedApplication().keyWindow.safeAreaInsets.top > 20;
  });

  return isIPhoneNotched;
}

static NSDictionary *RCTExportedDimensions(CGFloat fontScale)
{
  RCTAssertMainQueue();
  RCTDimensions dimensions = RCTGetDimensions(fontScale);
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

- (NSDictionary *)_exportedDimensions
{
  RCTAssert(!_invalidated, @"Failed to get exported dimensions: RCTDeviceInfo has been invalidated");
  RCTAssert(_moduleRegistry, @"Failed to get exported dimensions: RCTModuleRegistry is nil");
  RCTAccessibilityManager *accessibilityManager =
      (RCTAccessibilityManager *)[_moduleRegistry moduleForName:"AccessibilityManager"];
  RCTAssert(accessibilityManager, @"Failed to get exported dimensions: AccessibilityManager is nil");
  CGFloat fontScale = accessibilityManager ? accessibilityManager.multiplier : 1.0;
  return RCTExportedDimensions(fontScale);
}

- (NSDictionary<NSString *, id> *)constantsToExport
{
  return [self getConstants];
}

- (NSDictionary<NSString *, id> *)getConstants
{
  __block NSDictionary<NSString *, id> *constants;
  __weak __typeof(self) weakSelf = self;
  RCTUnsafeExecuteOnMainQueueSync(^{
    constants = @{
      @"Dimensions" : [weakSelf _exportedDimensions],
      // Note:
      // This prop is deprecated and will be removed in a future release.
      // Please use this only for a quick and temporary solution.
      // Use <SafeAreaView> instead.
      @"isIPhoneX_deprecated" : @(RCTIsIPhoneNotched()),
    };
  });

  return constants;
}

- (void)didReceiveNewContentSizeMultiplier
{
  __weak __typeof(self) weakSelf = self;
  RCTModuleRegistry *moduleRegistry = _moduleRegistry;
  RCTExecuteOnMainQueue(^{
  // Report the event across the bridge.
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [[moduleRegistry moduleForName:"EventDispatcher"] sendDeviceEventWithName:@"didUpdateDimensions"
                                                                         body:[weakSelf _exportedDimensions]];
#pragma clang diagnostic pop
  });
}

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
    [[_moduleRegistry moduleForName:"EventDispatcher"] sendDeviceEventWithName:@"didUpdateDimensions"
                                                                          body:[self _exportedDimensions]];
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
  NSDictionary *nextInterfaceDimensions = [self _exportedDimensions];

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

- (std::shared_ptr<TurboModule>)getTurboModule:(const ObjCTurboModule::InitParams &)params
{
  return std::make_shared<NativeDeviceInfoSpecJSI>(params);
}

@end

Class RCTDeviceInfoCls(void)
{
  return RCTDeviceInfo.class;
}

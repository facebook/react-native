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
#import <React/RCTUIUtils.h>
#import <React/RCTUtils.h>

#import "CoreModulesPlugins.h"

using namespace facebook::react;

@interface RCTDeviceInfo () <NativeDeviceInfoSpec, RCTInitializing>
@end

@implementation RCTDeviceInfo {
  UIInterfaceOrientation _currentInterfaceOrientation;
  NSDictionary *_currentInterfaceDimensions;
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
                                           selector:@selector(interfaceFrameDidChange)
                                               name:UIApplicationDidBecomeActiveNotification
                                             object:nil];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(interfaceFrameDidChange)
                                               name:RCTUserInterfaceStyleDidChangeNotification
                                             object:nil];
}

static NSDictionary *RCTExportedDimensions(RCTModuleRegistry *moduleRegistry, RCTBridge *bridge)
{
  RCTAssertMainQueue();
  RCTDimensions dimensions;
  if (moduleRegistry) {
    RCTAccessibilityManager *accessibilityManager =
        (RCTAccessibilityManager *)[moduleRegistry moduleForName:"AccessibilityManager"];
    dimensions = RCTGetDimensions(accessibilityManager ? accessibilityManager.multiplier : 1.0);
  } else {
    RCTAssert(false, @"ModuleRegistry must be set to properly init dimensions. Bridge exists: %d", bridge != nil);
  }
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
      @"Dimensions" : RCTExportedDimensions(moduleRegistry, bridge),
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
                           body:RCTExportedDimensions(moduleRegistry, bridge)];
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
  UIInterfaceOrientation nextOrientation = [RCTSharedApplication() statusBarOrientation];

  // Update when we go from portrait to landscape, or landscape to portrait
  if ((UIInterfaceOrientationIsPortrait(_currentInterfaceOrientation) &&
       !UIInterfaceOrientationIsPortrait(nextOrientation)) ||
      (UIInterfaceOrientationIsLandscape(_currentInterfaceOrientation) &&
       !UIInterfaceOrientationIsLandscape(nextOrientation))) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [[_moduleRegistry moduleForName:"EventDispatcher"]
        sendDeviceEventWithName:@"didUpdateDimensions"
                           body:RCTExportedDimensions(_moduleRegistry, _bridge)];
#pragma clang diagnostic pop
  }

  _currentInterfaceOrientation = nextOrientation;
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

  if (!([nextInterfaceDimensions isEqual:_currentInterfaceDimensions])) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [[_moduleRegistry moduleForName:"EventDispatcher"] sendDeviceEventWithName:@"didUpdateDimensions"
                                                                          body:nextInterfaceDimensions];
#pragma clang diagnostic pop
  }

  _currentInterfaceDimensions = nextInterfaceDimensions;
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

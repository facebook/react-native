/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTDeviceInfo.h"

<<<<<<< HEAD:React/Modules/RCTDeviceInfo.m
#import "RCTAccessibilityManager.h"
#import "RCTAssert.h"
#import "RCTEventDispatcher.h"
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
#import "RCTUIUtils.h"
#endif // TODO(macOS ISS#2323203)
#import "RCTUtils.h"
#import <React/RCTUIKit.h> // TODO(macOS ISS#2323203)
#import "UIView+React.h" // TODO(macOS ISS#2323203)
=======
#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import <React/RCTAccessibilityManager.h>
#import <React/RCTAssert.h>
#import <React/RCTConstants.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTUIUtils.h>
#import <React/RCTUtils.h>

#import "CoreModulesPlugins.h"

using namespace facebook::react;

@interface RCTDeviceInfo () <NativeDeviceInfoSpec>
@end
>>>>>>> fb/0.62-stable:React/CoreModules/RCTDeviceInfo.mm

@implementation RCTDeviceInfo {
#if !TARGET_OS_TV && !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  UIInterfaceOrientation _currentInterfaceOrientation;
  NSDictionary *_currentInterfaceDimensions;
#endif
}

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)setBridge:(RCTBridge *)bridge
{
  _bridge = bridge;

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(didReceiveNewContentSizeMultiplier)
                                               name:RCTAccessibilityManagerDidUpdateMultiplierNotification
                                             object:_bridge.accessibilityManager];
#endif // TODO(macOS ISS#2323203)
  
#if !TARGET_OS_TV && !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  _currentInterfaceOrientation = [RCTSharedApplication() statusBarOrientation];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(interfaceOrientationDidChange)
                                               name:UIApplicationDidChangeStatusBarOrientationNotification
                                             object:nil];

  _currentInterfaceDimensions = RCTExportedDimensions(_bridge);

  [[NSNotificationCenter defaultCenter] addObserver:self
                                            selector:@selector(interfaceFrameDidChange)
                                                name:UIApplicationDidBecomeActiveNotification
                                              object:nil];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                            selector:@selector(interfaceFrameDidChange)
                                                name:RCTUserInterfaceStyleDidChangeNotification
                                              object:nil];

#endif
}

static BOOL RCTIsIPhoneX() {
  static BOOL isIPhoneX = NO;
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  static dispatch_once_t onceToken;

  dispatch_once(&onceToken, ^{
    RCTAssertMainQueue();

    CGSize screenSize = [UIScreen mainScreen].nativeBounds.size;
    CGSize iPhoneXScreenSize = CGSizeMake(1125, 2436);
    CGSize iPhoneXMaxScreenSize = CGSizeMake(1242, 2688);
    CGSize iPhoneXRScreenSize = CGSizeMake(828, 1792);

    isIPhoneX =
      CGSizeEqualToSize(screenSize, iPhoneXScreenSize) ||
      CGSizeEqualToSize(screenSize, iPhoneXMaxScreenSize) ||
      CGSizeEqualToSize(screenSize, iPhoneXRScreenSize);
  });
#endif // TODO(macOS ISS#2323203)
  return isIPhoneX;
}

#if !TARGET_OS_OSX // [TODO(macOS ISS#2323203)
NSDictionary *RCTExportedDimensions(RCTBridge *bridge)
#else
NSDictionary *RCTExportedDimensions(RCTPlatformView *rootView)
#endif // ]TODO(macOS ISS#2323203)
{
  RCTAssertMainQueue();
<<<<<<< HEAD:React/Modules/RCTDeviceInfo.m

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
=======
>>>>>>> fb/0.62-stable:React/CoreModules/RCTDeviceInfo.mm
  RCTDimensions dimensions = RCTGetDimensions(bridge.accessibilityManager.multiplier);
  __typeof (dimensions.window) window = dimensions.window;
  NSDictionary<NSString *, NSNumber *> *dimsWindow = @{
      @"width": @(window.width),
      @"height": @(window.height),
      @"scale": @(window.scale),
      @"fontScale": @(window.fontScale)
  };
  __typeof(dimensions.screen) screen = dimensions.screen;
  NSDictionary<NSString *, NSNumber *> *dimsScreen = @{
      @"width": @(screen.width),
      @"height": @(screen.height),
      @"scale": @(screen.scale),
      @"fontScale": @(screen.fontScale)
  };
  return @{
      @"window": dimsWindow,
      @"screen": dimsScreen
  };
#else // [TODO(macOS ISS#2323203)
	if (rootView != nil) {
		NSWindow *window = rootView.window;
		if (window != nil) {
			NSSize size = rootView.bounds.size;
			return @{
				@"window": @{
					@"width": @(size.width),
					@"height": @(size.height),
					@"scale": @(window.backingScaleFactor),
				},
        @"rootTag" : rootView.reactTag,
			};
		}
	}

  // We don't have a root view or window yet so make something up
  NSScreen *screen = [NSScreen screens].firstObject;
  return @{
      @"window": @{
        @"width": @(screen.frame.size.width),
        @"height": @(screen.frame.size.height),
        @"scale": @(screen.backingScaleFactor),
      },
  };
#endif // ]TODO(macOS ISS#2323203)
}

- (NSDictionary<NSString *, id> *)constantsToExport
{
  return [self getConstants];
}

- (NSDictionary<NSString *, id> *)getConstants
{
  return @{
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
    @"Dimensions": RCTExportedDimensions(_bridge),
#else // [TODO(macOS ISS#2323203)
    @"Dimensions": RCTExportedDimensions(nil),
#endif // ]TODO(macOS ISS#2323203)
    // Note:
    // This prop is deprecated and will be removed in a future release.
    // Please use this only for a quick and temporary solution.
    // Use <SafeAreaView> instead.
    @"isIPhoneX_deprecated": @(RCTIsIPhoneX()),
  };
}

- (void)didReceiveNewContentSizeMultiplier
{
  RCTBridge *bridge = _bridge;
  RCTExecuteOnMainQueue(^{
    // Report the event across the bridge.
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [bridge.eventDispatcher sendDeviceEventWithName:@"didUpdateDimensions"
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
    body:RCTExportedDimensions(bridge)];
#else // [TODO(macOS ISS#2323203)
    body:RCTExportedDimensions(nil)];
#endif // ]TODO(macOS ISS#2323203)
#pragma clang diagnostic pop
  });
}

#if !TARGET_OS_TV && !TARGET_OS_OSX // TODO(macOS ISS#2323203)

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
        [_bridge.eventDispatcher sendDeviceEventWithName:@"didUpdateDimensions"
                                                    body:RCTExportedDimensions(_bridge)];
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
  NSDictionary *nextInterfaceDimensions = RCTExportedDimensions(_bridge);

  if (!([nextInterfaceDimensions isEqual:_currentInterfaceDimensions])) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
      [_bridge.eventDispatcher sendDeviceEventWithName:@"didUpdateDimensions"
                                                  body:nextInterfaceDimensions];
#pragma clang diagnostic pop
  }

  _currentInterfaceDimensions = nextInterfaceDimensions;
}

#endif // TARGET_OS_TV

- (std::shared_ptr<TurboModule>)getTurboModuleWithJsInvoker:(std::shared_ptr<CallInvoker>)jsInvoker
{
  return std::make_shared<NativeDeviceInfoSpecJSI>(self, jsInvoker);
}

@end

Class RCTDeviceInfoCls(void) {
  return RCTDeviceInfo.class;
}

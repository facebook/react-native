/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTAppSetupUtils.h"

#import <React/RCTJSIExecutorRuntimeInstaller.h>
#import <react/renderer/runtimescheduler/RuntimeScheduler.h>
#import <react/renderer/runtimescheduler/RuntimeSchedulerBinding.h>

// Turbo Module
#import <React/RCTBundleAssetImageLoader.h>
#import <React/RCTDataRequestHandler.h>
#import <React/RCTFileRequestHandler.h>
#import <React/RCTGIFImageDecoder.h>
#import <React/RCTHTTPRequestHandler.h>
#import <React/RCTImageLoader.h>
#import <React/RCTNetworking.h>

// Fabric
#import <React/RCTFabricSurface.h>
#import <React/RCTSurfaceHostingProxyRootView.h>

// jsinspector-modern
#import <jsinspector-modern/InspectorFlags.h>

void RCTAppSetupPrepareApp(UIApplication *application, BOOL turboModuleEnabled)
{
  RCTEnableTurboModule(turboModuleEnabled);

#if DEBUG
  // Disable idle timer in dev builds to avoid putting application in background and complicating
  // Metro reconnection logic. Users only need this when running the application using our CLI tooling.
  application.idleTimerDisabled = YES;
#endif
}

void RCTAppSetupPrepareApp(
    UIApplication *application,
    BOOL turboModuleEnabled,
    const facebook::react::ReactNativeConfig &reactNativeConfig)
{
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  RCTAppSetupPrepareApp(application, turboModuleEnabled);
#pragma clang diagnostic pop

  auto &inspectorFlags = facebook::react::jsinspector_modern::InspectorFlags::getInstance();
  inspectorFlags.initFromConfig(reactNativeConfig);
}

UIView *
RCTAppSetupDefaultRootView(RCTBridge *bridge, NSString *moduleName, NSDictionary *initialProperties, BOOL fabricEnabled)
{
  if (fabricEnabled) {
    id<RCTSurfaceProtocol> surface = [[RCTFabricSurface alloc] initWithBridge:bridge
                                                                   moduleName:moduleName
                                                            initialProperties:initialProperties];
    return [[RCTSurfaceHostingProxyRootView alloc] initWithSurface:surface];
  }
  return [[RCTRootView alloc] initWithBridge:bridge moduleName:moduleName initialProperties:initialProperties];
}

id<RCTTurboModule> RCTAppSetupDefaultModuleFromClass(Class moduleClass)
{
  // Set up the default RCTImageLoader and RCTNetworking modules.
  if (moduleClass == RCTImageLoader.class) {
    return [[moduleClass alloc] initWithRedirectDelegate:nil
        loadersProvider:^NSArray<id<RCTImageURLLoader>> *(RCTModuleRegistry *moduleRegistry) {
          return @[ [RCTBundleAssetImageLoader new] ];
        }
        decodersProvider:^NSArray<id<RCTImageDataDecoder>> *(RCTModuleRegistry *moduleRegistry) {
          return @[ [RCTGIFImageDecoder new] ];
        }];
  } else if (moduleClass == RCTNetworking.class) {
    return [[moduleClass alloc]
        initWithHandlersProvider:^NSArray<id<RCTURLRequestHandler>> *(RCTModuleRegistry *moduleRegistry) {
          return [NSArray arrayWithObjects:[RCTHTTPRequestHandler new],
                                           [RCTDataRequestHandler new],
                                           [RCTFileRequestHandler new],
                                           [moduleRegistry moduleForName:"BlobModule"],
                                           nil];
        }];
  }
  // No custom initializer here.
  return [moduleClass new];
}

std::unique_ptr<facebook::react::JSExecutorFactory> RCTAppSetupDefaultJsExecutorFactory(
    RCTBridge *bridge,
    RCTTurboModuleManager *turboModuleManager,
    const std::shared_ptr<facebook::react::RuntimeScheduler> &runtimeScheduler)
{
  // Necessary to allow NativeModules to lookup TurboModules
  [bridge setRCTTurboModuleRegistry:turboModuleManager];

#if RCT_DEV
  /**
   * Instantiating DevMenu has the side-effect of registering
   * shortcuts for CMD + d, CMD + i,  and CMD + n via RCTDevMenu.
   * Therefore, when TurboModules are enabled, we must manually create this
   * NativeModule.
   */
  [turboModuleManager moduleForName:"RCTDevMenu"];
#endif // end RCT_DEV

#if USE_HERMES
  return std::make_unique<facebook::react::HermesExecutorFactory>(
#else
  return std::make_unique<facebook::react::JSCExecutorFactory>(
#endif // USE_HERMES
      facebook::react::RCTJSIExecutorRuntimeInstaller(
          [turboModuleManager, bridge, runtimeScheduler](facebook::jsi::Runtime &runtime) {
            if (!bridge || !turboModuleManager) {
              return;
            }
            if (runtimeScheduler) {
              facebook::react::RuntimeSchedulerBinding::createAndInstallIfNeeded(runtime, runtimeScheduler);
            }
            [turboModuleManager installJSBindings:runtime];
          }));
}

std::unique_ptr<facebook::react::JSExecutorFactory> RCTAppSetupJsExecutorFactoryForOldArch(
    RCTBridge *bridge,
    const std::shared_ptr<facebook::react::RuntimeScheduler> &runtimeScheduler)
{
#if USE_HERMES
  return std::make_unique<facebook::react::HermesExecutorFactory>(
#else
  return std::make_unique<facebook::react::JSCExecutorFactory>(
#endif // USE_HERMES
      facebook::react::RCTJSIExecutorRuntimeInstaller([bridge, runtimeScheduler](facebook::jsi::Runtime &runtime) {
        if (!bridge) {
          return;
        }
        if (runtimeScheduler) {
          facebook::react::RuntimeSchedulerBinding::createAndInstallIfNeeded(runtime, runtimeScheduler);
        }
      }));
}

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTAppSetupUtils.h"

#if RCT_NEW_ARCH_ENABLED
// Turbo Module
#import <React/CoreModulesPlugins.h>
#import <React/RCTDataRequestHandler.h>
#import <React/RCTFileRequestHandler.h>
#import <React/RCTGIFImageDecoder.h>
#import <React/RCTHTTPRequestHandler.h>
#import <React/RCTImageLoader.h>
#import <React/RCTJSIExecutorRuntimeInstaller.h>
#import <React/RCTLocalAssetImageLoader.h>
#import <React/RCTNetworking.h>

// Fabric
#import <React/RCTFabricSurfaceHostingProxyRootView.h>
#endif

#ifdef FB_SONARKIT_ENABLED
#import <FlipperKit/FlipperClient.h>
#import <FlipperKitLayoutPlugin/FlipperKitLayoutPlugin.h>
#import <FlipperKitNetworkPlugin/FlipperKitNetworkPlugin.h>
#import <FlipperKitReactPlugin/FlipperKitReactPlugin.h>
#import <FlipperKitUserDefaultsPlugin/FKUserDefaultsPlugin.h>
#import <SKIOSNetworkPlugin/SKIOSNetworkAdapter.h>

static void InitializeFlipper(UIApplication *application)
{
  FlipperClient *client = [FlipperClient sharedClient];
  SKDescriptorMapper *layoutDescriptorMapper = [[SKDescriptorMapper alloc] initWithDefaults];
  [client addPlugin:[[FlipperKitLayoutPlugin alloc] initWithRootNode:application
                                                withDescriptorMapper:layoutDescriptorMapper]];
  [client addPlugin:[[FKUserDefaultsPlugin alloc] initWithSuiteName:nil]];
  [client addPlugin:[FlipperKitReactPlugin new]];
  [client addPlugin:[[FlipperKitNetworkPlugin alloc] initWithNetworkAdapter:[SKIOSNetworkAdapter new]]];
  [client start];
}
#endif

void RCTAppSetupPrepareApp(UIApplication *application)
{
#ifdef FB_SONARKIT_ENABLED
  InitializeFlipper(application);
#endif

#if RCT_NEW_ARCH_ENABLED
  RCTEnableTurboModule(YES);
#endif
}

UIView *RCTAppSetupDefaultRootView(RCTBridge *bridge, NSString *moduleName, NSDictionary *initialProperties)
{
#if RCT_NEW_ARCH_ENABLED
  return [[RCTFabricSurfaceHostingProxyRootView alloc] initWithBridge:bridge
                                                           moduleName:moduleName
                                                    initialProperties:initialProperties];
#else
  return [[RCTRootView alloc] initWithBridge:bridge moduleName:moduleName initialProperties:initialProperties];
#endif
}

#if RCT_NEW_ARCH_ENABLED
id<RCTTurboModule> RCTAppSetupDefaultModuleFromClass(Class moduleClass)
{
  // Set up the default RCTImageLoader and RCTNetworking modules.
  if (moduleClass == RCTImageLoader.class) {
    return [[moduleClass alloc] initWithRedirectDelegate:nil
        loadersProvider:^NSArray<id<RCTImageURLLoader>> *(RCTModuleRegistry *moduleRegistry) {
          return @[ [RCTLocalAssetImageLoader new] ];
        }
        decodersProvider:^NSArray<id<RCTImageDataDecoder>> *(RCTModuleRegistry *moduleRegistry) {
          return @[ [RCTGIFImageDecoder new] ];
        }];
  } else if (moduleClass == RCTNetworking.class) {
    return [[moduleClass alloc]
        initWithHandlersProvider:^NSArray<id<RCTURLRequestHandler>> *(RCTModuleRegistry *moduleRegistry) {
          return @[
            [RCTHTTPRequestHandler new],
            [RCTDataRequestHandler new],
            [RCTFileRequestHandler new],
          ];
        }];
  }
  // No custom initializer here.
  return [moduleClass new];
}

std::unique_ptr<facebook::react::JSExecutorFactory> RCTAppSetupDefaultJsExecutorFactory(
    RCTBridge *bridge,
    RCTTurboModuleManager *turboModuleManager)
{
  // Necessary to allow NativeModules to lookup TurboModules
  [bridge setRCTTurboModuleRegistry:turboModuleManager];

#if RCT_DEV
  if (!RCTTurboModuleEagerInitEnabled()) {
    /**
     * Instantiating DevMenu has the side-effect of registering
     * shortcuts for CMD + d, CMD + i,  and CMD + n via RCTDevMenu.
     * Therefore, when TurboModules are enabled, we must manually create this
     * NativeModule.
     */
    [turboModuleManager moduleForName:"RCTDevMenu"];
  }
#endif

#if RCT_USE_HERMES
  return std::make_unique<facebook::react::HermesExecutorFactory>(
#else
  return std::make_unique<facebook::react::JSCExecutorFactory>(
#endif
      facebook::react::RCTJSIExecutorRuntimeInstaller([turboModuleManager, bridge](facebook::jsi::Runtime &runtime) {
        if (!bridge || !turboModuleManager) {
          return;
        }
        facebook::react::RuntimeExecutor syncRuntimeExecutor =
            [&](std::function<void(facebook::jsi::Runtime & runtime_)> &&callback) { callback(runtime); };
        [turboModuleManager installJSBindingWithRuntimeExecutor:syncRuntimeExecutor];
      }));
}

#endif

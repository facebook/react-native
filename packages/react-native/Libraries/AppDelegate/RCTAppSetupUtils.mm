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

#import "RCTDependencyProvider.h"

void RCTAppSetupPrepareApp(UIApplication *application, BOOL turboModuleEnabled)
{
  RCTEnableTurboModule(turboModuleEnabled);

#if DEBUG
  // Disable idle timer in dev builds to avoid putting application in background and complicating
  // Metro reconnection logic. Users only need this when running the application using our CLI tooling.
  application.idleTimerDisabled = YES;
#endif
}

UIView *
RCTAppSetupDefaultRootView(RCTBridge *bridge, NSString *moduleName, NSDictionary *initialProperties, BOOL fabricEnabled)
{
  if (fabricEnabled) {
    id<RCTSurfaceProtocol> surface = [[RCTFabricSurface alloc] initWithBridge:bridge
                                                                   moduleName:moduleName
                                                            initialProperties:initialProperties];
    UIView *rootView = [[RCTSurfaceHostingProxyRootView alloc] initWithSurface:surface];
    [surface start];
    return rootView;
  }
  return [[RCTRootView alloc] initWithBridge:bridge moduleName:moduleName initialProperties:initialProperties];
}

NSArray<NSString *> *RCTAppSetupUnstableModulesRequiringMainQueueSetup(id<RCTDependencyProvider> dependencyProvider)
{
  // For oss, insert core main queue setup modules here
  return dependencyProvider ? dependencyProvider.unstableModulesRequiringMainQueueSetup : @[];
}

id<RCTTurboModule> RCTAppSetupDefaultModuleFromClass(Class moduleClass, id<RCTDependencyProvider> dependencyProvider)
{
  // private block used to filter out modules depending on protocol conformance
  NSArray * (^extractModuleConformingToProtocol)(RCTModuleRegistry *, Protocol *) =
      ^NSArray *(RCTModuleRegistry *moduleRegistry, Protocol *protocol) {
        NSArray<NSString *> *classNames = @[];

        if (protocol == @protocol(RCTImageURLLoader)) {
          classNames = dependencyProvider ? dependencyProvider.imageURLLoaderClassNames : @[];
        } else if (protocol == @protocol(RCTImageDataDecoder)) {
          classNames = dependencyProvider ? dependencyProvider.imageDataDecoderClassNames : @[];
        } else if (protocol == @protocol(RCTURLRequestHandler)) {
          classNames = dependencyProvider ? dependencyProvider.URLRequestHandlerClassNames : @[];
        }

        NSMutableArray *modules = [NSMutableArray new];

        for (NSString *className in classNames) {
          const char *cModuleName = [className cStringUsingEncoding:NSUTF8StringEncoding];
          id moduleFromLibrary = [moduleRegistry moduleForName:cModuleName];
          if (![moduleFromLibrary conformsToProtocol:protocol]) {
            continue;
          }
          [modules addObject:moduleFromLibrary];
        }
        return modules;
      };

  // Set up the default RCTImageLoader and RCTNetworking modules.
  if (moduleClass == RCTImageLoader.class) {
    return [[moduleClass alloc] initWithRedirectDelegate:nil
        loadersProvider:^NSArray<id<RCTImageURLLoader>> *(RCTModuleRegistry *moduleRegistry) {
          NSArray *imageURLLoaderModules =
              extractModuleConformingToProtocol(moduleRegistry, @protocol(RCTImageURLLoader));

          return [@[ [RCTBundleAssetImageLoader new] ] arrayByAddingObjectsFromArray:imageURLLoaderModules];
        }
        decodersProvider:^NSArray<id<RCTImageDataDecoder>> *(RCTModuleRegistry *moduleRegistry) {
          NSArray *imageDataDecoder = extractModuleConformingToProtocol(moduleRegistry, @protocol(RCTImageDataDecoder));
          return [@[ [RCTGIFImageDecoder new] ] arrayByAddingObjectsFromArray:imageDataDecoder];
        }];
  } else if (moduleClass == RCTNetworking.class) {
    return [[moduleClass alloc]
        initWithHandlersProvider:^NSArray<id<RCTURLRequestHandler>> *(RCTModuleRegistry *moduleRegistry) {
          NSArray *URLRequestHandlerModules =
              extractModuleConformingToProtocol(moduleRegistry, @protocol(RCTURLRequestHandler));
          return [@[
            [RCTHTTPRequestHandler new],
            [RCTDataRequestHandler new],
            [RCTFileRequestHandler new],
            [moduleRegistry moduleForName:"BlobModule"],
          ] arrayByAddingObjectsFromArray:URLRequestHandlerModules];
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

  auto runtimeInstallerLambda = [turboModuleManager, bridge, runtimeScheduler](facebook::jsi::Runtime &runtime) {
    if (!bridge || !turboModuleManager) {
      return;
    }
    if (runtimeScheduler) {
      facebook::react::RuntimeSchedulerBinding::createAndInstallIfNeeded(runtime, runtimeScheduler);
    }
    [turboModuleManager installJSBindings:runtime];
  };
#if USE_HERMES
  return std::make_unique<facebook::react::HermesExecutorFactory>(
      facebook::react::RCTJSIExecutorRuntimeInstaller(runtimeInstallerLambda));
#elif USE_THIRD_PARTY_JSC != 1
  return std::make_unique<facebook::react::JSCExecutorFactory>(
      facebook::react::RCTJSIExecutorRuntimeInstaller(runtimeInstallerLambda));
#else
  throw std::runtime_error("No JSExecutorFactory specified.");
  return nullptr;
#endif // USE_HERMES
}

std::unique_ptr<facebook::react::JSExecutorFactory> RCTAppSetupJsExecutorFactoryForOldArch(
    RCTBridge *bridge,
    const std::shared_ptr<facebook::react::RuntimeScheduler> &runtimeScheduler)
{
  auto runtimeInstallerLambda = [bridge, runtimeScheduler](facebook::jsi::Runtime &runtime) {
    if (!bridge) {
      return;
    }
    if (runtimeScheduler) {
      facebook::react::RuntimeSchedulerBinding::createAndInstallIfNeeded(runtime, runtimeScheduler);
    }
  };
#if USE_HERMES
  return std::make_unique<facebook::react::HermesExecutorFactory>(
      facebook::react::RCTJSIExecutorRuntimeInstaller(runtimeInstallerLambda));
#elif USE_THIRD_PARTY_JSC != 1
  return std::make_unique<facebook::react::JSCExecutorFactory>(
      facebook::react::RCTJSIExecutorRuntimeInstaller(runtimeInstallerLambda));
#else
  throw std::runtime_error("No JSExecutorFactory specified.");
  return nullptr;
#endif // USE_HERMES
}

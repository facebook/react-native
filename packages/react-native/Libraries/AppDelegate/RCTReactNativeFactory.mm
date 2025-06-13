/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTReactNativeFactory.h"
#import <React/RCTColorSpaceUtils.h>
#import <React/RCTLog.h>
#import <React/RCTRootView.h>
#import <React/RCTSurfacePresenterBridgeAdapter.h>
#import <React/RCTUtils.h>
#import <ReactCommon/RCTHost.h>
#import <objc/runtime.h>
#import <react/featureflags/ReactNativeFeatureFlags.h>
#import <react/featureflags/ReactNativeFeatureFlagsDefaults.h>
#import <react/renderer/graphics/ColorComponents.h>
#import "RCTAppSetupUtils.h"

#if RN_DISABLE_OSS_PLUGIN_HEADER
#import <RCTTurboModulePlugin/RCTTurboModulePlugin.h>
#else
#import <React/CoreModulesPlugins.h>
#endif
#import <React/RCTComponentViewFactory.h>
#import <React/RCTComponentViewProtocol.h>
#import <react/nativemodule/defaults/DefaultTurboModules.h>

#import "RCTDependencyProvider.h"

using namespace facebook::react;

@interface RCTReactNativeFactory () <
    RCTComponentViewFactoryComponentProvider,
    RCTHostDelegate,
    RCTJSRuntimeConfiguratorProtocol,
    RCTTurboModuleManagerDelegate>
@end

@implementation RCTReactNativeFactory

- (instancetype)initWithDelegate:(id<RCTReactNativeFactoryDelegate>)delegate
{
  if (self = [super init]) {
    self.delegate = delegate;
    [self _setUpFeatureFlags];

    auto newArchEnabled = [self newArchEnabled];
    auto fabricEnabled = [self fabricEnabled];

    RCTSetNewArchEnabled(newArchEnabled);
    [RCTColorSpaceUtils applyDefaultColorSpace:[self defaultColorSpace]];
    RCTEnableTurboModule([self turboModuleEnabled]);

    self.rootViewFactory = [self createRCTRootViewFactory];

    if (newArchEnabled || fabricEnabled) {
      [RCTComponentViewFactory currentComponentViewFactory].thirdPartyFabricComponentsProvider = self;
    }
  }

  return self;
}

- (void)startReactNativeWithModuleName:(NSString *)moduleName inWindow:(UIWindow *_Nullable)window
{
  [self startReactNativeWithModuleName:moduleName inWindow:window initialProperties:nil launchOptions:nil];
}

- (void)startReactNativeWithModuleName:(NSString *)moduleName
                              inWindow:(UIWindow *_Nullable)window
                         launchOptions:(NSDictionary *_Nullable)launchOptions
{
  [self startReactNativeWithModuleName:moduleName inWindow:window initialProperties:nil launchOptions:launchOptions];
}

- (void)startReactNativeWithModuleName:(NSString *)moduleName
                              inWindow:(UIWindow *_Nullable)window
                     initialProperties:(NSDictionary *_Nullable)initialProperties
                         launchOptions:(NSDictionary *_Nullable)launchOptions
{
  UIView *rootView = [self.rootViewFactory viewWithModuleName:moduleName
                                            initialProperties:initialProperties
                                                launchOptions:launchOptions];
  UIViewController *rootViewController = [_delegate createRootViewController];
  [_delegate setRootView:rootView toRootViewController:rootViewController];
  window.rootViewController = rootViewController;
  [window makeKeyAndVisible];
}

#pragma mark - RCTUIConfiguratorProtocol

- (RCTColorSpace)defaultColorSpace
{
  if ([_delegate respondsToSelector:@selector(defaultColorSpace)]) {
    return [_delegate defaultColorSpace];
  }

  return RCTColorSpaceSRGB;
}

- (NSURL *_Nullable)bundleURL
{
  if (![_delegate respondsToSelector:@selector(bundleURL)]) {
    [NSException raise:@"RCTReactNativeFactoryDelegate::bundleURL not implemented"
                format:@"Delegate must implement a valid getBundleURL method"];
  }

  return _delegate.bundleURL;
}

#pragma mark - RCTJSRuntimeConfiguratorProtocol

- (JSRuntimeFactoryRef)createJSRuntimeFactory
{
  return [_delegate createJSRuntimeFactory];
}

#pragma mark - RCTArchConfiguratorProtocol

- (BOOL)newArchEnabled
{
  if ([_delegate respondsToSelector:@selector(newArchEnabled)]) {
    return _delegate.newArchEnabled;
  }

#if RCT_NEW_ARCH_ENABLED
  return YES;
#else
  return NO;
#endif
}

- (BOOL)fabricEnabled
{
  if ([_delegate respondsToSelector:@selector(fabricEnabled)]) {
    return _delegate.fabricEnabled;
  }

  return [self newArchEnabled];
}

- (BOOL)turboModuleEnabled
{
  if ([_delegate respondsToSelector:@selector(turboModuleEnabled)]) {
    return _delegate.turboModuleEnabled;
  }

  return [self newArchEnabled];
}

- (BOOL)bridgelessEnabled
{
  if ([_delegate respondsToSelector:@selector(bridgelessEnabled)]) {
    return _delegate.bridgelessEnabled;
  }

  return [self newArchEnabled];
}

#pragma mark - RCTTurboModuleManagerDelegate

- (Class)getModuleClassFromName:(const char *)name
{
#if RN_DISABLE_OSS_PLUGIN_HEADER
  return RCTTurboModulePluginClassProvider(name);
#else
  return RCTCoreModulesClassProvider(name);
#endif
}

- (nullable id<RCTModuleProvider>)getModuleProvider:(const char *)name
{
  if ([_delegate respondsToSelector:@selector(getModuleProvider:)]) {
    return [_delegate getModuleProvider:name];
  }
  return nil;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
                                                      jsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker
{
  if ([_delegate respondsToSelector:@selector(getTurboModule:jsInvoker:)]) {
    return [_delegate getTurboModule:name jsInvoker:jsInvoker];
  }

  return facebook::react::DefaultTurboModules::getTurboModule(name, jsInvoker);
}

- (id<RCTTurboModule>)getModuleInstanceFromClass:(Class)moduleClass
{
  return RCTAppSetupDefaultModuleFromClass(moduleClass, self.delegate.dependencyProvider);
}

- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge
{
  if ([_delegate respondsToSelector:@selector(extraModulesForBridge:)]) {
    return [_delegate extraModulesForBridge:bridge];
  }

  return @[];
}

#pragma mark - RCTComponentViewFactoryComponentProvider

- (NSDictionary<NSString *, Class<RCTComponentViewProtocol>> *)thirdPartyFabricComponents
{
  if ([_delegate respondsToSelector:@selector(thirdPartyFabricComponents)]) {
    return _delegate.thirdPartyFabricComponents;
  }

  return self.delegate.dependencyProvider ? self.delegate.dependencyProvider.thirdPartyFabricComponents : @{};
}

#pragma mark - RCTHostDelegate

- (void)hostDidStart:(RCTHost *)host
{
  if ([_delegate respondsToSelector:@selector(hostDidStart:)]) {
    [_delegate hostDidStart:host];
  }
}

- (RCTRootViewFactory *)createRCTRootViewFactory
{
  __weak __typeof(self) weakSelf = self;
  RCTBundleURLBlock bundleUrlBlock = ^{
    auto *strongSelf = weakSelf;
    return strongSelf.bundleURL;
  };

  RCTRootViewFactoryConfiguration *configuration =
      [[RCTRootViewFactoryConfiguration alloc] initWithBundleURLBlock:bundleUrlBlock
                                                       newArchEnabled:self.fabricEnabled
                                                   turboModuleEnabled:self.turboModuleEnabled
                                                    bridgelessEnabled:self.bridgelessEnabled];

  configuration.createRootViewWithBridge = ^UIView *(RCTBridge *bridge, NSString *moduleName, NSDictionary *initProps) {
    return [weakSelf.delegate createRootViewWithBridge:bridge moduleName:moduleName initProps:initProps];
  };

  configuration.createBridgeWithDelegate = ^RCTBridge *(id<RCTBridgeDelegate> delegate, NSDictionary *launchOptions) {
    return [weakSelf.delegate createBridgeWithDelegate:delegate launchOptions:launchOptions];
  };

  configuration.customizeRootView = ^(UIView *_Nonnull rootView) {
    [weakSelf.delegate customizeRootView:(RCTRootView *)rootView];
  };

  configuration.sourceURLForBridge = ^NSURL *_Nullable(RCTBridge *_Nonnull bridge)
  {
    return [weakSelf.delegate sourceURLForBridge:bridge];
  };

  if ([self.delegate respondsToSelector:@selector(extraModulesForBridge:)]) {
    configuration.extraModulesForBridge = ^NSArray<id<RCTBridgeModule>> *_Nonnull(RCTBridge *_Nonnull bridge)
    {
      return [weakSelf.delegate extraModulesForBridge:bridge];
    };
  }

  if ([self.delegate respondsToSelector:@selector(extraLazyModuleClassesForBridge:)]) {
    configuration.extraLazyModuleClassesForBridge =
        ^NSDictionary<NSString *, Class> *_Nonnull(RCTBridge *_Nonnull bridge)
    {
      return [weakSelf.delegate extraLazyModuleClassesForBridge:bridge];
    };
  }

  if ([self.delegate respondsToSelector:@selector(bridge:didNotFindModule:)]) {
    configuration.bridgeDidNotFindModule = ^BOOL(RCTBridge *_Nonnull bridge, NSString *_Nonnull moduleName) {
      return [weakSelf.delegate bridge:bridge didNotFindModule:moduleName];
    };
  }

  if ([self.delegate respondsToSelector:@selector(loadSourceForBridge:onProgress:onComplete:)]) {
    configuration.loadSourceForBridgeWithProgress =
        ^(RCTBridge *_Nonnull bridge,
          RCTSourceLoadProgressBlock _Nonnull onProgress,
          RCTSourceLoadBlock _Nonnull loadCallback) {
          [weakSelf.delegate loadSourceForBridge:bridge onProgress:onProgress onComplete:loadCallback];
        };
  }

  if ([self.delegate respondsToSelector:@selector(loadSourceForBridge:withBlock:)]) {
    configuration.loadSourceForBridge = ^(RCTBridge *_Nonnull bridge, RCTSourceLoadBlock _Nonnull loadCallback) {
      [weakSelf.delegate loadSourceForBridge:bridge withBlock:loadCallback];
    };
  }

  configuration.jsRuntimeConfiguratorDelegate = self;

  return [[RCTRootViewFactory alloc] initWithTurboModuleDelegate:self hostDelegate:self configuration:configuration];
}

#pragma mark - Feature Flags

class RCTAppDelegateBridgelessFeatureFlags : public ReactNativeFeatureFlagsDefaults {
 public:
  bool enableBridgelessArchitecture() override
  {
    return true;
  }
  bool enableFabricRenderer() override
  {
    return true;
  }
  bool useTurboModules() override
  {
    return true;
  }
  bool useNativeViewConfigsInBridgelessMode() override
  {
    return true;
  }
  bool useShadowNodeStateOnClone() override
  {
    return true;
  }
};

- (void)_setUpFeatureFlags
{
  static dispatch_once_t setupFeatureFlagsToken;
  dispatch_once(&setupFeatureFlagsToken, ^{
    if ([self bridgelessEnabled]) {
      ReactNativeFeatureFlags::override(std::make_unique<RCTAppDelegateBridgelessFeatureFlags>());
    }
  });
}

@end

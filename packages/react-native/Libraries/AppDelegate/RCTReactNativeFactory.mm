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
#if USE_HERMES
#import <ReactCommon/RCTHermesInstance.h>
#else
#import <ReactCommon/RCTJscInstance.h>
#endif
#import <react/nativemodule/defaults/DefaultTurboModules.h>

#import "RCTDependencyProvider.h"

using namespace facebook::react;

@interface RCTReactNativeFactory () <
    RCTComponentViewFactoryComponentProvider,
    RCTHostDelegate,
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
};

- (void)_setUpFeatureFlags
{
  if ([self bridgelessEnabled]) {
    ReactNativeFeatureFlags::override(std::make_unique<RCTAppDelegateBridgelessFeatureFlags>());
  }
}

@end

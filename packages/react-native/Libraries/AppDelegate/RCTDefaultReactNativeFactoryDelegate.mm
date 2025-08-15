/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTDefaultReactNativeFactoryDelegate.h"
#import <ReactCommon/RCTHost.h>
#import "RCTAppSetupUtils.h"
#import "RCTDependencyProvider.h"
#if USE_THIRD_PARTY_JSC != 1
#import <React/RCTHermesInstanceFactory.h>
#endif

#import <react/nativemodule/defaults/DefaultTurboModules.h>

@implementation RCTDefaultReactNativeFactoryDelegate

@synthesize dependencyProvider;

- (NSURL *_Nullable)sourceURLForBridge:(nonnull RCTBridge *)bridge
{
  [NSException raise:@"RCTBridgeDelegate::sourceURLForBridge not implemented"
              format:@"Subclasses must implement a valid sourceURLForBridge method"];
  return nil;
}

- (UIViewController *)createRootViewController
{
  return [UIViewController new];
}

- (RCTBridge *)createBridgeWithDelegate:(id<RCTBridgeDelegate>)delegate launchOptions:(NSDictionary *)launchOptions
{
  return [[RCTBridge alloc] initWithDelegate:delegate launchOptions:launchOptions];
}

- (void)setRootView:(UIView *)rootView toRootViewController:(UIViewController *)rootViewController
{
  rootViewController.view = rootView;
}

- (JSRuntimeFactoryRef)createJSRuntimeFactory
{
#if USE_THIRD_PARTY_JSC != 1
  return jsrt_create_hermes_factory();
#endif
}

- (void)customizeRootView:(RCTRootView *)rootView
{
  // Override point for customization after application launch.
}

- (UIView *)createRootViewWithBridge:(RCTBridge *)bridge
                          moduleName:(NSString *)moduleName
                           initProps:(NSDictionary *)initProps
{
  UIView *rootView = RCTAppSetupDefaultRootView(bridge, moduleName, initProps, YES);

  rootView.backgroundColor = [UIColor systemBackgroundColor];

  return rootView;
}

- (RCTColorSpace)defaultColorSpace
{
  return RCTColorSpaceSRGB;
}

- (NSURL *_Nullable)bundleURL
{
  [NSException raise:@"RCTAppDelegate::bundleURL not implemented"
              format:@"Subclasses must implement a valid getBundleURL method"];
  return nullptr;
}

- (NSDictionary<NSString *, Class<RCTComponentViewProtocol>> *)thirdPartyFabricComponents
{
  return self.dependencyProvider ? self.dependencyProvider.thirdPartyFabricComponents : @{};
}

- (void)hostDidStart:(RCTHost *)host
{
}

- (NSArray<NSString *> *)unstableModulesRequiringMainQueueSetup
{
  return self.dependencyProvider ? RCTAppSetupUnstableModulesRequiringMainQueueSetup(self.dependencyProvider) : @[];
}

- (nullable id<RCTModuleProvider>)getModuleProvider:(const char *)name
{
  NSString *providerName = [NSString stringWithCString:name encoding:NSUTF8StringEncoding];
  return self.dependencyProvider ? self.dependencyProvider.moduleProviders[providerName] : nullptr;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
                                                      jsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker
{
  return facebook::react::DefaultTurboModules::getTurboModule(name, jsInvoker);
}

#pragma mark - RCTArchConfiguratorProtocol

- (BOOL)newArchEnabled
{
  return YES;
}

- (BOOL)bridgelessEnabled
{
  return YES;
}

- (BOOL)fabricEnabled
{
  return YES;
}

- (BOOL)turboModuleEnabled
{
  return YES;
}

- (Class)getModuleClassFromName:(const char *)name
{
  return nullptr;
}

- (id<RCTTurboModule>)getModuleInstanceFromClass:(Class)moduleClass
{
  return nullptr;
}

- (void)loadSourceForBridge:(RCTBridge *)bridge
                 onProgress:(RCTSourceLoadProgressBlock)onProgress
                 onComplete:(RCTSourceLoadBlock)loadCallback
{
  [RCTJavaScriptLoader loadBundleAtURL:[self sourceURLForBridge:bridge] onProgress:onProgress onComplete:loadCallback];
}

@end

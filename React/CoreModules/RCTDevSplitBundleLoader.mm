/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTDevSplitBundleLoader.h>

#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTConvert.h>
#import <React/RCTDefines.h>
#import <React/RCTDevSettings.h>
#import <React/RCTUtils.h>

#import "CoreModulesPlugins.h"

using namespace facebook::react;

@interface RCTDevSplitBundleLoader () <NativeDevSplitBundleLoaderSpec>
@end

#if RCT_DEV_MENU

@implementation RCTDevSplitBundleLoader

@synthesize bridge = _bridge;
@synthesize loadScript = _loadScript;
@synthesize turboModuleRegistry = _turboModuleRegistry;

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (void)setBridge:(RCTBridge *)bridge
{
  _bridge = bridge;
}

RCT_EXPORT_METHOD(loadBundle
                  : (NSString *)bundlePath resolve
                  : (RCTPromiseResolveBlock)resolve reject
                  : (RCTPromiseRejectBlock)reject)
{
  NSURL *sourceURL = [[RCTBundleURLProvider sharedSettings] jsBundleURLForSplitBundleRoot:bundlePath];
  if (_bridge) {
    [_bridge loadAndExecuteSplitBundleURL:sourceURL
        onError:^(NSError *error) {
          reject(@"E_BUNDLE_LOAD_ERROR", [error localizedDescription], error);
        }
        onComplete:^() {
          resolve(@YES);
        }];
  } else {
    __weak __typeof(self) weakSelf = self;
    [RCTJavaScriptLoader loadBundleAtURL:sourceURL
        onProgress:^(RCTLoadingProgress *progressData) {
          // TODO: Setup loading bar.
        }
        onComplete:^(NSError *error, RCTSource *source) {
          if (error) {
            reject(@"E_BUNDLE_LOAD_ERROR", [error localizedDescription], error);
            return;
          }
          __typeof(self) strongSelf = weakSelf;
          strongSelf->_loadScript(source);
          RCTDevSettings *devSettings = [strongSelf->_turboModuleRegistry moduleForName:"RCTDevSettings"];
          [devSettings setupHMRClientWithAdditionalBundleURL:source.url];
          resolve(@YES);
        }];
  }
}

- (std::shared_ptr<TurboModule>)getTurboModule:(const ObjCTurboModule::InitParams &)params
{
  return std::make_shared<NativeDevSplitBundleLoaderSpecJSI>(params);
}

@end

#else

@implementation RCTDevSplitBundleLoader

@synthesize loadScript = _loadScript;

+ (NSString *)moduleName
{
  return nil;
}
- (void)loadBundle:(NSString *)bundlePath resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;
{
}
- (std::shared_ptr<TurboModule>)getTurboModule:(const ObjCTurboModule::InitParams &)params
{
  return std::make_shared<NativeDevSplitBundleLoaderSpecJSI>(params);
}

@end

#endif

Class RCTDevSplitBundleLoaderCls(void)
{
  return RCTDevSplitBundleLoader.class;
}

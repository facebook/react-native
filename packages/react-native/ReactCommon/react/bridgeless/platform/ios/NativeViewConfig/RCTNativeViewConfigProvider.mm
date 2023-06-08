/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RCTNativeViewConfigProvider.h"

#import <React/RCTBridge+Private.h>
#import <React/RCTComponentData.h>
#import <React/RCTUIManager.h>
#import <React/RCTViewManager.h>
#import <ReactCommon/RCTTurboModule.h>
#import <react/bridgeless/nativeviewconfig/NativeViewConfigProviderBinding.h>

namespace facebook::react {
namespace {

// This function eagerly loads module constants for every RCTViewManager subclass.
// This is not compatible with lazily loaded modules, but we don't have them in OSS, so that's fine for now.
NSDictionary<NSString *, NSObject *> *eagerViewConfigs()
{
  static NSMutableDictionary<NSString *, NSObject *> *result = [NSMutableDictionary new];
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    auto directEvents = [NSMutableDictionary new];
    auto bubblingEvents = [NSMutableDictionary new];
    for (Class moduleClass in RCTGetModuleClasses()) {
      if ([moduleClass isSubclassOfClass:RCTViewManager.class]) {
        auto name = RCTViewManagerModuleNameForClass(moduleClass);
        auto viewConfig = [RCTComponentData viewConfigForViewMangerClass:moduleClass];
        auto moduleConstants =
            RCTModuleConstantsForDestructuredComponent(directEvents, bubblingEvents, moduleClass, name, viewConfig);
        result[name] = moduleConstants;
      }
    }
  });
  return result;
}

jsi::Value provideNativeViewConfig(facebook::jsi::Runtime &runtime, std::string const &name)
{
  auto componentName = [NSString stringWithCString:name.c_str() encoding:NSASCIIStringEncoding];
  auto viewConfig = eagerViewConfigs()[componentName];
  return TurboModuleConvertUtils::convertObjCObjectToJSIValue(runtime, viewConfig);
};

} // namespace

void installNativeViewConfigProviderBinding(jsi::Runtime &runtime)
{
  auto nativeViewConfigProvider = [&runtime](std::string const &name) -> jsi::Value {
    return provideNativeViewConfig(runtime, name);
  };
  NativeViewConfigProviderBinding::install(runtime, std::move(nativeViewConfigProvider));
}
} // namespace facebook::react

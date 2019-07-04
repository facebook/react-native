/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifndef RN_DISABLE_OSS_PLUGIN_HEADER

// OSS-compatibility layer: manually define these for github.
// TODO: This should be codegen'ed

#import "CoreModulesPlugins.h"

#import <string>
#import <unordered_map>

static std::unordered_map<std::string, Class (*)(void)> sCoreModuleClassMap = {
  // NOTE: Sync these with FB internal plugin definitions.
  {"PlatformConstants", RCTPlatformCls},
};

Class RCTCoreModulesClassProvider(const char *name) {
  auto p = sCoreModuleClassMap.find(name);
  if (p != sCoreModuleClassMap.end()) {
    auto classFunc = p->second;
    return classFunc();
  }
  return nil;
}

#endif // RN_DISABLE_OSS_PLUGIN_HEADER

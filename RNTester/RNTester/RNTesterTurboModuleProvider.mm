/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

#import "RNTesterTurboModuleProvider.h"

#import <React/CoreModulesPlugins.h>
#import <ReactCommon/SampleTurboCxxModule.h>
#import <ReactCommon/RCTSampleTurboModule.h>

// NOTE: This entire file should be codegen'ed.

namespace facebook {
namespace react {

Class RNTesterTurboModuleClassProvider(const char *name) {
  return RCTCoreModulesClassProvider(name);
}

std::shared_ptr<TurboModule> RNTesterTurboModuleProvider(const std::string &name, std::shared_ptr<JSCallInvoker> jsInvoker) {
  if (name == "SampleTurboCxxModule") {
    return std::make_shared<SampleTurboCxxModule>(jsInvoker);
  }

  return nullptr;
}

std::shared_ptr<TurboModule> RNTesterTurboModuleProvider(const std::string &name,
                                                         id<RCTTurboModule> instance,
                                                         std::shared_ptr<JSCallInvoker> jsInvoker) {
  if (name == "SampleTurboModule") {
    return std::make_shared<NativeSampleTurboModuleSpecJSI>(instance, jsInvoker);
  }

  return nullptr;
}

} // namespace react
} // namespace facebook

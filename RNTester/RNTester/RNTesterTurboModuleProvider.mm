/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

#ifdef RN_TURBO_MODULE_ENABLED

#import "RNTesterTurboModuleProvider.h"

#import <jsireact/RCTSampleTurboCxxModule.h>
#import <jsireact/RCTSampleTurboModule.h>

// NOTE: This entire file should be codegen'ed.

namespace facebook {
namespace react {

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

#endif

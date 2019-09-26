/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

#ifdef RN_TURBO_MODULE_ENABLED

#import <jsireact/RCTTurboModule.h>

namespace facebook {
namespace react {

/**
 * Provide a pure C++ instance of a TurboModule, specific to this app.
 */
std::shared_ptr<TurboModule> RNTesterTurboModuleProvider(const std::string &name, std::shared_ptr<JSCallInvoker> jsInvoker);

/**
 * Provide an instance of a ObjCTurboModule, given the ObjC instance, specific to this app.
 */
std::shared_ptr<TurboModule> RNTesterTurboModuleProvider(const std::string &name,
                                                         id<RCTTurboModule> instance,
                                                         std::shared_ptr<JSCallInvoker> jsInvoker);

} // namespace react
} // namespace facebook

#endif

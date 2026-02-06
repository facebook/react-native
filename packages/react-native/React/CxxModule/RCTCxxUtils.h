/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <functional>
#include <memory>

#import <Foundation/Foundation.h>

@class RCTBridge;
@class RCTModuleData;

namespace facebook::react {

class Instance;
class NativeModule;

#ifndef RCT_REMOVE_LEGACY_ARCH

[[deprecated("This API will be removed along with the legacy architecture.")]]
std::vector<std::unique_ptr<NativeModule>>
createNativeModules(NSArray<RCTModuleData *> *modules, RCTBridge *bridge, const std::shared_ptr<Instance> &instance);

#endif // RCT_REMOVE_LEGACY_ARCH

NSError *tryAndReturnError(const std::function<void()> &func);
NSString *deriveSourceURL(NSURL *url);

} // namespace facebook::react

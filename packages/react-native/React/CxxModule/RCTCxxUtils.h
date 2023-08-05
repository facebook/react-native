/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifdef __cplusplus

#include <functional>
#include <memory>

#import <Foundation/Foundation.h>

@class RCTBridge;
@class RCTModuleData;

namespace facebook::react {

class Instance;
class NativeModule;

std::vector<std::unique_ptr<NativeModule>>
createNativeModules(NSArray<RCTModuleData *> *modules, RCTBridge *bridge, const std::shared_ptr<Instance> &instance);

NSError *tryAndReturnError(const std::function<void()> &func);
NSString *deriveSourceURL(NSURL *url);

} // namespace facebook::react

#endif // __cplusplus

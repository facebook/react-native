/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cassert>
#include <string>
#include <unordered_map>

#include <jsi/jsi.h>

#include <ReactCommon/CallInvoker.h>
#include <ReactCommon/CallbackWrapper.h>
#include <ReactCommon/TurboModule.h>

namespace facebook::react {

std::unordered_map<
    std::string,
    std::function<
        std::shared_ptr<TurboModule>(std::shared_ptr<CallInvoker> jsInvoker)>>&
cxxTurboModuleMap();

void registerCxxModule(
    std::string name,
    std::function<std::shared_ptr<TurboModule>(
        std::shared_ptr<CallInvoker> jsInvoker)> moduleProviderFunc);

} // namespace facebook::react

#define RCT_EXPORT_CXX_MODULE_EXPERIMENTAL(name)                           \
  _Pragma("clang diagnostic push")                                         \
      _Pragma("clang diagnostic ignored \"-Wglobal-constructors\"") struct \
      name##Load {                                                         \
    name##Load() {                                                         \
      facebook::react::registerCxxModule(                                  \
          #name,                                                           \
          [&](std::shared_ptr<facebook::react::CallInvoker> jsInvoker) {   \
            return std::make_shared<facebook::react::name>(jsInvoker);     \
          });                                                              \
    }                                                                      \
  };                                                                       \
  static name##Load _##name##Load;                                \
  _Pragma("clang diagnostic pop")

// RCT_EXPORT_CXX_MODULE(NativeCxxModuleExample) turns into the following:
// #pragma clang diagnostic push
// #pragma clang diagnostic ignored "-Wglobal-constructors"
// struct NativeCxxModuleExampleLoad {
//   NativeCxxModuleExampleLoad() {
//       facebook::react::registerCxxModule(name,
//       [&](std::shared_ptr<facebook::react::CallInvoker> jsInvoker) {
//         return
//         std::make_shared<facebook::react::NativeCxxModuleExample>(jsInvoker);
//     });
//   }
// };
// constexpr static NativeCxxModuleExampleLoad nativeCxxModuleExampleLoad;
// #pragma clang diagnostic pop

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>
#include <unordered_map>

#include <ReactCommon/CallInvoker.h>
#include <ReactCommon/TurboModule.h>

namespace facebook::react {

std::unordered_map<
    std::string,
    std::function<
        std::shared_ptr<TurboModule>(std::shared_ptr<CallInvoker> jsInvoker)>>&
globalExportedCxxTurboModuleMap();

void registerCxxModuleToGlobalModuleMap(
    std::string name,
    std::function<std::shared_ptr<TurboModule>(
        std::shared_ptr<CallInvoker> jsInvoker)> moduleProviderFunc);

} // namespace facebook::react

/*
 * You can use this macro to register your C++ TurboModule in your .cpp
 * implementation if you do not have access to getTurboModule:jsInvoker:
 * callback. This will register the module before main() is called,
 * so it will incur a startup cost.
 *
 * RCT_EXPORT_CXX_MODULE_EXPERIMENTAL(ModuleExample) becomes:
 *
 * #pragma clang diagnostic push
 * #pragma clang diagnostic ignored "-Wglobal-constructors"
 * struct ModuleExampleLoad {
 *   ModuleExampleLoad() {
 *     facebook::react::registerCxxModule(name,
 *       [&](std::shared_ptr<facebook::react::CallInvoker> jsInvoker) {
 *         return
 *         std::make_shared<facebook::react::ModuleExample>(jsInvoker);
 *      });
 *   }
 * };
 * static ModuleExampleLoad moduleExampleLoad;
 * #pragma clang diagnostic pop
 *
 */
#define RCT_EXPORT_CXX_MODULE_EXPERIMENTAL(name)                           \
  _Pragma("clang diagnostic push")                                         \
      _Pragma("clang diagnostic ignored \"-Wglobal-constructors\"") struct \
      name##Load {                                                         \
    name##Load() {                                                         \
      facebook::react::registerCxxModuleToGlobalModuleMap(                 \
          #name,                                                           \
          [&](std::shared_ptr<facebook::react::CallInvoker> jsInvoker) {   \
            return std::make_shared<facebook::react::name>(jsInvoker);     \
          });                                                              \
    }                                                                      \
  };                                                                       \
  static name##Load _##name##Load;                                         \
  _Pragma("clang diagnostic pop")

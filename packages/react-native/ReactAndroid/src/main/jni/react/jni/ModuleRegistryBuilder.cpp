/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ModuleRegistryBuilder.h"

#include <glog/logging.h>
#include <memory>
#include <string>

#include <cxxreact/CxxNativeModule.h>

#ifndef RCT_REMOVE_LEGACY_ARCH

namespace facebook::react {

std::string ModuleHolder::getName() const {
  static auto method = getClass()->getMethod<jstring()>("getName");
  return method(self())->toStdString();
}

xplat::module::CxxModule::Provider ModuleHolder::getProvider(
    const std::string& moduleName) const {
  return [self = jni::make_global(self()), moduleName] { return nullptr; };
}

std::vector<std::unique_ptr<NativeModule>> buildNativeModuleList(
    std::weak_ptr<Instance> winstance,
    jni::alias_ref<jni::JCollection<JavaModuleWrapper::javaobject>::javaobject>
        javaModules,
    std::shared_ptr<MessageQueueThread> moduleMessageQueue) {
  std::vector<std::unique_ptr<NativeModule>> modules;
  if (javaModules) {
    for (const auto& jm : *javaModules) {
      modules.emplace_back(
          std::make_unique<JavaNativeModule>(
              winstance, jm, moduleMessageQueue));
    }
  }
  return modules;
}

} // namespace facebook::react

#endif

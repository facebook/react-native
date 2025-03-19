/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "DevToolsRuntimeSettingsModule.h"
#include "Plugins.h"

std::shared_ptr<facebook::react::TurboModule>
ReactDevToolsRuntimeSettingsModuleProvider(
    std::shared_ptr<facebook::react::CallInvoker> jsInvoker) {
  return std::make_shared<facebook::react::DevToolsRuntimeSettingsModule>(
      std::move(jsInvoker));
}

namespace facebook::react {

DevToolsRuntimeSettingsModule::DevToolsRuntimeSettingsModule(
    std::shared_ptr<CallInvoker> jsInvoker)
    : NativeReactDevToolsRuntimeSettingsModuleCxxSpec(std::move(jsInvoker)) {}

void DevToolsRuntimeSettingsModule::setReloadAndProfileConfig(
    jsi::Runtime& /*rt*/,
    NativePartialReloadAndProfileConfig config) {
  DevToolsRuntimeSettings::getInstance().setReloadAndProfileConfig(config);
};

NativeReloadAndProfileConfig
DevToolsRuntimeSettingsModule::getReloadAndProfileConfig(jsi::Runtime& /*rt*/) {
  return DevToolsRuntimeSettings::getInstance().getReloadAndProfileConfig();
};

} // namespace facebook::react

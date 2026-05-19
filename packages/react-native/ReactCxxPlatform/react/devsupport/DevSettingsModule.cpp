/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "DevSettingsModule.h"

#include <glog/logging.h>

namespace facebook::react {

void DevSettingsModule::reload(jsi::Runtime& /*rt*/) {
  LOG(INFO) << "DevSettingsModule::reload";
  if (liveReloadCallback_) {
    liveReloadCallback_();
  }
}

void DevSettingsModule::reloadWithReason(
    jsi::Runtime& /*rt*/,
    const std::string& reason) {
  LOG(INFO) << "DevSettingsModule::reloadWithReason: " << reason;
  if (liveReloadCallback_) {
    liveReloadCallback_();
  }
}

void DevSettingsModule::onFastRefresh(jsi::Runtime& /*rt*/) {
  LOG(INFO) << "DevSettingsModule::onFastRefresh";
}

void DevSettingsModule::setHotLoadingEnabled(
    jsi::Runtime& /*rt*/,
    bool isHotLoadingEnabled) {
  LOG(INFO) << "DevSettingsModule::setHotLoadingEnabled: "
            << (int)isHotLoadingEnabled;
}

void DevSettingsModule::setIsDebuggingRemotely(
    jsi::Runtime& /*rt*/,
    bool /*isDebuggingRemotelyEnabled*/) {}

void DevSettingsModule::setProfilingEnabled(
    jsi::Runtime& /*rt*/,
    bool /*isProfilingEnabled*/) {}

void DevSettingsModule::toggleElementInspector(jsi::Runtime& rt) {}

void DevSettingsModule::addMenuItem(
    jsi::Runtime& /*rt*/,
    const std::string& /*title*/) {}

void DevSettingsModule::setIsShakeToShowDevMenuEnabled(
    jsi::Runtime& /*rt*/,
    bool /*enabled*/) {}

void DevSettingsModule::openDebugger(jsi::Runtime& /*rt*/) {
  if (auto devServerHelper = devServerHelper_.lock()) {
    devServerHelper->openDebugger();
  }
}

void DevSettingsModule::addListener(
    jsi::Runtime& /*rt*/,
    const std::string& /*eventName*/) {
  // noop
}

void DevSettingsModule::removeListeners(
    jsi::Runtime& /*rt*/,
    double /*count*/) {
  // noop
}

} // namespace facebook::react

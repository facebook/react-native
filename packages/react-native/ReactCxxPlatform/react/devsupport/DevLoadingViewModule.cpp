/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "DevLoadingViewModule.h"

namespace facebook::react {

const int32_t DEFAULT_TEXT_COLOR = 0xFFFFFFFF;
const int32_t DEFAULT_BACKGROUND_COLOR = 0xFF2584E8;

DevLoadingViewModule::DevLoadingViewModule(
    std::shared_ptr<CallInvoker> jsInvoker,
    std::weak_ptr<IDevUIDelegate> devUIDelegate)
    : NativeDevLoadingViewCxxSpec(jsInvoker),
      devUIDelegate_(std::move(devUIDelegate)) {}

DevLoadingViewModule::~DevLoadingViewModule() {
  if (auto devUIDelegate = devUIDelegate_.lock()) {
    devUIDelegate->hideLoadingView();
  }
}

void DevLoadingViewModule::showMessage(
    jsi::Runtime& /*rt*/,
    const std::string& message,
    std::optional<int32_t> textColor,
    std::optional<int32_t> backgroundColor) {
  if (auto devUIDelegate = devUIDelegate_.lock()) {
    devUIDelegate->showLoadingView(
        message,
        SharedColor{textColor.value_or(DEFAULT_TEXT_COLOR)},
        SharedColor{backgroundColor.value_or(DEFAULT_BACKGROUND_COLOR)});
  }
}

void DevLoadingViewModule::hide(jsi::Runtime& /*rt*/) {
  if (auto devUIDelegate = devUIDelegate_.lock()) {
    devUIDelegate->hideLoadingView();
  }
}

} // namespace facebook::react

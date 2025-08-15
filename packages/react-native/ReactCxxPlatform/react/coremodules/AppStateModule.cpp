/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AppStateModule.h"

namespace facebook::react {

AppStateConstants AppStateModule::getConstants(jsi::Runtime& /*rt*/) {
  // TODO: T160890586 Wire up AppState implementation to use real data
  return AppStateConstants{.initialAppState = ""};
}

void AppStateModule::getCurrentAppState(
    jsi::Runtime& /*rt*/,
    const AsyncCallback<AppState>& /*success*/,
    jsi::Function /*error*/) {}

void AppStateModule::addListener(
    jsi::Runtime& /*rt*/,
    const std::string& /*eventName*/) {}

void AppStateModule::removeListeners(jsi::Runtime& /*rt*/, double /*count*/) {}

} // namespace facebook::react

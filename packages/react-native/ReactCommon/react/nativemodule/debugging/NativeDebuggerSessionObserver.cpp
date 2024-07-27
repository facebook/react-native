/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NativeDebuggerSessionObserver.h"
#include <jsinspector-modern/HostTargetSessionObserver.h>

#include "Plugins.h"

std::shared_ptr<facebook::react::TurboModule>
NativeDebuggerSessionObserverModuleProvider(
    std::shared_ptr<facebook::react::CallInvoker> jsInvoker) {
  return std::make_shared<facebook::react::NativeDebuggerSessionObserver>(
      std::move(jsInvoker));
}

namespace facebook::react {

NativeDebuggerSessionObserver::NativeDebuggerSessionObserver(
    std::shared_ptr<CallInvoker> jsInvoker)
    : NativeDebuggerSessionObserverCxxSpec(std::move(jsInvoker)) {}

bool NativeDebuggerSessionObserver::hasActiveSession(
    jsi::Runtime& /*runtime*/) {
  return jsinspector_modern::HostTargetSessionObserver::getInstance()
      .hasActiveSessions();
}

std::function<void()> NativeDebuggerSessionObserver::subscribe(
    jsi::Runtime& /*runtime*/,
    AsyncCallback<bool> callback) {
  return jsinspector_modern::HostTargetSessionObserver::getInstance().subscribe(
      [callback = std::move(callback)](bool sessionStatus) {
        callback(sessionStatus);
      });
}

} // namespace facebook::react

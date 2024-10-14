/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "BindingsInstallerHolder.h"

#include <utility>

namespace facebook::react {

BindingsInstallerHolder::BindingsInstallerHolder(
    BindingsInstallFunc bindingsInstaller)
    : bindingsInstaller_(std::move(bindingsInstaller)) {}

BindingsInstallerHolder::BindingsInstallerHolder(
    std::function<void(jsi::Runtime& runtime)> oldBindingsInstaller)
    : bindingsInstaller_(
          [f = std::move(oldBindingsInstaller)](
              jsi::Runtime& runtime,
              const std::shared_ptr<CallInvoker>&) { f(runtime); }) {}

void BindingsInstallerHolder::installBindings(
    jsi::Runtime& runtime,
    const std::shared_ptr<CallInvoker>& callInvoker) {
  bindingsInstaller_(runtime, callInvoker);
}

} // namespace facebook::react

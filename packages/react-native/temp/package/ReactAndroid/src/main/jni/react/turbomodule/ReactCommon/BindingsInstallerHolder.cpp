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
    std::function<void(facebook::jsi::Runtime& runtime)> bindingsInstaller)
    : bindingsInstaller_(std::move(bindingsInstaller)) {}

void BindingsInstallerHolder::installBindings(jsi::Runtime& runtime) {
  bindingsInstaller_(runtime);
}

} // namespace facebook::react

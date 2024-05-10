/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "BindingsInstallerHolder.h"

namespace facebook::react {

BindingsInstallerHolder::BindingsInstallerHolder(
    TurboModule::BindingsInstaller bindingsInstaller)
    : bindingsInstaller_(bindingsInstaller) {}

TurboModule::BindingsInstaller BindingsInstallerHolder::get() {
  return bindingsInstaller_;
}

} // namespace facebook::react

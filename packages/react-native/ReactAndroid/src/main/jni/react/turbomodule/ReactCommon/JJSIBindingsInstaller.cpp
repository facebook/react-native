/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JJSIBindingsInstaller.h"

namespace facebook::react {

JJSIBindingsInstaller::JJSIBindingsInstaller(
    TurboModule::JSIBindingsInstaller jsiBindingsInstaller)
    : jsiBindingsInstaller_(jsiBindingsInstaller) {}

TurboModule::JSIBindingsInstaller JJSIBindingsInstaller::get() {
  return jsiBindingsInstaller_;
}

} // namespace facebook::react

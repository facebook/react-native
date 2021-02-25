/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsireact/JSIExecutor.h>

namespace facebook {
namespace react {

/**
 * Creates a lambda used to bind a JSIRuntime in the context of
 * Apple platforms, such as console logging, performance metrics, etc.
 */
JSIExecutor::RuntimeInstaller RCTJSIExecutorRuntimeInstaller(
    JSIExecutor::RuntimeInstaller runtimeInstallerToWrap);

} // namespace react
} // namespace facebook

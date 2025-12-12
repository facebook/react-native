/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifndef RCT_REMOVE_LEGACY_ARCH

#include <jsireact/JSIExecutor.h>

namespace facebook::react {

/**
 * Creates a lambda used to bind a JSIRuntime in the context of
 * Apple platforms, such as console logging, performance metrics, etc.
 */
[[deprecated("This API will be removed along with the legacy architecture.")]]
JSIExecutor::RuntimeInstaller RCTJSIExecutorRuntimeInstaller(JSIExecutor::RuntimeInstaller runtimeInstallerToWrap);

} // namespace facebook::react

#endif // RCT_REMOVE_LEGACY_ARCH

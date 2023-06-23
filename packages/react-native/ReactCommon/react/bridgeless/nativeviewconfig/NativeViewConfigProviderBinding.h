/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsi/jsi.h>

namespace facebook::react::NativeViewConfigProviderBinding {

using ProviderType = std::function<jsi::Value(const std::string &name)>;

/*
 * Installs native view config provider into JavaScript runtime.
 */
void install(jsi::Runtime &runtime, ProviderType &&provider);
} // namespace facebook::react::NativeViewConfigProviderBinding

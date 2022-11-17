/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsi/jsi.h>

namespace facebook::react {

jsi::Value callMethodOfModule(
    jsi::Runtime &runtime,
    std::string const &moduleName,
    std::string const &methodName,
    std::initializer_list<jsi::Value> args);

} // namespace facebook::react

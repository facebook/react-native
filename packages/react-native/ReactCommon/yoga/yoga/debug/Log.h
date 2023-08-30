/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <yoga/YGEnums.h>
#include <yoga/node/Node.h>
#include <yoga/config/Config.h>

namespace facebook::yoga {

void log(
    yoga::Node* node,
    YGLogLevel level,
    void*,
    const char* message,
    ...) noexcept;

void log(
    yoga::Config* config,
    YGLogLevel level,
    void*,
    const char* format,
    ...) noexcept;

} // namespace facebook::yoga

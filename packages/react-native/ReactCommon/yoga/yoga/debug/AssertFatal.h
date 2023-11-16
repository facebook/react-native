/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <yoga/Yoga.h>
#include <yoga/config/Config.h>
#include <yoga/node/Node.h>

namespace facebook::yoga {

[[noreturn]] void fatalWithMessage(const char* message);

void assertFatal(bool condition, const char* message);
void assertFatalWithNode(
    const yoga::Node* node,
    bool condition,
    const char* message);
void assertFatalWithConfig(
    const yoga::Config* config,
    bool condition,
    const char* message);

} // namespace facebook::yoga

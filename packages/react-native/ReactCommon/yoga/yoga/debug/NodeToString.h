/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifdef DEBUG

#pragma once

#include <string>

#include <yoga/Yoga.h>
#include <yoga/node/Node.h>

namespace facebook::yoga {

void nodeToString(
    std::string& str,
    yoga::Node* node,
    YGPrintOptions options,
    uint32_t level);

} // namespace facebook::yoga

#endif

/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifdef DEBUG
#pragma once
#include <string>

#include "Yoga.h"

namespace facebook {
namespace yoga {

void YGNodeToString(
    std::string& str,
    YGNodeRef node,
    YGPrintOptions options,
    uint32_t level);

} // namespace yoga
} // namespace facebook
#endif

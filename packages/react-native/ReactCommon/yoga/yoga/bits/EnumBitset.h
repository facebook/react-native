/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <bitset>
#include <yoga/YGEnums.h>

namespace facebook::yoga {

// std::bitset with one bit for each option defined in YG_ENUM_SEQ_DECL
template <typename Enum>
using EnumBitset = std::bitset<enums::count<Enum>()>;

} // namespace facebook::yoga

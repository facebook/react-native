/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <algorithm>
#include <cmath>
#include <vector>

#include <yoga/Yoga.h>

YG_EXTERN_C_BEGIN

// Deallocates a Yoga Node. Unlike YGNodeFree, does not remove the node from
// its parent or children.
YG_EXPORT void YGNodeDeallocate(YGNodeRef node);

YG_EXTERN_C_END

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <yoga/Yoga.h>
#include <yoga/node/Node.h>

namespace facebook::yoga {

// Calculate baseline represented as an offset from the top edge of the node.
float calculateBaseline(const yoga::Node* node);

// Whether any of the children of this node participate in baseline alignment
bool isBaselineLayout(const yoga::Node* node);

} // namespace facebook::yoga

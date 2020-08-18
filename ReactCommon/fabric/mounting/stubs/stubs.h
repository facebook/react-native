/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/core/ShadowNode.h>
#include "StubView.h"
#include "StubViewTree.h"

namespace facebook {
namespace react {

StubViewTree stubViewTreeFromShadowNode(ShadowNode const &rootShadowNode);

} // namespace react
} // namespace facebook

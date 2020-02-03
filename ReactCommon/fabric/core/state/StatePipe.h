/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>

#include <react/core/StateData.h>
#include <react/core/StateTarget.h>

namespace facebook {
namespace react {

class ShadowNodeFamily;
using SharedShadowNodeFamily = std::shared_ptr<ShadowNodeFamily const>;

using StatePipe = std::function<
    void(const StateData::Shared &data, SharedShadowNodeFamily const &family)>;

} // namespace react
} // namespace facebook

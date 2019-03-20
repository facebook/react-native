/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "StateUpdate.h"

namespace facebook {
namespace react {

std::pair<StateTarget, StateData::Shared> StateUpdate::operator()() const {
  return callback_();
}

} // namespace react
} // namespace facebook

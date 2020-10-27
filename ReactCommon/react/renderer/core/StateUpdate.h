/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>

#include <react/renderer/core/StateData.h>

namespace facebook {
namespace react {

class ShadowNodeFamily;
using SharedShadowNodeFamily = std::shared_ptr<ShadowNodeFamily const>;

class StateUpdate {
 public:
  using Callback =
      std::function<StateData::Shared(StateData::Shared const &data)>;
  using FailureCallback = std::function<void()>;

  SharedShadowNodeFamily family;
  Callback callback;
  FailureCallback failureCallback;
  bool autorepeat;
};

} // namespace react
} // namespace facebook

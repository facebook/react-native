/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#pragma once

#include <react/components/view/ViewEventEmitter.h>

namespace facebook {
namespace react {

class SliderEventEmitter : public ViewEventEmitter {
 public:
  using ViewEventEmitter::ViewEventEmitter;

  void onValueChange(float value) const;
  void onSlidingComplete(float value) const;
};

} // namespace react
} // namespace facebook

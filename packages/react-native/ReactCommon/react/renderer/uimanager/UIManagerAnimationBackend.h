/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/view/BaseViewProps.h>
#include <react/renderer/core/ShadowNodeFamily.h>

namespace facebook::react {

class UIManagerAnimationBackend {
 public:
  virtual ~UIManagerAnimationBackend() = default;

  virtual void onAnimationFrame(double timestamp) = 0;
  // TODO: T240293839 Move over start() function and mutation types
  virtual void stop(bool isAsync) = 0;
};

} // namespace facebook::react

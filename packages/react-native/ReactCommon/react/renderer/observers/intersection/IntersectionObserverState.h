/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/graphics/Float.h>

namespace {
enum class IntersectionObserverStateType {
  Initial,
  NotIntersecting,
  Intersecting,
};
}

namespace facebook::react {

class IntersectionObserverState {
 public:
  static IntersectionObserverState Initial();
  static IntersectionObserverState NotIntersecting();
  static IntersectionObserverState Intersecting(Float threshold);

  bool isIntersecting() const;

  bool operator==(const IntersectionObserverState& other) const;
  bool operator!=(const IntersectionObserverState& other) const;

 private:
  explicit IntersectionObserverState(IntersectionObserverStateType state);
  IntersectionObserverState(
      IntersectionObserverStateType state,
      Float threshold);

  IntersectionObserverStateType state_;

  // This value is only relevant if the state is
  // IntersectionObserverStateType::Intersecting.
  Float threshold_{};
};

} // namespace facebook::react

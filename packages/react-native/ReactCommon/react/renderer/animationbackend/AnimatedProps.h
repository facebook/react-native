/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once
#include <react/renderer/components/view/BaseViewProps.h>

#include <utility>

namespace facebook::react {

enum PropName { OPACITY, WIDTH, HEIGHT, BORDER_RADII, FLEX, TRANSFORM };

struct AnimatedPropBase {
  PropName propName;
  explicit AnimatedPropBase(PropName propName) : propName(propName) {}
  virtual ~AnimatedPropBase() = default;
};

template <typename T>
struct AnimatedProp : AnimatedPropBase {
  T value;
  AnimatedProp() = default;
  AnimatedProp(PropName propName, const T &value) : AnimatedPropBase{propName}, value(std::move(value)) {}
};

template <typename T>
T get(const std::unique_ptr<AnimatedPropBase> &animatedProp)
{
  return static_cast<AnimatedProp<T> *>(animatedProp.get())->value;
}

struct AnimatedProps {
  std::vector<std::unique_ptr<AnimatedPropBase>> props;
  std::unique_ptr<RawProps> rawProps;
};
} // namespace facebook::react

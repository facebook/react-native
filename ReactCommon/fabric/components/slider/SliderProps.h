/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/components/view/ViewProps.h>
#include <react/graphics/Color.h>

namespace facebook {
namespace react {

// TODO (T28334063): Consider for codegen.
class SliderProps final : public ViewProps {
 public:
  SliderProps() = default;
  SliderProps(const SliderProps &sourceProps, const RawProps &rawProps);

#pragma mark - Props

  const float value{false};
  const float steps{false};
  const bool disabled{false};
  const SharedColor minimumTrackTintColor{};
  const SharedColor maximumTrackTintColor{};

  // Android only
  const SharedColor thumbTintColor;
};

} // namespace react
} // namespace facebook


/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#pragma once

#include <react/components/view/ViewProps.h>
#include <react/graphics/Color.h>
#include <react/imagemanager/primitives.h>

namespace facebook {
namespace react {

enum class ActivityIndicatorViewSize { Small, Large };

static inline void fromRawValue(const RawValue &value, ActivityIndicatorViewSize &result) {
  auto string = (std::string)value;
  if (string == "small") { result = ActivityIndicatorViewSize::Small; return; }
if (string == "large") { result = ActivityIndicatorViewSize::Large; return; }
  abort();
}

static inline std::string toString(const ActivityIndicatorViewSize &value) {
  switch (value) {
    case ActivityIndicatorViewSize::Small: return "small";
case ActivityIndicatorViewSize::Large: return "large";
  }
}

class ActivityIndicatorViewProps final : public ViewProps {
 public:
  ActivityIndicatorViewProps() = default;
  ActivityIndicatorViewProps(const ActivityIndicatorViewProps &sourceProps, const RawProps &rawProps);

#pragma mark - Props

  const bool hidesWhenStopped{false};
const bool animating{false};
const std::string styleAttr{""};
const SharedColor color{};
const ActivityIndicatorViewSize size{ActivityIndicatorViewSize::Small};
const bool intermediate{false};
};

class SwitchProps final : public ViewProps {
 public:
  SwitchProps() = default;
  SwitchProps(const SwitchProps &sourceProps, const RawProps &rawProps);

#pragma mark - Props

  const bool disabled{false};
const bool value{false};
const SharedColor tintColor{};
const SharedColor onTintColor{};
const SharedColor thumbTintColor{};
};

class SliderProps final : public ViewProps {
 public:
  SliderProps() = default;
  SliderProps(const SliderProps &sourceProps, const RawProps &rawProps);

#pragma mark - Props

  const bool disabled{false};
const bool enabled{false};
const ImageSource maximumTrackImage{};
const SharedColor maximumTrackTintColor{};
const Float maximumValue{1.0};
const ImageSource minimumTrackImage{};
const SharedColor minimumTrackTintColor{};
const Float minimumValue{0.0};
const Float step{0.0};
const std::string testID{""};
const ImageSource thumbImage{};
const ImageSource trackImage{};
const SharedColor thumbTintColor{};
const Float value{0.0};
};

} // namespace react
} // namespace facebook

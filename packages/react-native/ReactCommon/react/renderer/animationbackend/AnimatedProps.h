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

enum PropName {
  OPACITY,
  WIDTH,
  HEIGHT,
  BORDER_RADII,
  MARGIN,
  PADDING,
  POSITION,
  FLEX,
  TRANSFORM,
  BACKGROUND_COLOR,
  SHADOW_COLOR,
  SHADOW_OFFSET,
  SHADOW_OPACITY,
  SHADOW_RADIUS
};

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

template <typename T>
T get(const AnimatedPropBase &animatedProp)
{
  return static_cast<const AnimatedProp<T> &>(animatedProp).value;
}

struct AnimatedProps {
  std::vector<std::unique_ptr<AnimatedPropBase>> props;
  std::unique_ptr<RawProps> rawProps;
};

inline void cloneProp(BaseViewProps &viewProps, const AnimatedPropBase &animatedProp)
{
  switch (animatedProp.propName) {
    case OPACITY:
      viewProps.opacity = get<Float>(animatedProp);
      break;

    case WIDTH:
      viewProps.yogaStyle.setDimension(yoga::Dimension::Width, get<yoga::Style::SizeLength>(animatedProp));
      break;

    case HEIGHT:
      viewProps.yogaStyle.setDimension(yoga::Dimension::Height, get<yoga::Style::SizeLength>(animatedProp));
      break;

    case BORDER_RADII:
      viewProps.borderRadii = get<CascadedBorderRadii>(animatedProp);
      break;

    case MARGIN: {
      const auto &margins = get<CascadedRectangleEdges<yoga::StyleLength>>(animatedProp);
      if (margins.left.has_value()) {
        viewProps.yogaStyle.setMargin(yoga::Edge::Left, margins.left.value());
      }
      if (margins.top.has_value()) {
        viewProps.yogaStyle.setMargin(yoga::Edge::Top, margins.top.value());
      }
      if (margins.right.has_value()) {
        viewProps.yogaStyle.setMargin(yoga::Edge::Right, margins.right.value());
      }
      if (margins.bottom.has_value()) {
        viewProps.yogaStyle.setMargin(yoga::Edge::Bottom, margins.bottom.value());
      }
      if (margins.start.has_value()) {
        viewProps.yogaStyle.setMargin(yoga::Edge::Start, margins.start.value());
      }
      if (margins.end.has_value()) {
        viewProps.yogaStyle.setMargin(yoga::Edge::End, margins.end.value());
      }
      if (margins.horizontal.has_value()) {
        viewProps.yogaStyle.setMargin(yoga::Edge::Horizontal, margins.horizontal.value());
      }
      if (margins.vertical.has_value()) {
        viewProps.yogaStyle.setMargin(yoga::Edge::Vertical, margins.vertical.value());
      }
      if (margins.all.has_value()) {
        viewProps.yogaStyle.setMargin(yoga::Edge::All, margins.all.value());
      }
      break;
    }

    case PADDING: {
      const auto &paddings = get<CascadedRectangleEdges<yoga::StyleLength>>(animatedProp);
      if (paddings.left.has_value()) {
        viewProps.yogaStyle.setPadding(yoga::Edge::Left, paddings.left.value());
      }
      if (paddings.top.has_value()) {
        viewProps.yogaStyle.setPadding(yoga::Edge::Top, paddings.top.value());
      }
      if (paddings.right.has_value()) {
        viewProps.yogaStyle.setPadding(yoga::Edge::Right, paddings.right.value());
      }
      if (paddings.bottom.has_value()) {
        viewProps.yogaStyle.setPadding(yoga::Edge::Bottom, paddings.bottom.value());
      }
      if (paddings.start.has_value()) {
        viewProps.yogaStyle.setPadding(yoga::Edge::Start, paddings.start.value());
      }
      if (paddings.end.has_value()) {
        viewProps.yogaStyle.setPadding(yoga::Edge::End, paddings.end.value());
      }
      if (paddings.horizontal.has_value()) {
        viewProps.yogaStyle.setPadding(yoga::Edge::Horizontal, paddings.horizontal.value());
      }
      if (paddings.vertical.has_value()) {
        viewProps.yogaStyle.setPadding(yoga::Edge::Vertical, paddings.vertical.value());
      }
      if (paddings.all.has_value()) {
        viewProps.yogaStyle.setPadding(yoga::Edge::All, paddings.all.value());
      }
      break;
    }

    case POSITION: {
      const auto &positions = get<CascadedRectangleEdges<yoga::StyleLength>>(animatedProp);
      if (positions.left.has_value()) {
        viewProps.yogaStyle.setPosition(yoga::Edge::Left, positions.left.value());
      }
      if (positions.top.has_value()) {
        viewProps.yogaStyle.setPosition(yoga::Edge::Top, positions.top.value());
      }
      if (positions.right.has_value()) {
        viewProps.yogaStyle.setPosition(yoga::Edge::Right, positions.right.value());
      }
      if (positions.bottom.has_value()) {
        viewProps.yogaStyle.setPosition(yoga::Edge::Bottom, positions.bottom.value());
      }
      if (positions.start.has_value()) {
        viewProps.yogaStyle.setPosition(yoga::Edge::Start, positions.start.value());
      }
      if (positions.end.has_value()) {
        viewProps.yogaStyle.setPosition(yoga::Edge::End, positions.end.value());
      }
      if (positions.horizontal.has_value()) {
        viewProps.yogaStyle.setPosition(yoga::Edge::Horizontal, positions.horizontal.value());
      }
      if (positions.vertical.has_value()) {
        viewProps.yogaStyle.setPosition(yoga::Edge::Vertical, positions.vertical.value());
      }
      if (positions.all.has_value()) {
        viewProps.yogaStyle.setPosition(yoga::Edge::All, positions.all.value());
      }
      break;
    }

    case FLEX:
      viewProps.yogaStyle.setFlex(get<yoga::FloatOptional>(animatedProp));
      break;

    case TRANSFORM:
      viewProps.transform = get<Transform>(animatedProp);
      break;

    case BACKGROUND_COLOR:
      viewProps.backgroundColor = get<SharedColor>(animatedProp);
      break;

    case SHADOW_COLOR:
      viewProps.shadowColor = get<SharedColor>(animatedProp);
      break;

    case SHADOW_OFFSET:
      viewProps.shadowOffset = get<Size>(animatedProp);
      break;

    case SHADOW_OPACITY:
      viewProps.shadowOpacity = get<Float>(animatedProp);
      break;

    case SHADOW_RADIUS:
      viewProps.shadowRadius = get<Float>(animatedProp);
      break;

    default:
      break;
  }
}
} // namespace facebook::react

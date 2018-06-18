/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fabric/core/Props.h>
#include <fabric/graphics/Geometry.h>
#include <fabric/graphics/Color.h>
#include <fabric/view/AccessibilityProps.h>
#include <fabric/view/primitives.h>
#include <fabric/view/YogaStylableProps.h>

namespace facebook {
namespace react {

class ViewProps;

using SharedViewProps = std::shared_ptr<const ViewProps>;

class ViewProps:
  public Props,
  public YogaStylableProps,
  public AccessibilityProps {

public:

  ViewProps() = default;
  ViewProps(const YGStyle &yogaStyle);
  ViewProps(const ViewProps &sourceProps, const RawProps &rawProps);

#pragma mark - Props

  // Color
  const Float opacity {1};
  const SharedColor foregroundColor {nullptr};
  const SharedColor backgroundColor {nullptr};

  // Borders
  const EdgeInsets borderWidth {};
  const CornerInsets borderRadius {};
  const SharedColor borderColor {};
  const BorderStyle borderStyle {};

  // Shadow
  const SharedColor shadowColor {nullptr};
  const Size shadowOffset {};
  const Float shadowOpacity {};
  const Float shadowRadius {};

  // Transform
  const Transform transform {};
  const bool backfaceVisibility {false};
  const bool shouldRasterize {false};
  const int zIndex {0};

  // Events
  const PointerEventsMode pointerEvents {};
  const EdgeInsets hitSlop {};

#pragma mark - DebugStringConvertible

  SharedDebugStringConvertibleList getDebugProps() const override;
};

} // namespace react
} // namespace facebook

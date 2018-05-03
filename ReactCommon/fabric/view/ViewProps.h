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
#include <fabric/view/YogaStylableProps.h>
#include <fabric/view/AccessibilityProps.h>

namespace facebook {
namespace react {

class ViewProps;

using SharedViewProps = std::shared_ptr<const ViewProps>;

class ViewProps:
  public Props,
  public YogaStylableProps,
  public AccessibilityProps {

public:
  void apply(const RawProps &rawProps) override;

#pragma mark - Getters

  SharedColor getForegroundColor() const;
  SharedColor getBackgroundColor() const;

#pragma mark - DebugStringConvertible

  SharedDebugStringConvertibleList getDebugProps() const override;

private:
  int zIndex_ {0};
  Float opacity_ {1.0};

  SharedColor foregroundColor_ {nullptr};
  SharedColor backgroundColor_ {nullptr};

  SharedColor shadowColor_ {nullptr};
  Point shadowOffset_ {0, 0};
};

} // namespace react
} // namespace facebook


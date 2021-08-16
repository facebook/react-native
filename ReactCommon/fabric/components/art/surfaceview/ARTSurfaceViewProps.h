/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/components/view/ViewProps.h>
#include <react/core/propsConversions.h>
#include <react/graphics/Color.h>
#include <vector>

namespace facebook {
namespace react {

class ARTSurfaceViewProps final : public ViewProps {
 public:
  ARTSurfaceViewProps() = default;
  ARTSurfaceViewProps(
      ARTSurfaceViewProps const &sourceProps,
      RawProps const &rawProps);

#pragma mark - Props

  SharedColor backgroundColor{};
};

} // namespace react
} // namespace facebook

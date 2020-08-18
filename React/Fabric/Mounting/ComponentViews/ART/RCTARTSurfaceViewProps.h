/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/components/view/ViewProps.h>

namespace facebook {
namespace react {

class RCTARTSurfaceViewProps final : public ViewProps {
 public:
  RCTARTSurfaceViewProps() = default;
  RCTARTSurfaceViewProps(
      const RCTARTSurfaceViewProps &sourceProps,
      const RawProps &rawProps);

#pragma mark - Props
};

} // namespace react
} // namespace facebook

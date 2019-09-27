
// Copyright 2004-present Facebook. All Rights Reserved.

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

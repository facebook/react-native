// Copyright 2004-present Facebook. All Rights Reserved.

#include "RCTARTSurfaceViewProps.h"

#include <react/core/propsConversions.h>

namespace facebook {
namespace react {

RCTARTSurfaceViewProps::RCTARTSurfaceViewProps(
    const RCTARTSurfaceViewProps &sourceProps,
    const RawProps &rawProps)
    : ViewProps(sourceProps, rawProps) {}

} // namespace react
} // namespace facebook

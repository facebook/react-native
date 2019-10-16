/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

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

/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/components/art/ARTSurfaceViewProps.h>
#include <react/core/propsConversions.h>

namespace facebook {
namespace react {

ARTSurfaceViewProps::ARTSurfaceViewProps(
    ARTSurfaceViewProps const &sourceProps,
    RawProps const &rawProps)
    : ViewProps(sourceProps, rawProps),

      backgroundColor(convertRawProp(
          rawProps,
          "backgroundColor",
          sourceProps.backgroundColor,
          {})) {}

} // namespace react
} // namespace facebook

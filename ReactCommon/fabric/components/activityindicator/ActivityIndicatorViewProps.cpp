/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/components/activityindicator/ActivityIndicatorViewProps.h>
#include <react/components/activityindicator/conversions.h>
#include <react/core/propsConversions.h>

namespace facebook {
namespace react {

ActivityIndicatorViewProps::ActivityIndicatorViewProps(
    const ActivityIndicatorViewProps &sourceProps,
    const RawProps &rawProps)
    : ViewProps(sourceProps, rawProps),
      animating(convertRawProp(rawProps, "animating", sourceProps.animating)),
      color(convertRawProp(rawProps, "color", sourceProps.color)),
      hidesWhenStopped(convertRawProp(
          rawProps,
          "hidesWhenStopped",
          sourceProps.hidesWhenStopped)),
      size(convertRawProp(rawProps, "size", sourceProps.size)) {}

} // namespace react
} // namespace facebook

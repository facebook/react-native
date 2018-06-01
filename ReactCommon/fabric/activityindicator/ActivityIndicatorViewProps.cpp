/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <fabric/activityindicator/ActivityIndicatorViewProps.h>
#include <fabric/activityindicator/conversions.h>
#include <fabric/core/propsConversions.h>

namespace facebook {
namespace react {

ActivityIndicatorViewProps::ActivityIndicatorViewProps(const ActivityIndicatorViewProps &sourceProps, const RawProps &rawProps):
  ViewProps(sourceProps, rawProps),
  animating(convertRawProp(rawProps, "animating", sourceProps.animating)),
  color(convertRawProp(rawProps, "color", sourceProps.color)),
  hidesWhenStopped(convertRawProp(rawProps, "hidesWhenStopped", sourceProps.hidesWhenStopped)),
  size(convertRawProp(rawProps, "size", sourceProps.size)) {}

} // namespace react
} // namespace facebook

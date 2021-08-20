/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/components/art/ARTShapeProps.h>
#include <Glog/logging.h>
#include <react/core/propsConversions.h>
#include <react/debug/debugStringConvertibleUtils.h>

namespace facebook {
namespace react {

ARTShapeProps::ARTShapeProps(
    const ARTShapeProps &sourceProps,
    const RawProps &rawProps)
    : Props(sourceProps, rawProps),

      opacity(convertRawProp(rawProps, "opacity", sourceProps.opacity, {1.0})),
      transform(
          convertRawProp(rawProps, "transform", sourceProps.transform, {})),
      d(convertRawProp(rawProps, "d", sourceProps.d, {})),
      stroke(convertRawProp(rawProps, "stroke", sourceProps.stroke, {})),
      strokeDash(
          convertRawProp(rawProps, "strokeDash", sourceProps.strokeDash, {})),
      fill(convertRawProp(rawProps, "fill", sourceProps.fill, {})),
      strokeWidth(convertRawProp(
          rawProps,
          "strokeWidth",
          sourceProps.strokeWidth,
          {1.0})),
      strokeCap(
          convertRawProp(rawProps, "strokeCap", sourceProps.strokeCap, {1})),
      strokeJoin(
          convertRawProp(rawProps, "strokeJoin", sourceProps.strokeJoin, {1})){

      };

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList ARTShapeProps::getDebugProps() const {
  return SharedDebugStringConvertibleList{
      debugStringConvertibleItem("opacity", opacity)};
}
#endif

} // namespace react
} // namespace facebook

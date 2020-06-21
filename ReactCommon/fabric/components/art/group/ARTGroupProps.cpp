/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/components/art/ARTGroupProps.h>
#include <react/core/propsConversions.h>
#include <react/debug/debugStringConvertibleUtils.h>

namespace facebook {
namespace react {

ARTGroupProps::ARTGroupProps(
    const ARTGroupProps &sourceProps,
    const RawProps &rawProps)
    : Props(sourceProps, rawProps),
      opacity(convertRawProp(rawProps, "opacity", sourceProps.opacity, {1.0})),
      transform(
          convertRawProp(rawProps, "transform", sourceProps.transform, {})),
      clipping(
          convertRawProp(rawProps, "clipping", sourceProps.clipping, {})){};

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList ARTGroupProps::getDebugProps() const {
  return SharedDebugStringConvertibleList{
      debugStringConvertibleItem("opacity", opacity)};
}
#endif

} // namespace react
} // namespace facebook

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/components/slider/SliderProps.h>
#include <react/core/propsConversions.h>

namespace facebook {
namespace react {

SliderProps::SliderProps(
    const SliderProps &sourceProps,
    const RawProps &rawProps)
    : ViewProps(sourceProps, rawProps),
      value(convertRawProp(rawProps, "value", sourceProps.value, value)),
      steps(convertRawProp(rawProps, "steps", sourceProps.steps, steps)),
      disabled(
          convertRawProp(rawProps, "disabled", sourceProps.disabled, disabled)),
      minimumTrackTintColor(convertRawProp(
          rawProps,
          "minimumTintColor",
          sourceProps.thumbTintColor,
          thumbTintColor)),
      maximumTrackTintColor(convertRawProp(
          rawProps,
          "maximumTintColor",
          sourceProps.thumbTintColor,
          thumbTintColor)),
      thumbTintColor(convertRawProp(
          rawProps,
          "thumbTintColor",
          sourceProps.thumbTintColor,
          thumbTintColor)) {}

} // namespace react
} // namespace facebook

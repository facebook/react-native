/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/components/slider/SliderProps.h>
#include <react/components/image/conversions.h>
#include <react/core/propsConversions.h>

namespace facebook {
namespace react {

SliderProps::SliderProps(
    const SliderProps &sourceProps,
    const RawProps &rawProps)
    : ViewProps(sourceProps, rawProps),
      value(convertRawProp(rawProps, "value", sourceProps.value, value)),
      minimumValue(convertRawProp(
          rawProps,
          "minimumValue",
          sourceProps.minimumValue,
          minimumValue)),
      maximumValue(convertRawProp(
          rawProps,
          "maximumValue",
          sourceProps.maximumValue,
          maximumValue)),
      step(convertRawProp(rawProps, "step", sourceProps.step, step)),
      disabled(
          convertRawProp(rawProps, "disabled", sourceProps.disabled, disabled)),
      minimumTrackTintColor(convertRawProp(
          rawProps,
          "minimumTrackTintColor",
          sourceProps.minimumTrackTintColor,
          minimumTrackTintColor)),
      maximumTrackTintColor(convertRawProp(
          rawProps,
          "maximumTrackTintColor",
          sourceProps.maximumTrackTintColor,
          maximumTrackTintColor)),
      thumbTintColor(convertRawProp(
          rawProps,
          "thumbTintColor",
          sourceProps.thumbTintColor,
          thumbTintColor)),
      trackImage(convertRawProp(
          rawProps,
          "trackImage",
          sourceProps.trackImage,
          trackImage)),
      minimumTrackImage(convertRawProp(
          rawProps,
          "minimumTrackImage",
          sourceProps.minimumTrackImage,
          minimumTrackImage)),
      maximumTrackImage(convertRawProp(
          rawProps,
          "maximumTrackImage",
          sourceProps.maximumTrackImage,
          maximumTrackImage)),
      thumbImage(convertRawProp(
          rawProps,
          "thumbImage",
          sourceProps.thumbImage,
          thumbImage)) {}

} // namespace react
} // namespace facebook

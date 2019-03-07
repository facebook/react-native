
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/components/rncore/Props.h>
#include <react/components/image/conversions.h>
#include <react/core/propsConversions.h>

namespace facebook {
namespace react {

ActivityIndicatorViewProps::ActivityIndicatorViewProps(
    const ActivityIndicatorViewProps &sourceProps,
    const RawProps &rawProps): ViewProps(sourceProps, rawProps),

    hidesWhenStopped(convertRawProp(rawProps, "hidesWhenStopped", sourceProps.hidesWhenStopped, hidesWhenStopped)),
animating(convertRawProp(rawProps, "animating", sourceProps.animating, animating)),
styleAttr(convertRawProp(rawProps, "styleAttr", sourceProps.styleAttr, styleAttr)),
color(convertRawProp(rawProps, "color", sourceProps.color, color)),
size(convertRawProp(rawProps, "size", sourceProps.size, size)),
intermediate(convertRawProp(rawProps, "intermediate", sourceProps.intermediate, intermediate))
      {}
SwitchProps::SwitchProps(
    const SwitchProps &sourceProps,
    const RawProps &rawProps): ViewProps(sourceProps, rawProps),

    disabled(convertRawProp(rawProps, "disabled", sourceProps.disabled, disabled)),
value(convertRawProp(rawProps, "value", sourceProps.value, value)),
tintColor(convertRawProp(rawProps, "tintColor", sourceProps.tintColor, tintColor)),
onTintColor(convertRawProp(rawProps, "onTintColor", sourceProps.onTintColor, onTintColor)),
thumbTintColor(convertRawProp(rawProps, "thumbTintColor", sourceProps.thumbTintColor, thumbTintColor))
      {}
SliderProps::SliderProps(
    const SliderProps &sourceProps,
    const RawProps &rawProps): ViewProps(sourceProps, rawProps),

    disabled(convertRawProp(rawProps, "disabled", sourceProps.disabled, disabled)),
enabled(convertRawProp(rawProps, "enabled", sourceProps.enabled, enabled)),
maximumTrackImage(convertRawProp(rawProps, "maximumTrackImage", sourceProps.maximumTrackImage, maximumTrackImage)),
maximumTrackTintColor(convertRawProp(rawProps, "maximumTrackTintColor", sourceProps.maximumTrackTintColor, maximumTrackTintColor)),
maximumValue(convertRawProp(rawProps, "maximumValue", sourceProps.maximumValue, maximumValue)),
minimumTrackImage(convertRawProp(rawProps, "minimumTrackImage", sourceProps.minimumTrackImage, minimumTrackImage)),
minimumTrackTintColor(convertRawProp(rawProps, "minimumTrackTintColor", sourceProps.minimumTrackTintColor, minimumTrackTintColor)),
minimumValue(convertRawProp(rawProps, "minimumValue", sourceProps.minimumValue, minimumValue)),
step(convertRawProp(rawProps, "step", sourceProps.step, step)),
testID(convertRawProp(rawProps, "testID", sourceProps.testID, testID)),
thumbImage(convertRawProp(rawProps, "thumbImage", sourceProps.thumbImage, thumbImage)),
trackImage(convertRawProp(rawProps, "trackImage", sourceProps.trackImage, trackImage)),
thumbTintColor(convertRawProp(rawProps, "thumbTintColor", sourceProps.thumbTintColor, thumbTintColor)),
value(convertRawProp(rawProps, "value", sourceProps.value, value))
      {}

} // namespace react
} // namespace facebook

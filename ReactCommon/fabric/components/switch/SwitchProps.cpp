/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <fabric/components/switch/SwitchProps.h>
#include <fabric/core/propsConversions.h>

namespace facebook {
namespace react {

SwitchProps::SwitchProps(const SwitchProps &sourceProps, const RawProps &rawProps):
  ViewProps(sourceProps, rawProps),
  value(convertRawProp(rawProps, "value", sourceProps.value, value)),
  disabled(convertRawProp(rawProps, "disabled", sourceProps.disabled, disabled)),
  tintColor(convertRawProp(rawProps, "tintColor", sourceProps.tintColor, tintColor)),
  onTintColor(convertRawProp(rawProps, "onTintColor", sourceProps.onTintColor, onTintColor)),
  thumbTintColor(convertRawProp(rawProps, "thumbTintColor", sourceProps.thumbTintColor, thumbTintColor)) {}

} // namespace react
} // namespace facebook

/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AndroidDropdownPickerProps.h"

#include <react/renderer/components/image/conversions.h>
#include <react/renderer/core/propsConversions.h>

namespace facebook {
namespace react {

AndroidDropdownPickerProps::AndroidDropdownPickerProps(
    const AndroidDropdownPickerProps &sourceProps,
    const RawProps &rawProps)
    : ViewProps(sourceProps, rawProps),
      color(convertRawProp(rawProps, "color", sourceProps.color, {})),
      enabled(convertRawProp(rawProps, "enabled", sourceProps.enabled, {true})),
      items(convertRawProp(rawProps, "items", sourceProps.items, {})),
      prompt(convertRawProp(rawProps, "prompt", sourceProps.prompt, {""})),
      selected(
          convertRawProp(rawProps, "selected", sourceProps.selected, {0})) {}

} // namespace react
} // namespace facebook

/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "PickerProps.h"

#include <react/renderer/attributedstring/conversions.h>
#include <react/renderer/components/iospicker/conversions.h>
#include <react/renderer/core/propsConversions.h>

namespace facebook {
namespace react {

PickerProps::PickerProps(
    PickerProps const &sourceProps,
    RawProps const &rawProps)
    : ViewProps(sourceProps, rawProps),
      items(convertRawProp(rawProps, "items", sourceProps.items, {})),
      selectedIndex(convertRawProp(
          rawProps,
          "selectedIndex",
          sourceProps.selectedIndex,
          {0})),
      // TODO (T75217510) - This doesn't build, need to inherit from
      // BaseTextProps? style(convertRawProp(rawProps, "style",
      // sourceProps.style, {})),
      testID(convertRawProp(rawProps, "testID", sourceProps.testID, {})),
      accessibilityLabel(convertRawProp(
          rawProps,
          "accessibilityLabel",
          sourceProps.accessibilityLabel,
          {})){

      };

} // namespace react
} // namespace facebook

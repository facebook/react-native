/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RawTextProps.h"

#include <fabric/core/propsConversions.h>
#include <fabric/debug/debugStringConvertibleUtils.h>

namespace facebook {
namespace react {

RawTextProps::RawTextProps(const RawTextProps &sourceProps, const RawProps &rawProps):
  Props(sourceProps, rawProps),
  text(convertRawProp(rawProps, "text", sourceProps.text)) {};

#pragma mark - DebugStringConvertible

SharedDebugStringConvertibleList RawTextProps::getDebugProps() const {
  return {
    debugStringConvertibleItem("text", text)
  };
}

} // namespace react
} // namespace facebook

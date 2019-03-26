/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ParagraphAttributes.h"

#include <fabric/attributedstring/conversions.h>
#include <fabric/graphics/conversions.h>
#include <fabric/debug/debugStringConvertibleUtils.h>

namespace facebook {
namespace react {

#pragma mark - DebugStringConvertible

SharedDebugStringConvertibleList ParagraphAttributes::getDebugProps() const {
  return {
    debugStringConvertibleItem("maximumNumberOfLines", maximumNumberOfLines),
    debugStringConvertibleItem("ellipsizeMode", ellipsizeMode),
    debugStringConvertibleItem("adjustsFontSizeToFit", adjustsFontSizeToFit),
    debugStringConvertibleItem("minimumFontSize", minimumFontSize),
    debugStringConvertibleItem("maximumFontSize", maximumFontSize)
  };
}

} // namespace react
} // namespace facebook

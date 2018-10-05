/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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

#if RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList ParagraphAttributes::getDebugProps() const {
  return {
    debugStringConvertibleItem("maximumNumberOfLines", maximumNumberOfLines),
    debugStringConvertibleItem("ellipsizeMode", ellipsizeMode),
    debugStringConvertibleItem("adjustsFontSizeToFit", adjustsFontSizeToFit),
    debugStringConvertibleItem("minimumFontSize", minimumFontSize),
    debugStringConvertibleItem("maximumFontSize", maximumFontSize)
  };
}
#endif

} // namespace react
} // namespace facebook

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fabric/attributedstring/TextPrimitives.h>
#include <fabric/attributedstring/textValuesConversions.h>
#include <fabric/core/propsConversions.h>
#include <folly/dynamic.h>

namespace facebook {
namespace react {

CONVERT_RAW_PROP_TEMPLATE(EllipsizeMode, ellipsizeModeFromDynamic)
CONVERT_RAW_PROP_TEMPLATE(FontWeight, fontWeightFromDynamic)
CONVERT_RAW_PROP_TEMPLATE(FontStyle, fontStyleFromDynamic)
CONVERT_RAW_PROP_TEMPLATE(FontVariant, fontVariantFromDynamic)
CONVERT_RAW_PROP_TEMPLATE(WritingDirection, writingDirectionFromDynamic)
CONVERT_RAW_PROP_TEMPLATE(TextAlignment, textAlignmentFromDynamic)
CONVERT_RAW_PROP_TEMPLATE(TextDecorationLineType, textDecorationLineTypeFromDynamic)
CONVERT_RAW_PROP_TEMPLATE(TextDecorationLineStyle, textDecorationLineStyleFromDynamic)
CONVERT_RAW_PROP_TEMPLATE(TextDecorationLinePattern, textDecorationLinePatternFromDynamic)

} // namespace react
} // namespace facebook

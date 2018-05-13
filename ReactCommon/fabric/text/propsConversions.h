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

APPLY_RAW_PROP_TEMPLATE(EllipsizeMode, ellipsizeModeFromDynamic)
APPLY_RAW_PROP_TEMPLATE(FontWeight, fontWeightFromDynamic)
APPLY_RAW_PROP_TEMPLATE(FontStyle, fontStyleFromDynamic)
APPLY_RAW_PROP_TEMPLATE(FontVariant, fontVariantFromDynamic)
APPLY_RAW_PROP_TEMPLATE(WritingDirection, writingDirectionFromDynamic)
APPLY_RAW_PROP_TEMPLATE(TextAlignment, textAlignmentFromDynamic)
APPLY_RAW_PROP_TEMPLATE(TextDecorationLineType, textDecorationLineTypeFromDynamic)
APPLY_RAW_PROP_TEMPLATE(TextDecorationLineStyle, textDecorationLineStyleFromDynamic)
APPLY_RAW_PROP_TEMPLATE(TextDecorationLinePattern, textDecorationLinePatternFromDynamic)

} // namespace react
} // namespace facebook

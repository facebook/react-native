/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "SpanAttributes.h"

#include <react/renderer/attributedstring/conversions.h>
#include <react/renderer/core/conversions.h>
#include <react/renderer/core/graphicsConversions.h>
#include <react/utils/FloatComparison.h>
#include <cmath>

#include <react/renderer/debug/debugStringConvertibleUtils.h>

namespace facebook::react {

void SpanAttributes::apply(SpanAttributes spanAttributes) {
  fillLineGap = spanAttributes.fillLineGap
      ? spanAttributes.fillLineGap
      : fillLineGap;
}

#pragma mark - Operators

bool SpanAttributes::operator==(const SpanAttributes& rhs) const {
  return std::tie(fillLineGap) ==
      std::tie(rhs.fillLineGap);
}

bool SpanAttributes::operator!=(const SpanAttributes& rhs) const {
  return !(*this == rhs);
}

SpanAttributes SpanAttributes::defaultSpanAttributes() {
  static auto spanAttributes = [] {
    auto spanAttributes = SpanAttributes{};
    spanAttributes.fillLineGap = true;
    return spanAttributes;
  }();
  return spanAttributes;
}

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList SpanAttributes::getDebugProps() const {
  return {
      debugStringConvertibleItem("fillLineGap", fillLineGap),
  };
}
#endif

} // namespace facebook::react

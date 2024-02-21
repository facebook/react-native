/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "SpanAttributes.h"

#include "conversions.h"
#include "react/renderer/core/conversions.h"

#include "react/renderer/debug/debugStringConvertibleUtils.h"

namespace facebook::react {

SpanAttributes SpanAttributes::extract(const BaseViewProps& props) {
  return SpanAttributes();
}

#pragma mark - Operators

bool SpanAttributes::operator==(const SpanAttributes& rhs) const {
  return true;
}

bool SpanAttributes::operator!=(const SpanAttributes& rhs) const {
  return !(*this == rhs);
}

SpanAttributes SpanAttributes::defaultSpanAttributes() {
  static auto spanAttributes = [] {
    auto spanAttributes = SpanAttributes{};
    return spanAttributes;
  }();
  return spanAttributes;
}

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList SpanAttributes::getDebugProps() const {
  return {};
}
#endif

} // namespace facebook::react

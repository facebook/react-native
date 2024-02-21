/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <limits>
#include <optional>

#include "primitives.h"
#include "react/renderer/attributedstring/TextAttributes.h"
#include "react/renderer/components/view/AccessibilityPrimitives.h"
#include "react/renderer/components/view/BaseViewProps.h"
#include "react/renderer/core/LayoutPrimitives.h"
#include "react/renderer/core/ReactPrimitives.h"
#include "react/renderer/debug/DebugStringConvertible.h"
#include "react/renderer/graphics/Color.h"
#include "react/renderer/graphics/Size.h"
#include "react/renderer/graphics/platform/android/react/renderer/graphics/Float.h"
#include "react/utils/hash_combine.h"

namespace facebook::react {
class SpanAttributes;

using SharedSpanAttributes = std::shared_ptr<const SpanAttributes>;

class SpanAttributes : public DebugStringConvertible {
 public:
  static SpanAttributes defaultSpanAttributes();

  static SpanAttributes extract(const BaseViewProps& props);

#pragma mark - Fields

  /**
   * A minimal subset of text attributes that's required for calculating span's
   * geometry
   */
  TextAttributes textAttributes;

#pragma mark - Operators

  bool operator==(const SpanAttributes& rhs) const;
  bool operator!=(const SpanAttributes& rhs) const;

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const override;
#endif
};

} // namespace facebook::react

namespace std {

template <>
struct hash<facebook::react::SpanAttributes> {
  size_t operator()(
      const facebook::react::SpanAttributes& textAttributes) const {
    return facebook::react::hash_combine(textAttributes.textAttributes);
  }
};

} // namespace std

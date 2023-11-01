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

#include <react/renderer/attributedstring/primitives.h>
#include <react/renderer/components/view/AccessibilityPrimitives.h>
#include <react/renderer/core/LayoutPrimitives.h>
#include <react/renderer/core/ReactPrimitives.h>
#include <react/renderer/debug/DebugStringConvertible.h>
#include <react/renderer/graphics/Color.h>
#include <react/renderer/graphics/Float.h>
#include <react/renderer/graphics/Size.h>
#include <react/utils/hash_combine.h>

namespace facebook::react {

class SpanAttributes;

using SpanedTextAttributes = std::shared_ptr<const SpanAttributes>;

class SpanAttributes : public DebugStringConvertible {
 public:
  /*
   * Returns SpanAttributes object which has actual default attribute values
   * (e.g. `fillLineGap = true`), in oppose to SpanAttributes's default
   * constructor which creates an object with non-set attributes.
   */
  static SpanAttributes defaultSpanAttributes();

#pragma mark - Fields

  std::optional<bool> fillLineGap;

#pragma mark - Operations

  void apply(SpanAttributes spanAttributes);

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
      const facebook::react::SpanAttributes& spanAttributes) const {
    return facebook::react::hash_combine(spanAttributes.fillLineGap);
  }
};
} // namespace std

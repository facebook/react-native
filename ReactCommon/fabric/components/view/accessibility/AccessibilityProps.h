/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fabric/components/view/AccessibilityPrimitives.h>
#include <fabric/core/Props.h>
#include <fabric/core/ReactPrimitives.h>
#include <fabric/debug/DebugStringConvertible.h>

namespace facebook {
namespace react {

class AccessibilityProps;

typedef std::shared_ptr<const AccessibilityProps> SharedAccessibilityProps;

class AccessibilityProps : public virtual DebugStringConvertible {
 public:
  AccessibilityProps() = default;
  AccessibilityProps(
      const AccessibilityProps &sourceProps,
      const RawProps &rawProps);

#pragma mark - Props

  const bool accessible{false};
  const AccessibilityTraits accessibilityTraits{AccessibilityTraits::None};
  const std::string accessibilityLabel{""};
  const std::string accessibilityHint{""};
  const std::vector<std::string> accessibilityActions{};
  const bool accessibilityViewIsModal{false};
  const bool accessibilityElementsHidden{false};
  const bool accessibilityIgnoresInvertColors{false};
  const std::string testId{""};

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const override;
#endif
};

} // namespace react
} // namespace facebook

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/components/view/AccessibilityPrimitives.h>
#include <react/core/Props.h>
#include <react/core/ReactPrimitives.h>
#include <react/debug/DebugStringConvertible.h>

namespace facebook {
namespace react {

class AccessibilityProps {
 public:
  AccessibilityProps() = default;
  AccessibilityProps(
      AccessibilityProps const &sourceProps,
      RawProps const &rawProps);

#pragma mark - Props

  bool const accessible{false};
  AccessibilityTraits const accessibilityTraits{AccessibilityTraits::None};
  std::string const accessibilityLabel{""};
  std::string const accessibilityHint{""};
  std::vector<std::string> const accessibilityActions{};
  bool const accessibilityViewIsModal{false};
  bool const accessibilityElementsHidden{false};
  bool const accessibilityIgnoresInvertColors{false};
  std::string const testId{""};

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const;
#endif
};

} // namespace react
} // namespace facebook

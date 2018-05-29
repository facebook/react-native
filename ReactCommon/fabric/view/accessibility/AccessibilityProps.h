/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fabric/core/Props.h>
#include <fabric/core/ReactPrimitives.h>
#include <fabric/debug/DebugStringConvertible.h>
#include <fabric/view/AccessibilityPrimitives.h>

namespace facebook {
namespace react {

class AccessibilityProps;

typedef std::shared_ptr<const AccessibilityProps> SharedAccessibilityProps;

class AccessibilityProps:
  public virtual DebugStringConvertible {

public:

  AccessibilityProps() = default;
  AccessibilityProps(const AccessibilityProps &sourceProps, const RawProps &rawProps);

#pragma mark - Props

  const bool accessible {true};
  const std::string accessibilityActions {""};
  const std::string accessibilityLabel {""};
  const AccessibilityTraits accessibilityTraits {AccessibilityTraits::None};
  const bool accessibilityViewIsModal {false};
  const bool accessibilityElementsHidden {false};
};

} // namespace react
} // namespace facebook

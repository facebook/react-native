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
  public virtual DebugStringConvertible
{

public:
  void apply(const RawProps &rawProps);

protected:
  bool accessible_ {true};
  std::string accessibilityActions_ {""};
  std::string accessibilityLabel_ {""};
  AccessibilityTraits accessibilityTraits_ {AccessibilityTraits::None};
  bool accessibilityViewIsModal_ {false};
  bool accessibilityElementsHidden_ {false};
  SharedDirectEventHandler onAccessibilityAction_ {nullptr};
  SharedDirectEventHandler onAccessibilityTap_ {nullptr};
  SharedDirectEventHandler onMagicTap_ {nullptr};
};

} // namespace react
} // namespace facebook

/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <better/optional.h>
#include <cinttypes>
#include <string>

namespace facebook {
namespace react {

enum class AccessibilityTraits : uint32_t {
  None = 0,
  Button = (1 << 0),
  Link = (1 << 1),
  Image = (1 << 2),
  Selected = (1 << 3),
  PlaysSound = (1 << 4),
  KeyboardKey = (1 << 5),
  StaticText = (1 << 6),
  SummaryElement = (1 << 7),
  NotEnabled = (1 << 8),
  UpdatesFrequently = (1 << 9),
  SearchField = (1 << 10),
  StartsMediaSession = (1 << 11),
  Adjustable = (1 << 12),
  AllowsDirectInteraction = (1 << 13),
  CausesPageTurn = (1 << 14),
  Header = (1 << 15),
  Switch = (1 << 16),
  TabBar = (1 << 17),
};

constexpr enum AccessibilityTraits operator|(
    const enum AccessibilityTraits lhs,
    const enum AccessibilityTraits rhs) {
  return (enum AccessibilityTraits)((uint32_t)lhs | (uint32_t)rhs);
}

constexpr enum AccessibilityTraits operator&(
    const enum AccessibilityTraits lhs,
    const enum AccessibilityTraits rhs) {
  return (enum AccessibilityTraits)((uint32_t)lhs & (uint32_t)rhs);
}

struct AccessibilityAction {
  std::string name{""};
  better::optional<std::string> label{};
};

struct AccessibilityState {
  bool disabled{false};
  bool selected{false};
  enum { Unchecked, Checked, Mixed, None } checked{None};
  bool busy{false};
  bool expanded{false};
};

constexpr bool operator==(
    AccessibilityState const &lhs,
    AccessibilityState const &rhs) {
  return lhs.disabled == rhs.disabled && lhs.selected == rhs.selected &&
      lhs.checked == rhs.checked && lhs.busy == rhs.busy &&
      lhs.expanded == rhs.expanded;
}

constexpr bool operator!=(
    AccessibilityState const &lhs,
    AccessibilityState const &rhs) {
  return !(rhs == lhs);
}

struct AccessibilityValue {
  better::optional<int> min;
  better::optional<int> max;
  better::optional<int> now;
  better::optional<std::string> text{};
};

constexpr bool operator==(
    AccessibilityValue const &lhs,
    AccessibilityValue const &rhs) {
  return lhs.min == rhs.min && lhs.max == rhs.max && lhs.now == rhs.now &&
      lhs.text == rhs.text;
}

constexpr bool operator!=(
    AccessibilityValue const &lhs,
    AccessibilityValue const &rhs) {
  return !(rhs == lhs);
}

enum class ImportantForAccessibility {
  Auto,
  Yes,
  No,
  NoHideDescendants,
};

} // namespace react
} // namespace facebook

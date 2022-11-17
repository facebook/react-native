/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cinttypes>
#include <optional>
#include <string>
#include <vector>

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
  std::optional<std::string> label{};
};

inline static bool operator==(
    AccessibilityAction const &lhs,
    AccessibilityAction const &rhs) {
  return lhs.name == rhs.name && lhs.label == rhs.label;
}

inline static bool operator!=(
    AccessibilityAction const &lhs,
    AccessibilityAction const &rhs) {
  return !(rhs == lhs);
}

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

struct AccessibilityLabelledBy {
  std::vector<std::string> value{};
};

inline static bool operator==(
    AccessibilityLabelledBy const &lhs,
    AccessibilityLabelledBy const &rhs) {
  return lhs.value == rhs.value;
}

inline static bool operator!=(
    AccessibilityLabelledBy const &lhs,
    AccessibilityLabelledBy const &rhs) {
  return !(lhs == rhs);
}

struct AccessibilityValue {
  std::optional<int> min;
  std::optional<int> max;
  std::optional<int> now;
  std::optional<std::string> text{};
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

enum class AccessibilityLiveRegion {
  None,
  Polite,
  Assertive,
};

} // namespace react
} // namespace facebook

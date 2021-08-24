/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <glog/logging.h>
#include <react/debug/react_native_assert.h>
#include <react/renderer/components/view/AccessibilityPrimitives.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/propsConversions.h>

namespace facebook {
namespace react {

inline void fromString(const std::string &string, AccessibilityTraits &result) {
  if (string == "none") {
    result = AccessibilityTraits::None;
    return;
  }
  if (string == "button" || string == "togglebutton") {
    result = AccessibilityTraits::Button;
    return;
  }
  if (string == "link") {
    result = AccessibilityTraits::Link;
    return;
  }
  if (string == "image") {
    result = AccessibilityTraits::Image;
    return;
  }
  if (string == "selected") {
    result = AccessibilityTraits::Selected;
    return;
  }
  if (string == "plays") {
    result = AccessibilityTraits::PlaysSound;
    return;
  }
  if (string == "keyboardkey" || string == "key") {
    result = AccessibilityTraits::KeyboardKey;
    return;
  }
  if (string == "text") {
    result = AccessibilityTraits::StaticText;
    return;
  }
  if (string == "disabled") {
    result = AccessibilityTraits::NotEnabled;
    return;
  }
  if (string == "frequentUpdates") {
    result = AccessibilityTraits::UpdatesFrequently;
    return;
  }
  if (string == "search") {
    result = AccessibilityTraits::SearchField;
    return;
  }
  if (string == "startsMedia") {
    result = AccessibilityTraits::StartsMediaSession;
    return;
  }
  if (string == "adjustable") {
    result = AccessibilityTraits::Adjustable;
    return;
  }
  if (string == "allowsDirectInteraction") {
    result = AccessibilityTraits::AllowsDirectInteraction;
    return;
  }
  if (string == "pageTurn") {
    result = AccessibilityTraits::CausesPageTurn;
    return;
  }
  if (string == "header") {
    result = AccessibilityTraits::Header;
    return;
  }
  if (string == "imagebutton") {
    result = AccessibilityTraits::Image | AccessibilityTraits::Button;
    return;
  }
  if (string == "summary") {
    result = AccessibilityTraits::SummaryElement;
    return;
  }
  if (string == "switch") {
    result = AccessibilityTraits::Switch;
    return;
  }
  if (string == "tabbar") {
    result = AccessibilityTraits::TabBar;
    return;
  }
  result = AccessibilityTraits::None;
}

inline void fromRawValue(
    const PropsParserContext &context,
    const RawValue &value,
    AccessibilityTraits &result) {
  if (value.hasType<std::string>()) {
    fromString((std::string)value, result);
    return;
  }

  result = {};

  react_native_assert(value.hasType<std::vector<std::string>>());
  if (value.hasType<std::vector<std::string>>()) {
    auto items = (std::vector<std::string>)value;
    for (auto &item : items) {
      AccessibilityTraits itemAccessibilityTraits;
      fromString(item, itemAccessibilityTraits);
      result = result | itemAccessibilityTraits;
    }
  } else {
    LOG(ERROR) << "AccessibilityTraits parsing: unsupported type";
  }
}

inline void fromRawValue(
    const PropsParserContext &context,
    const RawValue &value,
    AccessibilityState &result) {
  auto map = (better::map<std::string, RawValue>)value;
  auto selected = map.find("selected");
  if (selected != map.end()) {
    fromRawValue(context, selected->second, result.selected);
  }
  auto disabled = map.find("disabled");
  if (disabled != map.end()) {
    fromRawValue(context, disabled->second, result.disabled);
  }
  auto checked = map.find("checked");
  if (checked != map.end()) {
    if (checked->second.hasType<std::string>()) {
      if ((std::string)checked->second == "mixed") {
        result.checked = AccessibilityState::Mixed;
      } else {
        result.checked = AccessibilityState::None;
      }
    } else if (checked->second.hasType<bool>()) {
      if ((bool)checked->second == true) {
        result.checked = AccessibilityState::Checked;
      } else {
        result.checked = AccessibilityState::Unchecked;
      }
    } else {
      result.checked = AccessibilityState::None;
    }
  }
  auto busy = map.find("busy");
  if (busy != map.end()) {
    fromRawValue(context, busy->second, result.busy);
  }
  auto expanded = map.find("expanded");
  if (expanded != map.end()) {
    fromRawValue(context, expanded->second, result.expanded);
  }
}

inline std::string toString(
    const ImportantForAccessibility &importantForAccessibility) {
  switch (importantForAccessibility) {
    case ImportantForAccessibility::Auto:
      return "auto";
    case ImportantForAccessibility::Yes:
      return "yes";
    case ImportantForAccessibility::No:
      return "no";
    case ImportantForAccessibility::NoHideDescendants:
      return "no-hide-descendants";
  }
}

inline void fromRawValue(
    const PropsParserContext &context,
    const RawValue &value,
    ImportantForAccessibility &result) {
  react_native_assert(value.hasType<std::string>());
  if (value.hasType<std::string>()) {
    auto string = (std::string)value;
    if (string == "auto") {
      result = ImportantForAccessibility::Auto;
    } else if (string == "yes") {
      result = ImportantForAccessibility::Yes;
    } else if (string == "no") {
      result = ImportantForAccessibility::No;
    } else if (string == "no-hide-descendants") {
      result = ImportantForAccessibility::NoHideDescendants;
    } else {
      LOG(ERROR) << "Unsupported ImportantForAccessiblity value: " << string;
      react_native_assert(false);
    }
  } else {
    LOG(ERROR) << "Unsupported ImportantForAccessiblity type";
  }
}

inline void fromRawValue(
    const PropsParserContext &context,
    const RawValue &value,
    AccessibilityAction &result) {
  auto map = (better::map<std::string, RawValue>)value;

  auto name = map.find("name");
  react_native_assert(name != map.end() && name->second.hasType<std::string>());
  if (name != map.end()) {
    fromRawValue(context, name->second, result.name);
  }

  auto label = map.find("label");
  if (label != map.end()) {
    if (label->second.hasType<std::string>()) {
      result.label = (std::string)label->second;
    }
  }
}

inline void fromRawValue(
    const PropsParserContext &,
    const RawValue &value,
    AccessibilityValue &result) {
  auto map = (better::map<std::string, RawValue>)value;

  auto min = map.find("min");
  if (min != map.end()) {
    if (min->second.hasType<int>()) {
      result.min = (int)min->second;
    }
  }

  auto max = map.find("max");
  if (max != map.end()) {
    if (max->second.hasType<int>()) {
      result.max = (int)max->second;
    }
  }

  auto now = map.find("now");
  if (now != map.end()) {
    if (now->second.hasType<int>()) {
      result.now = (int)now->second;
    }
  }

  auto text = map.find("text");
  if (text != map.end()) {
    if (text->second.hasType<std::string>()) {
      result.text = (std::string)text->second;
    }
  }
}

} // namespace react
} // namespace facebook

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <glog/logging.h>
#include <react/debug/react_native_assert.h>
#include <react/debug/react_native_expect.h>
#include <react/renderer/components/view/AccessibilityPrimitives.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/propsConversions.h>
#include <react/renderer/debug/DebugStringConvertible.h>

#include <unordered_map>

namespace facebook::react {

inline void fromString(const std::string &string, AccessibilityTraits &result)
{
  static const std::unordered_map<std::string, AccessibilityTraits> traitsMap = {
      {"none", AccessibilityTraits::None},
      {"button", AccessibilityTraits::Button},
      {"togglebutton", AccessibilityTraits::Button},
      {"link", AccessibilityTraits::Link},
      {"image", AccessibilityTraits::Image},
      {"img", AccessibilityTraits::Image},
      {"selected", AccessibilityTraits::Selected},
      {"plays", AccessibilityTraits::PlaysSound},
      {"keyboardkey", AccessibilityTraits::KeyboardKey},
      {"key", AccessibilityTraits::KeyboardKey},
      {"text", AccessibilityTraits::StaticText},
      {"disabled", AccessibilityTraits::NotEnabled},
      {"frequentUpdates", AccessibilityTraits::UpdatesFrequently},
      {"search", AccessibilityTraits::SearchField},
      {"startsMedia", AccessibilityTraits::StartsMediaSession},
      {"adjustable", AccessibilityTraits::Adjustable},
      {"allowsDirectInteraction", AccessibilityTraits::AllowsDirectInteraction},
      {"pageTurn", AccessibilityTraits::CausesPageTurn},
      {"header", AccessibilityTraits::Header},
      {"heading", AccessibilityTraits::Header},
      {"imagebutton", AccessibilityTraits::Image | AccessibilityTraits::Button},
      {"summary", AccessibilityTraits::SummaryElement},
      {"switch", AccessibilityTraits::Switch},
      {"tabbar", AccessibilityTraits::TabBar},
      {"progressbar", AccessibilityTraits::UpdatesFrequently},
  };

  auto it = traitsMap.find(string);
  if (it != traitsMap.end()) {
    result = it->second;
    return;
  }
  result = AccessibilityTraits::None;
}

inline void fromRawValue(const PropsParserContext &context, const RawValue &value, AccessibilityTraits &result)
{
  if (value.hasType<std::string>()) {
    fromString((std::string)value, result);
    return;
  }

  result = {};

  react_native_expect(value.hasType<std::vector<std::string>>());
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

inline void fromRawValue(const PropsParserContext &context, const RawValue &value, AccessibilityState &result)
{
  auto map = (std::unordered_map<std::string, RawValue>)value;
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

inline std::string toString(const ImportantForAccessibility &importantForAccessibility)
{
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

inline void fromRawValue(const PropsParserContext &context, const RawValue &value, ImportantForAccessibility &result)
{
  result = ImportantForAccessibility::Auto;
  react_native_expect(value.hasType<std::string>());
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
      LOG(ERROR) << "Unsupported ImportantForAccessibility value: " << string;
      react_native_expect(false);
    }
  } else {
    LOG(ERROR) << "Unsupported ImportantForAccessibility type";
  }
}

inline void fromRawValue(const PropsParserContext &context, const RawValue &value, AccessibilityAction &result)
{
  auto map = (std::unordered_map<std::string, RawValue>)value;

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

inline void fromRawValue(const PropsParserContext & /*unused*/, const RawValue &value, AccessibilityValue &result)
{
  auto map = (std::unordered_map<std::string, RawValue>)value;

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

inline void fromRawValue(const PropsParserContext &context, const RawValue &value, AccessibilityLabelledBy &result)
{
  if (value.hasType<std::string>()) {
    result.value.push_back((std::string)value);
  } else if (value.hasType<std::vector<std::string>>()) {
    result.value = (std::vector<std::string>)value;
  }
}

inline void fromRawValue(const PropsParserContext &context, const RawValue &value, AccessibilityLiveRegion &result)
{
  result = AccessibilityLiveRegion::None;
  react_native_expect(value.hasType<std::string>());
  if (value.hasType<std::string>()) {
    auto string = (std::string)value;
    if (string == "none") {
      result = AccessibilityLiveRegion::None;
    } else if (string == "polite") {
      result = AccessibilityLiveRegion::Polite;
    } else if (string == "assertive") {
      result = AccessibilityLiveRegion::Assertive;
    } else {
      LOG(ERROR) << "Unsupported AccessibilityLiveRegion value: " << string;
      react_native_expect(false);
    }
  } else {
    LOG(ERROR) << "Unsupported AccessibilityLiveRegion type";
  }
}

inline std::string toString(const AccessibilityRole &accessibilityRole)
{
  switch (accessibilityRole) {
    case AccessibilityRole::None:
      return "none";
    case AccessibilityRole::Button:
      return "button";
    case AccessibilityRole::Dropdownlist:
      return "dropdownlist";
    case AccessibilityRole::Togglebutton:
      return "togglebutton";
    case AccessibilityRole::Link:
      return "link";
    case AccessibilityRole::Search:
      return "search";
    case AccessibilityRole::Image:
      return "image";
    case AccessibilityRole::Keyboardkey:
      return "keyboardkey";
    case AccessibilityRole::Text:
      return "text";
    case AccessibilityRole::Adjustable:
      return "adjustable";
    case AccessibilityRole::Imagebutton:
      return "imagebutton";
    case AccessibilityRole::Header:
      return "header";
    case AccessibilityRole::Summary:
      return "summary";
    case AccessibilityRole::Alert:
      return "alert";
    case AccessibilityRole::Checkbox:
      return "checkbox";
    case AccessibilityRole::Combobox:
      return "combobox";
    case AccessibilityRole::Menu:
      return "menu";
    case AccessibilityRole::Menubar:
      return "menubar";
    case AccessibilityRole::Menuitem:
      return "menuitem";
    case AccessibilityRole::Progressbar:
      return "progressbar";
    case AccessibilityRole::Radio:
      return "radio";
    case AccessibilityRole::Radiogroup:
      return "radiogroup";
    case AccessibilityRole::Scrollbar:
      return "scrollbar";
    case AccessibilityRole::Spinbutton:
      return "spinbutton";
    case AccessibilityRole::Switch:
      return "switch";
    case AccessibilityRole::Tab:
      return "tab";
    case AccessibilityRole::Tabbar:
      return "tabbar";
    case AccessibilityRole::Tablist:
      return "tablist";
    case AccessibilityRole::Timer:
      return "timer";
    case AccessibilityRole::List:
      return "timer";
    case AccessibilityRole::Toolbar:
      return "toolbar";
    case AccessibilityRole::Grid:
      return "grid";
    case AccessibilityRole::Pager:
      return "pager";
    case AccessibilityRole::Scrollview:
      return "scrollview";
    case AccessibilityRole::Horizontalscrollview:
      return "horizontalscrollview";
    case AccessibilityRole::Viewgroup:
      return "viewgroup";
    case AccessibilityRole::Webview:
      return "webview";
    case AccessibilityRole::Drawerlayout:
      return "drawerlayout";
    case AccessibilityRole::Slidingdrawer:
      return "slidingdrawer";
    case AccessibilityRole::Iconmenu:
      return "iconmenu";
  }

  LOG(ERROR) << "Unsupported AccessibilityRole value";
  react_native_expect(false);
  // sane default for prod
  return "none";
}

inline void fromRawValue(const PropsParserContext &context, const RawValue &value, AccessibilityRole &result)
{
  static const std::unordered_map<std::string, AccessibilityRole> accessibilityRoleMap = {
      {"none", AccessibilityRole::None},
      {"button", AccessibilityRole::Button},
      {"dropdownlist", AccessibilityRole::Dropdownlist},
      {"togglebutton", AccessibilityRole::Togglebutton},
      {"link", AccessibilityRole::Link},
      {"search", AccessibilityRole::Search},
      {"image", AccessibilityRole::Image},
      {"keyboardkey", AccessibilityRole::Keyboardkey},
      {"text", AccessibilityRole::Text},
      {"adjustable", AccessibilityRole::Adjustable},
      {"imagebutton", AccessibilityRole::Imagebutton},
      {"header", AccessibilityRole::Header},
      {"summary", AccessibilityRole::Summary},
      {"alert", AccessibilityRole::Alert},
      {"checkbox", AccessibilityRole::Checkbox},
      {"combobox", AccessibilityRole::Combobox},
      {"menu", AccessibilityRole::Menu},
      {"menubar", AccessibilityRole::Menubar},
      {"menuitem", AccessibilityRole::Menuitem},
      {"progressbar", AccessibilityRole::Progressbar},
      {"radio", AccessibilityRole::Radio},
      {"radiogroup", AccessibilityRole::Radiogroup},
      {"scrollbar", AccessibilityRole::Scrollbar},
      {"spinbutton", AccessibilityRole::Spinbutton},
      {"switch", AccessibilityRole::Switch},
      {"tab", AccessibilityRole::Tab},
      {"tabbar", AccessibilityRole::Tabbar},
      {"tablist", AccessibilityRole::Tablist},
      {"timer", AccessibilityRole::Timer},
      {"toolbar", AccessibilityRole::Toolbar},
      {"grid", AccessibilityRole::Grid},
      {"pager", AccessibilityRole::Pager},
      {"scrollview", AccessibilityRole::Scrollview},
      {"horizontalscrollview", AccessibilityRole::Horizontalscrollview},
      {"viewgroup", AccessibilityRole::Viewgroup},
      {"webview", AccessibilityRole::Webview},
      {"drawerlayout", AccessibilityRole::Drawerlayout},
      {"slidingdrawer", AccessibilityRole::Slidingdrawer},
      {"iconmenu", AccessibilityRole::Iconmenu},
  };

  react_native_expect(value.hasType<std::string>());
  if (value.hasType<std::string>()) {
    auto string = (std::string)value;
    auto it = accessibilityRoleMap.find(string);
    if (it != accessibilityRoleMap.end()) {
      result = it->second;
    } else {
      LOG(ERROR) << "Unsupported AccessibilityRole value: " << string;
      react_native_expect(false);
      // sane default for prod
      result = AccessibilityRole::None;
    }
    return;
  }

  LOG(ERROR) << "Unsupported AccessibilityRole type";
  react_native_expect(false);
  // sane default for prod
  result = AccessibilityRole::None;
}

inline std::string toString(const Role &role)
{
  switch (role) {
    case Role::Alert:
      return "alert";
    case Role::Alertdialog:
      return "alertdialog";
    case Role::Application:
      return "application";
    case Role::Article:
      return "article";
    case Role::Banner:
      return "banner";
    case Role::Button:
      return "button";
    case Role::Cell:
      return "cell";
    case Role::Checkbox:
      return "checkbox";
    case Role::Columnheader:
      return "columnheader";
    case Role::Combobox:
      return "combobox";
    case Role::Complementary:
      return "complementary";
    case Role::Contentinfo:
      return "contentinfo";
    case Role::Definition:
      return "definition";
    case Role::Dialog:
      return "dialog";
    case Role::Directory:
      return "directory";
    case Role::Document:
      return "document";
    case Role::Feed:
      return "feed";
    case Role::Figure:
      return "figure";
    case Role::Form:
      return "form";
    case Role::Grid:
      return "grid";
    case Role::Group:
      return "group";
    case Role::Heading:
      return "heading";
    case Role::Img:
      return "img";
    case Role::Link:
      return "link";
    case Role::List:
      return "list";
    case Role::Listitem:
      return "listitem";
    case Role::Log:
      return "log";
    case Role::Main:
      return "main";
    case Role::Marquee:
      return "marquee";
    case Role::Math:
      return "math";
    case Role::Menu:
      return "menu";
    case Role::Menubar:
      return "menubar";
    case Role::Menuitem:
      return "menuitem";
    case Role::Meter:
      return "meter";
    case Role::Navigation:
      return "navigation";
    case Role::None:
      return "none";
    case Role::Note:
      return "note";
    case Role::Option:
      return "option";
    case Role::Presentation:
      return "presentation";
    case Role::Progressbar:
      return "progressbar";
    case Role::Radio:
      return "radio";
    case Role::Radiogroup:
      return "radiogroup";
    case Role::Region:
      return "region";
    case Role::Row:
      return "row";
    case Role::Rowgroup:
      return "rowgroup";
    case Role::Rowheader:
      return "rowheader";
    case Role::Scrollbar:
      return "scrollbar";
    case Role::Searchbox:
      return "searchbox";
    case Role::Separator:
      return "separator";
    case Role::Slider:
      return "slider";
    case Role::Spinbutton:
      return "spinbutton";
    case Role::Status:
      return "status";
    case Role::Summary:
      return "summary";
    case Role::Switch:
      return "switch";
    case Role::Tab:
      return "tab";
    case Role::Table:
      return "table";
    case Role::Tablist:
      return "tablist";
    case Role::Tabpanel:
      return "tabpanel";
    case Role::Term:
      return "term";
    case Role::Timer:
      return "timer";
    case Role::Toolbar:
      return "toolbar";
    case Role::Tooltip:
      return "tooltip";
    case Role::Tree:
      return "tree";
    case Role::Treegrid:
      return "treegrid";
    case Role::Treeitem:
      return "treeitem";
  }

  LOG(ERROR) << "Unsupported Role value";
  react_native_expect(false);
  // sane default for prod
  return "none";
}

inline void fromRawValue(const PropsParserContext &context, const RawValue &value, Role &result)
{
  static const std::unordered_map<std::string, Role> roleMap = {
      {"alert", Role::Alert},
      {"alertdialog", Role::Alertdialog},
      {"application", Role::Application},
      {"article", Role::Article},
      {"banner", Role::Banner},
      {"button", Role::Button},
      {"cell", Role::Cell},
      {"checkbox", Role::Checkbox},
      {"columnheader", Role::Columnheader},
      {"combobox", Role::Combobox},
      {"complementary", Role::Complementary},
      {"contentinfo", Role::Contentinfo},
      {"definition", Role::Definition},
      {"dialog", Role::Dialog},
      {"directory", Role::Directory},
      {"document", Role::Document},
      {"feed", Role::Feed},
      {"figure", Role::Figure},
      {"form", Role::Form},
      {"grid", Role::Grid},
      {"group", Role::Group},
      {"heading", Role::Heading},
      {"img", Role::Img},
      {"link", Role::Link},
      {"list", Role::List},
      {"listitem", Role::Listitem},
      {"log", Role::Log},
      {"main", Role::Main},
      {"marquee", Role::Marquee},
      {"math", Role::Math},
      {"menu", Role::Menu},
      {"menubar", Role::Menubar},
      {"menuitem", Role::Menuitem},
      {"meter", Role::Meter},
      {"navigation", Role::Navigation},
      {"none", Role::None},
      {"note", Role::Note},
      {"option", Role::Option},
      {"presentation", Role::Presentation},
      {"progressbar", Role::Progressbar},
      {"radio", Role::Radio},
      {"radiogroup", Role::Radiogroup},
      {"region", Role::Region},
      {"row", Role::Row},
      {"rowgroup", Role::Rowgroup},
      {"rowheader", Role::Rowheader},
      {"scrollbar", Role::Scrollbar},
      {"searchbox", Role::Searchbox},
      {"separator", Role::Separator},
      {"slider", Role::Slider},
      {"spinbutton", Role::Spinbutton},
      {"status", Role::Status},
      {"summary", Role::Summary},
      {"switch", Role::Switch},
      {"tab", Role::Tab},
      {"table", Role::Table},
      {"tablist", Role::Tablist},
      {"tabpanel", Role::Tabpanel},
      {"term", Role::Term},
      {"timer", Role::Timer},
      {"toolbar", Role::Toolbar},
      {"tooltip", Role::Tooltip},
      {"tree", Role::Tree},
      {"treegrid", Role::Treegrid},
      {"treeitem", Role::Treeitem},
  };

  react_native_expect(value.hasType<std::string>());
  if (value.hasType<std::string>()) {
    auto string = (std::string)value;
    auto it = roleMap.find(string);
    if (it != roleMap.end()) {
      result = it->second;
    } else {
      LOG(ERROR) << "Unsupported Role value: " << string;
      react_native_expect(false);
      // sane default for prod
      result = Role::None;
    }
    return;
  }

  LOG(ERROR) << "Unsupported Role type";
  react_native_expect(false);
  // sane default for prod
  result = Role::None;
}

inline std::string toString(AccessibilityLiveRegion accessibilityLiveRegion)
{
  switch (accessibilityLiveRegion) {
    case AccessibilityLiveRegion::None:
      return "none";
    case AccessibilityLiveRegion::Polite:
      return "polite";
    case AccessibilityLiveRegion::Assertive:
      return "assertive";
  }
}

#if RN_DEBUG_STRING_CONVERTIBLE
inline std::string toString(AccessibilityState::CheckedState state)
{
  switch (state) {
    case AccessibilityState::Unchecked:
      return "Unchecked";
    case AccessibilityState::Checked:
      return "Checked";
    case AccessibilityState::Mixed:
      return "Mixed";
    case AccessibilityState::None:
      return "None";
  }
}

inline std::string toString(const AccessibilityAction &accessibilityAction)
{
  std::string result = accessibilityAction.name;
  if (accessibilityAction.label.has_value()) {
    result += ": '" + accessibilityAction.label.value() + "'";
  }
  return result;
}

inline std::string toString(std::vector<AccessibilityAction> accessibilityActions)
{
  std::string result = "[";
  for (size_t i = 0; i < accessibilityActions.size(); i++) {
    result += toString(accessibilityActions[i]);
    if (i < accessibilityActions.size() - 1) {
      result += ", ";
    }
  }
  result += "]";
  return result;
}

inline std::string toString(const AccessibilityState &accessibilityState)
{
  return "{disabled:" + toString(accessibilityState.disabled) + ",selected:" + toString(accessibilityState.selected) +
      ",checked:" + toString(accessibilityState.checked) + ",busy:" + toString(accessibilityState.busy) +
      ",expanded:" + toString(accessibilityState.expanded) + "}";
}
#endif

} // namespace facebook::react

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AccessibilityPropsMapBuffer.h"
#include <react/renderer/components/view/AccessibilityProps.h>

namespace facebook::react {

static MapBuffer convertAccessibilityActions(
    const std::vector<AccessibilityAction>& actions) {
  MapBufferBuilder builder(actions.size());
  for (auto i = 0; i < actions.size(); i++) {
    const auto& action = actions[i];
    MapBufferBuilder actionsBuilder(2);
    actionsBuilder.putString(ACCESSIBILITY_ACTION_NAME, action.name);
    if (action.label.has_value()) {
      actionsBuilder.putString(
          ACCESSIBILITY_ACTION_LABEL, action.label.value());
    }
    builder.putMapBuffer(i, actionsBuilder.build());
  }
  return builder.build();
}

static MapBuffer convertAccessibilityLabelledBy(
    const AccessibilityLabelledBy& labelledBy) {
  MapBufferBuilder builder(labelledBy.value.size());
  for (auto i = 0; i < labelledBy.value.size(); i++) {
    builder.putString(i, labelledBy.value[i]);
  }
  return builder.build();
}

// AccessibilityState values
constexpr MapBuffer::Key ACCESSIBILITY_STATE_BUSY = 0;
constexpr MapBuffer::Key ACCESSIBILITY_STATE_DISABLED = 1;
constexpr MapBuffer::Key ACCESSIBILITY_STATE_EXPANDED = 2;
constexpr MapBuffer::Key ACCESSIBILITY_STATE_SELECTED = 3;
constexpr MapBuffer::Key ACCESSIBILITY_STATE_CHECKED = 4;

MapBuffer convertAccessibilityState(const AccessibilityState& state) {
  MapBufferBuilder builder(5);
  builder.putBool(ACCESSIBILITY_STATE_BUSY, state.busy);
  builder.putBool(ACCESSIBILITY_STATE_DISABLED, state.disabled);
  builder.putBool(ACCESSIBILITY_STATE_EXPANDED, state.expanded);
  builder.putBool(ACCESSIBILITY_STATE_SELECTED, state.selected);
  int checked;
  switch (state.checked) {
    case AccessibilityState::Unchecked:
      checked = 0;
      break;
    case AccessibilityState::Checked:
      checked = 1;
      break;
    case AccessibilityState::Mixed:
      checked = 2;
      break;
    case AccessibilityState::None:
      checked = 3;
      break;
  }
  builder.putInt(ACCESSIBILITY_STATE_CHECKED, checked);
  return builder.build();
}

// TODO: Currently unsupported: nextFocusForward/Left/Up/Right/Down
void AccessibilityProps::propsDiffMapBuffer(
    const Props* oldPropsPtr,
    MapBufferBuilder& builder) const {
  // Call with default props if necessary
  if (oldPropsPtr == nullptr) {
    AccessibilityProps defaultProps{};
    propsDiffMapBuffer(reinterpret_cast<Props*>(&defaultProps), builder);
    return;
  }

  const AccessibilityProps& oldProps =
      *(reinterpret_cast<const AccessibilityProps*>(oldPropsPtr));
  const AccessibilityProps& newProps = *this;

  if (oldProps.accessibilityActions != newProps.accessibilityActions) {
    builder.putMapBuffer(
        AP_ACCESSIBILITY_ACTIONS,
        convertAccessibilityActions(newProps.accessibilityActions));
  }

  if (oldProps.accessibilityHint != newProps.accessibilityHint) {
    builder.putString(AP_ACCESSIBILITY_HINT, newProps.accessibilityHint);
  }

  if (oldProps.accessibilityLabel != newProps.accessibilityLabel) {
    builder.putString(AP_ACCESSIBILITY_LABEL, newProps.accessibilityLabel);
  }

  if (oldProps.accessibilityLabelledBy != newProps.accessibilityLabelledBy) {
    builder.putMapBuffer(
        AP_ACCESSIBILITY_LABELLED_BY,
        convertAccessibilityLabelledBy(newProps.accessibilityLabelledBy));
  }

  if (oldProps.accessibilityLiveRegion != newProps.accessibilityLiveRegion) {
    int value;
    switch (newProps.accessibilityLiveRegion) {
      case AccessibilityLiveRegion::None:
        value = 0;
        break;
      case AccessibilityLiveRegion::Polite:
        value = 1;
        break;
      case AccessibilityLiveRegion::Assertive:
        value = 2;
        break;
    }
    builder.putInt(AP_ACCESSIBILITY_LIVE_REGION, value);
  }

  if (oldProps.accessibilityRole != newProps.accessibilityRole) {
    builder.putString(AP_ACCESSIBILITY_ROLE, newProps.accessibilityRole);
  }

  if (oldProps.accessibilityState != newProps.accessibilityState) {
    builder.putMapBuffer(
        AP_ACCESSIBILITY_STATE,
        convertAccessibilityState(newProps.accessibilityState));
  }

  if (oldProps.accessibilityValue != newProps.accessibilityValue) {
    builder.putString(
        AP_ACCESSIBILITY_VALUE, newProps.accessibilityValue.text.value_or(""));
  }

  if (oldProps.accessible != newProps.accessible) {
    builder.putBool(AP_ACCESSIBLE, newProps.accessible);
  }

  if (oldProps.importantForAccessibility !=
      newProps.importantForAccessibility) {
    int value;
    switch (newProps.importantForAccessibility) {
      case ImportantForAccessibility::Auto:
        value = 0;
        break;
      case ImportantForAccessibility::Yes:
        value = 1;
        break;
      case ImportantForAccessibility::No:
        value = 2;
        break;
      case ImportantForAccessibility::NoHideDescendants:
        value = 3;
        break;
    }
    builder.putInt(AP_IMPORTANT_FOR_ACCESSIBILITY, value);
  }

  if (oldProps.role != newProps.role) {
    builder.putInt(AP_ROLE, static_cast<int32_t>(newProps.role));
  }
}

} // namespace facebook::react

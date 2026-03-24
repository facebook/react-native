/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AccessibilityProps.h"

#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/components/view/accessibilityPropsConversions.h>
#include <react/renderer/components/view/propsConversions.h>
#include <react/renderer/core/propsConversions.h>
#include <react/renderer/debug/debugStringConvertibleUtils.h>

namespace facebook::react {

static AccessibilityLabelledBy parseCommaSeparatedList(const std::string& str) {
  AccessibilityLabelledBy result;
  size_t pos = 0;
  while (pos < str.size()) {
    auto commaPos = str.find(',', pos);
    if (commaPos == std::string::npos) {
      commaPos = str.size();
    }
    auto start = str.find_first_not_of(' ', pos);
    if (start < commaPos) {
      auto end = str.find_last_not_of(' ', commaPos - 1);
      result.value.push_back(str.substr(start, end - start + 1));
    }
    pos = commaPos + 1;
  }
  return result;
}

AccessibilityProps::AccessibilityProps(
    const PropsParserContext& context,
    const AccessibilityProps& sourceProps,
    const RawProps& rawProps)
    : accessible(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.accessible
              : convertRawProp(
                    context,
                    rawProps,
                    "accessible",
                    sourceProps.accessible,
                    false)),
      accessibilityState(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.accessibilityState
              : convertRawProp(
                    context,
                    rawProps,
                    "accessibilityState",
                    sourceProps.accessibilityState,
                    {})),
      accessibilityLabel(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.accessibilityLabel
              : convertRawProp(
                    context,
                    rawProps,
                    "accessibilityLabel",
                    sourceProps.accessibilityLabel,
                    "")),
      accessibilityOrder(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.accessibilityOrder
              : convertRawProp(
                    context,
                    rawProps,
                    "experimental_accessibilityOrder",
                    sourceProps.accessibilityOrder,
                    {})),
      accessibilityLabelledBy(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.accessibilityLabelledBy
              : convertRawProp(
                    context,
                    rawProps,
                    "accessibilityLabelledBy",
                    sourceProps.accessibilityLabelledBy,
                    {})),
      accessibilityLiveRegion(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.accessibilityLiveRegion
              : convertRawProp(
                    context,
                    rawProps,
                    "accessibilityLiveRegion",
                    sourceProps.accessibilityLiveRegion,
                    AccessibilityLiveRegion::None)),
      accessibilityHint(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.accessibilityHint
              : convertRawProp(
                    context,
                    rawProps,
                    "accessibilityHint",
                    sourceProps.accessibilityHint,
                    "")),
      accessibilityLanguage(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.accessibilityLanguage
              : convertRawProp(
                    context,
                    rawProps,
                    "accessibilityLanguage",
                    sourceProps.accessibilityLanguage,
                    "")),
      accessibilityLargeContentTitle(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.accessibilityLargeContentTitle
              : convertRawProp(
                    context,
                    rawProps,
                    "accessibilityLargeContentTitle",
                    sourceProps.accessibilityLargeContentTitle,
                    "")),
      accessibilityValue(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.accessibilityValue
              : convertRawProp(
                    context,
                    rawProps,
                    "accessibilityValue",
                    sourceProps.accessibilityValue,
                    {})),
      accessibilityActions(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.accessibilityActions
              : convertRawProp(
                    context,
                    rawProps,
                    "accessibilityActions",
                    sourceProps.accessibilityActions,
                    {})),
      accessibilityShowsLargeContentViewer(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.accessibilityShowsLargeContentViewer
              : convertRawProp(
                    context,
                    rawProps,
                    "accessibilityShowsLargeContentViewer",
                    sourceProps.accessibilityShowsLargeContentViewer,
                    false)),
      accessibilityViewIsModal(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.accessibilityViewIsModal
              : convertRawProp(
                    context,
                    rawProps,
                    "accessibilityViewIsModal",
                    sourceProps.accessibilityViewIsModal,
                    false)),
      accessibilityElementsHidden(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.accessibilityElementsHidden
              : convertRawProp(
                    context,
                    rawProps,
                    "accessibilityElementsHidden",
                    sourceProps.accessibilityElementsHidden,
                    false)),
      accessibilityIgnoresInvertColors(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.accessibilityIgnoresInvertColors
              : convertRawProp(
                    context,
                    rawProps,
                    "accessibilityIgnoresInvertColors",
                    sourceProps.accessibilityIgnoresInvertColors,
                    false)),
      accessibilityRespondsToUserInteraction(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.accessibilityRespondsToUserInteraction
              : convertRawProp(
                    context,
                    rawProps,
                    "accessibilityRespondsToUserInteraction",
                    sourceProps.accessibilityRespondsToUserInteraction,
                    true)),
      onAccessibilityTap(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.onAccessibilityTap
              : convertRawProp(
                    context,
                    rawProps,
                    "onAccessibilityTap",
                    sourceProps.onAccessibilityTap,
                    {})),
      onAccessibilityMagicTap(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.onAccessibilityMagicTap
              : convertRawProp(
                    context,
                    rawProps,
                    "onAccessibilityMagicTap",
                    sourceProps.onAccessibilityMagicTap,
                    {})),
      onAccessibilityEscape(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.onAccessibilityEscape
              : convertRawProp(
                    context,
                    rawProps,
                    "onAccessibilityEscape",
                    sourceProps.onAccessibilityEscape,
                    {})),
      onAccessibilityAction(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.onAccessibilityAction
              : convertRawProp(
                    context,
                    rawProps,
                    "onAccessibilityAction",
                    sourceProps.onAccessibilityAction,
                    {})),
      importantForAccessibility(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.importantForAccessibility
              : convertRawProp(
                    context,
                    rawProps,
                    "importantForAccessibility",
                    sourceProps.importantForAccessibility,
                    ImportantForAccessibility::Auto)),
      testId(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.testId
              : convertRawProp(
                    context,
                    rawProps,
                    "testID",
                    sourceProps.testId,
                    "")),
      canonicalAccessibilityLabel_(sourceProps.canonicalAccessibilityLabel_),
      canonicalAccessibilityLiveRegion_(
          sourceProps.canonicalAccessibilityLiveRegion_),
      canonicalImportantForAccessibility_(
          sourceProps.canonicalImportantForAccessibility_),
      canonicalAccessibilityElementsHidden_(
          sourceProps.canonicalAccessibilityElementsHidden_) {
  // It is a (severe!) perf deoptimization to request props out-of-order.
  // Thus, since we need to request the same prop twice here
  // (accessibilityRole) we "must" do them subsequently here to prevent
  // a regression. It is reasonable to ask if the `at` function can be improved;
  // it probably can, but this is a fairly rare edge-case that (1) is easy-ish
  // to work around here, and (2) would require very careful work to address
  // this case and not regress the more common cases.
  if (ReactNativeFeatureFlags::enableCppPropsIteratorSetter()) {
    accessibilityRole = sourceProps.accessibilityRole;
    role = sourceProps.role;
    accessibilityTraits = sourceProps.accessibilityTraits;
  } else {
    auto* accessibilityRoleValue =
        rawProps.at("accessibilityRole", nullptr, nullptr);
    auto* roleValue = rawProps.at("role", nullptr, nullptr);

    auto* precedentRoleValue =
        roleValue != nullptr ? roleValue : accessibilityRoleValue;

    if (accessibilityRoleValue == nullptr ||
        !accessibilityRoleValue->hasValue()) {
      accessibilityRole = sourceProps.accessibilityRole;
    } else {
      fromRawValue(context, *accessibilityRoleValue, accessibilityRole);
    }

    if (roleValue == nullptr || !roleValue->hasValue()) {
      role = sourceProps.role;
    } else {
      fromRawValue(context, *roleValue, role);
    }

    if (precedentRoleValue == nullptr || !precedentRoleValue->hasValue()) {
      accessibilityTraits = sourceProps.accessibilityTraits;
    } else {
      fromRawValue(context, *precedentRoleValue, accessibilityTraits);
    }

    if (ReactNativeFeatureFlags::enableNativeViewPropTransformations()) {
      static auto defaults = AccessibilityProps{};

      // Update canonical values from explicit props if present.
      // These track the user-set accessibility* prop values separately
      // from any aria-* override, so we can restore them when an
      // aria-* alias is cleared.
      auto* explicitLabel = rawProps.at("accessibilityLabel", nullptr, nullptr);
      if (explicitLabel != nullptr) {
        canonicalAccessibilityLabel_ = explicitLabel->hasValue()
            ? accessibilityLabel
            : defaults.accessibilityLabel;
      }

      auto* explicitLiveRegion =
          rawProps.at("accessibilityLiveRegion", nullptr, nullptr);
      if (explicitLiveRegion != nullptr) {
        canonicalAccessibilityLiveRegion_ = explicitLiveRegion->hasValue()
            ? accessibilityLiveRegion
            : defaults.accessibilityLiveRegion;
      }

      auto* explicitIFA =
          rawProps.at("importantForAccessibility", nullptr, nullptr);
      if (explicitIFA != nullptr) {
        canonicalImportantForAccessibility_ = explicitIFA->hasValue()
            ? importantForAccessibility
            : defaults.importantForAccessibility;
      }

      auto* explicitAEH =
          rawProps.at("accessibilityElementsHidden", nullptr, nullptr);
      if (explicitAEH != nullptr) {
        canonicalAccessibilityElementsHidden_ = explicitAEH->hasValue()
            ? accessibilityElementsHidden
            : defaults.accessibilityElementsHidden;
      }

      // aria-label -> accessibilityLabel
      auto* ariaLabel = rawProps.at("aria-label", nullptr, nullptr);
      if (ariaLabel != nullptr) {
        if (ariaLabel->hasValue()) {
          fromRawValue(context, *ariaLabel, accessibilityLabel);
        } else {
          accessibilityLabel = canonicalAccessibilityLabel_;
        }
      }

      // aria-labelledby -> accessibilityLabelledBy (comma-split string ->
      // array)
      auto* ariaLabelledBy = rawProps.at("aria-labelledby", nullptr, nullptr);
      if (ariaLabelledBy != nullptr) {
        if (ariaLabelledBy->hasValue()) {
          if (ariaLabelledBy->hasType<std::string>()) {
            accessibilityLabelledBy =
                parseCommaSeparatedList((std::string)*ariaLabelledBy);
          } else {
            fromRawValue(context, *ariaLabelledBy, accessibilityLabelledBy);
          }
        } else {
          accessibilityLabelledBy = defaults.accessibilityLabelledBy;
        }
      }

      // aria-live -> accessibilityLiveRegion (map "off" -> None)
      auto* ariaLive = rawProps.at("aria-live", nullptr, nullptr);
      if (ariaLive != nullptr) {
        if (ariaLive->hasValue()) {
          if (ariaLive->hasType<std::string>()) {
            auto str = (std::string)*ariaLive;
            if (str == "off") {
              accessibilityLiveRegion = AccessibilityLiveRegion::None;
            } else {
              fromRawValue(context, *ariaLive, accessibilityLiveRegion);
            }
          }
        } else {
          accessibilityLiveRegion = canonicalAccessibilityLiveRegion_;
        }
      }

      // aria-hidden -> accessibilityElementsHidden +
      // importantForAccessibility
      auto* ariaHidden = rawProps.at("aria-hidden", nullptr, nullptr);
      if (ariaHidden != nullptr) {
        if (ariaHidden->hasValue()) {
          fromRawValue(context, *ariaHidden, accessibilityElementsHidden);
          if (accessibilityElementsHidden) {
            importantForAccessibility =
                ImportantForAccessibility::NoHideDescendants;
          } else {
            importantForAccessibility = canonicalImportantForAccessibility_;
          }
        } else {
          accessibilityElementsHidden = canonicalAccessibilityElementsHidden_;
          importantForAccessibility = canonicalImportantForAccessibility_;
        }
      }

      // aria-busy -> accessibilityState.busy
      auto* ariaBusy = rawProps.at("aria-busy", nullptr, nullptr);
      if (ariaBusy != nullptr) {
        if (ariaBusy->hasValue()) {
          if (!accessibilityState.has_value()) {
            accessibilityState = AccessibilityState{};
          }
          fromRawValue(context, *ariaBusy, accessibilityState->busy);
        } else {
          if (accessibilityState.has_value()) {
            accessibilityState->busy = AccessibilityState{}.busy;
          }
        }
      }

      // aria-checked -> accessibilityState.checked
      auto* ariaChecked = rawProps.at("aria-checked", nullptr, nullptr);
      if (ariaChecked != nullptr) {
        if (ariaChecked->hasValue()) {
          if (!accessibilityState.has_value()) {
            accessibilityState = AccessibilityState{};
          }
          if (ariaChecked->hasType<std::string>()) {
            if ((std::string)*ariaChecked == "mixed") {
              accessibilityState->checked = AccessibilityState::Mixed;
            }
          } else if (ariaChecked->hasType<bool>()) {
            accessibilityState->checked = (bool)*ariaChecked
                ? AccessibilityState::Checked
                : AccessibilityState::Unchecked;
          }
        } else {
          if (accessibilityState.has_value()) {
            accessibilityState->checked = AccessibilityState{}.checked;
          }
        }
      }

      // aria-disabled -> accessibilityState.disabled
      auto* ariaDisabled = rawProps.at("aria-disabled", nullptr, nullptr);
      if (ariaDisabled != nullptr) {
        if (ariaDisabled->hasValue()) {
          if (!accessibilityState.has_value()) {
            accessibilityState = AccessibilityState{};
          }
          fromRawValue(context, *ariaDisabled, accessibilityState->disabled);
        } else {
          if (accessibilityState.has_value()) {
            accessibilityState->disabled = AccessibilityState{}.disabled;
          }
        }
      }

      // aria-expanded -> accessibilityState.expanded
      auto* ariaExpanded = rawProps.at("aria-expanded", nullptr, nullptr);
      if (ariaExpanded != nullptr) {
        if (ariaExpanded->hasValue()) {
          if (!accessibilityState.has_value()) {
            accessibilityState = AccessibilityState{};
          }
          fromRawValue(context, *ariaExpanded, accessibilityState->expanded);
        } else {
          if (accessibilityState.has_value()) {
            accessibilityState->expanded = AccessibilityState{}.expanded;
          }
        }
      }

      // aria-selected -> accessibilityState.selected
      auto* ariaSelected = rawProps.at("aria-selected", nullptr, nullptr);
      if (ariaSelected != nullptr) {
        if (ariaSelected->hasValue()) {
          if (!accessibilityState.has_value()) {
            accessibilityState = AccessibilityState{};
          }
          fromRawValue(context, *ariaSelected, accessibilityState->selected);
        } else {
          if (accessibilityState.has_value()) {
            accessibilityState->selected = AccessibilityState{}.selected;
          }
        }
      }

      // If all aria-state fields have been reset to defaults, clear the
      // optional entirely so the view reports no accessibilityState.
      if (accessibilityState.has_value() &&
          *accessibilityState == AccessibilityState{}) {
        accessibilityState = std::nullopt;
      }

      // aria-valuemax -> accessibilityValue.max
      auto* ariaValueMax = rawProps.at("aria-valuemax", nullptr, nullptr);
      if (ariaValueMax != nullptr) {
        if (ariaValueMax->hasValue()) {
          if (ariaValueMax->hasType<int>()) {
            accessibilityValue.max = (int)*ariaValueMax;
          }
        } else {
          accessibilityValue.max = std::nullopt;
        }
      }

      // aria-valuemin -> accessibilityValue.min
      auto* ariaValueMin = rawProps.at("aria-valuemin", nullptr, nullptr);
      if (ariaValueMin != nullptr) {
        if (ariaValueMin->hasValue()) {
          if (ariaValueMin->hasType<int>()) {
            accessibilityValue.min = (int)*ariaValueMin;
          }
        } else {
          accessibilityValue.min = std::nullopt;
        }
      }

      // aria-valuenow -> accessibilityValue.now
      auto* ariaValueNow = rawProps.at("aria-valuenow", nullptr, nullptr);
      if (ariaValueNow != nullptr) {
        if (ariaValueNow->hasValue()) {
          if (ariaValueNow->hasType<int>()) {
            accessibilityValue.now = (int)*ariaValueNow;
          }
        } else {
          accessibilityValue.now = std::nullopt;
        }
      }

      // aria-valuetext -> accessibilityValue.text
      auto* ariaValueText = rawProps.at("aria-valuetext", nullptr, nullptr);
      if (ariaValueText != nullptr) {
        if (ariaValueText->hasValue()) {
          if (ariaValueText->hasType<std::string>()) {
            accessibilityValue.text = (std::string)*ariaValueText;
          }
        } else {
          accessibilityValue.text = std::nullopt;
        }
      }
    }
  }
}

void AccessibilityProps::setProp(
    const PropsParserContext& context,
    RawPropsPropNameHash hash,
    const char* /*propName*/,
    const RawValue& value) {
  static auto defaults = AccessibilityProps{};

  switch (hash) {
    RAW_SET_PROP_SWITCH_CASE_BASIC(accessible);
    RAW_SET_PROP_SWITCH_CASE_BASIC(accessibilityState);
    case CONSTEXPR_RAW_PROPS_KEY_HASH("accessibilityLabel"): {
      fromRawValue(
          context, value, accessibilityLabel, defaults.accessibilityLabel);
      canonicalAccessibilityLabel_ = accessibilityLabel;
      return;
    }
      RAW_SET_PROP_SWITCH_CASE_BASIC(accessibilityOrder);
      RAW_SET_PROP_SWITCH_CASE_BASIC(accessibilityLabelledBy);
    case CONSTEXPR_RAW_PROPS_KEY_HASH("accessibilityLiveRegion"): {
      fromRawValue(
          context,
          value,
          accessibilityLiveRegion,
          defaults.accessibilityLiveRegion);
      canonicalAccessibilityLiveRegion_ = accessibilityLiveRegion;
      return;
    }
      RAW_SET_PROP_SWITCH_CASE_BASIC(accessibilityHint);
      RAW_SET_PROP_SWITCH_CASE_BASIC(accessibilityLanguage);
      RAW_SET_PROP_SWITCH_CASE_BASIC(accessibilityShowsLargeContentViewer);
      RAW_SET_PROP_SWITCH_CASE_BASIC(accessibilityLargeContentTitle);
      RAW_SET_PROP_SWITCH_CASE_BASIC(accessibilityValue);
      RAW_SET_PROP_SWITCH_CASE_BASIC(accessibilityActions);
      RAW_SET_PROP_SWITCH_CASE_BASIC(accessibilityViewIsModal);
    case CONSTEXPR_RAW_PROPS_KEY_HASH("accessibilityElementsHidden"): {
      fromRawValue(
          context,
          value,
          accessibilityElementsHidden,
          defaults.accessibilityElementsHidden);
      canonicalAccessibilityElementsHidden_ = accessibilityElementsHidden;
      return;
    }
      RAW_SET_PROP_SWITCH_CASE_BASIC(accessibilityIgnoresInvertColors);
      RAW_SET_PROP_SWITCH_CASE_BASIC(accessibilityRespondsToUserInteraction);
      RAW_SET_PROP_SWITCH_CASE_BASIC(onAccessibilityTap);
      RAW_SET_PROP_SWITCH_CASE_BASIC(onAccessibilityMagicTap);
      RAW_SET_PROP_SWITCH_CASE_BASIC(onAccessibilityEscape);
      RAW_SET_PROP_SWITCH_CASE_BASIC(onAccessibilityAction);
    case CONSTEXPR_RAW_PROPS_KEY_HASH("importantForAccessibility"): {
      fromRawValue(
          context,
          value,
          importantForAccessibility,
          defaults.importantForAccessibility);
      canonicalImportantForAccessibility_ = importantForAccessibility;
      return;
    }
      RAW_SET_PROP_SWITCH_CASE_BASIC(role);
      RAW_SET_PROP_SWITCH_CASE(testId, "testID");
    case CONSTEXPR_RAW_PROPS_KEY_HASH("accessibilityRole"): {
      AccessibilityTraits traits = AccessibilityTraits::None;
      std::string roleString;
      if (value.hasValue()) {
        fromRawValue(context, value, traits);
        fromRawValue(context, value, roleString);
      }

      accessibilityTraits = traits;
      accessibilityRole = roleString;
      return;
    }
    case CONSTEXPR_RAW_PROPS_KEY_HASH("aria-label"): {
      if (!ReactNativeFeatureFlags::enableNativeViewPropTransformations()) {
        return;
      }
      if (value.hasValue()) {
        fromRawValue(context, value, accessibilityLabel);
      } else {
        accessibilityLabel = canonicalAccessibilityLabel_;
      }
      return;
    }
    case CONSTEXPR_RAW_PROPS_KEY_HASH("aria-labelledby"): {
      if (!ReactNativeFeatureFlags::enableNativeViewPropTransformations()) {
        return;
      }
      if (value.hasValue()) {
        if (value.hasType<std::string>()) {
          accessibilityLabelledBy = parseCommaSeparatedList((std::string)value);
        } else {
          fromRawValue(context, value, accessibilityLabelledBy);
        }
      } else {
        accessibilityLabelledBy = defaults.accessibilityLabelledBy;
      }
      return;
    }
    case CONSTEXPR_RAW_PROPS_KEY_HASH("aria-live"): {
      if (!ReactNativeFeatureFlags::enableNativeViewPropTransformations()) {
        return;
      }
      if (value.hasValue()) {
        if (value.hasType<std::string>()) {
          auto str = (std::string)value;
          if (str == "off") {
            accessibilityLiveRegion = AccessibilityLiveRegion::None;
          } else {
            fromRawValue(context, value, accessibilityLiveRegion);
          }
        }
      } else {
        accessibilityLiveRegion = canonicalAccessibilityLiveRegion_;
      }
      return;
    }
    case CONSTEXPR_RAW_PROPS_KEY_HASH("aria-hidden"): {
      if (!ReactNativeFeatureFlags::enableNativeViewPropTransformations()) {
        return;
      }
      if (value.hasValue()) {
        fromRawValue(context, value, accessibilityElementsHidden);
        if (accessibilityElementsHidden) {
          importantForAccessibility =
              ImportantForAccessibility::NoHideDescendants;
        } else {
          importantForAccessibility = canonicalImportantForAccessibility_;
        }
      } else {
        accessibilityElementsHidden = canonicalAccessibilityElementsHidden_;
        importantForAccessibility = canonicalImportantForAccessibility_;
      }
      return;
    }
    case CONSTEXPR_RAW_PROPS_KEY_HASH("aria-busy"): {
      if (!ReactNativeFeatureFlags::enableNativeViewPropTransformations()) {
        return;
      }
      if (value.hasValue()) {
        if (!accessibilityState.has_value()) {
          accessibilityState = AccessibilityState{};
        }
        fromRawValue(context, value, accessibilityState->busy);
      } else {
        if (accessibilityState.has_value()) {
          accessibilityState->busy = AccessibilityState{}.busy;
          if (*accessibilityState == AccessibilityState{}) {
            accessibilityState = std::nullopt;
          }
        }
      }
      return;
    }
    case CONSTEXPR_RAW_PROPS_KEY_HASH("aria-checked"): {
      if (!ReactNativeFeatureFlags::enableNativeViewPropTransformations()) {
        return;
      }
      if (value.hasValue()) {
        if (!accessibilityState.has_value()) {
          accessibilityState = AccessibilityState{};
        }
        if (value.hasType<std::string>()) {
          if ((std::string)value == "mixed") {
            accessibilityState->checked = AccessibilityState::Mixed;
          }
        } else if (value.hasType<bool>()) {
          accessibilityState->checked = (bool)value
              ? AccessibilityState::Checked
              : AccessibilityState::Unchecked;
        }
      } else {
        if (accessibilityState.has_value()) {
          accessibilityState->checked = AccessibilityState{}.checked;
          if (*accessibilityState == AccessibilityState{}) {
            accessibilityState = std::nullopt;
          }
        }
      }
      return;
    }
    case CONSTEXPR_RAW_PROPS_KEY_HASH("aria-disabled"): {
      if (!ReactNativeFeatureFlags::enableNativeViewPropTransformations()) {
        return;
      }
      if (value.hasValue()) {
        if (!accessibilityState.has_value()) {
          accessibilityState = AccessibilityState{};
        }
        fromRawValue(context, value, accessibilityState->disabled);
      } else {
        if (accessibilityState.has_value()) {
          accessibilityState->disabled = AccessibilityState{}.disabled;
          if (*accessibilityState == AccessibilityState{}) {
            accessibilityState = std::nullopt;
          }
        }
      }
      return;
    }
    case CONSTEXPR_RAW_PROPS_KEY_HASH("aria-expanded"): {
      if (!ReactNativeFeatureFlags::enableNativeViewPropTransformations()) {
        return;
      }
      if (value.hasValue()) {
        if (!accessibilityState.has_value()) {
          accessibilityState = AccessibilityState{};
        }
        fromRawValue(context, value, accessibilityState->expanded);
      } else {
        if (accessibilityState.has_value()) {
          accessibilityState->expanded = AccessibilityState{}.expanded;
          if (*accessibilityState == AccessibilityState{}) {
            accessibilityState = std::nullopt;
          }
        }
      }
      return;
    }
    case CONSTEXPR_RAW_PROPS_KEY_HASH("aria-selected"): {
      if (!ReactNativeFeatureFlags::enableNativeViewPropTransformations()) {
        return;
      }
      if (value.hasValue()) {
        if (!accessibilityState.has_value()) {
          accessibilityState = AccessibilityState{};
        }
        fromRawValue(context, value, accessibilityState->selected);
      } else {
        if (accessibilityState.has_value()) {
          accessibilityState->selected = AccessibilityState{}.selected;
          if (*accessibilityState == AccessibilityState{}) {
            accessibilityState = std::nullopt;
          }
        }
      }
      return;
    }
    case CONSTEXPR_RAW_PROPS_KEY_HASH("aria-valuemax"): {
      if (!ReactNativeFeatureFlags::enableNativeViewPropTransformations()) {
        return;
      }
      if (value.hasValue()) {
        if (value.hasType<int>()) {
          accessibilityValue.max = (int)value;
        }
      } else {
        accessibilityValue.max = std::nullopt;
      }
      return;
    }
    case CONSTEXPR_RAW_PROPS_KEY_HASH("aria-valuemin"): {
      if (!ReactNativeFeatureFlags::enableNativeViewPropTransformations()) {
        return;
      }
      if (value.hasValue()) {
        if (value.hasType<int>()) {
          accessibilityValue.min = (int)value;
        }
      } else {
        accessibilityValue.min = std::nullopt;
      }
      return;
    }
    case CONSTEXPR_RAW_PROPS_KEY_HASH("aria-valuenow"): {
      if (!ReactNativeFeatureFlags::enableNativeViewPropTransformations()) {
        return;
      }
      if (value.hasValue()) {
        if (value.hasType<int>()) {
          accessibilityValue.now = (int)value;
        }
      } else {
        accessibilityValue.now = std::nullopt;
      }
      return;
    }
    case CONSTEXPR_RAW_PROPS_KEY_HASH("aria-valuetext"): {
      if (!ReactNativeFeatureFlags::enableNativeViewPropTransformations()) {
        return;
      }
      if (value.hasValue()) {
        if (value.hasType<std::string>()) {
          accessibilityValue.text = (std::string)value;
        }
      } else {
        accessibilityValue.text = std::nullopt;
      }
      return;
    }
  }
}

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE

SharedDebugStringConvertibleList AccessibilityProps::getDebugProps() const {
  const auto& defaultProps = AccessibilityProps();
  return SharedDebugStringConvertibleList{
      debugStringConvertibleItem(
          "accessibilityRole",
          accessibilityRole,
          defaultProps.accessibilityRole),
      debugStringConvertibleItem(
          "accessible", accessible, defaultProps.accessible),
      debugStringConvertibleItem(
          "accessibilityActions",
          accessibilityActions,
          defaultProps.accessibilityActions),
      debugStringConvertibleItem(
          "accessibilityState",
          accessibilityState,
          defaultProps.accessibilityState),
      debugStringConvertibleItem(
          "accessibilityElementsHidden",
          accessibilityElementsHidden,
          defaultProps.accessibilityElementsHidden),
      debugStringConvertibleItem(
          "accessibilityHint",
          accessibilityHint,
          defaultProps.accessibilityHint),
      debugStringConvertibleItem(
          "accessibilityLabel",
          accessibilityLabel,
          defaultProps.accessibilityLabel),
      debugStringConvertibleItem(
          "accessibilityLiveRegion",
          accessibilityLiveRegion,
          defaultProps.accessibilityLiveRegion),
      debugStringConvertibleItem(
          "importantForAccessibility",
          importantForAccessibility,
          defaultProps.importantForAccessibility),
      debugStringConvertibleItem("testID", testId, defaultProps.testId),
  };
}
#endif // RN_DEBUG_STRING_CONVERTIBLE

} // namespace facebook::react

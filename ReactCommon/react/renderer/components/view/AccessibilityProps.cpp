/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AccessibilityProps.h"

#include <react/renderer/components/view/accessibilityPropsConversions.h>
#include <react/renderer/components/view/propsConversions.h>
#include <react/renderer/core/propsConversions.h>
#include <react/renderer/debug/debugStringConvertibleUtils.h>

namespace facebook {
namespace react {

AccessibilityProps::AccessibilityProps(
    const PropsParserContext &context,
    AccessibilityProps const &sourceProps,
    RawProps const &rawProps)
    : accessible(convertRawProp(
          context,
          rawProps,
          "accessible",
          sourceProps.accessible,
          false)),
      accessibilityTraits(convertRawProp(
          context,
          rawProps,
          "accessibilityRole",
          sourceProps.accessibilityTraits,
          AccessibilityTraits::None)),
      accessibilityState(convertRawProp(
          context,
          rawProps,
          "accessibilityState",
          sourceProps.accessibilityState,
          {})),
      accessibilityLabel(convertRawProp(
          context,
          rawProps,
          "accessibilityLabel",
          sourceProps.accessibilityLabel,
          "")),
      accessibilityLabelledBy(convertRawProp(
          context,
          rawProps,
          "accessibilityLabelledBy",
          sourceProps.accessibilityLabelledBy,
          {})),
      accessibilityLiveRegion(convertRawProp(
          context,
          rawProps,
          "accessibilityLiveRegion",
          sourceProps.accessibilityLiveRegion,
          AccessibilityLiveRegion::None)),
      accessibilityRole(convertRawProp(
          context,
          rawProps,
          "accessibilityRole",
          sourceProps.accessibilityRole,
          "")),
      accessibilityHint(convertRawProp(
          context,
          rawProps,
          "accessibilityHint",
          sourceProps.accessibilityHint,
          "")),
      accessibilityLanguage(convertRawProp(
          context,
          rawProps,
          "accessibilityLanguage",
          sourceProps.accessibilityLanguage,
          "")),
      accessibilityValue(convertRawProp(
          context,
          rawProps,
          "accessibilityValue",
          sourceProps.accessibilityValue,
          {})),
      accessibilityActions(convertRawProp(
          context,
          rawProps,
          "accessibilityActions",
          sourceProps.accessibilityActions,
          {})),
      accessibilityViewIsModal(convertRawProp(
          context,
          rawProps,
          "accessibilityViewIsModal",
          sourceProps.accessibilityViewIsModal,
          false)),
      accessibilityElementsHidden(convertRawProp(
          context,
          rawProps,
          "accessibilityElementsHidden",
          sourceProps.accessibilityElementsHidden,
          false)),
      accessibilityIgnoresInvertColors(convertRawProp(
          context,
          rawProps,
          "accessibilityIgnoresInvertColors",
          sourceProps.accessibilityIgnoresInvertColors,
          false)),
      onAccessibilityTap(convertRawProp(
          context,
          rawProps,
          "onAccessibilityTap",
          sourceProps.onAccessibilityTap,
          {})),
      onAccessibilityMagicTap(convertRawProp(
          context,
          rawProps,
          "onAccessibilityMagicTap",
          sourceProps.onAccessibilityMagicTap,
          {})),
      onAccessibilityEscape(convertRawProp(
          context,
          rawProps,
          "onAccessibilityEscape",
          sourceProps.onAccessibilityEscape,
          {})),
      onAccessibilityAction(convertRawProp(
          context,
          rawProps,
          "onAccessibilityAction",
          sourceProps.onAccessibilityAction,
          {})),
      importantForAccessibility(convertRawProp(
          context,
          rawProps,
          "importantForAccessibility",
          sourceProps.importantForAccessibility,
          ImportantForAccessibility::Auto)),
      testId(
          convertRawProp(context, rawProps, "testID", sourceProps.testId, "")) {
}

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList AccessibilityProps::getDebugProps() const {
  auto const &defaultProps = AccessibilityProps();
  return SharedDebugStringConvertibleList{
      debugStringConvertibleItem("testId", testId, defaultProps.testId),
  };
}
#endif // RN_DEBUG_STRING_CONVERTIBLE

} // namespace react
} // namespace facebook

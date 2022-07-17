/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ViewShadowNode.h"
#include <react/config/ReactNativeConfig.h>
#include <react/renderer/components/view/primitives.h>

namespace facebook {
namespace react {

char const ViewComponentName[] = "View";

static inline bool keepRawValuesInViewProps(PropsParserContext const &context) {
  static bool shouldUseRawProps = true;

#ifdef ANDROID
  static bool initialized = false;

  if (!initialized) {
    auto config =
        context.contextContainer.find<std::shared_ptr<const ReactNativeConfig>>(
            "ReactNativeConfig");
    if (config.has_value()) {
      initialized = true;
      shouldUseRawProps = !config.value()->getBool(
          "react_native_new_architecture:use_mapbuffer_for_viewprops");
    }
  }
#endif

  return shouldUseRawProps;
}

ViewShadowNodeProps::ViewShadowNodeProps(
    PropsParserContext const &context,
    ViewShadowNodeProps const &sourceProps,
    RawProps const &rawProps)
    : ViewProps(
          context,
          sourceProps,
          rawProps,
          keepRawValuesInViewProps(context)){};

ViewShadowNode::ViewShadowNode(
    ShadowNodeFragment const &fragment,
    ShadowNodeFamily::Shared const &family,
    ShadowNodeTraits traits)
    : ConcreteViewShadowNode(fragment, family, traits) {
  initialize();
}

ViewShadowNode::ViewShadowNode(
    ShadowNode const &sourceShadowNode,
    ShadowNodeFragment const &fragment)
    : ConcreteViewShadowNode(sourceShadowNode, fragment) {
  initialize();
}

void ViewShadowNode::initialize() noexcept {
  auto &viewProps = static_cast<ViewProps const &>(*props_);

  bool formsStackingContext = !viewProps.collapsable ||
      viewProps.pointerEvents == PointerEventsMode::None ||
      !viewProps.nativeId.empty() || viewProps.accessible ||
      viewProps.opacity != 1.0 || viewProps.transform != Transform{} ||
      (viewProps.zIndex.has_value() &&
       viewProps.yogaStyle.positionType() != YGPositionTypeStatic) ||
      viewProps.yogaStyle.display() == YGDisplayNone ||
      viewProps.getClipsContentToBounds() || viewProps.events.bits.any() ||
      isColorMeaningful(viewProps.shadowColor) ||
      viewProps.accessibilityElementsHidden ||
      viewProps.accessibilityViewIsModal ||
      viewProps.importantForAccessibility != ImportantForAccessibility::Auto ||
      viewProps.removeClippedSubviews;

#ifdef ANDROID
  formsStackingContext = formsStackingContext || viewProps.elevation != 0;
#endif

  bool formsView = formsStackingContext ||
      isColorMeaningful(viewProps.backgroundColor) ||
      isColorMeaningful(viewProps.foregroundColor) ||
      !(viewProps.yogaStyle.border() == YGStyle::Edges{}) ||
      !viewProps.testId.empty();

#ifdef ANDROID
  formsView = formsView || viewProps.nativeBackground.has_value() ||
      viewProps.nativeForeground.has_value() || viewProps.focusable ||
      viewProps.hasTVPreferredFocus ||
      viewProps.needsOffscreenAlphaCompositing ||
      viewProps.renderToHardwareTextureAndroid;
#endif

  if (formsView) {
    traits_.set(ShadowNodeTraits::Trait::FormsView);
  } else {
    traits_.unset(ShadowNodeTraits::Trait::FormsView);
  }

  if (formsStackingContext) {
    traits_.set(ShadowNodeTraits::Trait::FormsStackingContext);
  } else {
    traits_.unset(ShadowNodeTraits::Trait::FormsStackingContext);
  }
}

} // namespace react
} // namespace facebook

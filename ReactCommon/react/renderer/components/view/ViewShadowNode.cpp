/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ViewShadowNode.h"
#include <react/renderer/components/view/primitives.h>

namespace facebook {
namespace react {

char const ViewComponentName[] = "View";

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
      viewProps.elevation != 0 ||
      (viewProps.zIndex.has_value() &&
       viewProps.yogaStyle.positionType() != YGPositionTypeStatic) ||
      viewProps.yogaStyle.display() == YGDisplayNone ||
      viewProps.getClipsContentToBounds() ||
      isColorMeaningful(viewProps.shadowColor) ||
      viewProps.accessibilityElementsHidden ||
      viewProps.importantForAccessibility != ImportantForAccessibility::Auto ||
      viewProps.removeClippedSubviews;

  bool formsView = isColorMeaningful(viewProps.backgroundColor) ||
      isColorMeaningful(viewProps.foregroundColor) ||
      !(viewProps.yogaStyle.border() == YGStyle::Edges{}) ||
      !viewProps.testId.empty();

  formsView = formsView || formsStackingContext;

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

/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ViewShadowNode.h"
#include <react/components/view/primitives.h>

namespace facebook {
namespace react {

const char ViewComponentName[] = "View";

bool ViewShadowNode::isLayoutOnly() const {
  const auto &viewProps = *std::static_pointer_cast<const ViewProps>(props_);

  return viewProps.collapsable &&
      // Generic Props
      viewProps.nativeId.empty() &&
      // Accessibility Props
      !viewProps.accessible &&
      // Pointer events Props
      (viewProps.pointerEvents == PointerEventsMode::Auto ||
       viewProps.pointerEvents == PointerEventsMode::BoxNone) &&
      // Style Props
      viewProps.opacity == 1.0 && !viewProps.backgroundColor &&
      !viewProps.foregroundColor && !viewProps.shadowColor &&
      viewProps.transform == Transform{} && viewProps.zIndex == 0 &&
      !viewProps.getClipsContentToBounds() &&
      // Layout Metrics
      getLayoutMetrics().borderWidth == EdgeInsets{};
}

ViewShadowNode::ViewShadowNode(
    ShadowNodeFragment const &fragment,
    ShadowNodeFamily::Shared const &family,
    ShadowNodeTraits traits)
    : ConcreteViewShadowNode(fragment, family, traits) {
  updateTraits();
}

ViewShadowNode::ViewShadowNode(
    ShadowNode const &sourceShadowNode,
    ShadowNodeFragment const &fragment)
    : ConcreteViewShadowNode(sourceShadowNode, fragment) {
  updateTraits();
}

static bool isColorMeaningful(SharedColor const &color) {
  if (!color) {
    return false;
  }

  return colorComponentsFromColor(color).alpha > 0;
}

void ViewShadowNode::updateTraits() {
  auto &viewProps = static_cast<ViewProps const &>(*props_);

  bool formsStackingContext = !viewProps.collapsable ||
      viewProps.pointerEvents == PointerEventsMode::None ||
      !viewProps.nativeId.empty() || viewProps.accessible ||
      viewProps.opacity != 1.0 || viewProps.transform != Transform{} ||
      viewProps.zIndex != 0 || viewProps.getClipsContentToBounds() ||
      viewProps.yogaStyle.positionType() == YGPositionTypeAbsolute;

  bool formsView = isColorMeaningful(viewProps.backgroundColor) ||
      isColorMeaningful(viewProps.foregroundColor) ||
      isColorMeaningful(viewProps.shadowColor) ||
      !(viewProps.yogaStyle.border() == YGStyle::Edges{});

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

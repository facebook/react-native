/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "LayoutableShadowNode.h"

#include <react/core/LayoutConstraints.h>
#include <react/core/LayoutContext.h>
#include <react/core/LayoutMetrics.h>
#include <react/core/ShadowNode.h>
#include <react/debug/DebugStringConvertibleItem.h>
#include <react/graphics/conversions.h>

namespace facebook {
namespace react {

LayoutMetrics LayoutableShadowNode::getLayoutMetrics() const {
  return layoutMetrics_;
}

bool LayoutableShadowNode::setLayoutMetrics(LayoutMetrics layoutMetrics) {
  if (layoutMetrics_ == layoutMetrics) {
    return false;
  }

  ensureUnsealed();

  layoutMetrics_ = layoutMetrics;
  return true;
}

bool LayoutableShadowNode::LayoutableShadowNode::isLayoutOnly() const {
  return false;
}

LayoutMetrics LayoutableShadowNode::getRelativeLayoutMetrics(
    const LayoutableShadowNode &ancestorLayoutableShadowNode) const {
  std::vector<std::reference_wrapper<const ShadowNode>> ancestors;

  auto &ancestorShadowNode =
      dynamic_cast<const ShadowNode &>(ancestorLayoutableShadowNode);
  auto &shadowNode = dynamic_cast<const ShadowNode &>(*this);

  if (!shadowNode.constructAncestorPath(ancestorShadowNode, ancestors)) {
    return EmptyLayoutMetrics;
  }

  auto layoutMetrics = getLayoutMetrics();

  for (const auto &currentShadowNode : ancestors) {
    auto layoutableCurrentShadowNode =
        dynamic_cast<const LayoutableShadowNode *>(&currentShadowNode.get());

    if (!layoutableCurrentShadowNode) {
      return EmptyLayoutMetrics;
    }

    layoutMetrics.frame.origin +=
        layoutableCurrentShadowNode->getLayoutMetrics().frame.origin;
  }

  return layoutMetrics;
}

void LayoutableShadowNode::cleanLayout() {
  isLayoutClean_ = true;
}

void LayoutableShadowNode::dirtyLayout() {
  isLayoutClean_ = false;
}

bool LayoutableShadowNode::getIsLayoutClean() const {
  return isLayoutClean_;
}

bool LayoutableShadowNode::getHasNewLayout() const {
  return hasNewLayout_;
};

void LayoutableShadowNode::setHasNewLayout(bool hasNewLayout) {
  hasNewLayout_ = hasNewLayout;
}

Size LayoutableShadowNode::measure(LayoutConstraints layoutConstraints) const {
  return Size();
}

Float LayoutableShadowNode::firstBaseline(Size size) const {
  return 0;
}

Float LayoutableShadowNode::lastBaseline(Size size) const {
  return 0;
}

void LayoutableShadowNode::layout(LayoutContext layoutContext) {
  layoutChildren(layoutContext);

  for (auto child : getLayoutableChildNodes()) {
    if (!child->getHasNewLayout()) {
      continue;
    }

    child->ensureUnsealed();
    child->setHasNewLayout(false);

    const auto childLayoutMetrics = child->getLayoutMetrics();
    if (childLayoutMetrics.displayType == DisplayType::None) {
      continue;
    }

    auto childLayoutContext = LayoutContext(layoutContext);
    childLayoutContext.absolutePosition += childLayoutMetrics.frame.origin;

    child->layout(layoutContext);
  }
}

void LayoutableShadowNode::layoutChildren(LayoutContext layoutContext) {
  // Default implementation does nothing.
}

#if RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList LayoutableShadowNode::getDebugProps() const {
  auto list = SharedDebugStringConvertibleList{};

  if (getHasNewLayout()) {
    list.push_back(
        std::make_shared<DebugStringConvertibleItem>("hasNewLayout"));
  }

  if (!getIsLayoutClean()) {
    list.push_back(std::make_shared<DebugStringConvertibleItem>("dirty"));
  }

  auto layoutMetrics = getLayoutMetrics();
  auto defaultLayoutMetrics = LayoutMetrics();

  list.push_back(std::make_shared<DebugStringConvertibleItem>(
      "frame", toString(layoutMetrics.frame)));

  if (layoutMetrics.borderWidth != defaultLayoutMetrics.borderWidth) {
    list.push_back(std::make_shared<DebugStringConvertibleItem>(
        "borderWidth", toString(layoutMetrics.borderWidth)));
  }

  if (layoutMetrics.contentInsets != defaultLayoutMetrics.contentInsets) {
    list.push_back(std::make_shared<DebugStringConvertibleItem>(
        "contentInsets", toString(layoutMetrics.contentInsets)));
  }

  if (layoutMetrics.displayType == DisplayType::None) {
    list.push_back(std::make_shared<DebugStringConvertibleItem>("hidden"));
  }

  if (layoutMetrics.layoutDirection == LayoutDirection::RightToLeft) {
    list.push_back(std::make_shared<DebugStringConvertibleItem>("rtl"));
  }

  return list;
}
#endif

} // namespace react
} // namespace facebook

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <yoga/Yoga.h>
#include <yoga/debug/AssertFatal.h>
#include <yoga/node/Node.h>

using namespace facebook;
using namespace facebook::yoga;

namespace {

template <auto LayoutMember>
float getResolvedLayoutProperty(
    const YGNodeConstRef nodeRef,
    const YGEdge edge) {
  const auto node = resolveRef(nodeRef);
  yoga::assertFatalWithNode(
      node,
      edge <= YGEdgeEnd,
      "Cannot get layout properties of multi-edge shorthands");

  if (edge == YGEdgeStart) {
    if (node->getLayout().direction() == Direction::RTL) {
      return (node->getLayout().*LayoutMember)[YGEdgeRight];
    } else {
      return (node->getLayout().*LayoutMember)[YGEdgeLeft];
    }
  }

  if (edge == YGEdgeEnd) {
    if (node->getLayout().direction() == Direction::RTL) {
      return (node->getLayout().*LayoutMember)[YGEdgeLeft];
    } else {
      return (node->getLayout().*LayoutMember)[YGEdgeRight];
    }
  }

  return (node->getLayout().*LayoutMember)[edge];
}

} // namespace

float YGNodeLayoutGetLeft(const YGNodeConstRef node) {
  return resolveRef(node)->getLayout().position[YGEdgeLeft];
}

float YGNodeLayoutGetTop(const YGNodeConstRef node) {
  return resolveRef(node)->getLayout().position[YGEdgeTop];
}

float YGNodeLayoutGetRight(const YGNodeConstRef node) {
  return resolveRef(node)->getLayout().position[YGEdgeRight];
}

float YGNodeLayoutGetBottom(const YGNodeConstRef node) {
  return resolveRef(node)->getLayout().position[YGEdgeBottom];
}

float YGNodeLayoutGetWidth(const YGNodeConstRef node) {
  return resolveRef(node)->getLayout().dimension(Dimension::Width);
}

float YGNodeLayoutGetHeight(const YGNodeConstRef node) {
  return resolveRef(node)->getLayout().dimension(Dimension::Height);
}

YGDirection YGNodeLayoutGetDirection(const YGNodeConstRef node) {
  return unscopedEnum(resolveRef(node)->getLayout().direction());
}

bool YGNodeLayoutGetHadOverflow(const YGNodeConstRef node) {
  return resolveRef(node)->getLayout().hadOverflow();
}

float YGNodeLayoutGetMargin(YGNodeConstRef node, YGEdge edge) {
  return getResolvedLayoutProperty<&LayoutResults::margin>(node, edge);
}

float YGNodeLayoutGetBorder(YGNodeConstRef node, YGEdge edge) {
  return getResolvedLayoutProperty<&LayoutResults::border>(node, edge);
}

float YGNodeLayoutGetPadding(YGNodeConstRef node, YGEdge edge) {
  return getResolvedLayoutProperty<&LayoutResults::padding>(node, edge);
}

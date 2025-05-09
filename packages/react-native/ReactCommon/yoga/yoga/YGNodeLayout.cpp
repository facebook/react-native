/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <yoga/Yoga.h>
#include <yoga/debug/AssertFatal.h>
#include <yoga/enums/Edge.h>
#include <yoga/node/Node.h>

using namespace facebook;
using namespace facebook::yoga;

namespace {

template <auto LayoutMember>
float getResolvedLayoutProperty(const YGNodeConstRef nodeRef, const Edge edge) {
  const auto node = resolveRef(nodeRef);
  yoga::assertFatalWithNode(
      node,
      edge <= Edge::End,
      "Cannot get layout properties of multi-edge shorthands");

  if (edge == Edge::Start) {
    if (node->getLayout().direction() == Direction::RTL) {
      return (node->getLayout().*LayoutMember)(PhysicalEdge::Right);
    } else {
      return (node->getLayout().*LayoutMember)(PhysicalEdge::Left);
    }
  }

  if (edge == Edge::End) {
    if (node->getLayout().direction() == Direction::RTL) {
      return (node->getLayout().*LayoutMember)(PhysicalEdge::Left);
    } else {
      return (node->getLayout().*LayoutMember)(PhysicalEdge::Right);
    }
  }

  return (node->getLayout().*LayoutMember)(static_cast<PhysicalEdge>(edge));
}

} // namespace

float YGNodeLayoutGetLeft(const YGNodeConstRef node) {
  return resolveRef(node)->getLayout().position(PhysicalEdge::Left);
}

float YGNodeLayoutGetTop(const YGNodeConstRef node) {
  return resolveRef(node)->getLayout().position(PhysicalEdge::Top);
}

float YGNodeLayoutGetRight(const YGNodeConstRef node) {
  return resolveRef(node)->getLayout().position(PhysicalEdge::Right);
}

float YGNodeLayoutGetBottom(const YGNodeConstRef node) {
  return resolveRef(node)->getLayout().position(PhysicalEdge::Bottom);
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
  return getResolvedLayoutProperty<&LayoutResults::margin>(
      node, scopedEnum(edge));
}

float YGNodeLayoutGetBorder(YGNodeConstRef node, YGEdge edge) {
  return getResolvedLayoutProperty<&LayoutResults::border>(
      node, scopedEnum(edge));
}

float YGNodeLayoutGetPadding(YGNodeConstRef node, YGEdge edge) {
  return getResolvedLayoutProperty<&LayoutResults::padding>(
      node, scopedEnum(edge));
}

float YGNodeLayoutGetRawHeight(YGNodeConstRef node) {
  return resolveRef(node)->getLayout().rawDimension(Dimension::Height);
}

float YGNodeLayoutGetRawWidth(YGNodeConstRef node) {
  return resolveRef(node)->getLayout().rawDimension(Dimension::Width);
}

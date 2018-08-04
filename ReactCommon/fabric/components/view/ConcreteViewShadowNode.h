/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fabric/components/view/AccessibleShadowNode.h>
#include <fabric/components/view/ViewEventEmitter.h>
#include <fabric/components/view/ViewProps.h>
#include <fabric/components/view/YogaLayoutableShadowNode.h>
#include <fabric/core/ConcreteShadowNode.h>
#include <fabric/core/LayoutableShadowNode.h>
#include <fabric/core/ShadowNode.h>
#include <fabric/core/ShadowNodeFragment.h>
#include <fabric/debug/DebugStringConvertibleItem.h>

namespace facebook {
namespace react {

/*
 * Template for all <View>-like classes (classes which have all same props
 * as <View> and similar basic behaviour).
 * For example: <Paragraph>, <Image>, but not <Text>, <RawText>.
 */
template <
  const char *concreteComponentName,
  typename ViewPropsT = ViewProps,
  typename ViewEventEmitterT = ViewEventEmitter
>
class ConcreteViewShadowNode:
  public ConcreteShadowNode<
    concreteComponentName,
    ViewPropsT,
    ViewEventEmitterT
  >,
  public AccessibleShadowNode,
  public YogaLayoutableShadowNode {

  static_assert(std::is_base_of<ViewProps, ViewPropsT>::value, "ViewPropsT must be a descendant of ViewProps");
  static_assert(std::is_base_of<YogaStylableProps, ViewPropsT>::value, "ViewPropsT must be a descendant of YogaStylableProps");
  static_assert(std::is_base_of<AccessibilityProps, ViewPropsT>::value, "ViewPropsT must be a descendant of AccessibilityProps");

public:
  using BaseShadowNode = ConcreteShadowNode<
    concreteComponentName,
    ViewPropsT,
    ViewEventEmitterT
  >;
  using ConcreteViewProps = ViewPropsT;

  ConcreteViewShadowNode(
    const ShadowNodeFragment &fragment,
    const ShadowNodeCloneFunction &cloneFunction
  ):
    BaseShadowNode(
      fragment,
      cloneFunction
    ),
    AccessibleShadowNode(
      std::static_pointer_cast<const ConcreteViewProps>(fragment.props)
    ),
    YogaLayoutableShadowNode() {

    YogaLayoutableShadowNode::setProps(*std::static_pointer_cast<const ConcreteViewProps>(fragment.props));
    YogaLayoutableShadowNode::setChildren(BaseShadowNode::template getChildrenSlice<YogaLayoutableShadowNode>());
  };

  ConcreteViewShadowNode(
    const ShadowNode &sourceShadowNode,
    const ShadowNodeFragment &fragment
  ):
    BaseShadowNode(
      sourceShadowNode,
      fragment
    ),
    AccessibleShadowNode(
      static_cast<const ConcreteViewShadowNode &>(sourceShadowNode),
      std::static_pointer_cast<const ConcreteViewProps>(fragment.props)
    ),
    YogaLayoutableShadowNode(
      static_cast<const ConcreteViewShadowNode &>(sourceShadowNode)
    ) {

    if (fragment.props) {
      YogaLayoutableShadowNode::setProps(*std::static_pointer_cast<const ConcreteViewProps>(fragment.props));
    }

    if (fragment.children) {
      YogaLayoutableShadowNode::setChildren(BaseShadowNode::template getChildrenSlice<YogaLayoutableShadowNode>());
    }
  };

  void appendChild(const SharedShadowNode &child) {
    ensureUnsealed();

    ShadowNode::appendChild(child);

    auto nonConstChild = const_cast<ShadowNode *>(child.get());
    auto yogaLayoutableChild = dynamic_cast<YogaLayoutableShadowNode *>(nonConstChild);
    if (yogaLayoutableChild) {
      YogaLayoutableShadowNode::appendChild(yogaLayoutableChild);
    }
  }

  LayoutableShadowNode *cloneAndReplaceChild(LayoutableShadowNode *child, int suggestedIndex = -1) override {
    ensureUnsealed();
    auto childShadowNode = static_cast<const ConcreteViewShadowNode *>(child);
    auto clonedChildShadowNode = std::static_pointer_cast<ConcreteViewShadowNode>(childShadowNode->clone({}));
    ShadowNode::replaceChild(childShadowNode->shared_from_this(), clonedChildShadowNode, suggestedIndex);
    return clonedChildShadowNode.get();
  }

#pragma mark - Equality

  bool operator==(const ShadowNode& rhs) const override {
    if (!ShadowNode::operator==(rhs)) {
      return false;
    }

    const auto &other = static_cast<const ConcreteViewShadowNode&>(rhs);
    return getLayoutMetrics() == other.getLayoutMetrics();
  }

#pragma mark - DebugStringConvertible

  SharedDebugStringConvertibleList getDebugProps() const override {
    SharedDebugStringConvertibleList list = {};

    auto basePropsList = ShadowNode::getDebugProps();
    std::move(basePropsList.begin(), basePropsList.end(), std::back_inserter(list));

    list.push_back(std::make_shared<DebugStringConvertibleItem>("layout", "", LayoutableShadowNode::getDebugProps()));

    return list;
  }

};

} // namespace react
} // namespace facebook

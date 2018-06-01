/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fabric/core/ConcreteShadowNode.h>
#include <fabric/core/LayoutableShadowNode.h>
#include <fabric/core/ShadowNode.h>
#include <fabric/debug/DebugStringConvertibleItem.h>
#include <fabric/view/AccessibleShadowNode.h>
#include <fabric/view/ViewEventHandlers.h>
#include <fabric/view/ViewProps.h>
#include <fabric/view/YogaLayoutableShadowNode.h>

namespace facebook {
namespace react {

/*
 * Template for all <View>-like classes (classes which have all same props
 * as <View> and similar basic behaviour).
 * For example: <Paragraph>, <Image>, but not <Text>, <RawText>.
 */
template <typename ViewPropsT = ViewProps, typename ViewEventHandlersT = ViewEventHandlers>
class ConcreteViewShadowNode:
  public ConcreteShadowNode<ViewPropsT, ViewEventHandlersT>,
  public AccessibleShadowNode,
  public YogaLayoutableShadowNode {

  static_assert(std::is_base_of<ViewProps, ViewPropsT>::value, "ViewPropsT must be a descendant of ViewProps");
  static_assert(std::is_base_of<YogaStylableProps, ViewPropsT>::value, "ViewPropsT must be a descendant of YogaStylableProps");
  static_assert(std::is_base_of<AccessibilityProps, ViewPropsT>::value, "ViewPropsT must be a descendant of AccessibilityProps");

public:

  using ConcreteViewProps = ViewPropsT;
  using SharedConcreteViewProps = std::shared_ptr<const ViewPropsT>;
  using ConcreteViewEventHandlers = ViewEventHandlersT;
  using SharedConcreteViewEventHandlers = std::shared_ptr<const ViewEventHandlersT>;
  using SharedConcreteViewShadowNode = std::shared_ptr<const ConcreteViewShadowNode>;

  ConcreteViewShadowNode(
    const Tag &tag,
    const Tag &rootTag,
    const SharedConcreteViewProps &props,
    const SharedConcreteViewEventHandlers &eventHandlers,
    const SharedShadowNodeSharedList &children,
    const ShadowNodeCloneFunction &cloneFunction
  ):
    ConcreteShadowNode<ViewPropsT, ViewEventHandlersT>(
      tag,
      rootTag,
      props,
      eventHandlers,
      children,
      cloneFunction
    ),
    AccessibleShadowNode(
      props
    ),
    YogaLayoutableShadowNode(
      props,
      children
    ) {};

  ConcreteViewShadowNode(
    const SharedConcreteViewShadowNode &shadowNode,
    const SharedConcreteViewProps &props,
    const SharedConcreteViewEventHandlers &eventHandlers,
    const SharedShadowNodeSharedList &children
  ):
    ConcreteShadowNode<ViewPropsT, ViewEventHandlersT>(
      shadowNode,
      props,
      eventHandlers,
      children
    ),
    AccessibleShadowNode(
      shadowNode,
      props
    ),
    YogaLayoutableShadowNode(
      shadowNode,
      props,
      children
    ) {};

  void appendChild(const SharedShadowNode &child) {
    ensureUnsealed();

    ShadowNode::appendChild(child);

    auto yogaLayoutableChild = std::dynamic_pointer_cast<const YogaLayoutableShadowNode>(child);
    if (yogaLayoutableChild) {
      YogaLayoutableShadowNode::appendChild(yogaLayoutableChild);
    }
  }

  SharedLayoutableShadowNode cloneAndReplaceChild(const SharedLayoutableShadowNode &child) override {
    ensureUnsealed();

    auto childShadowNode = std::dynamic_pointer_cast<const ShadowNode>(child);
    assert(childShadowNode);
    auto childShadowNodeClone = childShadowNode->clone();

    // This is overloading of `SharedLayoutableShadowNode::cloneAndReplaceChild`,
    // the method is used to clone some node as a preparation for future mutation
    // caused by relayout.
    // Because those changes are not requested by UIManager, they add a layer
    // of node generation (between the committed stage and new proposed stage).
    // That additional layer confuses the Diffing algorithm which uses
    // `sourceNode` for referencing the previous (aka committed) stage
    // of the tree to produce mutation instructions.
    // In other words, if we don't compensate this change here,
    // the Diffing algorithm will compare wrong trees
    // ("new-but-not-laid-out-yet vs. new" instead of "committed vs. new").
    auto nonConstChildShadowNodeClone = std::const_pointer_cast<ShadowNode>(childShadowNodeClone);
    nonConstChildShadowNodeClone->shallowSourceNode();

    ShadowNode::replaceChild(childShadowNode, childShadowNodeClone);
    return std::dynamic_pointer_cast<const LayoutableShadowNode>(childShadowNodeClone);
  }

#pragma mark - Equality

  bool operator==(const ShadowNode& rhs) const override {
    if (!ShadowNode::operator==(rhs)) {
      return false;
    }

    auto &&other = static_cast<const ConcreteViewShadowNode&>(rhs);
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

protected:

#pragma mark - LayoutableShadowNode

  SharedLayoutableShadowNodeList getLayoutableChildNodes() const override {
    SharedLayoutableShadowNodeList sharedLayoutableShadowNodeList = {};
    for (auto child : *ShadowNode::children_) {
      const SharedLayoutableShadowNode layoutableShadowNode = std::dynamic_pointer_cast<const LayoutableShadowNode>(child);
      if (!layoutableShadowNode) {
        continue;
      }

      sharedLayoutableShadowNodeList.push_back(layoutableShadowNode);
    }

    return sharedLayoutableShadowNodeList;
  }

};

} // namespace react
} // namespace facebook

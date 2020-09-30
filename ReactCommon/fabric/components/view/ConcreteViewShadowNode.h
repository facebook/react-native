/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/components/view/ViewEventEmitter.h>
#include <react/components/view/ViewProps.h>
#include <react/components/view/YogaLayoutableShadowNode.h>
#include <react/core/ConcreteShadowNode.h>
#include <react/core/LayoutableShadowNode.h>
#include <react/core/ShadowNode.h>
#include <react/core/ShadowNodeFragment.h>
#include <react/debug/DebugStringConvertibleItem.h>

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
    typename ViewEventEmitterT = ViewEventEmitter,
    typename... Ts>
class ConcreteViewShadowNode : public ConcreteShadowNode<
                                   concreteComponentName,
                                   ViewPropsT,
                                   ViewEventEmitterT,
                                   Ts...>,
                               public YogaLayoutableShadowNode {
  static_assert(
      std::is_base_of<ViewProps, ViewPropsT>::value,
      "ViewPropsT must be a descendant of ViewProps");
  static_assert(
      std::is_base_of<YogaStylableProps, ViewPropsT>::value,
      "ViewPropsT must be a descendant of YogaStylableProps");
  static_assert(
      std::is_base_of<AccessibilityProps, ViewPropsT>::value,
      "ViewPropsT must be a descendant of AccessibilityProps");

 public:
  using BaseShadowNode = ConcreteShadowNode<
      concreteComponentName,
      ViewPropsT,
      ViewEventEmitterT,
      Ts...>;
  using ConcreteViewProps = ViewPropsT;

  ConcreteViewShadowNode(
      ShadowNodeFragment const &fragment,
      ComponentDescriptor const &componentDescriptor,
      ShadowNodeTraits traits)
      : BaseShadowNode(fragment, componentDescriptor, traits),
        YogaLayoutableShadowNode(
            traits.check(ShadowNodeTraits::Trait::LeafYogaNode)) {
    YogaLayoutableShadowNode::setProps(
        *std::static_pointer_cast<const ConcreteViewProps>(fragment.props));
    YogaLayoutableShadowNode::setChildren(
        BaseShadowNode::template getChildrenSlice<YogaLayoutableShadowNode>());
  };

  ConcreteViewShadowNode(
      ShadowNode const &sourceShadowNode,
      ShadowNodeFragment const &fragment)
      : BaseShadowNode(sourceShadowNode, fragment),
        YogaLayoutableShadowNode(
            static_cast<const ConcreteViewShadowNode &>(sourceShadowNode)) {
    if (fragment.props) {
      YogaLayoutableShadowNode::setProps(
          *std::static_pointer_cast<const ConcreteViewProps>(fragment.props));
    }

    if (fragment.children) {
      YogaLayoutableShadowNode::setChildren(
          BaseShadowNode::template getChildrenSlice<
              YogaLayoutableShadowNode>());
    }
  };

  void appendChild(const SharedShadowNode &child) {
    ensureUnsealed();

    ShadowNode::appendChild(child);

    auto nonConstChild = const_cast<ShadowNode *>(child.get());
    auto yogaLayoutableChild =
        dynamic_cast<YogaLayoutableShadowNode *>(nonConstChild);
    if (yogaLayoutableChild) {
      YogaLayoutableShadowNode::appendChild(yogaLayoutableChild);
    }
  }

  LayoutableShadowNode *cloneAndReplaceChild(
      LayoutableShadowNode *child,
      int suggestedIndex = -1) override {
    ensureUnsealed();
    auto childShadowNode = static_cast<const ConcreteViewShadowNode *>(child);
    auto clonedChildShadowNode =
        std::static_pointer_cast<ConcreteViewShadowNode>(
            childShadowNode->clone({}));
    ShadowNode::replaceChild(
        *childShadowNode, clonedChildShadowNode, suggestedIndex);
    return clonedChildShadowNode.get();
  }

  Transform getTransform() const override {
    return BaseShadowNode::getProps()->transform;
  }

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const override {
    auto list = SharedDebugStringConvertibleList{};

    auto basePropsList = ShadowNode::getDebugProps();
    std::move(
        basePropsList.begin(), basePropsList.end(), std::back_inserter(list));

    list.push_back(std::make_shared<DebugStringConvertibleItem>(
        "layout", "", LayoutableShadowNode::getDebugProps()));

    return list;
  }
#endif
};

} // namespace react
} // namespace facebook

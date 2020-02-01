/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <algorithm>
#include <memory>

#include <gtest/gtest.h>

#include <react/components/root/RootComponentDescriptor.h>
#include <react/components/view/ViewComponentDescriptor.h>
#include <react/element/ComponentBuilder.h>
#include <react/element/Element.h>
#include <react/element/testUtils.h>
#include <react/uimanager/ComponentDescriptorProviderRegistry.h>

using namespace facebook::react;

TEST(ElementTest, testYogaDirtyFlag) {
  auto builder = simpleComponentBuilder();

  auto rootShadowNode = std::shared_ptr<RootShadowNode>{};
  auto innerShadowNode = std::shared_ptr<ViewShadowNode>{};

  // clang-format off
  auto element =
      Element<RootShadowNode>()
        .reference(rootShadowNode)
        .tag(1)
        .children({
          Element<ViewShadowNode>()
            .tag(2),
          Element<ViewShadowNode>()
            .tag(3)
            .reference(innerShadowNode)
            .children({
              Element<ViewShadowNode>()
                .tag(4)
                .props([] {
                  /*
                   * Some non-default props.
                   */
                  auto mutableViewProps = std::make_shared<ViewProps>();
                  auto &props = *mutableViewProps;
                  props.nativeId = "native Id";
                  props.opacity = 0.5;
                  props.yogaStyle.alignContent() = YGAlignBaseline;
                  props.yogaStyle.flexDirection() = YGFlexDirectionRowReverse;
                  return mutableViewProps;
                }),
              Element<ViewShadowNode>()
                .tag(5),
              Element<ViewShadowNode>()
                .tag(6)
            })
        });
  // clang-format on

  builder.build(element);

  /*
   * Yoga nodes are dirty right after creation.
   */
  EXPECT_TRUE(rootShadowNode->layoutIfNeeded());

  /*
   * Yoga nodes are clean (not dirty) right after layout pass.
   */
  EXPECT_FALSE(rootShadowNode->layoutIfNeeded());

  {
    /*
     * Cloning props without changing them must *not* dirty Yoga nodes.
     */
    auto newRootShadowNode = rootShadowNode->clone(
        innerShadowNode->getFamily(), [](ShadowNode const &oldShadowNode) {
          auto &componentDescriptor = oldShadowNode.getComponentDescriptor();
          auto props = componentDescriptor.cloneProps(
              oldShadowNode.getProps(), RawProps());
          return oldShadowNode.clone(ShadowNodeFragment{props});
        });

    EXPECT_FALSE(newRootShadowNode->layoutIfNeeded());
  }

  {
    /*
     * Changing *non-layout* sub-props must *not* dirty Yoga nodes.
     */
    auto newRootShadowNode = rootShadowNode->clone(
        innerShadowNode->getFamily(), [](ShadowNode const &oldShadowNode) {
          auto viewProps = std::make_shared<ViewProps>();
          auto &props = *viewProps;

          props.nativeId = "some new native Id";
          props.foregroundColor = whiteColor();
          props.backgroundColor = blackColor();
          props.opacity = props.opacity + 0.042;
          props.zIndex = props.zIndex + 42;
          props.shouldRasterize = !props.shouldRasterize;
          props.collapsable = !props.collapsable;

          return oldShadowNode.clone(ShadowNodeFragment{viewProps});
        });

    EXPECT_FALSE(newRootShadowNode->layoutIfNeeded());
  }

  {
    /*
     * Changing *layout* sub-props *must* dirty Yoga nodes.
     */
    auto newRootShadowNode = rootShadowNode->clone(
        innerShadowNode->getFamily(), [](ShadowNode const &oldShadowNode) {
          auto viewProps = std::make_shared<ViewProps>();
          auto &props = *viewProps;

          props.yogaStyle.alignContent() = YGAlignBaseline;
          props.yogaStyle.display() = YGDisplayNone;

          return oldShadowNode.clone(ShadowNodeFragment{viewProps});
        });

    EXPECT_TRUE(newRootShadowNode->layoutIfNeeded());
  }

  {
    /*
     * Removing all children *must* dirty Yoga nodes.
     */
    auto newRootShadowNode = rootShadowNode->clone(
        innerShadowNode->getFamily(), [](ShadowNode const &oldShadowNode) {
          return oldShadowNode.clone(
              {ShadowNodeFragment::propsPlaceholder(),
               ShadowNode::emptySharedShadowNodeSharedList()});
        });

    EXPECT_TRUE(newRootShadowNode->layoutIfNeeded());
  }

  {
    /*
     * Removing the last child *must* dirty Yoga nodes.
     */
    auto newRootShadowNode = rootShadowNode->clone(
        innerShadowNode->getFamily(), [](ShadowNode const &oldShadowNode) {
          auto children = oldShadowNode.getChildren();
          children.pop_back();

          std::reverse(children.begin(), children.end());

          return oldShadowNode.clone(
              {ShadowNodeFragment::propsPlaceholder(),
               std::make_shared<ShadowNode::ListOfShared const>(children)});
        });

    EXPECT_TRUE(newRootShadowNode->layoutIfNeeded());
  }

  {
    /*
     * Reversing a list of children *must* dirty Yoga nodes.
     */
    auto newRootShadowNode = rootShadowNode->clone(
        innerShadowNode->getFamily(), [](ShadowNode const &oldShadowNode) {
          auto children = oldShadowNode.getChildren();

          std::reverse(children.begin(), children.end());

          return oldShadowNode.clone(
              {ShadowNodeFragment::propsPlaceholder(),
               std::make_shared<ShadowNode::ListOfShared const>(children)});
        });

    EXPECT_TRUE(newRootShadowNode->layoutIfNeeded());
  }
}

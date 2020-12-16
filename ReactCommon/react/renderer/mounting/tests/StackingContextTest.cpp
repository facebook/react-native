/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <algorithm>
#include <memory>

#include <gtest/gtest.h>

#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#include <react/renderer/components/root/RootComponentDescriptor.h>
#include <react/renderer/components/scrollview/ScrollViewComponentDescriptor.h>
#include <react/renderer/components/view/ViewComponentDescriptor.h>
#include <react/renderer/element/ComponentBuilder.h>
#include <react/renderer/element/Element.h>
#include <react/renderer/element/testUtils.h>
#include <react/renderer/mounting/Differentiator.h>
#include <react/renderer/mounting/ShadowViewMutation.h>
#include <react/renderer/mounting/stubs.h>

namespace facebook {
namespace react {

class StackingContextTest : public ::testing::Test {
 protected:
  ComponentBuilder builder_;
  std::shared_ptr<RootShadowNode> rootShadowNode_;
  std::shared_ptr<ViewShadowNode> nodeA_;
  std::shared_ptr<ViewShadowNode> nodeAA_;
  std::shared_ptr<ViewShadowNode> nodeB_;
  std::shared_ptr<ViewShadowNode> nodeBA_;
  std::shared_ptr<ViewShadowNode> nodeBB_;
  std::shared_ptr<ViewShadowNode> nodeBBA_;
  std::shared_ptr<ViewShadowNode> nodeBBB_;
  std::shared_ptr<ViewShadowNode> nodeBC_;
  std::shared_ptr<ViewShadowNode> nodeBD_;

  StackingContextTest() : builder_(simpleComponentBuilder()) {
    //  ┌────────────── (Root) ──────────────┐
    //  │ ┏━ A (tag: 2) ━━━━━━━━━━━━━━━━━━━┓ │
    //  │ ┃                                ┃ │
    //  │ ┃                                ┃ │
    //  │ ┃                                ┃ │
    //  │ ┃                                ┃ │
    //  │ ┃ ┏━ AA (tag: 3) ━━━━━━━━━━━━━━┓ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │
    //  │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
    //  │ ┏━ B (tag: 4) ━━━━━━━━━━━━━━━━━━━┓ │
    //  │ ┃                                ┃ │
    //  │ ┃                                ┃ │
    //  │ ┃                                ┃ │
    //  │ ┃                                ┃ │
    //  │ ┃ ┏━ BA (tag: 5) ━━━━━━━━━━━━━━┓ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │
    //  │ ┃ ┏━ BB (tag: 6) ━━━━━━━━━━━━━━┓ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃ ┏━ BBA (tag: 7) ━━━━━━━━━┓ ┃ ┃ │
    //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │
    //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │
    //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │
    //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │
    //  │ ┃ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ ┃ │
    //  │ ┃ ┃ ┏━ BBB (tag: 8) ━━━━━━━━━┓ ┃ ┃ │
    //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │
    //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │
    //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │
    //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │
    //  │ ┃ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ ┃ │
    //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │
    //  │ ┃ ┏━ BC (tag: 9) ━━━━━━━━━━━━━━┓ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │
    //  │ ┃ ┏━ BD (tag: 10) ━━━━━━━━━━━━━┓ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │
    //  │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
    //  └────────────────────────────────────┘

    // clang-format off
    auto element =
        Element<RootShadowNode>()
          .reference(rootShadowNode_)
          .tag(1)
          .children({
            Element<ViewShadowNode>()
              .tag(2)
              .reference(nodeA_)
              .children({
                Element<ViewShadowNode>()
                  .tag(3)
                  .reference(nodeAA_)
              }),
            Element<ViewShadowNode>()
              .tag(4)
              .reference(nodeB_)
              .children({
                Element<ViewShadowNode>()
                  .tag(5)
                  .reference(nodeBA_),
                Element<ViewShadowNode>()
                  .tag(6)
                  .reference(nodeBB_)
                  .children({
                    Element<ViewShadowNode>()
                      .tag(7)
                      .reference(nodeBBA_),
                    Element<ViewShadowNode>()
                      .tag(8)
                      .reference(nodeBBB_)
                  }),
                Element<ViewShadowNode>()
                  .tag(9)
                  .reference(nodeBC_),
                Element<ViewShadowNode>()
                  .tag(10)
                  .reference(nodeBD_)
              })
          });
    // clang-format on

    builder_.build(element);
  }

  void mutateViewShadowNodeProps_(
      std::shared_ptr<ViewShadowNode> node,
      std::function<void(ViewProps &props)> callback) {
    rootShadowNode_ =
        std::static_pointer_cast<RootShadowNode>(rootShadowNode_->cloneTree(
            node->getFamily(), [&](ShadowNode const &oldShadowNode) {
              auto viewProps = std::make_shared<ViewProps>();
              callback(*viewProps);
              return oldShadowNode.clone(ShadowNodeFragment{viewProps});
            }));
  }

  void testViewTree(
      std::function<void(StubViewTree const &viewTree)> callback) {
    rootShadowNode_->layoutIfNeeded();

    callback(buildStubViewTreeUsingDifferentiator(*rootShadowNode_));
    callback(buildStubViewTreeWithoutUsingDifferentiator(*rootShadowNode_));
  }
};

TEST_F(StackingContextTest, defaultPropsMakeEverythingFlattened) {
  testViewTree([](StubViewTree const &viewTree) {
    // 1 view in total.
    EXPECT_EQ(viewTree.size(), 1);

    // The root view has no subviews.
    EXPECT_EQ(viewTree.getRootStubView().children.size(), 0);
  });
}

TEST_F(StackingContextTest, mostPropsDoNotForceViewsToMaterialize) {
  //  ┌────────────── (Root) ──────────────┐    ┌────────── (Root) ───────────┐
  //  │ ┏━ A (tag: 2) ━━━━━━━━━━━━━━━━━━━┓ │    │                             │
  //  │ ┃                                ┃ │    │                             │
  //  │ ┃                                ┃ │    │                             │
  //  │ ┃                                ┃ │    │                             │
  //  │ ┃                                ┃ │    │                             │
  //  │ ┃ ┏━ AA (tag: 3) ━━━━━━━━━━━━━━┓ ┃ │    │                             │
  //  │ ┃ ┃ padding: 10;               ┃ ┃ │    │                             │
  //  │ ┃ ┃ margin: 9001;              ┃ ┃ │    │                             │
  //  │ ┃ ┃ position: absolute;        ┃ ┃ │    │                             │
  //  │ ┃ ┃ shadowRadius: 10;          ┃ ┃ │    │                             │
  //  │ ┃ ┃ shadowOffset: [42, 42];    ┃ ┃ │    │                             │
  //  │ ┃ ┃ backgroundColor: clear;    ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │    │                             │
  //  │ ┏━ B (tag: 4) ━━━━━━━━━━━━━━━━━━━┓ │    │                             │
  //  │ ┃                                ┃ │    │                             │
  //  │ ┃                                ┃ │    │                             │
  //  │ ┃                                ┃ │    │                             │
  //  │ ┃                                ┃ │    │                             │
  //  │ ┃ ┏━ BA (tag: 5) ━━━━━━━━━━━━━━┓ ┃ │    │                             │
  //  │ ┃ ┃ zIndex: 42;                ┃ ┃ │    │                             │
  //  │ ┃ ┃ margin: 42;                ┃ ┃ │    │                             │
  //  │ ┃ ┃ shadowColor: clear;        ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┃ ┏━ BB (tag: 6) ━━━━━━━━━━━━━━┓ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │ No observable side-effects. │
  //  │ ┃ ┃                            ┃ ┃ │━━━▶│   No views are generated.   │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┏━ BBA (tag: 7) ━━━━━━━━━┓ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃ position: relative;    ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃ borderRadii: 42;       ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃ borderColor: black;    ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┏━ BBB (tag: 8) ━━━━━━━━━┓ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┃ ┏━ BC (tag: 9) ━━━━━━━━━━━━━━┓ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┃ ┏━ BD (tag: 10) ━━━━━━━━━━━━━┓ ┃ │    │                             │
  //  │ ┃ ┃ onLayout: true;            ┃ ┃ │    │                             │
  //  │ ┃ ┃ hitSlop: 42;               ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │    │                             │
  //  └────────────────────────────────────┘    └─────────────────────────────┘

  mutateViewShadowNodeProps_(nodeAA_, [](ViewProps &props) {
    auto &yogaStyle = props.yogaStyle;
    yogaStyle.padding()[YGEdgeAll] = YGValue{42, YGUnitPoint};
    yogaStyle.margin()[YGEdgeAll] = YGValue{42, YGUnitPoint};
    yogaStyle.positionType() = YGPositionTypeAbsolute;
    props.shadowRadius = 42;
    props.shadowOffset = Size{42, 42};
    props.backgroundColor = clearColor();
  });

  mutateViewShadowNodeProps_(nodeBA_, [](ViewProps &props) {
    auto &yogaStyle = props.yogaStyle;
    props.zIndex = 42;
    yogaStyle.margin()[YGEdgeAll] = YGValue{42, YGUnitPoint};
    props.shadowColor = clearColor();
    props.shadowOpacity = 0.42;
  });

  mutateViewShadowNodeProps_(nodeBBA_, [](ViewProps &props) {
    auto &yogaStyle = props.yogaStyle;
    yogaStyle.positionType() = YGPositionTypeRelative;

    props.borderRadii.all = 42;
    props.borderColors.all = blackColor();
  });

  mutateViewShadowNodeProps_(nodeBD_, [](ViewProps &props) {
    props.onLayout = true;
    props.hitSlop = EdgeInsets{42, 42, 42, 42};
  });

  testViewTree([](StubViewTree const &viewTree) {
    // 1 view in total.
    EXPECT_EQ(viewTree.size(), 1);

    // The root view has no subviews.
    EXPECT_EQ(viewTree.getRootStubView().children.size(), 0);
  });
}

TEST_F(StackingContextTest, somePropsForceViewsToMaterialize1) {
  //  ┌────────────── (Root) ──────────────┐    ┌─────────── (Root) ──────────┐
  //  │ ┏━ A (tag: 2) ━━━━━━━━━━━━━━━━━━━┓ │    │ ┏━ AA (tag: 3) ━━━━━━━━━━━┓ │
  //  │ ┃                                ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃                                ┃ │    │ ┃                         ┃ │
  //  │ ┃                                ┃ │    │ ┃                         ┃ │
  //  │ ┃                                ┃ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┃ ┏━ AA (tag: 3) ━━━━━━━━━━━━━━┓ ┃ │    │ ┏━ BA (tag: 5) ━━━━━━━━━━━┓ │
  //  │ ┃ ┃ backgroundColor: black;    ┃ ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃                         ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃                         ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┏━ BBA (tag: 7) ━━━━━━━━━━┓ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃ #FormsStackingContext   ┃ │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │ ┃                         ┃ │
  //  │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┏━ B (tag: 4) ━━━━━━━━━━━━━━━━━━━┓ │    │                             │
  //  │ ┃                                ┃ │    │                             │
  //  │ ┃                                ┃ │    │                             │
  //  │ ┃                                ┃ │    │                             │
  //  │ ┃                                ┃ │    │                             │
  //  │ ┃ ┏━ BA (tag: 5) ━━━━━━━━━━━━━━┓ ┃ │    │                             │
  //  │ ┃ ┃ backgroundColor: white;    ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┃ ┏━ BB (tag: 6) ━━━━━━━━━━━━━━┓ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │━━━▶│                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┏━ BBA (tag: 7) ━━━━━━━━━┓ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃ shadowColor: black;    ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┏━ BBB (tag: 8) ━━━━━━━━━┓ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┃ ┏━ BC (tag: 9) ━━━━━━━━━━━━━━┓ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┃ ┏━ BD (tag: 10) ━━━━━━━━━━━━━┓ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │    │                             │
  //  └────────────────────────────────────┘    └─────────────────────────────┘

  mutateViewShadowNodeProps_(
      nodeAA_, [](ViewProps &props) { props.backgroundColor = blackColor(); });

  mutateViewShadowNodeProps_(
      nodeBA_, [](ViewProps &props) { props.backgroundColor = whiteColor(); });

  mutateViewShadowNodeProps_(
      nodeBBA_, [](ViewProps &props) { props.shadowColor = blackColor(); });

  testViewTree([](StubViewTree const &viewTree) {
    // 4 views in total.
    EXPECT_EQ(viewTree.size(), 4);

    // The root view has all 3 subviews.
    EXPECT_EQ(viewTree.getRootStubView().children.size(), 3);

    // The root view subviews are [3, 5, 7].
    EXPECT_EQ(viewTree.getRootStubView().children.at(0)->tag, 3);
    EXPECT_EQ(viewTree.getRootStubView().children.at(1)->tag, 5);
    EXPECT_EQ(viewTree.getRootStubView().children.at(2)->tag, 7);
  });
}

TEST_F(StackingContextTest, somePropsForceViewsToMaterialize2) {
  //  ┌────────────── (Root) ──────────────┐    ┌─────────── (Root) ──────────┐
  //  │ ┏━ A (tag: 2) ━━━━━━━━━━━━━━━━━━━┓ │    │ ┏━ A (tag: 2) ━━━━━━━━━━━━┓ │
  //  │ ┃ backgroundColor: black;        ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃                                ┃ │    │ ┃                         ┃ │
  //  │ ┃                                ┃ │    │ ┃                         ┃ │
  //  │ ┃                                ┃ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┃ ┏━ AA (tag: 3) ━━━━━━━━━━━━━━┓ ┃ │    │ ┏━ AA (tag: 3) ━━━━━━━━━━━┓ │
  //  │ ┃ ┃ pointerEvents: none;       ┃ ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃ #FormsStackingContext   ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃                         ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┏━ B (tag: 4) ━━━━━━━━━━━━┓ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃                         ┃ │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │ ┃                         ┃ │
  //  │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┏━ B (tag: 4) ━━━━━━━━━━━━━━━━━━━┓ │    │ ┏━ BA (tag: 5) ━━━━━━━━━━━┓ │
  //  │ ┃ testId: "42"                   ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃                                ┃ │    │ ┃ #FormsStackingContext   ┃ │
  //  │ ┃                                ┃ │    │ ┃                         ┃ │
  //  │ ┃                                ┃ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┃ ┏━ BA (tag: 5) ━━━━━━━━━━━━━━┓ ┃ │    │ ┏━ BB (tag: 6) ━━━━━━━━━━━┓ │
  //  │ ┃ ┃ nativeId: "42"             ┃ ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃                         ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃                         ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │ ┏━ BBA (tag: 7) ━━━━━━━━━━┓ │
  //  │ ┃ ┏━ BB (tag: 6) ━━━━━━━━━━━━━━┓ ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃ ┃ foregroundColor: black;    ┃ ┃ │    │ ┃ #FormsStackingContext   ┃ │
  //  │ ┃ ┃                            ┃ ┃ │━━━▶│ ┃                         ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┏━ BBB (tag: 8) ━━━━━━━━━━┓ │
  //  │ ┃ ┃ ┏━ BBA (tag: 7) ━━━━━━━━━┓ ┃ ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃ ┃ ┃ transform: scale(2);   ┃ ┃ ┃ │    │ ┃ #FormsStackingContext   ┃ │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │ ┃                         ┃ │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │ ┏━ BC (tag: 9) ━━━━━━━━━━━┓ │
  //  │ ┃ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃ ┃ ┏━ BBB (tag: 8) ━━━━━━━━━┓ ┃ ┃ │    │ ┃ #FormsStackingContext   ┃ │
  //  │ ┃ ┃ ┃ position: relative;    ┃ ┃ ┃ │    │ ┃                         ┃ │
  //  │ ┃ ┃ ┃ zIndex: 42;            ┃ ┃ ┃ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │ ┏━ BD (tag: 10) ━━━━━━━━━━┓ │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ ┃ │    │ ┃ #FormsStackingContext   ┃ │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │ ┃                         ┃ │
  //  │ ┃ ┏━ BC (tag: 9) ━━━━━━━━━━━━━━┓ ┃ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┃ ┃ shadowColor: black;        ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┃ ┏━ BD (tag: 10) ━━━━━━━━━━━━━┓ ┃ │    │                             │
  //  │ ┃ ┃ opacity: 0.42;             ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │    │                             │
  //  └────────────────────────────────────┘    └─────────────────────────────┘

  mutateViewShadowNodeProps_(
      nodeA_, [](ViewProps &props) { props.backgroundColor = blackColor(); });

  mutateViewShadowNodeProps_(nodeAA_, [](ViewProps &props) {
    props.pointerEvents = PointerEventsMode::None;
  });

  mutateViewShadowNodeProps_(
      nodeB_, [](ViewProps &props) { props.testId = "42"; });

  mutateViewShadowNodeProps_(
      nodeBA_, [](ViewProps &props) { props.nativeId = "42"; });

  mutateViewShadowNodeProps_(
      nodeBB_, [](ViewProps &props) { props.foregroundColor = blackColor(); });

  mutateViewShadowNodeProps_(nodeBBA_, [](ViewProps &props) {
    props.transform = Transform::Scale(2, 2, 2);
  });

  mutateViewShadowNodeProps_(nodeBBB_, [](ViewProps &props) {
    auto &yogaStyle = props.yogaStyle;
    yogaStyle.positionType() = YGPositionTypeRelative;
    props.zIndex = 42;
  });

  mutateViewShadowNodeProps_(
      nodeBC_, [](ViewProps &props) { props.shadowColor = blackColor(); });

  mutateViewShadowNodeProps_(
      nodeBD_, [](ViewProps &props) { props.opacity = 0.42; });

  testViewTree([](StubViewTree const &viewTree) {
    // 10 views in total.
    EXPECT_EQ(viewTree.size(), 10);

    // The root view has all 9 subviews.
    EXPECT_EQ(viewTree.getRootStubView().children.size(), 9);
  });
}

} // namespace react
} // namespace facebook

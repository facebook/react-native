/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#include <react/renderer/components/root/RootComponentDescriptor.h>
#include <react/renderer/components/view/ViewComponentDescriptor.h>
#include <react/renderer/element/ComponentBuilder.h>
#include <react/renderer/element/Element.h>
#include <react/renderer/element/testUtils.h>

namespace facebook {
namespace react {

//  *******************************************************┌─ABCD:────┐****
//  *******************************************************│ {70,-50} │****
//  *******************************************************│ {30,60}  │****
//  *******************************************************│          │****
//  *******************************************************│          │****
//  *******************┌─A: {0,0}{50,50}──┐****************│          │****
//  *******************│                  │****************│          │****
//  *******************│   ┌─AB:──────┐   │****************│          │****
//  *******************│   │ {10,10}{30,90}****************│          │****
//  *******************│   │   ┌─ABC: {10,10}{110,20}──────┤          ├───┐
//  *******************│   │   │                           │          │   │
//  *******************│   │   │                           └──────────┘   │
//  *******************│   │   └──────┬───┬───────────────────────────────┘
//  *******************│   │          │   │********************************
//  *******************└───┤          ├───┘********************************
//  ***********************│          │************************************
//  ***********************│          │************************************
//  ┌─ABE: {-60,50}{70,20}─┴───┐      │************************************
//  │                          │      │************************************
//  │                          │      │************************************
//  │                          │      │************************************
//  │                          │      │************************************
//  └──────────────────────┬───┘      │************************************
//  ***********************│          │************************************
//  ***********************└──────────┘************************************

class LayoutTest : public ::testing::Test {
 protected:
  ComponentBuilder builder_;
  std::shared_ptr<RootShadowNode> rootShadowNode_;
  std::shared_ptr<ViewShadowNode> viewShadowNodeA_;
  std::shared_ptr<ViewShadowNode> viewShadowNodeAB_;
  std::shared_ptr<ViewShadowNode> viewShadowNodeABC_;
  std::shared_ptr<ViewShadowNode> viewShadowNodeABCD_;
  std::shared_ptr<ViewShadowNode> viewShadowNodeABE_;

  LayoutTest() : builder_(simpleComponentBuilder()) {}

  void initialize(bool enforceClippingForABC) {
    // clang-format off
    auto element =
        Element<RootShadowNode>()
          .reference(rootShadowNode_)
          .tag(1)
          .props([] {
            auto sharedProps = std::make_shared<RootProps>();
            auto &props = *sharedProps;
            props.layoutConstraints = LayoutConstraints{{0,0}, {500, 500}};
            auto &yogaStyle = props.yogaStyle;
            yogaStyle.dimensions()[YGDimensionWidth] = YGValue{200, YGUnitPoint};
            yogaStyle.dimensions()[YGDimensionHeight] = YGValue{200, YGUnitPoint};
            return sharedProps;
          })
          .children({
            Element<ViewShadowNode>()
              .reference(viewShadowNodeA_)
              .props([] {
                auto sharedProps = std::make_shared<ViewProps>();
                auto &props = *sharedProps;
                auto &yogaStyle = props.yogaStyle;
                yogaStyle.positionType() = YGPositionTypeAbsolute;
                yogaStyle.dimensions()[YGDimensionWidth] = YGValue{50, YGUnitPoint};
                yogaStyle.dimensions()[YGDimensionHeight] = YGValue{50, YGUnitPoint};
                return sharedProps;
              })
              .children({
                Element<ViewShadowNode>()
                  .reference(viewShadowNodeAB_)
                  .props([] {
                    auto sharedProps = std::make_shared<ViewProps>();
                    auto &props = *sharedProps;
                    auto &yogaStyle = props.yogaStyle;
                    yogaStyle.positionType() = YGPositionTypeAbsolute;
                    yogaStyle.position()[YGEdgeLeft] = YGValue{10, YGUnitPoint};
                    yogaStyle.position()[YGEdgeTop] = YGValue{10, YGUnitPoint};
                    yogaStyle.dimensions()[YGDimensionWidth] = YGValue{30, YGUnitPoint};
                    yogaStyle.dimensions()[YGDimensionHeight] = YGValue{90, YGUnitPoint};
                    return sharedProps;
                  })
                  .children({
                    Element<ViewShadowNode>()
                      .reference(viewShadowNodeABC_)
                      .props([=] {
                        auto sharedProps = std::make_shared<ViewProps>();
                        auto &props = *sharedProps;
                        auto &yogaStyle = props.yogaStyle;

                        if (enforceClippingForABC) {
                          yogaStyle.overflow() = YGOverflowHidden;
                        }

                        yogaStyle.positionType() = YGPositionTypeAbsolute;
                        yogaStyle.position()[YGEdgeLeft] = YGValue{10, YGUnitPoint};
                        yogaStyle.position()[YGEdgeTop] = YGValue{10, YGUnitPoint};
                        yogaStyle.dimensions()[YGDimensionWidth] = YGValue{110, YGUnitPoint};
                        yogaStyle.dimensions()[YGDimensionHeight] = YGValue{20, YGUnitPoint};
                        return sharedProps;
                      })
                      .children({
                        Element<ViewShadowNode>()
                          .reference(viewShadowNodeABCD_)
                          .props([] {
                            auto sharedProps = std::make_shared<ViewProps>();
                            auto &props = *sharedProps;
                            auto &yogaStyle = props.yogaStyle;
                            yogaStyle.positionType() = YGPositionTypeAbsolute;
                            yogaStyle.position()[YGEdgeLeft] = YGValue{70, YGUnitPoint};
                            yogaStyle.position()[YGEdgeTop] = YGValue{-50, YGUnitPoint};
                            yogaStyle.dimensions()[YGDimensionWidth] = YGValue{30, YGUnitPoint};
                            yogaStyle.dimensions()[YGDimensionHeight] = YGValue{60, YGUnitPoint};
                            return sharedProps;
                          })
                      }),
                    Element<ViewShadowNode>()
                      .reference(viewShadowNodeABE_)
                      .props([] {
                        auto sharedProps = std::make_shared<ViewProps>();
                        auto &props = *sharedProps;
                        auto &yogaStyle = props.yogaStyle;
                        yogaStyle.positionType() = YGPositionTypeAbsolute;
                        yogaStyle.position()[YGEdgeLeft] = YGValue{-60, YGUnitPoint};
                        yogaStyle.position()[YGEdgeTop] = YGValue{50, YGUnitPoint};
                        yogaStyle.dimensions()[YGDimensionWidth] = YGValue{70, YGUnitPoint};
                        yogaStyle.dimensions()[YGDimensionHeight] = YGValue{20, YGUnitPoint};
                        return sharedProps;
                      })
                  })
              })
          });
    // clang-format on

    builder_.build(element);

    rootShadowNode_->layoutIfNeeded();
  }
};

TEST_F(LayoutTest, overflowInsetTest) {
  initialize(false);

  auto layoutMetrics = viewShadowNodeA_->getLayoutMetrics();

  EXPECT_EQ(layoutMetrics.frame.size.width, 50);
  EXPECT_EQ(layoutMetrics.frame.size.height, 50);

  EXPECT_EQ(layoutMetrics.overflowInset.left, -50);
  EXPECT_EQ(layoutMetrics.overflowInset.top, -30);
  EXPECT_EQ(layoutMetrics.overflowInset.right, -80);
  EXPECT_EQ(layoutMetrics.overflowInset.bottom, -50);
}

TEST_F(LayoutTest, overflowInsetWithClippingTest) {
  initialize(true);

  auto layoutMetrics = viewShadowNodeA_->getLayoutMetrics();

  EXPECT_EQ(layoutMetrics.frame.size.width, 50);
  EXPECT_EQ(layoutMetrics.frame.size.height, 50);

  EXPECT_EQ(layoutMetrics.overflowInset.left, -50);
  EXPECT_EQ(layoutMetrics.overflowInset.top, 0);
  EXPECT_EQ(layoutMetrics.overflowInset.right, -80);
  EXPECT_EQ(layoutMetrics.overflowInset.bottom, -50);
}

} // namespace react
} // namespace facebook

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <react/renderer/components/scrollview/ScrollViewComponentDescriptor.h>
#include <react/renderer/components/text/ParagraphComponentDescriptor.h>
#include <react/renderer/components/text/RawTextComponentDescriptor.h>
#include <react/renderer/components/text/TextComponentDescriptor.h>
#include <react/renderer/components/view/ViewComponentDescriptor.h>
#include <react/renderer/core/TraitCast.h>

#include <react/renderer/element/Element.h>
#include <react/renderer/element/testUtils.h>

using namespace facebook::react;

TEST(traitCastTest, testOne) {
  auto builder = simpleComponentBuilder();

  auto viewShadowNode = std::shared_ptr<ViewShadowNode>{};
  auto scrollViewShadowNode = std::shared_ptr<ScrollViewShadowNode>{};
  auto paragraphShadowNode = std::shared_ptr<ParagraphShadowNode>{};
  auto textShadowNode = std::shared_ptr<TextShadowNode>{};
  auto rawTextShadowNode = std::shared_ptr<RawTextShadowNode>{};

  // clang-format off
  auto element =
      Element<ScrollViewShadowNode>()
        .reference(scrollViewShadowNode)
        .children({
          Element<ParagraphShadowNode>()
            .reference(paragraphShadowNode)
            .children({
              Element<TextShadowNode>()
                .reference(textShadowNode),
              Element<RawTextShadowNode>()
                .reference(rawTextShadowNode)
            }),
          Element<ViewShadowNode>()
            .reference(viewShadowNode),
        });
  // clang-format on

  auto rootShadowNode = builder.build(element);

  std::shared_ptr<ShadowNode> shadowNodeForRawTextShadowNode{rawTextShadowNode};
  std::shared_ptr<ShadowNode> shadowNodeForTextShadowNode{textShadowNode};

  // Casting `nullptr` returns `nullptrs`.
  ShadowNode* nullShadowNode = nullptr;
  EXPECT_FALSE(traitCast<const LayoutableShadowNode*>(nullShadowNode));
  EXPECT_FALSE(traitCast<const YogaLayoutableShadowNode*>(nullShadowNode));
  EXPECT_FALSE(traitCast<const LayoutableShadowNode*>(nullShadowNode));
  EXPECT_FALSE(traitCast<LayoutableShadowNode*>(nullShadowNode));
  EXPECT_FALSE(traitCast<LayoutableShadowNode>(
      std::shared_ptr<ShadowNode>(nullShadowNode)));

  // `ViewShadowNode` is `LayoutableShadowNode` and `YogaLayoutableShadowNode`.
  EXPECT_TRUE(traitCast<const LayoutableShadowNode*>(viewShadowNode.get()));
  EXPECT_TRUE(traitCast<const YogaLayoutableShadowNode*>(viewShadowNode.get()));
  EXPECT_NO_FATAL_FAILURE(
      traitCast<const LayoutableShadowNode&>(*viewShadowNode));
  EXPECT_NO_FATAL_FAILURE(
      traitCast<const YogaLayoutableShadowNode&>(*viewShadowNode));
  EXPECT_NO_FATAL_FAILURE(
      traitCast<YogaLayoutableShadowNode&>(*viewShadowNode));
  EXPECT_TRUE(traitCast<LayoutableShadowNode*>(viewShadowNode.get()));
  EXPECT_TRUE(traitCast<LayoutableShadowNode>(viewShadowNode));

  // `ScrollViewShadowNode` is `LayoutableShadowNode` and
  // `YogaLayoutableShadowNode`.
  EXPECT_TRUE(
      traitCast<const LayoutableShadowNode*>(scrollViewShadowNode.get()));
  EXPECT_TRUE(
      traitCast<const YogaLayoutableShadowNode*>(scrollViewShadowNode.get()));
  EXPECT_NO_FATAL_FAILURE(
      traitCast<const LayoutableShadowNode&>(*scrollViewShadowNode));
  EXPECT_NO_FATAL_FAILURE(
      traitCast<const YogaLayoutableShadowNode&>(*scrollViewShadowNode));

  // `ParagraphShadowNode` is `LayoutableShadowNode` and
  // `YogaLayoutableShadowNode`.
  EXPECT_TRUE(
      traitCast<const LayoutableShadowNode*>(paragraphShadowNode.get()));
  EXPECT_TRUE(
      traitCast<const YogaLayoutableShadowNode*>(paragraphShadowNode.get()));
  EXPECT_NO_FATAL_FAILURE(
      traitCast<const LayoutableShadowNode&>(*paragraphShadowNode));
  EXPECT_NO_FATAL_FAILURE(
      traitCast<const YogaLayoutableShadowNode&>(*paragraphShadowNode));

  // `TextShadowNode` is *not* `LayoutableShadowNode` nor
  // `YogaLayoutableShadowNode`.
  EXPECT_FALSE(traitCast<const LayoutableShadowNode*>(textShadowNode.get()));
  EXPECT_FALSE(
      traitCast<const YogaLayoutableShadowNode*>(textShadowNode.get()));
  EXPECT_DEATH_IF_SUPPORTED(
      traitCast<const LayoutableShadowNode&>(*textShadowNode), "");
  EXPECT_DEATH_IF_SUPPORTED(
      traitCast<const YogaLayoutableShadowNode&>(*textShadowNode), "");

  // `RawTextShadowNode` is *not* `LayoutableShadowNode` nor
  // `YogaLayoutableShadowNode`.
  EXPECT_FALSE(traitCast<const LayoutableShadowNode*>(rawTextShadowNode.get()));
  EXPECT_FALSE(
      traitCast<const YogaLayoutableShadowNode*>(rawTextShadowNode.get()));
  EXPECT_DEATH_IF_SUPPORTED(
      traitCast<const LayoutableShadowNode&>(*rawTextShadowNode), "");
  EXPECT_DEATH_IF_SUPPORTED(
      traitCast<const YogaLayoutableShadowNode&>(*rawTextShadowNode), "");

  // trait cast to `RawTextShadowNode` works on `RawTextShadowNode`
  // and not on TextShadowNode or ViewShadowNode
  EXPECT_TRUE(traitCast<const RawTextShadowNode*>(
      shadowNodeForRawTextShadowNode.get()));
  EXPECT_NO_FATAL_FAILURE(
      traitCast<const RawTextShadowNode&>(*shadowNodeForRawTextShadowNode));
  EXPECT_FALSE(
      traitCast<const RawTextShadowNode*>(shadowNodeForTextShadowNode.get()));
  EXPECT_DEATH_IF_SUPPORTED(
      traitCast<const RawTextShadowNode&>(*shadowNodeForTextShadowNode), "");
  EXPECT_FALSE(traitCast<const RawTextShadowNode*>(viewShadowNode.get()));
  EXPECT_DEATH_IF_SUPPORTED(
      traitCast<const RawTextShadowNode&>(*viewShadowNode), "");

  // trait cast to `TextShadowNode` works on `TextShadowNode`
  // and not on RawTextShadowNode or ViewShadowNode
  EXPECT_TRUE(
      traitCast<const TextShadowNode*>(shadowNodeForTextShadowNode.get()));
  EXPECT_NO_FATAL_FAILURE(
      traitCast<const TextShadowNode&>(*shadowNodeForTextShadowNode));
  EXPECT_FALSE(
      traitCast<const TextShadowNode*>(shadowNodeForRawTextShadowNode.get()));
  EXPECT_DEATH_IF_SUPPORTED(
      traitCast<const TextShadowNode&>(*shadowNodeForRawTextShadowNode), "");
  EXPECT_FALSE(traitCast<const TextShadowNode*>(viewShadowNode.get()));
  EXPECT_DEATH_IF_SUPPORTED(
      traitCast<const TextShadowNode&>(*viewShadowNode), "");
}

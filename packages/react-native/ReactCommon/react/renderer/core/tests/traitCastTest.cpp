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
  ShadowNode *nullShadowNode = nullptr;
  EXPECT_FALSE(traitCast<LayoutableShadowNode const *>(nullShadowNode));
  EXPECT_FALSE(traitCast<YogaLayoutableShadowNode const *>(nullShadowNode));
  EXPECT_FALSE(traitCast<LayoutableShadowNode const *>(nullShadowNode));
  EXPECT_FALSE(traitCast<LayoutableShadowNode *>(nullShadowNode));
  EXPECT_FALSE(traitCast<LayoutableShadowNode>(
      std::shared_ptr<ShadowNode>(nullShadowNode)));

  // `ViewShadowNode` is `LayoutableShadowNode` and `YogaLayoutableShadowNode`.
  EXPECT_TRUE(traitCast<LayoutableShadowNode const *>(viewShadowNode.get()));
  EXPECT_TRUE(
      traitCast<YogaLayoutableShadowNode const *>(viewShadowNode.get()));
  EXPECT_NO_FATAL_FAILURE(
      traitCast<LayoutableShadowNode const &>(*viewShadowNode));
  EXPECT_NO_FATAL_FAILURE(
      traitCast<YogaLayoutableShadowNode const &>(*viewShadowNode));
  EXPECT_NO_FATAL_FAILURE(
      traitCast<YogaLayoutableShadowNode &>(*viewShadowNode));
  EXPECT_TRUE(traitCast<LayoutableShadowNode *>(viewShadowNode.get()));
  EXPECT_TRUE(traitCast<LayoutableShadowNode>(viewShadowNode));

  // `ScrollViewShadowNode` is `LayoutableShadowNode` and
  // `YogaLayoutableShadowNode`.
  EXPECT_TRUE(
      traitCast<LayoutableShadowNode const *>(scrollViewShadowNode.get()));
  EXPECT_TRUE(
      traitCast<YogaLayoutableShadowNode const *>(scrollViewShadowNode.get()));
  EXPECT_NO_FATAL_FAILURE(
      traitCast<LayoutableShadowNode const &>(*scrollViewShadowNode));
  EXPECT_NO_FATAL_FAILURE(
      traitCast<YogaLayoutableShadowNode const &>(*scrollViewShadowNode));

  // `ParagraphShadowNode` is `LayoutableShadowNode` and
  // `YogaLayoutableShadowNode`.
  EXPECT_TRUE(
      traitCast<LayoutableShadowNode const *>(paragraphShadowNode.get()));
  EXPECT_TRUE(
      traitCast<YogaLayoutableShadowNode const *>(paragraphShadowNode.get()));
  EXPECT_NO_FATAL_FAILURE(
      traitCast<LayoutableShadowNode const &>(*paragraphShadowNode));
  EXPECT_NO_FATAL_FAILURE(
      traitCast<YogaLayoutableShadowNode const &>(*paragraphShadowNode));

  // `TextShadowNode` is *not* `LayoutableShadowNode` nor
  // `YogaLayoutableShadowNode`.
  EXPECT_FALSE(traitCast<LayoutableShadowNode const *>(textShadowNode.get()));
  EXPECT_FALSE(
      traitCast<YogaLayoutableShadowNode const *>(textShadowNode.get()));
  EXPECT_DEATH_IF_SUPPORTED(
      traitCast<LayoutableShadowNode const &>(*textShadowNode), "");
  EXPECT_DEATH_IF_SUPPORTED(
      traitCast<YogaLayoutableShadowNode const &>(*textShadowNode), "");

  // `RawTextShadowNode` is *not* `LayoutableShadowNode` nor
  // `YogaLayoutableShadowNode`.
  EXPECT_FALSE(
      traitCast<LayoutableShadowNode const *>(rawTextShadowNode.get()));
  EXPECT_FALSE(
      traitCast<YogaLayoutableShadowNode const *>(rawTextShadowNode.get()));
  EXPECT_DEATH_IF_SUPPORTED(
      traitCast<LayoutableShadowNode const &>(*rawTextShadowNode), "");
  EXPECT_DEATH_IF_SUPPORTED(
      traitCast<YogaLayoutableShadowNode const &>(*rawTextShadowNode), "");

  // trait cast to `RawTextShadowNode` works on `RawTextShadowNode`
  // and not on TextShadowNode or ViewShadowNode
  EXPECT_TRUE(traitCast<RawTextShadowNode const *>(
      shadowNodeForRawTextShadowNode.get()));
  EXPECT_NO_FATAL_FAILURE(
      traitCast<RawTextShadowNode const &>(*shadowNodeForRawTextShadowNode));
  EXPECT_FALSE(
      traitCast<RawTextShadowNode const *>(shadowNodeForTextShadowNode.get()));
  EXPECT_DEATH_IF_SUPPORTED(
      traitCast<RawTextShadowNode const &>(*shadowNodeForTextShadowNode), "");
  EXPECT_FALSE(traitCast<RawTextShadowNode const *>(viewShadowNode.get()));
  EXPECT_DEATH_IF_SUPPORTED(
      traitCast<RawTextShadowNode const &>(*viewShadowNode), "");

  // trait cast to `TextShadowNode` works on `TextShadowNode`
  // and not on RawTextShadowNode or ViewShadowNode
  EXPECT_TRUE(
      traitCast<TextShadowNode const *>(shadowNodeForTextShadowNode.get()));
  EXPECT_NO_FATAL_FAILURE(
      traitCast<TextShadowNode const &>(*shadowNodeForTextShadowNode));
  EXPECT_FALSE(
      traitCast<TextShadowNode const *>(shadowNodeForRawTextShadowNode.get()));
  EXPECT_DEATH_IF_SUPPORTED(
      traitCast<TextShadowNode const &>(*shadowNodeForRawTextShadowNode), "");
  EXPECT_FALSE(traitCast<TextShadowNode const *>(viewShadowNode.get()));
  EXPECT_DEATH_IF_SUPPORTED(
      traitCast<TextShadowNode const &>(*viewShadowNode), "");
}

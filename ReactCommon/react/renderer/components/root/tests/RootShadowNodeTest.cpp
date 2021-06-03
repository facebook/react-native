/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/renderer/components/root/RootComponentDescriptor.h>
#include <react/renderer/element/ComponentBuilder.h>
#include <react/renderer/element/Element.h>
#include <react/renderer/element/testUtils.h>

#include <gtest/gtest.h>

namespace facebook::react {

TEST(RootShadowNodeTest, cloneWithLayoutConstraints) {
  auto builder = simpleComponentBuilder();
  std::shared_ptr<RootShadowNode> rootShadowNode;
  LayoutConstraints defaultLayoutConstraints = {};

  auto element =
      Element<RootShadowNode>().reference(rootShadowNode).tag(1).props([&] {
        auto sharedProps = std::make_shared<RootProps>();
        sharedProps->layoutConstraints = defaultLayoutConstraints;
        return sharedProps;
      });

  builder.build(element);

  EXPECT_FALSE(rootShadowNode->getIsLayoutClean());
  EXPECT_TRUE(rootShadowNode->layoutIfNeeded());
  EXPECT_TRUE(rootShadowNode->getIsLayoutClean());

  auto clonedWithDiffentLayoutConstraints =
      rootShadowNode->clone(LayoutConstraints{{0, 0}, {10, 10}}, {});

  EXPECT_FALSE(clonedWithDiffentLayoutConstraints->getIsLayoutClean());
  EXPECT_TRUE(clonedWithDiffentLayoutConstraints->layoutIfNeeded());
}

} // namespace facebook::react

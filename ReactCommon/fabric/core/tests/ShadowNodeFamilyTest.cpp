/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <exception>

#include <gtest/gtest.h>
#include "TestComponent.h"

using namespace facebook::react;

TEST(ShadowNodeFamilyTest, sealObjectCorrectly) {
  /*
   * The structure:
   * <A>
   *  <AA>
   *    <AAA/>
   *  </AA>
   * </A>
   */
  SurfaceId surfaceId = 1;
  auto eventDispatcher = std::shared_ptr<EventDispatcher const>();
  auto componentDescriptor = TestComponentDescriptor({eventDispatcher});
  auto props = std::make_shared<const TestProps>();

  auto familyAAA = std::make_shared<ShadowNodeFamily>(
      ShadowNodeFamilyFragment{
          /* .tag = */ 12,
          /* .surfaceId = */ surfaceId,
          /* .eventEmitter = */ nullptr,
      },
      componentDescriptor);

  auto nodeAAA = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          /* .props = */ props,
          /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
      },
      familyAAA,
      ShadowNodeTraits{});

  auto nodeAAChildren =
      std::make_shared<SharedShadowNodeList>(SharedShadowNodeList{nodeAAA});
  auto familyAA = std::make_shared<ShadowNodeFamily>(
      ShadowNodeFamilyFragment{
          /* .tag = */ 11,
          /* .surfaceId = */ surfaceId,
          /* .eventEmitter = */ nullptr,
      },
      componentDescriptor);
  auto nodeAA = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          /* .props = */ props,
          /* .children = */ nodeAAChildren,
      },
      familyAA,
      ShadowNodeTraits{});

  auto nodeAChildren =
      std::make_shared<SharedShadowNodeList>(SharedShadowNodeList{nodeAA});

  auto familyA = std::make_shared<ShadowNodeFamily>(
      ShadowNodeFamilyFragment{
          /* .tag = */ 17,
          /* .surfaceId = */ surfaceId,
          /* .eventEmitter = */ nullptr,
      },
      componentDescriptor);
  auto nodeA = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          /* .props = */ props,
          /* .children = */ nodeAChildren,
      },
      familyA,
      ShadowNodeTraits{});

  auto familyZ = std::make_shared<ShadowNodeFamily>(
      ShadowNodeFamilyFragment{
          /* .tag = */ 18,
          /* .surfaceId = */ surfaceId,
          /* .eventEmitter = */ nullptr,
      },
      componentDescriptor);
  auto nodeZ = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          /* .props = */ props,
          /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
      },
      familyZ,
      ShadowNodeTraits{});

  // Negative case:
  auto ancestors1 = nodeZ->getFamily().getAncestors(*nodeA);
  EXPECT_EQ(ancestors1.size(), 0);

  // Positive case:
  auto ancestors2 = nodeAAA->getFamily().getAncestors(*nodeA);
  EXPECT_EQ(ancestors2.size(), 2);
  EXPECT_EQ(&ancestors2[0].first.get(), nodeA.get());
  EXPECT_EQ(&ancestors2[1].first.get(), nodeAA.get());
}

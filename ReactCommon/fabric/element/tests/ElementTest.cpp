/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#include <gtest/gtest.h>

#include <react/components/view/ViewComponentDescriptor.h>
#include <react/element/ComponentBuilder.h>
#include <react/element/Element.h>
#include <react/uimanager/ComponentDescriptorProviderRegistry.h>

using namespace facebook::react;

TEST(ElementTest, testNormalCases) {
  ComponentDescriptorProviderRegistry componentDescriptorProviderRegistry{};
  auto eventDispatcher = EventDispatcher::Shared{};
  auto componentDescriptorRegistry =
      componentDescriptorProviderRegistry.createComponentDescriptorRegistry(
          ComponentDescriptorParameters{eventDispatcher, nullptr, nullptr});

  componentDescriptorProviderRegistry.add(
      concreteComponentDescriptorProvider<ViewComponentDescriptor>());

  auto builder = ComponentBuilder{componentDescriptorRegistry};

  auto shadowNodeA = std::shared_ptr<ViewShadowNode const>{};
  auto shadowNodeAA = std::shared_ptr<ViewShadowNode const>{};
  auto shadowNodeAB = std::shared_ptr<ViewShadowNode const>{};
  auto shadowNodeABA = std::shared_ptr<ViewShadowNode const>{};

  auto propsAA = std::make_shared<ViewProps const>();
  const_cast<std::string &>(propsAA->nativeId) = "node AA";

  // clang-format off
  auto element =
      Element<ViewShadowNode>()
        .reference(shadowNodeA)
        .tag(1)
        .props([]() {
          auto props = std::make_shared<ViewProps const>();
          const_cast<int &>(props->zIndex) = 42;
          const_cast<std::string &>(props->nativeId) = "node A";
          return props;
        })
        .finalize([](ViewShadowNode &shadowNode){
          shadowNode.sealRecursive();
        })
        .children({
          Element<ViewShadowNode>()
            .reference(shadowNodeAA)
            .tag(2)
            .props(propsAA),
          Element<ViewShadowNode>()
            .reference(shadowNodeAB)
            .tag(3)
            .props([]() {
               auto props = std::make_shared<ViewProps const>();
               const_cast<std::string &>(props->nativeId) = "node AB";
               return props;
            })
            .children({
              Element<ViewShadowNode>()
                .reference(shadowNodeABA)
                .tag(4)
                .props([]() {
                  auto props = std::make_shared<ViewProps const>();
                  const_cast<std::string &>(props->nativeId) = "node ABA";
                  return props;
                })
            })
        });
  // clang-format on

  auto shadowNode = builder.build(element);

  EXPECT_EQ(shadowNode, shadowNodeA);

  // Tags
  EXPECT_EQ(shadowNodeA->getTag(), 1);
  EXPECT_EQ(shadowNodeAA->getTag(), 2);
  EXPECT_EQ(shadowNodeAB->getTag(), 3);
  EXPECT_EQ(shadowNodeABA->getTag(), 4);

  // Children
  EXPECT_EQ(shadowNodeA->getChildren().size(), 2);
  EXPECT_EQ(shadowNodeAA->getChildren().size(), 0);
  EXPECT_EQ(shadowNodeAB->getChildren().size(), 1);
  EXPECT_EQ(shadowNodeABA->getChildren().size(), 0);
  EXPECT_EQ(
      shadowNodeA->getChildren(),
      (ShadowNode::ListOfShared{shadowNodeAA, shadowNodeAB}));
  EXPECT_EQ(
      shadowNodeAB->getChildren(), (ShadowNode::ListOfShared{shadowNodeABA}));

  // Props
  EXPECT_EQ(shadowNodeA->getProps()->nativeId, "node A");
  EXPECT_EQ(shadowNodeABA->getProps()->nativeId, "node ABA");
  EXPECT_EQ(shadowNodeAA->getProps(), propsAA);

  // Finalize
  EXPECT_TRUE(shadowNodeA->getSealed());
  EXPECT_TRUE(shadowNodeAA->getSealed());
  EXPECT_TRUE(shadowNodeAB->getSealed());
  EXPECT_TRUE(shadowNodeABA->getSealed());
}

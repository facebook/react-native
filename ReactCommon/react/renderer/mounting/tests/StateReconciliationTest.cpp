/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#include <gtest/gtest.h>

#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#include <react/renderer/components/root/RootComponentDescriptor.h>
#include <react/renderer/components/view/ViewComponentDescriptor.h>
#include <react/renderer/element/ComponentBuilder.h>
#include <react/renderer/element/Element.h>
#include <react/renderer/element/testUtils.h>

#include <react/renderer/mounting/MountingCoordinator.h>
#include <react/renderer/mounting/ShadowTree.h>
#include <react/renderer/mounting/ShadowTreeDelegate.h>

using namespace facebook::react;

class DummyShadowTreeDelegate : public ShadowTreeDelegate {
 public:
  virtual void shadowTreeDidFinishTransaction(
      ShadowTree const &shadowTree,
      MountingCoordinator::Shared const &mountingCoordinator) const override{};
};

inline ShadowNode const *findDescendantNode(
    ShadowNode const &shadowNode,
    ShadowNodeFamily const &family) {
  ShadowNode const *result = nullptr;
  shadowNode.cloneTree(family, [&](ShadowNode const &oldShadowNode) {
    result = &oldShadowNode;
    return oldShadowNode.clone({});
  });
  return result;
}

inline ShadowNode const *findDescendantNode(
    ShadowTree const &shadowTree,
    ShadowNodeFamily const &family) {
  return findDescendantNode(
      *shadowTree.getCurrentRevision().rootShadowNode, family);
}

TEST(StateReconciliationTest, testStateReconciliation) {
  auto builder = simpleComponentBuilder();

  auto shadowNodeA = std::shared_ptr<RootShadowNode>{};
  auto shadowNodeAA = std::shared_ptr<ViewShadowNode>{};
  auto shadowNodeAB = std::shared_ptr<ScrollViewShadowNode>{};
  auto shadowNodeABA = std::shared_ptr<ViewShadowNode>{};
  auto shadowNodeABB = std::shared_ptr<ViewShadowNode>{};
  auto shadowNodeABC = std::shared_ptr<ViewShadowNode>{};

  // clang-format off
  auto element =
      Element<RootShadowNode>()
        .reference(shadowNodeA)
        .finalize([](RootShadowNode &shadowNode){
          shadowNode.sealRecursive();
        })
        .children({
          Element<ViewShadowNode>()
            .reference(shadowNodeAA),
          Element<ScrollViewShadowNode>()
            .reference(shadowNodeAB)
            .children({
              Element<ViewShadowNode>()
                .reference(shadowNodeABA),
              Element<ViewShadowNode>()
                .reference(shadowNodeABB),
              Element<ViewShadowNode>()
                .reference(shadowNodeABC)
            })
        });
  // clang-format on

  auto shadowNode = builder.build(element);

  auto rootShadowNodeState1 = shadowNode->ShadowNode::clone({});

  auto &scrollViewComponentDescriptor = shadowNodeAB->getComponentDescriptor();
  auto &family = shadowNodeAB->getFamily();
  auto state1 = shadowNodeAB->getState();
  auto shadowTreeDelegate = DummyShadowTreeDelegate{};
  auto eventDispatcher = EventDispatcher::Shared{};
  auto rootComponentDescriptor =
      ComponentDescriptorParameters{eventDispatcher, nullptr, nullptr};
  ShadowTree shadowTree{SurfaceId{11},
                        LayoutConstraints{},
                        LayoutContext{},
                        rootComponentDescriptor,
                        shadowTreeDelegate,
                        {}};

  shadowTree.commit(
      [&](RootShadowNode const &oldRootShadowNode) {
        return std::static_pointer_cast<RootShadowNode>(rootShadowNodeState1);
      },
      {true});

  EXPECT_EQ(state1->getMostRecentState(), state1);

  EXPECT_EQ(
      findDescendantNode(*rootShadowNodeState1, family)->getState(), state1);

  auto state2 = scrollViewComponentDescriptor.createState(
      family, std::make_shared<ScrollViewState const>());

  auto rootShadowNodeState2 =
      shadowNode->cloneTree(family, [&](ShadowNode const &oldShadowNode) {
        return oldShadowNode.clone({ShadowNodeFragment::propsPlaceholder(),
                                    ShadowNodeFragment::childrenPlaceholder(),
                                    state2});
      });

  EXPECT_EQ(
      findDescendantNode(*rootShadowNodeState2, family)->getState(), state2);

  shadowTree.commit(
      [&](RootShadowNode const &oldRootShadowNode) {
        return std::static_pointer_cast<RootShadowNode>(rootShadowNodeState2);
      },
      {true});

  EXPECT_EQ(state1->getMostRecentState(), state2);
  EXPECT_EQ(state2->getMostRecentState(), state2);

  auto state3 = scrollViewComponentDescriptor.createState(
      family, std::make_shared<ScrollViewState const>());

  auto rootShadowNodeState3 = rootShadowNodeState2->cloneTree(
      family, [&](ShadowNode const &oldShadowNode) {
        return oldShadowNode.clone({ShadowNodeFragment::propsPlaceholder(),
                                    ShadowNodeFragment::childrenPlaceholder(),
                                    state3});
      });

  EXPECT_EQ(
      findDescendantNode(*rootShadowNodeState3, family)->getState(), state3);

  shadowTree.commit(
      [&](RootShadowNode const &oldRootShadowNode) {
        return std::static_pointer_cast<RootShadowNode>(rootShadowNodeState3);
      },
      {true});

  EXPECT_EQ(findDescendantNode(shadowTree, family)->getState(), state3);

  EXPECT_EQ(state1->getMostRecentState(), state3);
  EXPECT_EQ(state2->getMostRecentState(), state3);
  EXPECT_EQ(state3->getMostRecentState(), state3);

  // This is the core part of the whole test.
  // Here we commit the old tree but we expect that the state associated with
  // the node will stay the same (newer that the old tree has).
  shadowTree.commit(
      [&](RootShadowNode const &oldRootShadowNode) {
        return std::static_pointer_cast<RootShadowNode>(rootShadowNodeState2);
      },
      {true});

  EXPECT_EQ(findDescendantNode(shadowTree, family)->getState(), state3);
}

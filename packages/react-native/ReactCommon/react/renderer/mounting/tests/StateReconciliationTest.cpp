/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#include <gtest/gtest.h>

#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#include <react/renderer/components/view/ViewComponentDescriptor.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/element/ComponentBuilder.h>
#include <react/renderer/element/Element.h>
#include <react/renderer/mounting/MountingCoordinator.h>
#include <react/renderer/mounting/ShadowTree.h>
#include <react/renderer/mounting/ShadowTreeDelegate.h>

#include <react/renderer/element/testUtils.h>

using namespace facebook::react;

class DummyShadowTreeDelegate : public ShadowTreeDelegate {
 public:
  RootShadowNode::Unshared shadowTreeWillCommit(
      const ShadowTree& /*shadowTree*/,
      const RootShadowNode::Shared& /*oldRootShadowNode*/,
      const RootShadowNode::Unshared& newRootShadowNode) const override {
    return newRootShadowNode;
  };

  void shadowTreeDidFinishTransaction(
      MountingCoordinator::Shared mountingCoordinator,
      bool mountSynchronously) const override{};
};

namespace {
const ShadowNode* findDescendantNode(
    const ShadowNode& shadowNode,
    const ShadowNodeFamily& family) {
  if (&shadowNode.getFamily() == &family) {
    return &shadowNode;
  }

  for (auto childNode : shadowNode.getChildren()) {
    auto descendant = findDescendantNode(*childNode, family);
    if (descendant != nullptr) {
      return descendant;
    }
  }

  return nullptr;
}

const ShadowNode* findDescendantNode(
    const ShadowTree& shadowTree,
    const ShadowNodeFamily& family) {
  return findDescendantNode(
      *shadowTree.getCurrentRevision().rootShadowNode, family);
}
} // namespace

class StateReconciliationTest : public ::testing::TestWithParam<bool> {
 public:
  StateReconciliationTest() : builder_(simpleComponentBuilder()) {
    CoreFeatures::enableClonelessStateProgression = GetParam();
  }

  ComponentBuilder builder_;
};

TEST_P(StateReconciliationTest, testStateReconciliation) {
  auto shadowNodeA = std::shared_ptr<RootShadowNode>{};
  auto shadowNodeAA = std::shared_ptr<ViewShadowNode>{};
  auto shadowNodeAB = std::shared_ptr<ScrollViewShadowNode>{};

  // clang-format off
  auto element =
      Element<RootShadowNode>()
        .reference(shadowNodeA)
        .children({
          Element<ViewShadowNode>()
            .reference(shadowNodeAA),
          Element<ScrollViewShadowNode>()
            .reference(shadowNodeAB)
        });
  // clang-format on

  ContextContainer contextContainer{};

  auto shadowNode = builder_.build(element);

  auto rootShadowNodeState1 = shadowNode->ShadowNode::clone({});

  auto& scrollViewComponentDescriptor = shadowNodeAB->getComponentDescriptor();
  auto& family = shadowNodeAB->getFamily();
  auto state1 = shadowNodeAB->getState();
  auto shadowTreeDelegate = DummyShadowTreeDelegate{};
  ShadowTree shadowTree{
      SurfaceId{11},
      LayoutConstraints{},
      LayoutContext{},
      shadowTreeDelegate,
      contextContainer};

  shadowTree.commit(
      [&](const RootShadowNode& /*oldRootShadowNode*/) {
        return std::static_pointer_cast<RootShadowNode>(rootShadowNodeState1);
      },
      {true});

  EXPECT_EQ(state1->getMostRecentState(), state1);

  EXPECT_EQ(
      findDescendantNode(*rootShadowNodeState1, family)->getState(), state1);

  auto state2 = scrollViewComponentDescriptor.createState(
      family, std::make_shared<const ScrollViewState>());

  auto rootShadowNodeState2 =
      shadowNode->cloneTree(family, [&](const ShadowNode& oldShadowNode) {
        return oldShadowNode.clone(
            {ShadowNodeFragment::propsPlaceholder(),
             ShadowNodeFragment::childrenPlaceholder(),
             state2});
      });

  EXPECT_EQ(
      findDescendantNode(*rootShadowNodeState2, family)->getState(), state2);

  shadowTree.commit(
      [&](const RootShadowNode& /*oldRootShadowNode*/) {
        return std::static_pointer_cast<RootShadowNode>(rootShadowNodeState2);
      },
      {true});

  EXPECT_EQ(state1->getMostRecentState(), state2);
  EXPECT_EQ(state2->getMostRecentState(), state2);

  auto state3 = scrollViewComponentDescriptor.createState(
      family, std::make_shared<const ScrollViewState>());

  auto rootShadowNodeState3 = rootShadowNodeState2->cloneTree(
      family, [&](const ShadowNode& oldShadowNode) {
        return oldShadowNode.clone(
            {ShadowNodeFragment::propsPlaceholder(),
             ShadowNodeFragment::childrenPlaceholder(),
             state3});
      });

  EXPECT_EQ(
      findDescendantNode(*rootShadowNodeState3, family)->getState(), state3);

  shadowTree.commit(
      [&](const RootShadowNode& /*oldRootShadowNode*/) {
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
      [&](const RootShadowNode& /*oldRootShadowNode*/) {
        return std::static_pointer_cast<RootShadowNode>(rootShadowNodeState2);
      },
      {true});

  // Warning:
  // there is important semantic difference with the approach. With the old
  // algorithm, you couldn't go back to a shadow node with old state. New state
  // was always enforced when state reconciliation was enabled. The clone-less
  // algorithm does not support that, because it can't mutate such a node in
  // place.
  if (!GetParam()) {
    EXPECT_EQ(findDescendantNode(shadowTree, family)->getState(), state3);
  } else {
    EXPECT_EQ(findDescendantNode(shadowTree, family)->getState(), state2);
  }
}

TEST_P(StateReconciliationTest, testCloneslessStateReconciliationDoesntClone) {
  auto shadowNodeA = std::shared_ptr<RootShadowNode>{};
  auto shadowNodeAA = std::shared_ptr<ViewShadowNode>{};
  auto shadowNodeAB = std::shared_ptr<ScrollViewShadowNode>{};

  // clang-format off
  auto element =
      Element<RootShadowNode>()
        .reference(shadowNodeA)
        .children({
          Element<ViewShadowNode>()
            .reference(shadowNodeAA),
          Element<ScrollViewShadowNode>()
            .reference(shadowNodeAB)
        });
  // clang-format on

  ContextContainer contextContainer{};

  auto rootShadowNode1 = builder_.build(element);

  auto& scrollViewComponentDescriptor = shadowNodeAB->getComponentDescriptor();
  auto& family = shadowNodeAB->getFamily();
  auto state1 = shadowNodeAB->getState();
  auto shadowTreeDelegate = DummyShadowTreeDelegate{};
  ShadowTree shadowTree{
      SurfaceId{11},
      LayoutConstraints{},
      LayoutContext{},
      shadowTreeDelegate,
      contextContainer};

  shadowTree.commit(
      [&](const RootShadowNode& /*oldRootShadowNode*/) {
        return std::static_pointer_cast<RootShadowNode>(rootShadowNode1);
      },
      {true});

  EXPECT_EQ(state1->getMostRecentState(), state1);

  EXPECT_EQ(findDescendantNode(*rootShadowNode1, family)->getState(), state1);

  auto state2 = scrollViewComponentDescriptor.createState(
      family, std::make_shared<const ScrollViewState>());

  auto rootShadowNode2 =
      rootShadowNode1->cloneTree(family, [&](const ShadowNode& oldShadowNode) {
        return oldShadowNode.clone(
            {ShadowNodeFragment::propsPlaceholder(),
             ShadowNodeFragment::childrenPlaceholder(),
             state2});
      });

  EXPECT_EQ(findDescendantNode(*rootShadowNode2, family)->getState(), state2);
  EXPECT_EQ(state1->getMostRecentState(), state1);

  shadowTree.commit(
      [&](const RootShadowNode& /*oldRootShadowNode*/) {
        return std::static_pointer_cast<RootShadowNode>(rootShadowNode2);
      },
      {true});

  EXPECT_EQ(state1->getMostRecentState(), state2);
  EXPECT_EQ(state2->getMostRecentState(), state2);

  ShadowNode::Unshared newlyClonedShadowNode;

  auto rootShadowNodeClonedFromReact =
      rootShadowNode2->cloneTree(family, [&](const ShadowNode& oldShadowNode) {
        newlyClonedShadowNode = oldShadowNode.clone({});
        return newlyClonedShadowNode;
      });

  auto state3 = scrollViewComponentDescriptor.createState(
      family, std::make_shared<const ScrollViewState>());

  auto rootShadowNodeClonedFromStateUpdate =
      rootShadowNode2->cloneTree(family, [&](const ShadowNode& oldShadowNode) {
        return oldShadowNode.clone(
            {ShadowNodeFragment::propsPlaceholder(),
             ShadowNodeFragment::childrenPlaceholder(),
             state3});
      });

  shadowTree.commit(
      [&](const RootShadowNode& /*oldRootShadowNode*/) {
        return std::static_pointer_cast<RootShadowNode>(
            rootShadowNodeClonedFromStateUpdate);
      },
      {});

  shadowTree.commit(
      [&](const RootShadowNode& /*oldRootShadowNode*/) {
        return std::static_pointer_cast<RootShadowNode>(
            rootShadowNodeClonedFromReact);
      },
      {true});

  auto scrollViewShadowNode = findDescendantNode(shadowTree, family);

  EXPECT_EQ(scrollViewShadowNode->getState(), state3);

  if (GetParam()) {
    // Checking that newlyClonedShadowNode was not cloned unnecessarly by state
    // progression. This fails with the old algorithm.
    EXPECT_EQ(scrollViewShadowNode, newlyClonedShadowNode.get());
  }
}
INSTANTIATE_TEST_SUITE_P(
    StateReconciliationTestInstantiation,
    StateReconciliationTest,
    testing::Values(false, true));

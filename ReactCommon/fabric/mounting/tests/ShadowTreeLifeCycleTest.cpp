/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <glog/logging.h>
#include <gtest/gtest.h>

#include <react/components/root/RootComponentDescriptor.h>
#include <react/components/view/ViewComponentDescriptor.h>
#include <react/mounting/Differentiator.h>
#include <react/mounting/stubs.h>

#include "Entropy.h"
#include "shadowTreeGeneration.h"

namespace facebook {
namespace react {

static void testShadowNodeTreeLifeCycle(
    DifferentiatorMode differentiatorMode,
    uint_fast32_t seed,
    int treeSize,
    int repeats,
    int stages) {
  auto entropy = seed == 0 ? Entropy() : Entropy(seed);

  auto eventDispatcher = EventDispatcher::Shared{};
  auto contextContainer = std::make_shared<ContextContainer>();
  auto componentDescriptorParameters =
      ComponentDescriptorParameters{eventDispatcher, contextContainer, nullptr};
  auto viewComponentDescriptor =
      ViewComponentDescriptor(componentDescriptorParameters);
  auto rootComponentDescriptor =
      RootComponentDescriptor(componentDescriptorParameters);
  auto noopEventEmitter =
      std::make_shared<ViewEventEmitter const>(nullptr, -1, eventDispatcher);

  auto allNodes = std::vector<ShadowNode::Shared>{};

  for (int i = 0; i < repeats; i++) {
    allNodes.clear();

    auto family = rootComponentDescriptor.createFamily(
        {Tag(1), SurfaceId(1), nullptr}, nullptr);

    // Creating an initial root shadow node.
    auto emptyRootNode = std::const_pointer_cast<RootShadowNode>(
        std::static_pointer_cast<RootShadowNode const>(
            rootComponentDescriptor.createShadowNode(
                ShadowNodeFragment{RootShadowNode::defaultSharedProps()},
                family)));

    // Applying size constraints.
    emptyRootNode = emptyRootNode->clone(
        LayoutConstraints{Size{512, 0},
                          Size{512, std::numeric_limits<Float>::infinity()}},
        LayoutContext{});

    // Generation of a random tree.
    auto singleRootChildNode =
        generateShadowNodeTree(entropy, viewComponentDescriptor, treeSize);

    // Injecting a tree into the root node.
    auto currentRootNode = std::static_pointer_cast<RootShadowNode const>(
        emptyRootNode->ShadowNode::clone(ShadowNodeFragment{
            ShadowNodeFragment::propsPlaceholder(),
            std::make_shared<SharedShadowNodeList>(
                SharedShadowNodeList{singleRootChildNode})}));

    // Building an initial view hierarchy.
    auto viewTree = stubViewTreeFromShadowNode(*emptyRootNode);
    viewTree.mutate(calculateShadowViewMutations(
        differentiatorMode, *emptyRootNode, *currentRootNode));

    for (int j = 0; j < stages; j++) {
      auto nextRootNode = currentRootNode;

      // Mutating the tree.
      alterShadowTree(
          entropy,
          nextRootNode,
          {
              &messWithChildren,
              &messWithYogaStyles,
              &messWithLayotableOnlyFlag,
          });

      std::vector<LayoutableShadowNode const *> affectedLayoutableNodes{};
      affectedLayoutableNodes.reserve(1024);

      // Laying out the tree.
      std::const_pointer_cast<RootShadowNode>(nextRootNode)
          ->layoutIfNeeded(&affectedLayoutableNodes);

      nextRootNode->sealRecursive();
      allNodes.push_back(nextRootNode);

      // Calculating mutations.
      auto mutations = calculateShadowViewMutations(
          differentiatorMode, *currentRootNode, *nextRootNode);

      // Mutating the view tree.
      viewTree.mutate(mutations);

      // Building a view tree to compare with.
      auto rebuiltViewTree = stubViewTreeFromShadowNode(*nextRootNode);

      // Comparing the newly built tree with the updated one.
      if (rebuiltViewTree != viewTree) {
        // Something went wrong.

        LOG(ERROR) << "Entropy seed: " << entropy.getSeed() << "\n";

        LOG(ERROR) << "Shadow Tree before: \n"
                   << currentRootNode->getDebugDescription();
        LOG(ERROR) << "Shadow Tree after: \n"
                   << nextRootNode->getDebugDescription();

        LOG(ERROR) << "View Tree before: \n"
                   << getDebugDescription(viewTree.getRootStubView(), {});
        LOG(ERROR) << "View Tree after: \n"
                   << getDebugDescription(
                          rebuiltViewTree.getRootStubView(), {});

        LOG(ERROR) << "Mutations:"
                   << "\n"
                   << getDebugDescription(mutations, {});

        FAIL();
      }

      currentRootNode = nextRootNode;
    }
  }

  SUCCEED();
}

} // namespace react
} // namespace facebook

using namespace facebook::react;

TEST(MountingTest, stableBiggerTreeFewerIterationsClassic) {
  testShadowNodeTreeLifeCycle(
      DifferentiatorMode::Classic,
      /* seed */ 1,
      /* size */ 512,
      /* repeats */ 32,
      /* stages */ 32);
}

TEST(MountingTest, stableSmallerTreeMoreIterationsClassic) {
  testShadowNodeTreeLifeCycle(
      DifferentiatorMode::Classic,
      /* seed */ 1,
      /* size */ 16,
      /* repeats */ 512,
      /* stages */ 32);
}

TEST(MountingTest, stableBiggerTreeFewerIterationsOptimizedMoves) {
  testShadowNodeTreeLifeCycle(
      DifferentiatorMode::OptimizedMoves,
      /* seed */ 1,
      /* size */ 512,
      /* repeats */ 32,
      /* stages */ 32);
}

TEST(MountingTest, stableSmallerTreeMoreIterationsOptimizedMoves) {
  testShadowNodeTreeLifeCycle(
      DifferentiatorMode::OptimizedMoves,
      /* seed */ 1,
      /* size */ 16,
      /* repeats */ 512,
      /* stages */ 32);
}

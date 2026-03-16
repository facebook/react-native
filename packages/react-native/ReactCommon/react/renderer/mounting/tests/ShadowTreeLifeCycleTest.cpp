/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <vector>

#include <glog/logging.h>
#include <gtest/gtest.h>

#include <react/renderer/components/root/RootComponentDescriptor.h>
#include <react/renderer/components/view/ViewComponentDescriptor.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/element/ComponentBuilder.h>
#include <react/renderer/element/Element.h>
#include <react/renderer/element/testUtils.h>
#include <react/renderer/mounting/Differentiator.h>
#include <react/renderer/mounting/ShadowViewMutation.h>

#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/featureflags/ReactNativeFeatureFlagsDefaults.h>
#include <react/renderer/mounting/stubs/stubs.h>
#include <react/test_utils/Entropy.h>
#include <react/test_utils/shadowTreeGeneration.h>

// Uncomment when random test blocks are uncommented below.
// #include <algorithm>
// #include <random>

namespace facebook::react {

static void testShadowNodeTreeLifeCycle(
    uint_fast32_t seed,
    int treeSize,
    int repeats,
    int stages) {
  auto entropy = seed == 0 ? Entropy() : Entropy(seed);

  auto eventDispatcher = EventDispatcher::Shared{};
  auto contextContainer = std::make_shared<ContextContainer>();
  auto componentDescriptorParameters = ComponentDescriptorParameters{
      .eventDispatcher = eventDispatcher,
      .contextContainer = contextContainer,
      .flavor = nullptr};
  auto viewComponentDescriptor =
      ViewComponentDescriptor(componentDescriptorParameters);
  auto rootComponentDescriptor =
      RootComponentDescriptor(componentDescriptorParameters);

  PropsParserContext parserContext{-1, *contextContainer};

  auto allNodes = std::vector<std::shared_ptr<const ShadowNode>>{};

  for (int i = 0; i < repeats; i++) {
    allNodes.clear();

    auto family = rootComponentDescriptor.createFamily(
        {.tag = Tag(1), .surfaceId = SurfaceId(1), .instanceHandle = nullptr});

    // Creating an initial root shadow node.
    auto emptyRootNode = std::const_pointer_cast<RootShadowNode>(
        std::static_pointer_cast<const RootShadowNode>(
            rootComponentDescriptor.createShadowNode(
                ShadowNodeFragment{
                    .props = RootShadowNode::defaultSharedProps()},
                family)));

    // Applying size constraints.
    emptyRootNode = emptyRootNode->clone(
        parserContext,
        LayoutConstraints{
            .minimumSize = Size{.width = 512, .height = 0},
            .maximumSize =
                Size{
                    .width = 512,
                    .height = std::numeric_limits<Float>::infinity()}},
        LayoutContext{});

    // Generation of a random tree.
    auto singleRootChildNode =
        generateShadowNodeTree(entropy, viewComponentDescriptor, treeSize);

    // Injecting a tree into the root node.
    auto currentRootNode = std::static_pointer_cast<const RootShadowNode>(
        emptyRootNode->ShadowNode::clone(
            ShadowNodeFragment{
                .props = ShadowNodeFragment::propsPlaceholder(),
                .children = std::make_shared<
                    std::vector<std::shared_ptr<const ShadowNode>>>(
                    std::vector<std::shared_ptr<const ShadowNode>>{
                        singleRootChildNode})}));

    // Building an initial view hierarchy.
    auto viewTree = StubViewTree(ShadowView(*emptyRootNode));
    viewTree.mutate(
        calculateShadowViewMutations(*emptyRootNode, *currentRootNode));

    for (int j = 0; j < stages; j++) {
      auto nextRootNode = currentRootNode;

      // Mutating the tree.
      alterShadowTree(
          entropy,
          nextRootNode,
          {
              &messWithChildren,
              &messWithYogaStyles,
              &messWithLayoutableOnlyFlag,
          });

      std::vector<const LayoutableShadowNode*> affectedLayoutableNodes{};
      affectedLayoutableNodes.reserve(1024);

      // Laying out the tree.
      std::const_pointer_cast<RootShadowNode>(nextRootNode)
          ->layoutIfNeeded(&affectedLayoutableNodes);

      nextRootNode->sealRecursive();
      allNodes.push_back(nextRootNode);

      // Calculating mutations.
      auto mutations =
          calculateShadowViewMutations(*currentRootNode, *nextRootNode);

      // Make sure that in a single frame, a DELETE for a
      // view is not followed by a CREATE for the same view.
      {
        std::vector<int> deletedTags{};
        for (const auto& mutation : mutations) {
          if (mutation.type == ShadowViewMutation::Type::Delete) {
            deletedTags.push_back(mutation.oldChildShadowView.tag);
          }
        }
        for (const auto& mutation : mutations) {
          if (mutation.type == ShadowViewMutation::Type::Create) {
            if (std::find(
                    deletedTags.begin(),
                    deletedTags.end(),
                    mutation.newChildShadowView.tag) != deletedTags.end()) {
              LOG(ERROR) << "Deleted tag was recreated in mutations list: ["
                         << mutation.newChildShadowView.tag << "]";
              react_native_assert(false);
            }
          }
        }
      }

      // Mutating the view tree.
      viewTree.mutate(mutations);

      // Building a view tree to compare with.
      auto rebuiltViewTree =
          buildStubViewTreeWithoutUsingDifferentiator(*nextRootNode);

      // Comparing the newly built tree with the updated one.
      if (rebuiltViewTree != viewTree) {
        // Something went wrong.

        LOG(ERROR) << "Entropy seed: " << entropy.getSeed() << "\n";

        // There are some issues getting `getDebugDescription` to compile
        // under test on Android for now.
#if RN_DEBUG_STRING_CONVERTIBLE
        LOG(ERROR) << "Shadow Tree before: \n"
                   << currentRootNode->getDebugDescription();
        LOG(ERROR) << "Shadow Tree after: \n"
                   << nextRootNode->getDebugDescription();

        LOG(ERROR) << "View Tree before: \n"
                   << getDebugDescription(viewTree.getRootStubView(), {});
        LOG(ERROR) << "View Tree after: \n"
                   << getDebugDescription(
                          rebuiltViewTree.getRootStubView(), {});

        LOG(ERROR) << "Mutations:" << "\n"
                   << getDebugDescription(mutations, {});
#endif

        react_native_assert(false);
      }

      currentRootNode = nextRootNode;
    }
  }

  SUCCEED();
}

static void testShadowNodeTreeLifeCycleExtensiveFlatteningUnflattening(
    uint_fast32_t seed,
    int treeSize,
    int repeats,
    int stages) {
  auto entropy = seed == 0 ? Entropy() : Entropy(seed);

  auto eventDispatcher = EventDispatcher::Shared{};
  auto contextContainer = std::make_shared<ContextContainer>();

  auto componentDescriptorParameters = ComponentDescriptorParameters{
      .eventDispatcher = eventDispatcher,
      .contextContainer = contextContainer,
      .flavor = nullptr};
  auto viewComponentDescriptor =
      ViewComponentDescriptor(componentDescriptorParameters);
  auto rootComponentDescriptor =
      RootComponentDescriptor(componentDescriptorParameters);

  PropsParserContext parserContext{-1, *contextContainer};

  auto allNodes = std::vector<std::shared_ptr<const ShadowNode>>{};

  for (int i = 0; i < repeats; i++) {
    allNodes.clear();

    auto family = rootComponentDescriptor.createFamily(
        {.tag = Tag(1), .surfaceId = SurfaceId(1), .instanceHandle = nullptr});

    // Creating an initial root shadow node.
    auto emptyRootNode = std::const_pointer_cast<RootShadowNode>(
        std::static_pointer_cast<const RootShadowNode>(
            rootComponentDescriptor.createShadowNode(
                ShadowNodeFragment{
                    .props = RootShadowNode::defaultSharedProps()},
                family)));

    // Applying size constraints.
    emptyRootNode = emptyRootNode->clone(
        parserContext,
        LayoutConstraints{
            .minimumSize = Size{.width = 512, .height = 0},
            .maximumSize =
                Size{
                    .width = 512,
                    .height = std::numeric_limits<Float>::infinity()}},
        LayoutContext{});

    // Generation of a random tree.
    auto singleRootChildNode =
        generateShadowNodeTree(entropy, viewComponentDescriptor, treeSize);

    // Injecting a tree into the root node.
    auto currentRootNode = std::static_pointer_cast<const RootShadowNode>(
        emptyRootNode->ShadowNode::clone(
            ShadowNodeFragment{
                .props = ShadowNodeFragment::propsPlaceholder(),
                .children = std::make_shared<
                    std::vector<std::shared_ptr<const ShadowNode>>>(
                    std::vector<std::shared_ptr<const ShadowNode>>{
                        singleRootChildNode})}));

    // Building an initial view hierarchy.
    auto viewTree = buildStubViewTreeWithoutUsingDifferentiator(*emptyRootNode);
    viewTree.mutate(
        calculateShadowViewMutations(*emptyRootNode, *currentRootNode));

    for (int j = 0; j < stages; j++) {
      auto nextRootNode = currentRootNode;

      // Mutating the tree.
      alterShadowTree(
          entropy,
          nextRootNode,
          {
              &messWithYogaStyles,
              &messWithLayoutableOnlyFlag,
          });
      alterShadowTree(entropy, nextRootNode, &messWithNodeFlattenednessFlags);
      alterShadowTree(entropy, nextRootNode, &messWithChildren);

      std::vector<const LayoutableShadowNode*> affectedLayoutableNodes{};
      affectedLayoutableNodes.reserve(1024);

      // Laying out the tree.
      std::const_pointer_cast<RootShadowNode>(nextRootNode)
          ->layoutIfNeeded(&affectedLayoutableNodes);

      nextRootNode->sealRecursive();
      allNodes.push_back(nextRootNode);

      // Calculating mutations.
      auto mutations =
          calculateShadowViewMutations(*currentRootNode, *nextRootNode);

      // Make sure that in a single frame, a DELETE for a
      // view is not followed by a CREATE for the same view.
      {
        std::vector<int> deletedTags{};
        for (const auto& mutation : mutations) {
          if (mutation.type == ShadowViewMutation::Type::Delete) {
            deletedTags.push_back(mutation.oldChildShadowView.tag);
          }
        }
        for (const auto& mutation : mutations) {
          if (mutation.type == ShadowViewMutation::Type::Create) {
            if (std::find(
                    deletedTags.begin(),
                    deletedTags.end(),
                    mutation.newChildShadowView.tag) != deletedTags.end()) {
              LOG(ERROR) << "Deleted tag was recreated in mutations list: ["
                         << mutation.newChildShadowView.tag << "]";
              react_native_assert(false);
            }
          }
        }
      }

      // Mutating the view tree.
      viewTree.mutate(mutations);

      // Building a view tree to compare with.
      auto rebuiltViewTree =
          buildStubViewTreeWithoutUsingDifferentiator(*nextRootNode);

      // Comparing the newly built tree with the updated one.
      if (rebuiltViewTree != viewTree) {
        // Something went wrong.

        LOG(ERROR) << "Entropy seed: " << entropy.getSeed() << "\n";

        // There are some issues getting `getDebugDescription` to compile
        // under test on Android for now.
#if RN_DEBUG_STRING_CONVERTIBLE
        LOG(ERROR) << "Shadow Tree before: \n"
                   << currentRootNode->getDebugDescription();
        LOG(ERROR) << "Shadow Tree after: \n"
                   << nextRootNode->getDebugDescription();

        LOG(ERROR) << "View Tree before: \n"
                   << getDebugDescription(viewTree.getRootStubView(), {});
        LOG(ERROR) << "View Tree after: \n"
                   << getDebugDescription(
                          rebuiltViewTree.getRootStubView(), {});

        LOG(ERROR) << "Mutations:" << "\n"
                   << getDebugDescription(mutations, {});
#endif

        react_native_assert(false);
      }

      currentRootNode = nextRootNode;
    }
  }

  SUCCEED();
}

} // namespace facebook::react

using namespace facebook::react;

namespace {

class LISFeatureFlagsOverride
    : public facebook::react::ReactNativeFeatureFlagsDefaults {
 public:
  bool useLISAlgorithmInDifferentiator() override {
    return true;
  }
};

} // namespace

// Parametrized lifecycle tests: each test runs with both the greedy
// algorithm (false) and the LIS algorithm (true).
class ShadowTreeLifecycleTest : public ::testing::TestWithParam<bool> {
 protected:
  void SetUp() override {
    if (GetParam()) {
      facebook::react::ReactNativeFeatureFlags::override(
          std::make_unique<LISFeatureFlagsOverride>());
    }
  }

  void TearDown() override {
    facebook::react::ReactNativeFeatureFlags::dangerouslyReset();
  }
};

TEST_P(
    ShadowTreeLifecycleTest,
    stableBiggerTreeFewerIterationsOptimizedMovesFlattener) {
  testShadowNodeTreeLifeCycle(
      /* seed */ 0,
      /* size */ 512,
      /* repeats */ 32,
      /* stages */ 32);
}

TEST_P(
    ShadowTreeLifecycleTest,
    stableBiggerTreeFewerIterationsOptimizedMovesFlattener2) {
  testShadowNodeTreeLifeCycle(
      /* seed */ 1,
      /* size */ 512,
      /* repeats */ 32,
      /* stages */ 32);
}

TEST_P(
    ShadowTreeLifecycleTest,
    stableSmallerTreeMoreIterationsOptimizedMovesFlattener) {
  testShadowNodeTreeLifeCycle(
      /* seed */ 0,
      /* size */ 16,
      /* repeats */ 512,
      /* stages */ 32);
}

TEST_P(
    ShadowTreeLifecycleTest,
    unstableSmallerTreeFewerIterationsExtensiveFlatteningUnflattening) {
  testShadowNodeTreeLifeCycleExtensiveFlatteningUnflattening(
      /* seed */ 1337,
      /* size */ 32,
      /* repeats */ 32,
      /* stages */ 32);
}

TEST_P(
    ShadowTreeLifecycleTest,
    unstableBiggerTreeFewerIterationsExtensiveFlatteningUnflattening) {
  testShadowNodeTreeLifeCycleExtensiveFlatteningUnflattening(
      /* seed */ 1337,
      /* size */ 256,
      /* repeats */ 32,
      /* stages */ 32);
}

TEST_P(
    ShadowTreeLifecycleTest,
    unstableSmallerTreeMoreIterationsExtensiveFlatteningUnflattening) {
  testShadowNodeTreeLifeCycleExtensiveFlatteningUnflattening(
      /* seed */ 1337,
      /* size */ 32,
      /* repeats */ 512,
      /* stages */ 32);
}

// failing test case found 4-25-2021
TEST_P(
    ShadowTreeLifecycleTest,
    unstableSmallerTreeMoreIterationsExtensiveFlatteningUnflattening_1167342011) {
  testShadowNodeTreeLifeCycleExtensiveFlatteningUnflattening(
      /* seed */ 1167342011,
      /* size */ 32,
      /* repeats */ 512,
      /* stages */ 32);
}

// You may uncomment this - locally only! - to generate failing seeds.
// TEST_P(
//     ShadowTreeLifecycleTest,
//     unstableSmallerTreeMoreIterationsExtensiveFlatteningUnflatteningManyRandom)
//     {
//   std::random_device device;
//   for (int i = 0; i < 10; i++) {
//     uint_fast32_t seed = device();
//     LOG(ERROR) << "Seed: " << seed;
//     testShadowNodeTreeLifeCycleExtensiveFlatteningUnflattening(
//         /* seed */ seed,
//         /* size */ 32,
//         /* repeats */ 512,
//         /* stages */ 32);
//   }
// }

// Demonstrates that the LIS algorithm produces fewer mutations than the
// greedy algorithm for a simple child reorder: [A,B,C,D,E] → [B,C,D,E,A].
// The greedy two-pointer walk encounters A vs B mismatch and generates
// excessive REMOVE+INSERT pairs. The LIS algorithm identifies that B,C,D,E
// are already in increasing order and only moves A.
TEST_P(ShadowTreeLifecycleTest, moveFirstChildToLast) {
  auto builder = simpleComponentBuilder();

  auto makeProps = [](const std::string& id) {
    auto props = std::make_shared<ViewShadowNodeProps>();
    props->nativeId = id;
    return props;
  };

  // clang-format off
  auto rootElement =
      Element<RootShadowNode>()
        .tag(1)
        .children({
          Element<ViewShadowNode>().tag(2).props(makeProps("A")),
          Element<ViewShadowNode>().tag(3).props(makeProps("B")),
          Element<ViewShadowNode>().tag(4).props(makeProps("C")),
          Element<ViewShadowNode>().tag(5).props(makeProps("D")),
          Element<ViewShadowNode>().tag(6).props(makeProps("E")),
        });
  // clang-format on

  auto rootNode = builder.build(rootElement);

  // Clone root with children reordered to [B, C, D, E, A].
  auto children = rootNode->getChildren();
  auto reorderedChildren =
      std::make_shared<std::vector<std::shared_ptr<const ShadowNode>>>();
  for (size_t i = 1; i < children.size(); i++) {
    reorderedChildren->push_back(children[i]);
  }
  reorderedChildren->push_back(children[0]);

  auto reorderedRootNode = std::static_pointer_cast<const RootShadowNode>(
      rootNode->ShadowNode::clone(
          ShadowNodeFragment{
              .props = ShadowNodeFragment::propsPlaceholder(),
              .children = reorderedChildren}));

  auto expected =
      buildStubViewTreeWithoutUsingDifferentiator(*reorderedRootNode);
  auto mutations = calculateShadowViewMutations(*rootNode, *reorderedRootNode);

  auto isMoveOp = [](const ShadowViewMutation& m) {
    return m.type == ShadowViewMutation::Remove ||
        m.type == ShadowViewMutation::Insert;
  };

  if (ReactNativeFeatureFlags::useLISAlgorithmInDifferentiator()) {
    // LIS: 1 REMOVE + 1 INSERT = 2 move ops.
    EXPECT_EQ(std::count_if(mutations.begin(), mutations.end(), isMoveOp), 2);
  } else {
    // Greedy: 4 REMOVE + 4 INSERT = 8 move ops.
    EXPECT_EQ(std::count_if(mutations.begin(), mutations.end(), isMoveOp), 8);
  }

  auto viewTree = buildStubViewTreeWithoutUsingDifferentiator(*rootNode);
  viewTree.mutate(mutations);
  EXPECT_EQ(viewTree, expected);
}

// Exercises the LIS path where concreteChanged=true AND flattening
// consumption occur simultaneously. Z(tag=7) is reordered to break head/tail
// matching, forcing A, W, and C into the LIS path. W(tag=3) loses testId
// (concrete→non-concrete, concreteChanged=true) while remaining in the LIS.
// updateMatchedPairSubtrees triggers the flattener which promotes B(tag=6).
// The if(!concreteChanged) block that normally checks consumption is bypassed,
// so this test verifies the combination still produces correct mutations.
TEST_P(ShadowTreeLifecycleTest, concreteChangedWithFlattening) {
  auto builder = simpleComponentBuilder();

  auto concreteProps = [](const std::string& id) {
    auto props = std::make_shared<ViewShadowNodeProps>();
    props->testId = id;
    return props;
  };

  // clang-format off
  // Old: Root -> [Z, A, W(concrete, child B), C]
  // Old flattened: [Z(7), A(2), W(3), C(4)]
  auto rootElement =
      Element<RootShadowNode>()
        .tag(1)
        .children({
          Element<ViewShadowNode>().tag(7).props(concreteProps("Z")),
          Element<ViewShadowNode>().tag(2).props(concreteProps("A")),
          Element<ViewShadowNode>().tag(3).props(concreteProps("W"))
            .children({
              Element<ViewShadowNode>().tag(6).props(concreteProps("B")),
            }),
          Element<ViewShadowNode>().tag(4).props(concreteProps("C")),
        });
  // clang-format on

  auto rootNode = builder.build(rootElement);
  auto children = rootNode->getChildren();
  // children: [Z(7), A(2), W(3), C(4)]

  // W loses testId → non-concrete (flattened). B(tag=6) promoted.
  auto flatW = children[2]->clone(
      ShadowNodeFragment{.props = std::make_shared<ViewShadowNodeProps>()});

  // New: Root -> [A, W(flattened), C, Z] — Z moved to end.
  // New flattened: [A(2), W(3,non-concrete), B(6), C(4), Z(7)]
  // Z's move breaks head matching; A, W, C enter LIS path.
  // Among old remaining [Z,A,W,C] mapped to new positions,
  // LIS includes A,W,C (increasing order), W has concreteChanged=true.
  auto newChildren =
      std::make_shared<std::vector<std::shared_ptr<const ShadowNode>>>();
  newChildren->push_back(children[1]); // A
  newChildren->push_back(flatW); // W (flattened)
  newChildren->push_back(children[3]); // C
  newChildren->push_back(children[0]); // Z (moved to end)

  auto newRootNode = std::static_pointer_cast<const RootShadowNode>(
      rootNode->ShadowNode::clone(
          ShadowNodeFragment{
              .props = ShadowNodeFragment::propsPlaceholder(),
              .children = newChildren}));

  auto expected = buildStubViewTreeWithoutUsingDifferentiator(*newRootNode);
  auto mutations = calculateShadowViewMutations(*rootNode, *newRootNode);
  auto viewTree = buildStubViewTreeWithoutUsingDifferentiator(*rootNode);
  viewTree.mutate(mutations);
  EXPECT_EQ(viewTree, expected);
}

// Reverse: W(tag=3) gains testId (non-concrete→concrete, concreteChanged=true)
// while in the LIS path. B(tag=6) was promoted by flattening and now gets
// absorbed back into W via unflattening. Z reorder breaks head matching.
TEST_P(ShadowTreeLifecycleTest, concreteChangedWithUnflatteningInLIS) {
  auto builder = simpleComponentBuilder();

  auto concreteProps = [](const std::string& id) {
    auto props = std::make_shared<ViewShadowNodeProps>();
    props->testId = id;
    return props;
  };

  // clang-format off
  // Old: Root -> [Z, A, W(NON-concrete, child B(concrete)), C]
  // Old flattened: [Z(7), A(2), W(3,non-concrete), B(6), C(4)]
  auto rootElement =
      Element<RootShadowNode>()
        .tag(1)
        .children({
          Element<ViewShadowNode>().tag(7).props(concreteProps("Z")),
          Element<ViewShadowNode>().tag(2).props(concreteProps("A")),
          Element<ViewShadowNode>().tag(3)
            .children({
              Element<ViewShadowNode>().tag(6).props(concreteProps("B")),
            }),
          Element<ViewShadowNode>().tag(4).props(concreteProps("C")),
        });
  // clang-format on

  auto rootNode = builder.build(rootElement);
  auto children = rootNode->getChildren();

  // W gains testId → concrete (unflattened). B absorbed back into W.
  auto concreteW =
      children[2]->clone(ShadowNodeFragment{.props = concreteProps("W")});

  // New: Root -> [A, W(concrete), C, Z] — Z moved to end.
  // New flattened: [A(2), W(3), C(4), Z(7)]
  auto newChildren =
      std::make_shared<std::vector<std::shared_ptr<const ShadowNode>>>();
  newChildren->push_back(children[1]); // A
  newChildren->push_back(concreteW); // W (concrete)
  newChildren->push_back(children[3]); // C
  newChildren->push_back(children[0]); // Z (moved to end)

  auto newRootNode = std::static_pointer_cast<const RootShadowNode>(
      rootNode->ShadowNode::clone(
          ShadowNodeFragment{
              .props = ShadowNodeFragment::propsPlaceholder(),
              .children = newChildren}));

  auto expected = buildStubViewTreeWithoutUsingDifferentiator(*newRootNode);
  auto mutations = calculateShadowViewMutations(*rootNode, *newRootNode);
  auto viewTree = buildStubViewTreeWithoutUsingDifferentiator(*rootNode);
  viewTree.mutate(mutations);
  EXPECT_EQ(viewTree, expected);
}

// Tests that the LIS algorithm produces correct mutations when child
// reordering coincides with a view's flattening transition. When W(tag=3)
// becomes flattened (loses testId), its child B(tag=6) is promoted to the
// parent level in the flattened view. The LIS pre-computation maps old
// children to new positions, but the flattener may consume entries from
// newRemainingPairs during flatten/unflatten processing. This test verifies
// the runtime newRemainingPairs check correctly handles this interaction.
TEST_P(ShadowTreeLifecycleTest, reorderWithFlatteningTransition) {
  auto builder = simpleComponentBuilder();

  auto concreteProps = [](const std::string& id) {
    auto props = std::make_shared<ViewShadowNodeProps>();
    props->testId = id;
    return props;
  };

  // clang-format off
  // Old tree: Root -> [A, W(concrete with testId, child B), C, D]
  auto rootElement =
      Element<RootShadowNode>()
        .tag(1)
        .children({
          Element<ViewShadowNode>().tag(2).props(concreteProps("A")),
          Element<ViewShadowNode>().tag(3).props(concreteProps("W"))
            .children({
              Element<ViewShadowNode>().tag(6).props(concreteProps("B")),
            }),
          Element<ViewShadowNode>().tag(4).props(concreteProps("C")),
          Element<ViewShadowNode>().tag(5).props(concreteProps("D")),
        });
  // clang-format on

  auto rootNode = builder.build(rootElement);
  auto children = rootNode->getChildren();
  // children: [A(2), W(3), C(4), D(5)]

  // Clone W without testId to make it non-concrete (flattened).
  // B(tag=6) will be promoted to the parent level.
  auto flatW = children[1]->clone(
      ShadowNodeFragment{.props = std::make_shared<ViewShadowNodeProps>()});

  // New tree: Root -> [C, D, A, W(flattened)]
  // Reorder [A,W,C,D] -> [C,D,A,W(flattened)]
  auto reorderedChildren =
      std::make_shared<std::vector<std::shared_ptr<const ShadowNode>>>();
  reorderedChildren->push_back(children[2]); // C
  reorderedChildren->push_back(children[3]); // D
  reorderedChildren->push_back(children[0]); // A
  reorderedChildren->push_back(flatW); // W (flattened)

  auto newRootNode = std::static_pointer_cast<const RootShadowNode>(
      rootNode->ShadowNode::clone(
          ShadowNodeFragment{
              .props = ShadowNodeFragment::propsPlaceholder(),
              .children = reorderedChildren}));

  auto expected = buildStubViewTreeWithoutUsingDifferentiator(*newRootNode);
  auto mutations = calculateShadowViewMutations(*rootNode, *newRootNode);
  auto viewTree = buildStubViewTreeWithoutUsingDifferentiator(*rootNode);
  viewTree.mutate(mutations);
  EXPECT_EQ(viewTree, expected);
}

INSTANTIATE_TEST_SUITE_P(
    Greedy,
    ShadowTreeLifecycleTest,
    ::testing::Values(false),
    [](const auto&) { return "Greedy"; });

INSTANTIATE_TEST_SUITE_P(
    LIS,
    ShadowTreeLifecycleTest,
    ::testing::Values(true),
    [](const auto&) { return "LIS"; });

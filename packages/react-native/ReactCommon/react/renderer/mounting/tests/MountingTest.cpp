/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#include <react/renderer/components/root/RootComponentDescriptor.h>
#include <react/renderer/components/view/ViewComponentDescriptor.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/mounting/Differentiator.h>
#include <react/renderer/mounting/stubs/stubs.h>

#include <react/test_utils/shadowTreeGeneration.h>

#include <glog/logging.h>
#include <gtest/gtest.h>

namespace facebook::react {

static SharedViewProps nonFlattenedDefaultProps(
    const ComponentDescriptor& componentDescriptor) {
  folly::dynamic dynamic = folly::dynamic::object();
  dynamic["position"] = "absolute";
  dynamic["top"] = 0;
  dynamic["left"] = 0;
  dynamic["width"] = 100;
  dynamic["height"] = 100;
  dynamic["nativeId"] = "NativeId";
  dynamic["accessible"] = true;

  ContextContainer contextContainer;
  PropsParserContext parserContext{-1, contextContainer};

  return std::static_pointer_cast<const ViewProps>(
      componentDescriptor.cloneProps(
          parserContext, nullptr, RawProps{dynamic}));
}

static ShadowNode::Shared makeNode(
    const ComponentDescriptor& componentDescriptor,
    int tag,
    std::shared_ptr<ShadowNode::ListOfShared> children,
    bool flattened = false) {
  auto props = flattened ? generateDefaultProps(componentDescriptor)
                         : nonFlattenedDefaultProps(componentDescriptor);

  return componentDescriptor.createShadowNode(
      ShadowNodeFragment{std::move(props), std::move(children)},
      componentDescriptor.createFamily({tag, SurfaceId(1), nullptr}));
}

static std::shared_ptr<ShadowNode::ListOfShared> listOfChildren(
    std::initializer_list<ShadowNode::Shared> list) {
  return std::make_shared<ShadowNode::ListOfShared>(
      ShadowNode::ListOfShared{list});
}

/**
 * Test reordering of views with the same parent:
 *
 * For instance:
 *    A -> [B,C,D]  ==> A -> [D,B,C]
 *
 * In the V1 of diffing this would produce 3 removes and 3 inserts, but with
 * some cleverness we can reduce this to 1 remove and 1 insert.
 */
TEST(MountingTest, testReorderingInstructionGeneration) {
  auto eventDispatcher = EventDispatcher::Shared{};

  auto contextContainer = std::make_shared<ContextContainer>();
  auto componentDescriptorParameters =
      ComponentDescriptorParameters{eventDispatcher, contextContainer, nullptr};
  auto viewComponentDescriptor =
      ViewComponentDescriptor(componentDescriptorParameters);
  auto rootComponentDescriptor =
      RootComponentDescriptor(componentDescriptorParameters);

  auto rootFamily =
      rootComponentDescriptor.createFamily({Tag(1), SurfaceId(1), nullptr});

  // Creating an initial root shadow node.
  auto emptyRootNode = std::const_pointer_cast<RootShadowNode>(
      std::static_pointer_cast<const RootShadowNode>(
          rootComponentDescriptor.createShadowNode(
              ShadowNodeFragment{RootShadowNode::defaultSharedProps()},
              rootFamily)));

  PropsParserContext parserContext{-1, *contextContainer};

  // Applying size constraints.
  emptyRootNode = emptyRootNode->clone(
      parserContext,
      LayoutConstraints{
          Size{512, 0}, Size{512, std::numeric_limits<Float>::infinity()}},
      LayoutContext{});

  auto childA = makeNode(viewComponentDescriptor, 100, {});
  auto childB = makeNode(viewComponentDescriptor, 101, {});
  auto childC = makeNode(viewComponentDescriptor, 102, {});
  auto childD = makeNode(viewComponentDescriptor, 103, {});
  auto childE = makeNode(viewComponentDescriptor, 104, {});
  auto childF = makeNode(viewComponentDescriptor, 105, {});
  auto childG = makeNode(viewComponentDescriptor, 106, {});
  auto childH = makeNode(viewComponentDescriptor, 107, {});
  auto childI = makeNode(viewComponentDescriptor, 108, {});
  auto childJ = makeNode(viewComponentDescriptor, 109, {});
  auto childK = makeNode(viewComponentDescriptor, 110, {});

  auto family =
      viewComponentDescriptor.createFamily({10, SurfaceId(1), nullptr});

  // Construct "identical" shadow nodes: they differ only in children.
  auto shadowNodeV1 = viewComponentDescriptor.createShadowNode(
      ShadowNodeFragment{
          generateDefaultProps(viewComponentDescriptor),
          listOfChildren({childB, childC, childD})},
      family);
  auto shadowNodeV2 = shadowNodeV1->clone(ShadowNodeFragment{
      generateDefaultProps(viewComponentDescriptor),
      listOfChildren({childA, childB, childC, childD})});
  auto shadowNodeV3 = shadowNodeV2->clone(ShadowNodeFragment{
      generateDefaultProps(viewComponentDescriptor),
      listOfChildren({childB, childC, childD})});
  auto shadowNodeV4 = shadowNodeV3->clone(ShadowNodeFragment{
      generateDefaultProps(viewComponentDescriptor),
      listOfChildren({childB, childD, childE})});
  auto shadowNodeV5 = shadowNodeV4->clone(ShadowNodeFragment{
      generateDefaultProps(viewComponentDescriptor),
      listOfChildren({childB, childA, childE, childC})});
  auto shadowNodeV6 = shadowNodeV5->clone(ShadowNodeFragment{
      generateDefaultProps(viewComponentDescriptor),
      std::make_shared<ShadowNode::ListOfShared>(ShadowNode::ListOfShared{
          childB, childA, childD, childF, childE, childC})});
  auto shadowNodeV7 = shadowNodeV6->clone(ShadowNodeFragment{
      generateDefaultProps(viewComponentDescriptor),
      std::make_shared<ShadowNode::ListOfShared>(ShadowNode::ListOfShared{
          childF,
          childE,
          childC,
          childD,
          childG,
          childH,
          childI,
          childJ,
          childK})});

  // Injecting a tree into the root node.
  auto rootNodeV1 = std::static_pointer_cast<const RootShadowNode>(
      emptyRootNode->ShadowNode::clone(ShadowNodeFragment{
          ShadowNodeFragment::propsPlaceholder(),
          listOfChildren({shadowNodeV1})}));
  auto rootNodeV2 = std::static_pointer_cast<const RootShadowNode>(
      rootNodeV1->ShadowNode::clone(ShadowNodeFragment{
          ShadowNodeFragment::propsPlaceholder(),
          listOfChildren({shadowNodeV2})}));
  auto rootNodeV3 = std::static_pointer_cast<const RootShadowNode>(
      rootNodeV2->ShadowNode::clone(ShadowNodeFragment{
          ShadowNodeFragment::propsPlaceholder(),
          listOfChildren({shadowNodeV3})}));
  auto rootNodeV4 = std::static_pointer_cast<const RootShadowNode>(
      rootNodeV3->ShadowNode::clone(ShadowNodeFragment{
          ShadowNodeFragment::propsPlaceholder(),
          listOfChildren({shadowNodeV4})}));
  auto rootNodeV5 = std::static_pointer_cast<const RootShadowNode>(
      rootNodeV4->ShadowNode::clone(ShadowNodeFragment{
          ShadowNodeFragment::propsPlaceholder(),
          listOfChildren({shadowNodeV5})}));
  auto rootNodeV6 = std::static_pointer_cast<const RootShadowNode>(
      rootNodeV5->ShadowNode::clone(ShadowNodeFragment{
          ShadowNodeFragment::propsPlaceholder(),
          listOfChildren({shadowNodeV6})}));
  auto rootNodeV7 = std::static_pointer_cast<const RootShadowNode>(
      rootNodeV6->ShadowNode::clone(ShadowNodeFragment{
          ShadowNodeFragment::propsPlaceholder(),
          listOfChildren({shadowNodeV7})}));

  // Layout
  std::vector<const LayoutableShadowNode*> affectedLayoutableNodesV1{};
  affectedLayoutableNodesV1.reserve(1024);
  std::const_pointer_cast<RootShadowNode>(rootNodeV1)
      ->layoutIfNeeded(&affectedLayoutableNodesV1);
  rootNodeV1->sealRecursive();

  std::vector<const LayoutableShadowNode*> affectedLayoutableNodesV2{};
  affectedLayoutableNodesV2.reserve(1024);
  std::const_pointer_cast<RootShadowNode>(rootNodeV2)
      ->layoutIfNeeded(&affectedLayoutableNodesV2);
  rootNodeV2->sealRecursive();

  std::vector<const LayoutableShadowNode*> affectedLayoutableNodesV3{};
  affectedLayoutableNodesV3.reserve(1024);
  std::const_pointer_cast<RootShadowNode>(rootNodeV3)
      ->layoutIfNeeded(&affectedLayoutableNodesV3);
  rootNodeV3->sealRecursive();

  std::vector<const LayoutableShadowNode*> affectedLayoutableNodesV4{};
  affectedLayoutableNodesV4.reserve(1024);
  std::const_pointer_cast<RootShadowNode>(rootNodeV4)
      ->layoutIfNeeded(&affectedLayoutableNodesV4);
  rootNodeV4->sealRecursive();

  std::vector<const LayoutableShadowNode*> affectedLayoutableNodesV5{};
  affectedLayoutableNodesV5.reserve(1024);
  std::const_pointer_cast<RootShadowNode>(rootNodeV5)
      ->layoutIfNeeded(&affectedLayoutableNodesV5);
  rootNodeV5->sealRecursive();

  std::vector<const LayoutableShadowNode*> affectedLayoutableNodesV6{};
  affectedLayoutableNodesV6.reserve(1024);
  std::const_pointer_cast<RootShadowNode>(rootNodeV6)
      ->layoutIfNeeded(&affectedLayoutableNodesV6);
  rootNodeV6->sealRecursive();

  // This block displays all the mutations for debugging purposes.
  /*
      LOG(ERROR) << "Num mutations: " << mutations.size();
      for (auto const &mutation : mutations) {
      switch (mutation.type) {
        case ShadowViewMutation::Create: {
          LOG(ERROR) << "CREATE " << mutation.newChildShadowView.tag;
          break;
        }
        case ShadowViewMutation::Delete: {
          LOG(ERROR) << "DELETE " << mutation.oldChildShadowView.tag;
          break;
        }
        case ShadowViewMutation::Remove: {
          LOG(ERROR) << "REMOVE " << mutation.oldChildShadowView.tag << " " <<
    mutation.index; break;
        }
        case ShadowViewMutation::Insert: {
          LOG(ERROR) << "INSERT " << mutation.newChildShadowView.tag << " " <<
    mutation.index; break;
        }
        case ShadowViewMutation::Update: {
          LOG(ERROR) << "UPDATE " << mutation.newChildShadowView.tag;
          break;
        }
      }
    }*/

  // Calculating mutations.
  auto mutations1 = calculateShadowViewMutations(*rootNodeV1, *rootNodeV2);

  // The order and exact mutation instructions here may change at any time.
  // This test just ensures that any changes are intentional.
  // This test, in particular, ensures that inserting a node at the beginning
  // produces a single "Insert" instruction, and no remove/insert (move)
  // operations. All these nodes are laid out with absolute positioning, so
  // moving them around does not change layout.
  EXPECT_TRUE(mutations1.size() == 2);
  EXPECT_TRUE(mutations1[0].type == ShadowViewMutation::Create);
  EXPECT_TRUE(mutations1[0].newChildShadowView.tag == 100);
  EXPECT_TRUE(mutations1[1].type == ShadowViewMutation::Insert);
  EXPECT_TRUE(mutations1[1].newChildShadowView.tag == 100);
  EXPECT_TRUE(mutations1[1].index == 0);

  // Calculating mutations.
  auto mutations2 = calculateShadowViewMutations(*rootNodeV2, *rootNodeV3);

  // The order and exact mutation instructions here may change at any time.
  // This test just ensures that any changes are intentional.
  // This test, in particular, ensures that removing a node at the beginning
  // produces a single remove (and delete) instruction, and no remove/insert
  // (move) operations. All these nodes are laid out with absolute positioning,
  // so moving them around does not change layout.
  EXPECT_TRUE(mutations2.size() == 2);
  EXPECT_TRUE(mutations2[0].type == ShadowViewMutation::Remove);
  EXPECT_TRUE(mutations2[0].oldChildShadowView.tag == 100);
  EXPECT_TRUE(mutations2[0].index == 0);
  EXPECT_TRUE(mutations2[1].type == ShadowViewMutation::Delete);
  EXPECT_TRUE(mutations2[1].oldChildShadowView.tag == 100);

  // Calculating mutations.
  auto mutations3 = calculateShadowViewMutations(*rootNodeV3, *rootNodeV4);

  // The order and exact mutation instructions here may change at any time.
  // This test just ensures that any changes are intentional.
  // This test, in particular, ensures that removing a node in the middle
  // produces a single remove (and delete) instruction, and no remove/insert
  // (move) operations; and that simultaneously, we can insert a node at the
  // end.
  EXPECT_TRUE(mutations3.size() == 4);
  EXPECT_TRUE(mutations3[0].type == ShadowViewMutation::Remove);
  EXPECT_TRUE(mutations3[0].oldChildShadowView.tag == 102);
  EXPECT_TRUE(mutations3[0].index == 1);
  EXPECT_TRUE(mutations3[1].type == ShadowViewMutation::Delete);
  EXPECT_TRUE(mutations3[1].oldChildShadowView.tag == 102);
  EXPECT_TRUE(mutations3[2].type == ShadowViewMutation::Create);
  EXPECT_TRUE(mutations3[2].newChildShadowView.tag == 104);
  EXPECT_TRUE(mutations3[3].type == ShadowViewMutation::Insert);
  EXPECT_TRUE(mutations3[3].newChildShadowView.tag == 104);
  EXPECT_TRUE(mutations3[3].index == 2);

  // Calculating mutations.
  auto mutations4 = calculateShadowViewMutations(*rootNodeV4, *rootNodeV5);

  // The order and exact mutation instructions here may change at any time.
  // This test just ensures that any changes are intentional.
  // This test, in particular, ensures that inserting a child at the middle, and
  // at the end, and removing a node in the middle, produces the minimal set of
  // instructions. All these nodes are laid out with absolute positioning, so
  // moving them around does not change layout.
  EXPECT_TRUE(mutations4.size() == 6);
  EXPECT_TRUE(mutations4[0].type == ShadowViewMutation::Remove);
  EXPECT_TRUE(mutations4[0].oldChildShadowView.tag == 103);
  EXPECT_TRUE(mutations4[0].index == 1);
  EXPECT_TRUE(mutations4[1].type == ShadowViewMutation::Delete);
  EXPECT_TRUE(mutations4[1].oldChildShadowView.tag == 103);
  EXPECT_TRUE(mutations4[2].type == ShadowViewMutation::Create);
  EXPECT_TRUE(mutations4[2].newChildShadowView.tag == 100);
  EXPECT_TRUE(mutations4[3].type == ShadowViewMutation::Create);
  EXPECT_TRUE(mutations4[3].newChildShadowView.tag == 102);
  EXPECT_TRUE(mutations4[4].type == ShadowViewMutation::Insert);
  EXPECT_TRUE(mutations4[4].newChildShadowView.tag == 100);
  EXPECT_TRUE(mutations4[4].index == 1);
  EXPECT_TRUE(mutations4[5].type == ShadowViewMutation::Insert);
  EXPECT_TRUE(mutations4[5].newChildShadowView.tag == 102);
  EXPECT_TRUE(mutations4[5].index == 3);

  auto mutations5 = calculateShadowViewMutations(*rootNodeV5, *rootNodeV6);

  // The order and exact mutation instructions here may change at any time.
  // This test just ensures that any changes are intentional.
  // This test, in particular, ensures that inserting TWO children in the middle
  // produces the minimal set of instructions. All these nodes are laid out with
  // absolute positioning, so moving them around does not change layout.
  EXPECT_TRUE(mutations5.size() == 4);
  EXPECT_TRUE(mutations5[0].type == ShadowViewMutation::Create);
  EXPECT_TRUE(mutations5[0].newChildShadowView.tag == 103);
  EXPECT_TRUE(mutations5[1].type == ShadowViewMutation::Create);
  EXPECT_TRUE(mutations5[1].newChildShadowView.tag == 105);
  EXPECT_TRUE(mutations5[2].type == ShadowViewMutation::Insert);
  EXPECT_TRUE(mutations5[2].newChildShadowView.tag == 103);
  EXPECT_TRUE(mutations5[2].index == 2);
  EXPECT_TRUE(mutations5[3].type == ShadowViewMutation::Insert);
  EXPECT_TRUE(mutations5[3].newChildShadowView.tag == 105);
  EXPECT_TRUE(mutations5[3].index == 3);

  auto mutations6 = calculateShadowViewMutations(*rootNodeV6, *rootNodeV7);

  // The order and exact mutation instructions here may change at any time.
  // This test just ensures that any changes are intentional.
  // This test, in particular, ensures that a bug has been fixed: that with
  // a particular sequence of inserts/removes/moves, we don't unintentionally
  // create more "CREATE" mutations than necessary.
  // The actual nodes that should be created in this transaction have a tag >
  // 105.
  EXPECT_TRUE(mutations6.size() == 25);
  for (auto& i : mutations6) {
    if (i.type == ShadowViewMutation::Create) {
      EXPECT_TRUE(i.newChildShadowView.tag > 105);
    }
  }
}

/**
 * Test reparenting mutation instruction generation.
 * We cannot practically handle all possible use-cases here.
 * It would be helpful to do verification with randomized trees, but it's
 * much easier to do that in JS.
 */
TEST(MountingTest, testViewReparentingInstructionGeneration) {
  auto eventDispatcher = EventDispatcher::Shared{};
  auto contextContainer = std::make_shared<ContextContainer>();
  auto componentDescriptorParameters =
      ComponentDescriptorParameters{eventDispatcher, contextContainer, nullptr};
  auto viewComponentDescriptor =
      ViewComponentDescriptor(componentDescriptorParameters);
  auto rootComponentDescriptor =
      RootComponentDescriptor(componentDescriptorParameters);

  auto rootFamily =
      rootComponentDescriptor.createFamily({Tag(1), SurfaceId(1), nullptr});

  // Creating an initial root shadow node.
  auto emptyRootNode = std::const_pointer_cast<RootShadowNode>(
      std::static_pointer_cast<const RootShadowNode>(
          rootComponentDescriptor.createShadowNode(
              ShadowNodeFragment{RootShadowNode::defaultSharedProps()},
              rootFamily)));

  PropsParserContext parserContext{-1, *contextContainer};

  // Applying size constraints.
  emptyRootNode = emptyRootNode->clone(
      parserContext,
      LayoutConstraints{
          Size{512, 0}, Size{512, std::numeric_limits<Float>::infinity()}},
      LayoutContext{});

  auto childA = makeNode(viewComponentDescriptor, 100, {});
  auto childB = makeNode(viewComponentDescriptor, 101, {});
  auto childC = makeNode(viewComponentDescriptor, 102, {});
  auto childD = makeNode(viewComponentDescriptor, 103, {});
  auto childE = makeNode(viewComponentDescriptor, 104, {});
  auto childF = makeNode(viewComponentDescriptor, 105, {});

  auto childG = makeNode(viewComponentDescriptor, 106, {});
  auto childH = makeNode(viewComponentDescriptor, 107, {});
  auto childI = makeNode(viewComponentDescriptor, 108, {});
  auto childJ = makeNode(viewComponentDescriptor, 109, {});
  auto childK = makeNode(viewComponentDescriptor, 110, {});

  auto family =
      viewComponentDescriptor.createFamily({10, SurfaceId(1), nullptr});

  auto reparentedViewA_ = makeNode(
      viewComponentDescriptor, 1000, listOfChildren({childC, childA, childB}));
  auto reparentedViewA = reparentedViewA_->clone(
      ShadowNodeFragment{nonFlattenedDefaultProps(viewComponentDescriptor)});
  auto reparentedViewB = makeNode(
      viewComponentDescriptor, 2000, listOfChildren({childF, childE, childD}));

  // Root -> G* -> H -> I -> J -> A* [nodes with * are _not_ flattened]
  auto shadowNodeV1 = viewComponentDescriptor.createShadowNode(
      ShadowNodeFragment{
          generateDefaultProps(viewComponentDescriptor),
          listOfChildren({childG->clone(ShadowNodeFragment{
              nonFlattenedDefaultProps(viewComponentDescriptor),
              listOfChildren({childH->clone(ShadowNodeFragment{
                  generateDefaultProps(viewComponentDescriptor),
                  listOfChildren({childI->clone(ShadowNodeFragment{
                      generateDefaultProps(viewComponentDescriptor),
                      listOfChildren({childJ->clone(ShadowNodeFragment{
                          generateDefaultProps(viewComponentDescriptor),
                          listOfChildren({reparentedViewA_})})})})})})})})})},
      family);

  // Root -> G* -> H* -> I -> J -> A* [nodes with * are _not_ flattened]
  // Force an update with A with new props
  auto shadowNodeV2 = shadowNodeV1->clone(ShadowNodeFragment{
      generateDefaultProps(viewComponentDescriptor),
      listOfChildren({childG->clone(ShadowNodeFragment{
          nonFlattenedDefaultProps(viewComponentDescriptor),
          listOfChildren({childH->clone(ShadowNodeFragment{
              nonFlattenedDefaultProps(viewComponentDescriptor),
              listOfChildren({childI->clone(ShadowNodeFragment{
                  generateDefaultProps(viewComponentDescriptor),
                  listOfChildren({childJ->clone(ShadowNodeFragment{
                      generateDefaultProps(viewComponentDescriptor),
                      listOfChildren({reparentedViewA})})})})})})})})})});

  // Root -> G* -> H -> I -> J -> A* [nodes with * are _not_ flattened]
  auto shadowNodeV3 = shadowNodeV2->clone(ShadowNodeFragment{
      generateDefaultProps(viewComponentDescriptor),
      listOfChildren({childG->clone(ShadowNodeFragment{
          nonFlattenedDefaultProps(viewComponentDescriptor),
          listOfChildren({childH->clone(ShadowNodeFragment{
              generateDefaultProps(viewComponentDescriptor),
              listOfChildren({childI->clone(ShadowNodeFragment{
                  generateDefaultProps(viewComponentDescriptor),
                  listOfChildren({childJ->clone(ShadowNodeFragment{
                      generateDefaultProps(viewComponentDescriptor),
                      listOfChildren({reparentedViewA})})})})})})})})})});

  // The view is reparented 1 level down with a different sibling
  // Root -> G* -> H* -> I* -> J -> [B*, A*] [nodes with * are _not_ flattened]
  auto shadowNodeV4 = shadowNodeV3->clone(ShadowNodeFragment{
      generateDefaultProps(viewComponentDescriptor),
      listOfChildren({childG->clone(ShadowNodeFragment{
          nonFlattenedDefaultProps(viewComponentDescriptor),
          listOfChildren({childH->clone(ShadowNodeFragment{
              nonFlattenedDefaultProps(viewComponentDescriptor),
              listOfChildren({childI->clone(ShadowNodeFragment{
                  nonFlattenedDefaultProps(viewComponentDescriptor),
                  listOfChildren({childJ->clone(ShadowNodeFragment{
                      generateDefaultProps(viewComponentDescriptor),
                      listOfChildren(
                          {reparentedViewB, reparentedViewA})})})})})})})})})});

  // The view is reparented 1 level further down with its order with the sibling
  // swapped
  // Root -> G* -> H* -> I* -> J* -> [A*, B*] [nodes with * are _not_ flattened]
  auto shadowNodeV5 = shadowNodeV4->clone(ShadowNodeFragment{
      generateDefaultProps(viewComponentDescriptor),
      listOfChildren({childG->clone(ShadowNodeFragment{
          nonFlattenedDefaultProps(viewComponentDescriptor),
          listOfChildren({childH->clone(ShadowNodeFragment{
              nonFlattenedDefaultProps(viewComponentDescriptor),
              listOfChildren({childI->clone(ShadowNodeFragment{
                  nonFlattenedDefaultProps(viewComponentDescriptor),
                  listOfChildren({childJ->clone(ShadowNodeFragment{
                      nonFlattenedDefaultProps(viewComponentDescriptor),
                      listOfChildren(
                          {reparentedViewA, reparentedViewB})})})})})})})})})});

  // Injecting a tree into the root node.
  auto rootNodeV1 = std::static_pointer_cast<const RootShadowNode>(
      emptyRootNode->ShadowNode::clone(ShadowNodeFragment{
          ShadowNodeFragment::propsPlaceholder(),
          listOfChildren({shadowNodeV1})}));
  auto rootNodeV2 = std::static_pointer_cast<const RootShadowNode>(
      rootNodeV1->ShadowNode::clone(ShadowNodeFragment{
          ShadowNodeFragment::propsPlaceholder(),
          listOfChildren({shadowNodeV2})}));
  auto rootNodeV3 = std::static_pointer_cast<const RootShadowNode>(
      rootNodeV2->ShadowNode::clone(ShadowNodeFragment{
          ShadowNodeFragment::propsPlaceholder(),
          listOfChildren({shadowNodeV3})}));
  auto rootNodeV4 = std::static_pointer_cast<const RootShadowNode>(
      rootNodeV3->ShadowNode::clone(ShadowNodeFragment{
          ShadowNodeFragment::propsPlaceholder(),
          listOfChildren({shadowNodeV4})}));
  auto rootNodeV5 = std::static_pointer_cast<const RootShadowNode>(
      rootNodeV4->ShadowNode::clone(ShadowNodeFragment{
          ShadowNodeFragment::propsPlaceholder(),
          listOfChildren({shadowNodeV5})}));

  // Layout
  std::vector<const LayoutableShadowNode*> affectedLayoutableNodesV1{};
  affectedLayoutableNodesV1.reserve(1024);
  std::const_pointer_cast<RootShadowNode>(rootNodeV1)
      ->layoutIfNeeded(&affectedLayoutableNodesV1);
  rootNodeV1->sealRecursive();

  std::vector<const LayoutableShadowNode*> affectedLayoutableNodesV2{};
  affectedLayoutableNodesV2.reserve(1024);
  std::const_pointer_cast<RootShadowNode>(rootNodeV2)
      ->layoutIfNeeded(&affectedLayoutableNodesV2);
  rootNodeV2->sealRecursive();

  std::vector<const LayoutableShadowNode*> affectedLayoutableNodesV3{};
  affectedLayoutableNodesV3.reserve(1024);
  std::const_pointer_cast<RootShadowNode>(rootNodeV3)
      ->layoutIfNeeded(&affectedLayoutableNodesV3);
  rootNodeV3->sealRecursive();

  std::vector<const LayoutableShadowNode*> affectedLayoutableNodesV4{};
  affectedLayoutableNodesV4.reserve(1024);
  std::const_pointer_cast<RootShadowNode>(rootNodeV4)
      ->layoutIfNeeded(&affectedLayoutableNodesV4);
  rootNodeV4->sealRecursive();

  std::vector<const LayoutableShadowNode*> affectedLayoutableNodesV5{};
  affectedLayoutableNodesV5.reserve(1024);
  std::const_pointer_cast<RootShadowNode>(rootNodeV5)
      ->layoutIfNeeded(&affectedLayoutableNodesV5);
  rootNodeV5->sealRecursive();

  // Calculating mutations.
  auto mutations1 = calculateShadowViewMutations(*rootNodeV1, *rootNodeV2);

  EXPECT_EQ(mutations1.size(), 6);
  EXPECT_EQ(mutations1[0].type, ShadowViewMutation::Update);
  EXPECT_EQ(mutations1[0].oldChildShadowView.tag, childG->getTag());
  EXPECT_EQ(mutations1[1].type, ShadowViewMutation::Update);
  EXPECT_EQ(mutations1[1].oldChildShadowView.tag, reparentedViewA->getTag());
  EXPECT_EQ(mutations1[1].parentTag, childG->getTag());
  EXPECT_EQ(mutations1[2].type, ShadowViewMutation::Remove);
  EXPECT_EQ(mutations1[2].oldChildShadowView.tag, reparentedViewA->getTag());
  EXPECT_EQ(mutations1[3].type, ShadowViewMutation::Create);
  EXPECT_EQ(mutations1[3].newChildShadowView.tag, childH->getTag());
  EXPECT_EQ(mutations1[4].type, ShadowViewMutation::Insert);
  EXPECT_EQ(mutations1[4].newChildShadowView.tag, childH->getTag());
  EXPECT_EQ(mutations1[5].type, ShadowViewMutation::Insert);
  EXPECT_EQ(mutations1[5].newChildShadowView.tag, reparentedViewA->getTag());

  auto mutations2 = calculateShadowViewMutations(*rootNodeV2, *rootNodeV3);

  EXPECT_EQ(mutations2.size(), 5);
  EXPECT_EQ(mutations2[0].type, ShadowViewMutation::Update);
  EXPECT_EQ(mutations2[0].oldChildShadowView.tag, childG->getTag());
  EXPECT_EQ(mutations2[0].parentTag, emptyRootNode->getTag());
  EXPECT_EQ(mutations2[1].type, ShadowViewMutation::Remove);
  EXPECT_EQ(mutations2[1].oldChildShadowView.tag, reparentedViewA->getTag());
  EXPECT_EQ(mutations2[2].type, ShadowViewMutation::Remove);
  EXPECT_EQ(mutations2[2].oldChildShadowView.tag, childH->getTag());
  EXPECT_EQ(
      mutations2[3].type,
      ShadowViewMutation::Delete); // correct, H is removed from tree entirely
  EXPECT_EQ(mutations2[3].oldChildShadowView.tag, childH->getTag());
  EXPECT_EQ(mutations2[4].type, ShadowViewMutation::Insert);
  EXPECT_EQ(mutations2[4].newChildShadowView.tag, reparentedViewA->getTag());

  auto mutations3 = calculateShadowViewMutations(*rootNodeV3, *rootNodeV4);

  // between these two trees, lots of new nodes are created and inserted - this
  // is all correct, and this is the minimal amount of mutations

  EXPECT_EQ(mutations3.size(), 15);
  EXPECT_EQ(mutations3[0].type, ShadowViewMutation::Update);
  EXPECT_EQ(mutations3[0].oldChildShadowView.tag, childG->getTag());
  EXPECT_EQ(mutations3[0].parentTag, emptyRootNode->getTag());
  EXPECT_EQ(mutations3[1].type, ShadowViewMutation::Remove);
  EXPECT_EQ(mutations3[1].oldChildShadowView.tag, reparentedViewA->getTag());
  EXPECT_EQ(mutations3[2].type, ShadowViewMutation::Create);
  EXPECT_EQ(mutations3[2].newChildShadowView.tag, childH->getTag());
  EXPECT_EQ(mutations3[3].type, ShadowViewMutation::Create);
  EXPECT_EQ(mutations3[3].newChildShadowView.tag, reparentedViewB->getTag());
  EXPECT_EQ(mutations3[4].type, ShadowViewMutation::Create);
  EXPECT_EQ(mutations3[4].newChildShadowView.tag, childI->getTag());
  EXPECT_EQ(mutations3[5].type, ShadowViewMutation::Create);
  EXPECT_EQ(mutations3[5].newChildShadowView.tag, childF->getTag());
  EXPECT_EQ(mutations3[6].type, ShadowViewMutation::Create);
  EXPECT_EQ(mutations3[6].newChildShadowView.tag, childE->getTag());
  EXPECT_EQ(mutations3[7].type, ShadowViewMutation::Create);
  EXPECT_EQ(mutations3[7].newChildShadowView.tag, childD->getTag());
  EXPECT_EQ(mutations3[8].type, ShadowViewMutation::Insert);
  EXPECT_EQ(mutations3[8].newChildShadowView.tag, childF->getTag());
  EXPECT_EQ(mutations3[9].type, ShadowViewMutation::Insert);
  EXPECT_EQ(mutations3[9].newChildShadowView.tag, childE->getTag());
  EXPECT_EQ(mutations3[10].type, ShadowViewMutation::Insert);
  EXPECT_EQ(mutations3[10].newChildShadowView.tag, childD->getTag());
  EXPECT_EQ(mutations3[11].type, ShadowViewMutation::Insert);
  EXPECT_EQ(mutations3[11].newChildShadowView.tag, childH->getTag());
  EXPECT_EQ(mutations3[12].type, ShadowViewMutation::Insert);
  EXPECT_EQ(mutations3[12].newChildShadowView.tag, childI->getTag());
  EXPECT_EQ(mutations3[13].type, ShadowViewMutation::Insert);
  EXPECT_EQ(mutations3[13].newChildShadowView.tag, reparentedViewB->getTag());
  EXPECT_EQ(mutations3[14].type, ShadowViewMutation::Insert);
  EXPECT_EQ(mutations3[14].newChildShadowView.tag, reparentedViewA->getTag());

  auto mutations4 = calculateShadowViewMutations(*rootNodeV4, *rootNodeV5);

  EXPECT_EQ(mutations4.size(), 9);
  EXPECT_EQ(mutations4[0].type, ShadowViewMutation::Update);
  EXPECT_EQ(mutations4[0].oldChildShadowView.tag, childG->getTag());
  EXPECT_EQ(mutations4[1].type, ShadowViewMutation::Update);
  EXPECT_EQ(mutations4[1].oldChildShadowView.tag, childH->getTag());
  EXPECT_EQ(mutations4[2].type, ShadowViewMutation::Update);
  EXPECT_EQ(mutations4[2].oldChildShadowView.tag, childI->getTag());
  EXPECT_EQ(mutations4[3].type, ShadowViewMutation::Remove);
  EXPECT_EQ(mutations4[3].oldChildShadowView.tag, reparentedViewA->getTag());
  EXPECT_EQ(mutations4[4].type, ShadowViewMutation::Remove);
  EXPECT_EQ(mutations4[4].oldChildShadowView.tag, reparentedViewB->getTag());
  EXPECT_EQ(mutations4[5].type, ShadowViewMutation::Create);
  EXPECT_EQ(mutations4[5].newChildShadowView.tag, childJ->getTag());
  EXPECT_EQ(mutations4[6].type, ShadowViewMutation::Insert);
  EXPECT_EQ(mutations4[6].newChildShadowView.tag, childJ->getTag());
  EXPECT_EQ(mutations4[7].type, ShadowViewMutation::Insert);
  EXPECT_EQ(mutations4[7].newChildShadowView.tag, reparentedViewA->getTag());
  EXPECT_EQ(mutations4[8].type, ShadowViewMutation::Insert);
  EXPECT_EQ(mutations4[8].newChildShadowView.tag, reparentedViewB->getTag());
}

} // namespace facebook::react

/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#include <react/components/root/RootComponentDescriptor.h>
#include <react/components/view/ViewComponentDescriptor.h>
#include <react/mounting/Differentiator.h>
#include <react/mounting/stubs.h>

#include "shadowTreeGeneration.h"

#include <Glog/logging.h>
#include <gtest/gtest.h>

namespace facebook {
namespace react {

static ShadowNode::Shared makeNode(
    ComponentDescriptor const &componentDescriptor,
    int tag,
    ShadowNode::ListOfShared children) {
  auto props = generateDefaultProps(componentDescriptor);

  // Make sure node is layoutable by giving it dimensions and making it
  // accessible This is an implementation detail and subject to change.
  folly::dynamic dynamic = folly::dynamic::object();
  dynamic["position"] = "absolute";
  dynamic["top"] = 0;
  dynamic["left"] = 0;
  dynamic["width"] = 100;
  dynamic["height"] = 100;
  dynamic["nativeId"] = tag;
  dynamic["accessible"] = true;

  auto newProps = componentDescriptor.cloneProps(props, RawProps(dynamic));

  return componentDescriptor.createShadowNode(
      ShadowNodeFragment{newProps,
                         std::make_shared<SharedShadowNodeList>(children)},
      componentDescriptor.createFamily({tag, SurfaceId(1), nullptr}, nullptr));
}

TEST(MountingTest, testMinimalInstructionGeneration) {
  auto eventDispatcher = EventDispatcher::Shared{};
  auto contextContainer = std::make_shared<ContextContainer>();
  auto componentDescriptorParameters =
      ComponentDescriptorParameters{eventDispatcher, contextContainer, nullptr};
  auto viewComponentDescriptor =
      ViewComponentDescriptor(componentDescriptorParameters);
  auto rootComponentDescriptor =
      RootComponentDescriptor(componentDescriptorParameters);

  auto rootFamily = rootComponentDescriptor.createFamily(
      {Tag(1), SurfaceId(1), nullptr}, nullptr);

  // Creating an initial root shadow node.
  auto emptyRootNode = std::const_pointer_cast<RootShadowNode>(
      std::static_pointer_cast<RootShadowNode const>(
          rootComponentDescriptor.createShadowNode(
              ShadowNodeFragment{RootShadowNode::defaultSharedProps()},
              rootFamily)));

  // Applying size constraints.
  emptyRootNode = emptyRootNode->clone(
      LayoutConstraints{Size{512, 0},
                        Size{512, std::numeric_limits<Float>::infinity()}},
      LayoutContext{});

  auto childA = makeNode(viewComponentDescriptor, 100, {});
  auto childB = makeNode(viewComponentDescriptor, 101, {});
  auto childC = makeNode(viewComponentDescriptor, 102, {});
  auto childD = makeNode(viewComponentDescriptor, 103, {});
  auto childE = makeNode(viewComponentDescriptor, 104, {});
  auto childF = makeNode(viewComponentDescriptor, 105, {});

  auto family = viewComponentDescriptor.createFamily(
      {10, SurfaceId(1), nullptr}, nullptr);

  // Construct "identical" shadow nodes: they differ only in children.
  auto shadowNodeV1 = viewComponentDescriptor.createShadowNode(
      ShadowNodeFragment{generateDefaultProps(viewComponentDescriptor),
                         std::make_shared<SharedShadowNodeList>(
                             SharedShadowNodeList{childB, childC, childD})},
      family);
  auto shadowNodeV2 = shadowNodeV1->clone(ShadowNodeFragment{
      generateDefaultProps(viewComponentDescriptor),
      std::make_shared<SharedShadowNodeList>(
          SharedShadowNodeList{childA, childB, childC, childD})});
  auto shadowNodeV3 = shadowNodeV2->clone(
      ShadowNodeFragment{generateDefaultProps(viewComponentDescriptor),
                         std::make_shared<SharedShadowNodeList>(
                             SharedShadowNodeList{childB, childC, childD})});
  auto shadowNodeV4 = shadowNodeV3->clone(
      ShadowNodeFragment{generateDefaultProps(viewComponentDescriptor),
                         std::make_shared<SharedShadowNodeList>(
                             SharedShadowNodeList{childB, childD, childE})});
  auto shadowNodeV5 = shadowNodeV4->clone(ShadowNodeFragment{
      generateDefaultProps(viewComponentDescriptor),
      std::make_shared<SharedShadowNodeList>(
          SharedShadowNodeList{childB, childA, childE, childC})});
  auto shadowNodeV6 = shadowNodeV5->clone(ShadowNodeFragment{
      generateDefaultProps(viewComponentDescriptor),
      std::make_shared<SharedShadowNodeList>(SharedShadowNodeList{
          childB, childA, childD, childF, childE, childC})});

  // Injecting a tree into the root node.
  auto rootNodeV1 = std::static_pointer_cast<RootShadowNode const>(
      emptyRootNode->ShadowNode::clone(
          ShadowNodeFragment{ShadowNodeFragment::propsPlaceholder(),
                             std::make_shared<SharedShadowNodeList>(
                                 SharedShadowNodeList{shadowNodeV1})}));
  auto rootNodeV2 = std::static_pointer_cast<RootShadowNode const>(
      rootNodeV1->ShadowNode::clone(
          ShadowNodeFragment{ShadowNodeFragment::propsPlaceholder(),
                             std::make_shared<SharedShadowNodeList>(
                                 SharedShadowNodeList{shadowNodeV2})}));
  auto rootNodeV3 = std::static_pointer_cast<RootShadowNode const>(
      rootNodeV2->ShadowNode::clone(
          ShadowNodeFragment{ShadowNodeFragment::propsPlaceholder(),
                             std::make_shared<SharedShadowNodeList>(
                                 SharedShadowNodeList{shadowNodeV3})}));
  auto rootNodeV4 = std::static_pointer_cast<RootShadowNode const>(
      rootNodeV3->ShadowNode::clone(
          ShadowNodeFragment{ShadowNodeFragment::propsPlaceholder(),
                             std::make_shared<SharedShadowNodeList>(
                                 SharedShadowNodeList{shadowNodeV4})}));
  auto rootNodeV5 = std::static_pointer_cast<RootShadowNode const>(
      rootNodeV4->ShadowNode::clone(
          ShadowNodeFragment{ShadowNodeFragment::propsPlaceholder(),
                             std::make_shared<SharedShadowNodeList>(
                                 SharedShadowNodeList{shadowNodeV5})}));
  auto rootNodeV6 = std::static_pointer_cast<RootShadowNode const>(
      rootNodeV5->ShadowNode::clone(
          ShadowNodeFragment{ShadowNodeFragment::propsPlaceholder(),
                             std::make_shared<SharedShadowNodeList>(
                                 SharedShadowNodeList{shadowNodeV6})}));

  // Layout and diff
  std::vector<LayoutableShadowNode const *> affectedLayoutableNodesV1{};
  affectedLayoutableNodesV1.reserve(1024);
  std::const_pointer_cast<RootShadowNode>(rootNodeV1)
      ->layoutIfNeeded(&affectedLayoutableNodesV1);
  rootNodeV1->sealRecursive();

  std::vector<LayoutableShadowNode const *> affectedLayoutableNodesV2{};
  affectedLayoutableNodesV2.reserve(1024);
  std::const_pointer_cast<RootShadowNode>(rootNodeV2)
      ->layoutIfNeeded(&affectedLayoutableNodesV2);
  rootNodeV2->sealRecursive();

  std::vector<LayoutableShadowNode const *> affectedLayoutableNodesV3{};
  affectedLayoutableNodesV3.reserve(1024);
  std::const_pointer_cast<RootShadowNode>(rootNodeV3)
      ->layoutIfNeeded(&affectedLayoutableNodesV3);
  rootNodeV3->sealRecursive();

  std::vector<LayoutableShadowNode const *> affectedLayoutableNodesV4{};
  affectedLayoutableNodesV4.reserve(1024);
  std::const_pointer_cast<RootShadowNode>(rootNodeV4)
      ->layoutIfNeeded(&affectedLayoutableNodesV4);
  rootNodeV4->sealRecursive();

  std::vector<LayoutableShadowNode const *> affectedLayoutableNodesV5{};
  affectedLayoutableNodesV5.reserve(1024);
  std::const_pointer_cast<RootShadowNode>(rootNodeV5)
      ->layoutIfNeeded(&affectedLayoutableNodesV5);
  rootNodeV5->sealRecursive();

  std::vector<LayoutableShadowNode const *> affectedLayoutableNodesV6{};
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
  auto mutations1 = calculateShadowViewMutations(
      DifferentiatorMode::OptimizedMoves, *rootNodeV1, *rootNodeV2);

  // The order and exact mutation instructions here may change at any time.
  // This test just ensures that any changes are intentional.
  // This test, in particular, ensures that inserting a node at the beginning
  // produces a single "Insert" instruction, and no remove/insert (move)
  // operations. All these nodes are laid out with absolute positioning, so
  // moving them around does not change layout.
  assert(mutations1.size() == 2);
  assert(mutations1[0].type == ShadowViewMutation::Create);
  assert(mutations1[0].newChildShadowView.tag == 100);
  assert(mutations1[1].type == ShadowViewMutation::Insert);
  assert(mutations1[1].newChildShadowView.tag == 100);
  assert(mutations1[1].index == 0);

  // Calculating mutations.
  auto mutations2 = calculateShadowViewMutations(
      DifferentiatorMode::OptimizedMoves, *rootNodeV2, *rootNodeV3);

  // The order and exact mutation instructions here may change at any time.
  // This test just ensures that any changes are intentional.
  // This test, in particular, ensures that removing a node at the beginning
  // produces a single remove (and delete) instruction, and no remove/insert
  // (move) operations. All these nodes are laid out with absolute positioning,
  // so moving them around does not change layout.
  assert(mutations2.size() == 2);
  assert(mutations2[0].type == ShadowViewMutation::Remove);
  assert(mutations2[0].oldChildShadowView.tag == 100);
  assert(mutations2[0].index == 0);
  assert(mutations2[1].type == ShadowViewMutation::Delete);
  assert(mutations2[1].oldChildShadowView.tag == 100);

  // Calculating mutations.
  auto mutations3 = calculateShadowViewMutations(
      DifferentiatorMode::OptimizedMoves, *rootNodeV3, *rootNodeV4);

  // The order and exact mutation instructions here may change at any time.
  // This test just ensures that any changes are intentional.
  // This test, in particular, ensures that removing a node in the middle
  // produces a single remove (and delete) instruction, and no remove/insert
  // (move) operations; and that simultaneously, we can insert a node at the
  // end. NOTE: This list of mutations has some unexpected "Update"
  // instructions, due to layout issues (some LayoutMetrics are 0). Not sure
  // why, but the point of this test is to make sure there aren't unnecessary
  // insert/deletes, so we can ignore for now.
  assert(mutations3.size() == 7);
  assert(mutations3[0].type == ShadowViewMutation::Update);
  assert(mutations3[1].type == ShadowViewMutation::Update);
  assert(mutations3[2].type == ShadowViewMutation::Update);
  assert(mutations3[3].type == ShadowViewMutation::Remove);
  assert(mutations3[3].oldChildShadowView.tag == 102);
  assert(mutations3[3].index == 1);
  assert(mutations3[4].type == ShadowViewMutation::Delete);
  assert(mutations3[4].oldChildShadowView.tag == 102);
  assert(mutations3[5].type == ShadowViewMutation::Create);
  assert(mutations3[5].newChildShadowView.tag == 104);
  assert(mutations3[6].type == ShadowViewMutation::Insert);
  assert(mutations3[6].newChildShadowView.tag == 104);
  assert(mutations3[6].index == 2);

  // Calculating mutations.
  auto mutations4 = calculateShadowViewMutations(
      DifferentiatorMode::OptimizedMoves, *rootNodeV4, *rootNodeV5);

  // The order and exact mutation instructions here may change at any time.
  // This test just ensures that any changes are intentional.
  // This test, in particular, ensures that inserting a child at the middle, and
  // at the end, and removing a node in the middle, produces the minimal set of
  // instructions. All these nodes are laid out with absolute positioning, so
  // moving them around does not change layout. NOTE: This list of mutations has
  // some unexpected "Update" instructions, due to layout issues (some
  // LayoutMetrics are 0). Not sure why, but the point of this test is to make
  // sure there aren't unnecessary insert/deletes, so we can ignore for now.
  assert(mutations4.size() == 9);
  assert(mutations4[0].type == ShadowViewMutation::Update);
  assert(mutations4[1].type == ShadowViewMutation::Update);
  assert(mutations4[2].type == ShadowViewMutation::Update);
  assert(mutations4[3].type == ShadowViewMutation::Remove);
  assert(mutations4[3].oldChildShadowView.tag == 103);
  assert(mutations4[3].index == 1);
  assert(mutations4[4].type == ShadowViewMutation::Delete);
  assert(mutations4[4].oldChildShadowView.tag == 103);
  assert(mutations4[5].type == ShadowViewMutation::Create);
  assert(mutations4[5].newChildShadowView.tag == 100);
  assert(mutations4[6].type == ShadowViewMutation::Create);
  assert(mutations4[6].newChildShadowView.tag == 102);
  assert(mutations4[7].type == ShadowViewMutation::Insert);
  assert(mutations4[7].newChildShadowView.tag == 100);
  assert(mutations4[7].index == 1);
  assert(mutations4[8].type == ShadowViewMutation::Insert);
  assert(mutations4[8].newChildShadowView.tag == 102);
  assert(mutations4[8].index == 3);

  auto mutations5 = calculateShadowViewMutations(
      DifferentiatorMode::OptimizedMoves, *rootNodeV5, *rootNodeV6);

  // The order and exact mutation instructions here may change at any time.
  // This test just ensures that any changes are intentional.
  // This test, in particular, ensures that inserting TWO children in the middle
  // produces the minimal set of instructions. All these nodes are laid out with
  // absolute positioning, so moving them around does not change layout.
  assert(mutations5.size() == 4);
  assert(mutations5[0].type == ShadowViewMutation::Create);
  assert(mutations5[0].newChildShadowView.tag == 103);
  assert(mutations5[1].type == ShadowViewMutation::Create);
  assert(mutations5[1].newChildShadowView.tag == 105);
  assert(mutations5[2].type == ShadowViewMutation::Insert);
  assert(mutations5[2].newChildShadowView.tag == 103);
  assert(mutations5[2].index == 2);
  assert(mutations5[3].type == ShadowViewMutation::Insert);
  assert(mutations5[3].newChildShadowView.tag == 105);
  assert(mutations5[3].index == 3);
}

} // namespace react
} // namespace facebook

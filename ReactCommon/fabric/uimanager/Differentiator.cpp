// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "Differentiator.h"

namespace facebook {
namespace react {

static void calculateMutationInstructions(
  TreeMutationInstructionList &instructions,
  SharedShadowNode parentNode,
  SharedShadowNodeSharedList oldChildNodes,
  SharedShadowNodeSharedList newChildNodes
) {
  // The current version of the algorithm is otimized for simplicity,
  // not for performance of optimal result.

  // TODO(shergin): Consider to use Minimal Edit Distance algorithm to produce
  // optimal set of instructions and improve mounting performance.
  // https://en.wikipedia.org/wiki/Edit_distance
  // https://www.geeksforgeeks.org/dynamic-programming-set-5-edit-distance/

  if (oldChildNodes == newChildNodes) {
    return;
  }

  if (oldChildNodes->size() == 0 && newChildNodes->size() == 0) {
    return;
  }

  std::unordered_set<Tag> insertedTags = {};
  int index = 0;

  TreeMutationInstructionList createInstructions = {};
  TreeMutationInstructionList deleteInstructions = {};
  TreeMutationInstructionList insertInstructions = {};
  TreeMutationInstructionList removeInstructions = {};
  TreeMutationInstructionList replaceInstructions = {};
  TreeMutationInstructionList downwardInstructions = {};

  // Stage 1: Collectings Updates
  for (index = 0; index < oldChildNodes->size() && index < newChildNodes->size(); index++) {
    SharedShadowNode oldChildNode = oldChildNodes->at(index);
    SharedShadowNode newChildNode = newChildNodes->at(index);

    if (oldChildNode->getTag() != newChildNode->getTag()) {
      // Totally different nodes, updating is impossible.
      break;
    }

    if (*oldChildNode != *newChildNode) {
      replaceInstructions.push_back(
        TreeMutationInstruction::Replace(
          parentNode,
          oldChildNode,
          newChildNode,
          index
        )
      );
    }

    calculateMutationInstructions(
      downwardInstructions,
      oldChildNode,
      oldChildNode->getChildren(),
      newChildNode->getChildren()
    );
  }

  int lastIndexAfterFirstStage = index;

  // Stage 2: Collectings Insertions
  for (; index < newChildNodes->size(); index++) {
    SharedShadowNode newChildNode = newChildNodes->at(index);

    insertInstructions.push_back(
      TreeMutationInstruction::Insert(
        parentNode,
        newChildNode,
        index
      )
    );

    insertedTags.insert(newChildNode->getTag());

    SharedShadowNode newChildSourceNode = newChildNode->getSourceNode();
    SharedShadowNodeSharedList newChildSourceChildNodes =
      newChildSourceNode ? newChildSourceNode->getChildren() : ShadowNode::emptySharedShadowNodeSharedList();

    calculateMutationInstructions(
      downwardInstructions,
      newChildNode,
      newChildSourceChildNodes,
      newChildNode->getChildren()
    );
  }

  // Stage 3: Collectings Deletions and Removals
  for (index = lastIndexAfterFirstStage; index < oldChildNodes->size(); index++) {
    SharedShadowNode oldChildNode = oldChildNodes->at(index);

    // Even if the old node was (re)inserted, we have to generate `remove`
    // instruction.
    removeInstructions.push_back(
      TreeMutationInstruction::Remove(
        parentNode,
        oldChildNode,
        index
      )
    );

    auto numberOfRemovedTags = insertedTags.erase(oldChildNode->getTag());
    assert(numberOfRemovedTags == 0 || numberOfRemovedTags == 1);

    if (numberOfRemovedTags == 0) {
      // The old node was *not* (re)inserted,
      // so we have to generate `delete` instruction and apply the algorithm
      // recursively.
      deleteInstructions.push_back(
        TreeMutationInstruction::Delete(
          oldChildNode
        )
      );

      calculateMutationInstructions(
        downwardInstructions,
        oldChildNode,
        oldChildNode->getChildren(),
        ShadowNode::emptySharedShadowNodeSharedList()
      );
    }
  }

  // Stage 4: Collectings Creations
  for (index = lastIndexAfterFirstStage; index < newChildNodes->size(); index++) {
    SharedShadowNode newChildNode = newChildNodes->at(index);
    if (insertedTags.find(newChildNode->getTag()) == insertedTags.end()) {
      // The new node was (re)inserted, so there is no need to create it.
      continue;
    }

    createInstructions.push_back(
      TreeMutationInstruction::Create(
        newChildNode
      )
    );
  }

  // All instructions in an optimal order:
  instructions.insert(instructions.end(), replaceInstructions.begin(), replaceInstructions.end());
  instructions.insert(instructions.end(), removeInstructions.begin(), removeInstructions.end());
  instructions.insert(instructions.end(), deleteInstructions.begin(), deleteInstructions.end());
  instructions.insert(instructions.end(), createInstructions.begin(), createInstructions.end());
  instructions.insert(instructions.end(), insertInstructions.begin(), insertInstructions.end());
  instructions.insert(instructions.end(), downwardInstructions.begin(), downwardInstructions.end());
}


void calculateMutationInstructions(
  TreeMutationInstructionList &instructions,
  SharedShadowNode oldRootShadowNode,
  SharedShadowNode newRootShadowNode
) {
  // Root shadow nodes must have same tag.
  assert(oldRootShadowNode->getTag() == newRootShadowNode->getTag());

  if (*oldRootShadowNode != *newRootShadowNode) {
    instructions.push_back(
      TreeMutationInstruction::Replace(
        nullptr,
        oldRootShadowNode,
        newRootShadowNode,
        -1
      )
    );
  }

  calculateMutationInstructions(
    instructions,
    oldRootShadowNode,
    oldRootShadowNode->getChildren(),
    newRootShadowNode->getChildren()
  );
}

} // namespace react
} // namespace facebook

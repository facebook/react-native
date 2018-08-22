// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "Differentiator.h"

namespace facebook {
namespace react {

static void calculateMutationInstructions(
  TreeMutationInstructionList &instructions,
  SharedShadowNode parentNode,
  const SharedShadowNodeList &oldChildNodes,
  const SharedShadowNodeList &newChildNodes
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

  if (oldChildNodes.size() == 0 && newChildNodes.size() == 0) {
    return;
  }

  std::unordered_map<Tag, SharedShadowNode> insertedNodes;
  int index = 0;

  TreeMutationInstructionList createInstructions = {};
  TreeMutationInstructionList deleteInstructions = {};
  TreeMutationInstructionList insertInstructions = {};
  TreeMutationInstructionList removeInstructions = {};
  TreeMutationInstructionList replaceInstructions = {};
  TreeMutationInstructionList downwardInstructions = {};
  TreeMutationInstructionList destructionDownwardInstructions = {};

  // Stage 1: Collectings Updates
  for (index = 0; index < oldChildNodes.size() && index < newChildNodes.size(); index++) {
    const auto &oldChildNode = oldChildNodes.at(index);
    const auto &newChildNode = newChildNodes.at(index);

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
      *(newChildNode->getChildren().size() ? &downwardInstructions : &destructionDownwardInstructions),
      oldChildNode,
      oldChildNode->getChildren(),
      newChildNode->getChildren()
    );
  }

  int lastIndexAfterFirstStage = index;

  // Stage 2: Collectings Insertions
  for (; index < newChildNodes.size(); index++) {
    const auto &newChildNode = newChildNodes.at(index);

    insertInstructions.push_back(
      TreeMutationInstruction::Insert(
        parentNode,
        newChildNode,
        index
      )
    );

    insertedNodes.insert({newChildNode->getTag(), newChildNode});
  }

  // Stage 3: Collectings Deletions and Removals
  for (index = lastIndexAfterFirstStage; index < oldChildNodes.size(); index++) {
    const auto &oldChildNode = oldChildNodes.at(index);

    // Even if the old node was (re)inserted, we have to generate `remove`
    // instruction.
    removeInstructions.push_back(
      TreeMutationInstruction::Remove(
        parentNode,
        oldChildNode,
        index
      )
    );

    const auto &it = insertedNodes.find(oldChildNode->getTag());

    if (it == insertedNodes.end()) {
      // The old node was *not* (re)inserted.
      // We have to generate `delete` instruction and apply the algorithm
      // recursively.
      deleteInstructions.push_back(
        TreeMutationInstruction::Delete(
          oldChildNode
        )
      );

      // We also have to call the algorithm recursively to clean up the entire
      // subtree starting from the removed node.
      calculateMutationInstructions(
        destructionDownwardInstructions,
        oldChildNode,
        oldChildNode->getChildren(),
        {}
      );
    } else {
      // The old node *was* (re)inserted.
      // We have to call the algorithm recursively if the inserted node
      // is *not* the same as removed one.
      const auto &newChildNode = it->second;
      if (newChildNode != oldChildNode) {
        calculateMutationInstructions(
          *(newChildNode->getChildren().size() ? &downwardInstructions : &destructionDownwardInstructions),
          newChildNode,
          oldChildNode->getChildren(),
          newChildNode->getChildren()
        );
      }

      // In any case we have to remove the node from `insertedNodes` as
      // indication that the node was actually removed (which means that
      // the node existed before), hence we don't have to generate
      // `create` instruction.
      insertedNodes.erase(it);
    }
  }

  // Stage 4: Collectings Creations
  for (index = lastIndexAfterFirstStage; index < newChildNodes.size(); index++) {
    const auto &newChildNode = newChildNodes.at(index);

    if (insertedNodes.find(newChildNode->getTag()) == insertedNodes.end()) {
      // The new node was (re)inserted, so there is no need to create it.
      continue;
    }

    createInstructions.push_back(
      TreeMutationInstruction::Create(
        newChildNode
      )
    );

    calculateMutationInstructions(
      downwardInstructions,
      newChildNode,
      {},
      newChildNode->getChildren()
    );
  }

  // All instructions in an optimal order:
  instructions.insert(instructions.end(), destructionDownwardInstructions.begin(), destructionDownwardInstructions.end());
  instructions.insert(instructions.end(), replaceInstructions.begin(), replaceInstructions.end());
  instructions.insert(instructions.end(), removeInstructions.rbegin(), removeInstructions.rend());
  instructions.insert(instructions.end(), createInstructions.begin(), createInstructions.end());
  instructions.insert(instructions.end(), downwardInstructions.begin(), downwardInstructions.end());
  instructions.insert(instructions.end(), insertInstructions.begin(), insertInstructions.end());
  instructions.insert(instructions.end(), deleteInstructions.begin(), deleteInstructions.end());
}

void calculateMutationInstructions(
  TreeMutationInstructionList &instructions,
  const SharedShadowNode &oldRootShadowNode,
  const SharedShadowNode &newRootShadowNode
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

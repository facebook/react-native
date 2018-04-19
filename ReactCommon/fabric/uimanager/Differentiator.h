// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <fabric/core/ShadowNode.h>
#include <fabric/uimanager/TreeMutationInstruction.h>

namespace facebook {
namespace react {

/*
 * Calculates set of mutation instuctions which describe how the old
 * ShadowNode tree can be transformed to the new ShadowNode tree.
 * The set of instuctions might be and might not be optimal.
 */
void calculateMutationInstructions(
  TreeMutationInstructionList &instructions,
  SharedShadowNode parentNode,
  SharedShadowNodeSharedList oldChildNodes,
  SharedShadowNodeSharedList newChildNodes
);

} // namespace react
} // namespace facebook

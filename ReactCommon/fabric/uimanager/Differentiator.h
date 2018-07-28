// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

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
  SharedShadowNode oldNode,
  SharedShadowNode newNode
);

} // namespace react
} // namespace facebook

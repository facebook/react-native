// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <fabric/uimanager/TreeMutationInstruction.h>

namespace facebook {
namespace react {

class ShadowTree;

/*
 * Abstract class for ShadowTree's delegate.
 */
class ShadowTreeDelegate {
public:

  /*
   * Called right after Shadow Tree commit a new state of the the tree.
   */
  virtual void shadowTreeDidCommit(const std::shared_ptr<ShadowTree> &shadowTree, const TreeMutationInstructionList &instructions) = 0;
};

} // namespace react
} // namespace facebook

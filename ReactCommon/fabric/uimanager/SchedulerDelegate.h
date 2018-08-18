// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <memory>

#include <fabric/core/ReactPrimitives.h>
#include <fabric/core/ShadowNode.h>
#include <fabric/uimanager/TreeMutationInstruction.h>

namespace facebook {
namespace react {

/*
 * Abstract class for Scheduler's delegate.
 */
class SchedulerDelegate {
public:

  virtual ~SchedulerDelegate() = default;

  /*
   * Called right after Scheduler computed (and laid out) a new updated version
   * of the tree and calculated a set of mutation instructions which are
   * suffisient to construct a new one.
   */
  virtual void schedulerDidComputeMutationInstructions(Tag rootTag, const TreeMutationInstructionList &instructions) = 0;

  /*
   * Called right after a new ShadowNode was created.
   */
  virtual void schedulerDidRequestPreliminaryViewAllocation(ComponentName componentName) = 0;
};

} // namespace react
} // namespace facebook

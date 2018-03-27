/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <vector>

#include <fabric/core/ShadowNode.h>
#include <fabric/debug/DebugStringConvertible.h>

namespace facebook {
namespace react {

class TreeMutationInstruction;

using TreeMutationInstructionList = std::vector<TreeMutationInstruction>;

/*
 * Describes single native views tree mutation instruction which may contain
 * pointers to an old shadow node, a new shadow node, a parent shadow node and
 * final index of inserted or updated node.
 * The relationship between native view instances and shadow node instances is
 * defined by `tag` value.
 */
class TreeMutationInstruction:
  public DebugStringConvertible {
public:

#pragma mark - Designated Initializers

  /*
   * Creates and returns an *Insert* instruction with following semantic:
   *   1. Create a native view for the shadow node if needed;
   *   2. Unmount the native view from a previous superview if needed;
   *   3. Mount the native view to the new superview.
   */
  static const TreeMutationInstruction Insert(
    SharedShadowNode parentNode,
    SharedShadowNode childNode,
    int index
  );

  /*
   * Creates and returns a *Delete* instruction with following semantic:
   *   1. Unmount the native view from a previous superview if needed;
   *   2. Destroy (or return to a recycle pool) the native view.
   */
  static const TreeMutationInstruction Delete(
    SharedShadowNode parentNode,
    SharedShadowNode childNode,
    int index
  );
  
  /*
   * Creates and returns an *Update* instruction with following semantic:
   *   1. Update the presentation of a native view based on the new shadow node;
   *   2. The exact set of changes are not specified but might contain
   *      new props and/or new layout (or might be empty).
   */
  static const TreeMutationInstruction Update(
    SharedShadowNode parentNode,
    SharedShadowNode oldChildNode,
    SharedShadowNode newChildNode,
    int index
  );

#pragma mark - Type

  enum Type {
    Inserting,
    Deleting,
    Updating
  };

#pragma mark - Getters

  Type getType() const;
  SharedShadowNode getParentNode() const;
  SharedShadowNode getOldChildNode() const;
  SharedShadowNode getNewChildNode() const;
  int getIndex() const;

#pragma mark - DebugStringConvertible

  std::string getDebugName() const override;
  SharedDebugStringConvertibleList getDebugProps() const override;

private:
  TreeMutationInstruction(
    Type type,
    SharedShadowNode parentNode,
    SharedShadowNode oldChildNode,
    SharedShadowNode newChildNode,
    int index
  );

  Type type_ {Inserting};
  SharedShadowNode parentNode_ {nullptr};
  SharedShadowNode oldChildNode_ {nullptr};
  SharedShadowNode newChildNode_ {nullptr};
  int index_ {-1};
};

} // namespace react
} // namespace facebook

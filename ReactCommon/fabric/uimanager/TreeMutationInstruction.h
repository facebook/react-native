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
 * Use static methods to instantiate mutation instructions of different types.
 */
class TreeMutationInstruction:
  public DebugStringConvertible {
public:

#pragma mark - Designated Initializers

  /*
   * Creates and returns an *Creation* instruction.
   */
  static const TreeMutationInstruction Create(
    SharedShadowNode node
  );

  /*
   * Creates and returns an *Deletion* instruction.
   */
  static const TreeMutationInstruction Delete(
    SharedShadowNode node
  );

  /*
   * Creates and returns an *Insertion* instruction.
   */
  static const TreeMutationInstruction Insert(
    SharedShadowNode parentNode,
    SharedShadowNode childNode,
    int index
  );

  /*
   * Creates and returns a *Removal* instruction.
   */
  static const TreeMutationInstruction Remove(
    SharedShadowNode parentNode,
    SharedShadowNode childNode,
    int index
  );
  
  /*
   * Creates and returns an *Replacement* instruction.
   */
  static const TreeMutationInstruction Replace(
    SharedShadowNode parentNode,
    SharedShadowNode oldChildNode,
    SharedShadowNode newChildNode,
    int index
  );

#pragma mark - Type

  enum Type {
    Creation,
    Deletion,
    Insertion,
    Removal,
    Replacement
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

  Type type_ {Creation};
  SharedShadowNode parentNode_ {nullptr};
  SharedShadowNode oldChildNode_ {nullptr};
  SharedShadowNode newChildNode_ {nullptr};
  int index_ {-1};
};

} // namespace react
} // namespace facebook

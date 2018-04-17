/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>
#include <vector>

#include <fabric/core/Props.h>
#include <fabric/core/Sealable.h>
#include <fabric/core/ReactPrimitives.h>
#include <fabric/debug/DebugStringConvertible.h>

namespace facebook {
namespace react {

class ShadowNode;

using SharedShadowNode = std::shared_ptr<const ShadowNode>;
using SharedShadowNodeList = std::vector<std::shared_ptr<const ShadowNode>>;
using SharedShadowNodeSharedList = std::shared_ptr<const SharedShadowNodeList>;
using SharedShadowNodeUnsharedList = std::shared_ptr<SharedShadowNodeList>;
using WeakShadowNode = std::weak_ptr<const ShadowNode>;

class ShadowNode:
  public virtual Sealable,
  public virtual DebugStringConvertible {
public:
  static SharedShadowNodeSharedList emptySharedShadowNodeSharedList();

#pragma mark - Constructors

  ShadowNode(
    const Tag &tag,
    const Tag &rootTag,
    const InstanceHandle &instanceHandle,
    const SharedProps &props = SharedProps(),
    const SharedShadowNodeSharedList &children = SharedShadowNodeSharedList()
  );

  ShadowNode(
    const SharedShadowNode &shadowNode,
    const SharedProps &props = nullptr,
    const SharedShadowNodeSharedList &children = nullptr
  );

#pragma mark - Getters

  virtual ComponentHandle getComponentHandle() const = 0;
  virtual ComponentName getComponentName() const = 0;

  SharedShadowNodeSharedList getChildren() const;
  SharedProps getProps() const;
  Tag getTag() const;
  Tag getRootTag() const;
  InstanceHandle getInstanceHandle() const;

  /*
   * Returns the node which was used as a prototype in clone constructor.
   * The node is held as a weak reference so that the method may return
   * `nullptr` in cases where the node was constructed using the explicit
   * constructor or the node was already deallocated.
   */
  SharedShadowNode getSourceNode() const;

  void sealRecursive() const;

#pragma mark - Mutating Methods

  void appendChild(const SharedShadowNode &child);
  void replaceChild(const SharedShadowNode &oldChild, const SharedShadowNode &newChild);
  void clearSourceNode();

  /*
   * Replaces the current source node with its source node.
   * This method might be used for illuminating side-effects caused by the last
   * cloning operation which are not desirable from the diffing algorithm
   * perspective.
   */
  void shallowSourceNode();

#pragma mark - Equality

  /*
   * Equality operators.
   * Use this to compare `ShadowNode`s values for equality (and non-equality).
   * Same values indicates that nodes must not produce mutation instructions
   * during tree diffing process.
   * Child nodes are not considered as part of the value.
   */
  virtual bool operator==(const ShadowNode& rhs) const;
  virtual bool operator!=(const ShadowNode& rhs) const;

#pragma mark - DebugStringConvertible

  std::string getDebugName() const override;
  std::string getDebugValue() const override;
  SharedDebugStringConvertibleList getDebugChildren() const override;
  SharedDebugStringConvertibleList getDebugProps() const override;

protected:
  Tag tag_;
  Tag rootTag_;
  InstanceHandle instanceHandle_;
  SharedProps props_;
  SharedShadowNodeSharedList children_;
  WeakShadowNode sourceNode_;

private:

  /*
   * A number of the generation of the ShadowNode instance;
   * is used and useful for debug-printing purposes *only*.
   * Do not access this value in any circumstances.
   */
  const int revision_;
};

} // namespace react
} // namespace facebook

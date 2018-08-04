/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>
#include <memory>
#include <vector>

#include <fabric/core/LocalData.h>
#include <fabric/core/Props.h>
#include <fabric/core/ReactPrimitives.h>
#include <fabric/core/Sealable.h>
#include <fabric/events/EventEmitter.h>
#include <fabric/debug/DebugStringConvertible.h>

namespace facebook {
namespace react {

struct ShadowNodeFragment;

class ShadowNode;

using SharedShadowNode = std::shared_ptr<const ShadowNode>;
using UnsharedShadowNode = std::shared_ptr<ShadowNode>;
using SharedShadowNodeList = std::vector<std::shared_ptr<const ShadowNode>>;
using SharedShadowNodeSharedList = std::shared_ptr<const SharedShadowNodeList>;
using SharedShadowNodeUnsharedList = std::shared_ptr<SharedShadowNodeList>;

using ShadowNodeCloneFunction = std::function<UnsharedShadowNode(
  const ShadowNode &sourceShadowNode,
  const ShadowNodeFragment &fragment
)>;

class ShadowNode:
  public virtual Sealable,
  public virtual DebugStringConvertible,
  public std::enable_shared_from_this<ShadowNode> {

public:
  static SharedShadowNodeSharedList emptySharedShadowNodeSharedList();

#pragma mark - Constructors

  /*
   * Creates a Shadow Node based on fields specified in a `fragment`.
   */
  ShadowNode(
    const ShadowNodeFragment &fragment,
    const ShadowNodeCloneFunction &cloneFunction
  );

  /*
   * Creates a Shadow Node via cloning given `sourceShadowNode` and
   * applying fields from given `fragment`.
   */
  ShadowNode(
    const ShadowNode &sourceShadowNode,
    const ShadowNodeFragment &fragment
  );

  /*
   * Clones the shadow node using stored `cloneFunction`.
   */
  UnsharedShadowNode clone(const ShadowNodeFragment &fragment) const;

#pragma mark - Getters

  virtual ComponentHandle getComponentHandle() const = 0;
  virtual ComponentName getComponentName() const = 0;

  const SharedShadowNodeList &getChildren() const;
  SharedProps getProps() const;
  SharedEventEmitter getEventEmitter() const;
  Tag getTag() const;
  Tag getRootTag() const;

  /*
   * Returns a local data associated with the node.
   * `LocalData` object might be used for data exchange between native view and
   * shadow node instances.
   * Concrete type of the object depends on concrete type of the `ShadowNode`.
   */
  SharedLocalData getLocalData() const;

  void sealRecursive() const;

#pragma mark - Mutating Methods

  void appendChild(const SharedShadowNode &child);
  void replaceChild(const SharedShadowNode &oldChild, const SharedShadowNode &newChild, int suggestedIndex = -1);
  void clearSourceNode();

  /*
   * Sets local data assosiated with the node.
   * The node must be unsealed at this point.
   */
  void setLocalData(const SharedLocalData &localData);

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
  SharedProps props_;
  SharedEventEmitter eventEmitter_;
  SharedShadowNodeSharedList children_;
  SharedLocalData localData_;

private:

  /*
   * Clones the list of children (and creates a new `shared_ptr` to it) if
   * `childrenAreShared_` flag is `true`.
   */
  void cloneChildrenIfShared();

  /*
   * A reference to a cloning function that understands how to clone
   * the specific type of ShadowNode.
   */
  ShadowNodeCloneFunction cloneFunction_;

  /*
   * Indicates that `children` list is shared between nodes and need
   * to be cloned before the first mutation.
   */
  bool childrenAreShared_;

  /*
   * A number of the generation of the ShadowNode instance;
   * is used and useful for debug-printing purposes *only*.
   * Do not access this value in any circumstances.
   */
  const int revision_;
};

} // namespace react
} // namespace facebook

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <string>
#include <vector>

#include <react/core/LocalData.h>
#include <react/core/Props.h>
#include <react/core/ReactPrimitives.h>
#include <react/core/Sealable.h>
#include <react/debug/DebugStringConvertible.h>
#include <react/events/EventEmitter.h>

namespace facebook {
namespace react {

struct ShadowNodeFragment;

class ShadowNode;

using SharedShadowNode = std::shared_ptr<const ShadowNode>;
using UnsharedShadowNode = std::shared_ptr<ShadowNode>;
using SharedShadowNodeList = std::vector<SharedShadowNode>;
using SharedShadowNodeSharedList = std::shared_ptr<const SharedShadowNodeList>;
using SharedShadowNodeUnsharedList = std::shared_ptr<SharedShadowNodeList>;

using ShadowNodeCloneFunction = std::function<UnsharedShadowNode(
    const ShadowNode &sourceShadowNode,
    const ShadowNodeFragment &fragment)>;

class ShadowNode : public virtual Sealable,
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
      const ShadowNodeCloneFunction &cloneFunction);

  /*
   * Creates a Shadow Node via cloning given `sourceShadowNode` and
   * applying fields from given `fragment`.
   */
  ShadowNode(
      const ShadowNode &sourceShadowNode,
      const ShadowNodeFragment &fragment);

  virtual ~ShadowNode() = default;

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
  void replaceChild(
      const SharedShadowNode &oldChild,
      const SharedShadowNode &newChild,
      int suggestedIndex = -1);
  void clearSourceNode();

  /*
   * Sets local data assosiated with the node.
   * The node must be unsealed at this point.
   */
  void setLocalData(const SharedLocalData &localData);

  /*
   * Forms a list of all ancestors of the node relative to the given ancestor.
   * The list starts from the parent node and ends with the given ancestor node.
   * Returns `true` if successful, `false` otherwise.
   * Thread-safe if the subtree is immutable.
   * The theoretical complexity of this algorithm is `O(n)`. Use it wisely.
   * The particular implementation can use some tricks to mitigate the
   * complexity problem up to `0(ln(n))` but this is not guaranteed.
   * Particular consumers should use appropriate cache techniques based on
   * `childIndex` and `nodeId` tracking.
   */
  bool constructAncestorPath(
      const ShadowNode &rootShadowNode,
      std::vector<std::reference_wrapper<const ShadowNode>> &ancestors) const;

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
  std::string getDebugName() const override;
  std::string getDebugValue() const override;
  SharedDebugStringConvertibleList getDebugChildren() const override;
  SharedDebugStringConvertibleList getDebugProps() const override;
#endif

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

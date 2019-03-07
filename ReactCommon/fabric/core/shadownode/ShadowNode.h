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

#include <better/small_vector.h>
#include <react/core/EventEmitter.h>
#include <react/core/LocalData.h>
#include <react/core/Props.h>
#include <react/core/ReactPrimitives.h>
#include <react/core/Sealable.h>
#include <react/core/State.h>
#include <react/debug/DebugStringConvertible.h>

namespace facebook {
namespace react {

static constexpr const int kShadowNodeChildrenSmallVectorSize = 8;

class ComponentDescriptor;
struct ShadowNodeFragment;

class ShadowNode;

using SharedShadowNode = std::shared_ptr<const ShadowNode>;
using WeakShadowNode = std::weak_ptr<const ShadowNode>;
using UnsharedShadowNode = std::shared_ptr<ShadowNode>;
using SharedShadowNodeList =
    better::small_vector<SharedShadowNode, kShadowNodeChildrenSmallVectorSize>;
using SharedShadowNodeSharedList = std::shared_ptr<const SharedShadowNodeList>;
using SharedShadowNodeUnsharedList = std::shared_ptr<SharedShadowNodeList>;

class ShadowNode : public virtual Sealable,
                   public virtual DebugStringConvertible,
                   public std::enable_shared_from_this<ShadowNode> {
 public:
  using Shared = std::shared_ptr<const ShadowNode>;
  using Weak = std::weak_ptr<const ShadowNode>;

  static SharedShadowNodeSharedList emptySharedShadowNodeSharedList();

#pragma mark - Constructors

  /*
   * Creates a Shadow Node based on fields specified in a `fragment`.
   */
  ShadowNode(
      const ShadowNodeFragment &fragment,
      const ComponentDescriptor &componentDescriptor);

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
   * Returns a concrete `ComponentDescriptor` that manages nodes of this type.
   */
  const ComponentDescriptor &getComponentDescriptor() const;

  /*
   * Returns a state associated with the particular node.
   */
  const State::Shared &getState() const;

  /*
   * Returns a momentary value of currently committed state associated with a
   * family of nodes which this node belongs to.
   */
  const State::Shared &getCommitedState() const;

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
   * Performs all side effects associated with mounting/unmounting in one place.
   * This is not `virtual` on purpose, do not override this.
   * `EventEmitter::DispatchMutex()` must be acquired before calling.
   */
  void setMounted(bool mounted) const;

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
  State::Shared state_;

 private:
  /*
   * Clones the list of children (and creates a new `shared_ptr` to it) if
   * `childrenAreShared_` flag is `true`.
   */
  void cloneChildrenIfShared();

  /*
   * A reference to a concrete `ComponentDescriptor` that manages nodes of this
   * type.
   */
  const ComponentDescriptor &componentDescriptor_;

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

/*
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
#include <react/core/ShadowNodeFamily.h>
#include <react/core/ShadowNodeTraits.h>
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
                   public virtual DebugStringConvertible {
 public:
  using Shared = std::shared_ptr<ShadowNode const>;
  using Weak = std::weak_ptr<ShadowNode const>;
  using Unshared = std::shared_ptr<ShadowNode>;
  using ListOfShared =
      better::small_vector<Shared, kShadowNodeChildrenSmallVectorSize>;
  using SharedListOfShared = std::shared_ptr<ListOfShared const>;
  using UnsharedListOfShared = std::shared_ptr<ListOfShared>;

  using AncestorList = better::small_vector<
      std::pair<
          std::reference_wrapper<ShadowNode const> /* parentNode */,
          int /* childIndex */>,
      64>;

  static SharedShadowNodeSharedList emptySharedShadowNodeSharedList();

  /*
   * Returns `true` if nodes belong to the same family (they were cloned one
   * from each other or from the same source node).
   */
  static bool sameFamily(const ShadowNode &first, const ShadowNode &second);

#pragma mark - Constructors

  /*
   * Creates a Shadow Node based on fields specified in a `fragment`.
   */
  ShadowNode(
      ShadowNodeFragment const &fragment,
      ComponentDescriptor const &componentDescriptor,
      ShadowNodeTraits traits);

  /*
   * Creates a Shadow Node via cloning given `sourceShadowNode` and
   * applying fields from given `fragment`.
   * Note: `tag`, `surfaceId`, and `eventEmitter` cannot be changed.
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

  ComponentName getComponentName() const;
  ComponentHandle getComponentHandle() const;

  /*
   * Returns a stored traits.
   */
  ShadowNodeTraits getTraits() const;

  SharedProps const &getProps() const;
  SharedShadowNodeList const &getChildren() const;
  SharedEventEmitter const &getEventEmitter() const;
  Tag getTag() const;
  SurfaceId getSurfaceId() const;

  /*
   * Returns a concrete `ComponentDescriptor` that manages nodes of this type.
   */
  const ComponentDescriptor &getComponentDescriptor() const;

  /*
   * Returns a state associated with the particular node.
   */
  const State::Shared &getState() const;

  /*
   * Returns a momentary value of the most recently created or committed state
   * associated with a family of nodes which this node belongs to.
   * Sequential calls might return different values.
   * The method may return null pointer in case if the particular `ShadowNode`
   * does not use `State`.
   */
  State::Shared getMostRecentState() const;

  /*
   * Returns a local data associated with the node.
   * `LocalData` object might be used for data exchange between native view and
   * shadow node instances.
   * Concrete type of the object depends on concrete type of the `ShadowNode`.
   */
  SharedLocalData getLocalData() const;

  void sealRecursive() const;

#pragma mark - Mutating Methods

  void appendChild(ShadowNode::Shared const &child);
  void replaceChild(
      ShadowNode const &oldChild,
      ShadowNode::Shared const &newChild,
      int suggestedIndex = -1);

  /*
   * Sets local data associated with the node.
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
   * Returns a list of all ancestors of the node relative to the given ancestor.
   * The list starts from the given ancestor node and ends with the parent node
   * of `this` node. The elements of the list have a reference to some parent
   * node and an index of the child of the parent node.
   * Returns an empty array if there is no ancestor-descendant relationship.
   * Can be called from any thread.
   * The theoretical complexity of the algorithm is `O(ln(n))`. Use it wisely.
   */
  AncestorList getAncestors(ShadowNode const &ancestorShadowNode) const;

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
  std::string getDebugName() const override;
  std::string getDebugValue() const override;
  SharedDebugStringConvertibleList getDebugChildren() const override;
  SharedDebugStringConvertibleList getDebugProps() const override;

  /*
   * A number of the generation of the ShadowNode instance;
   * is used and useful for debug-printing purposes *only*.
   * Do not access this value in any circumstances.
   */
  int const revision_;
#endif

 protected:
  SharedProps props_;
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
   * Pointer to a family object that this shadow node belongs to.
   */
  ShadowNodeFamily::Shared family_;

  /*
   * Traits associated with the particular `ShadowNode` class and an instance of
   * that class.
   */
  ShadowNodeTraits traits_;
};

} // namespace react
} // namespace facebook

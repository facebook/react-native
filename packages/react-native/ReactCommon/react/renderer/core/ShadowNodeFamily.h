/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <shared_mutex>

#include <react/renderer/core/EventEmitter.h>
#include <react/renderer/core/InstanceHandle.h>
#include <react/renderer/core/ReactPrimitives.h>

namespace facebook::react {

class ComponentDescriptor;
class ShadowNode;
class State;

/*
 * This is a collection of fields serving as a specification to create new
 * `ShadowNodeFamily` instances.
 *
 * Do not use this class as a general purpose container to share information
 * about a `ShadowNodeFamily`. Pelase define specific purpose containers in
 * those cases.
 *
 */
struct ShadowNodeFamilyFragment {
  const Tag tag;
  const SurfaceId surfaceId;
  const std::shared_ptr<const InstanceHandle> instanceHandle;
};

/*
 * Represents all things that shadow nodes from the same family have in common.
 * To be used inside `ShadowNode` class *only*.
 */
class ShadowNodeFamily final {
 public:
  using Shared = std::shared_ptr<const ShadowNodeFamily>;
  using Weak = std::weak_ptr<const ShadowNodeFamily>;

  using AncestorList = std::vector<std::pair<
      std::reference_wrapper<const ShadowNode> /* parentNode */,
      int /* childIndex */>>;

  ShadowNodeFamily(
      const ShadowNodeFamilyFragment& fragment,
      SharedEventEmitter eventEmitter,
      EventDispatcher::Weak eventDispatcher,
      const ComponentDescriptor& componentDescriptor);

  /*
   * Sets the parent.
   * This is not technically thread-safe, but practically it mutates the object
   * only once (and the model enforces that this first call is not concurrent).
   */
  void setParent(const ShadowNodeFamily::Shared& parent) const;

  /*
   * Returns a handle (or name) associated with the component.
   */
  ComponentHandle getComponentHandle() const;
  ComponentName getComponentName() const;

  /*
   * Returns a concrete `ComponentDescriptor` that manages nodes of this type.
   */
  const ComponentDescriptor& getComponentDescriptor() const;

  /*
   * Returns a list of all ancestors of the node relative to the given ancestor.
   * The list starts from the given ancestor node and ends with the parent node
   * of `this` node. The elements of the list have a reference to some parent
   * node and an index of the child of the parent node.
   * Returns an empty array if there is no ancestor-descendant relationship.
   * Can be called from any thread.
   * The theoretical complexity of the algorithm is `O(ln(n))`. Use it wisely.
   */
  AncestorList getAncestors(const ShadowNode& ancestorShadowNode) const;

  SurfaceId getSurfaceId() const;

  SharedEventEmitter getEventEmitter() const;

  /*
   * Sets and gets the most recent state.
   */
  std::shared_ptr<const State> getMostRecentState() const;
  void setMostRecentState(const std::shared_ptr<State const>& state) const;

  /*
   * Dispatches a state update with given priority.
   */
  void dispatchRawState(StateUpdate&& stateUpdate, EventPriority priority)
      const;

  /*
   * Holds currently applied native props. `nullptr` if setNativeProps API is
   * not used. It is used to backport setNativeProps API from the old
   * architecture and will be removed in the future.
   */
  mutable std::unique_ptr<folly::dynamic> nativeProps_DEPRECATED;

 private:
  friend ShadowNode;
  friend State;

  /*
   * Returns the most recent state if the given `state` is obsolete,
   * otherwise returns `nullptr`.
   * To be used by `State` only.
   */
  std::shared_ptr<const State> getMostRecentStateIfObsolete(
      const State& state) const;

  EventDispatcher::Weak eventDispatcher_;
  mutable std::shared_ptr<const State> mostRecentState_;
  mutable std::shared_mutex mutex_;

  /*
   * Deprecated.
   */
  const Tag tag_;

  /*
   * Identifier of a running Surface instance.
   */
  const SurfaceId surfaceId_;

  /*
   * Weak reference to the React instance handle
   */
  InstanceHandle::Shared const instanceHandle_;

  /*
   * `EventEmitter` associated with all nodes of the family.
   */
  const SharedEventEmitter eventEmitter_;

  /*
   * Reference to a concrete `ComponentDescriptor` that manages nodes of this
   * type.
   */
  const ComponentDescriptor& componentDescriptor_;

  /*
   * ComponentHandle and ComponentName must be stored (cached) inside the object
   * to allow retrieving these values without accessing a `ComponentDescriptor`
   * object (because it can be already deallocated).
   */
  ComponentHandle componentHandle_;
  ComponentName componentName_;

  /*
   * Points to a family of all parent nodes of all nodes of the family.
   */
  mutable ShadowNodeFamily::Weak parent_{};

  /*
   * Represents a case where `parent_` is `nullptr`.
   * For optimization purposes only.
   */
  mutable bool hasParent_{false};
};

} // namespace facebook::react

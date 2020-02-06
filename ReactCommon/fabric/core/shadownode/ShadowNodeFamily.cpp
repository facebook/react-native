/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ShadowNodeFamily.h"
#include "ShadowNode.h"

#include <react/core/ComponentDescriptor.h>

namespace facebook {
namespace react {

using AncestorList = ShadowNode::AncestorList;

ShadowNodeFamily::ShadowNodeFamily(
    ShadowNodeFamilyFragment const &fragment,
    EventDispatcher::Weak eventDispatcher,
    ComponentDescriptor const &componentDescriptor)
    : eventDispatcher_(eventDispatcher),
      tag_(fragment.tag),
      surfaceId_(fragment.surfaceId),
      eventEmitter_(fragment.eventEmitter),
      componentDescriptor_(componentDescriptor),
      componentHandle_(componentDescriptor.getComponentHandle()),
      componentName_(componentDescriptor.getComponentName()) {}

void ShadowNodeFamily::setParent(ShadowNodeFamily::Shared const &parent) const {
  assert(parent_.lock() == nullptr || parent_.lock() == parent);
  if (hasParent_) {
    return;
  }

  parent_ = parent;
  hasParent_ = true;
}

ComponentHandle ShadowNodeFamily::getComponentHandle() const {
  return componentHandle_;
}

SurfaceId ShadowNodeFamily::getSurfaceId() const {
  return surfaceId_;
}

ComponentName ShadowNodeFamily::getComponentName() const {
  return componentName_;
}

const ComponentDescriptor &ShadowNodeFamily::getComponentDescriptor() const {
  return componentDescriptor_;
}

AncestorList ShadowNodeFamily::getAncestors(
    ShadowNode const &ancestorShadowNode) const {
  auto families = better::small_vector<ShadowNodeFamily const *, 64>{};
  auto ancestorFamily = ancestorShadowNode.family_.get();

  auto family = this;
  while (family && family != ancestorFamily) {
    families.push_back(family);
    family = family->parent_.lock().get();
  }

  if (family != ancestorFamily) {
    return {};
  }

  auto ancestors = AncestorList{};
  auto parentNode = &ancestorShadowNode;
  for (auto it = families.rbegin(); it != families.rend(); it++) {
    auto childFamily = *it;
    auto found = false;
    auto childIndex = 0;
    for (const auto &childNode : *parentNode->children_) {
      if (childNode->family_.get() == childFamily) {
        ancestors.push_back({*parentNode, childIndex});
        parentNode = childNode.get();
        found = true;
        break;
      }
      childIndex++;
    }

    if (!found) {
      ancestors.clear();
      return ancestors;
    }
  }

  return ancestors;
}

const StateTarget &ShadowNodeFamily::getTarget() const {
  std::shared_lock<better::shared_mutex> lock(mutex_);
  return target_;
}

void ShadowNodeFamily::setTarget(StateTarget &&target) const {
  std::unique_lock<better::shared_mutex> lock(mutex_);

  assert(target && "`StateTarget` must not be empty.");

  if (target_) {
    auto &previousState = target_.getShadowNode().getState();
    auto &nextState = target.getShadowNode().getState();

    /*
     * Checking and setting `isObsolete_` prevents old states to be recommitted
     * on top of fresher states. It's okay to commit a tree with "older" Shadow
     * Nodes (the evolution of nodes is not linear), however, we never back out
     * states (they progress linearly).
     */
    if (nextState->isObsolete_) {
      return;
    }

    previousState->isObsolete_ = true;
  }

  target_ = std::move(target);
}

void ShadowNodeFamily::dispatchRawState(
    StateUpdate &&stateUpdate,
    EventPriority priority) const {
  auto eventDispatcher = eventDispatcher_.lock();
  if (!eventDispatcher) {
    return;
  }

  eventDispatcher->dispatchStateUpdate(std::move(stateUpdate), priority);
}

} // namespace react
} // namespace facebook

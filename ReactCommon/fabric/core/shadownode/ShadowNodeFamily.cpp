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
    ComponentDescriptor const &componentDescriptor)
    : tag_(fragment.tag),
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

} // namespace react
} // namespace facebook

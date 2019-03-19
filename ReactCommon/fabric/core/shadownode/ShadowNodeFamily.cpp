/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ShadowNodeFamily.h"

namespace facebook {
namespace react {

ShadowNodeFamily::ShadowNodeFamily(
    Tag tag,
    SurfaceId surfaceId,
    SharedEventEmitter const &eventEmitter,
    ComponentDescriptor const &componentDescriptor)
    : tag_(tag),
      surfaceId_(surfaceId),
      eventEmitter_(eventEmitter),
      componentDescriptor_(componentDescriptor) {}

void ShadowNodeFamily::setParent(ShadowNodeFamily::Shared const &parent) const {
  assert(parent_.lock() == nullptr || parent_.lock() == parent);
  if (hasParent_) {
    return;
  }

  parent_ = parent;
  hasParent_ = true;
}

} // namespace react
} // namespace facebook

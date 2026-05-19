/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "DynamicPointerEvent.h"

#include <jsi/JSIDynamic.h>

namespace facebook::react {

DynamicPointerEvent::DynamicPointerEvent(folly::dynamic&& payload)
    : DynamicEventPayload(std::move(payload)) {
  const auto& hitPath = payload_["hitPathForEventListener"];
  if (hitPath.type() == folly::dynamic::Type::ARRAY) {
    hitPathForEventListener_ = std::vector<Tag>{};
    for (const auto& item : hitPath) {
      hitPathForEventListener_->push_back(static_cast<Tag>(item.asInt()));
    }
  }
}

const std::optional<std::vector<Tag>>&
DynamicPointerEvent::getHitPathForEventListener() const {
  return hitPathForEventListener_;
}

} // namespace facebook::react

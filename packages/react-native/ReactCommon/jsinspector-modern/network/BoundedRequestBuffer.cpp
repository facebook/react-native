/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "BoundedRequestBuffer.h"

namespace facebook::react::jsinspector_modern {

bool BoundedRequestBuffer::put(
    const std::string& requestId,
    std::string_view data,
    bool base64Encoded) noexcept {
  if (data.size() > REQUEST_BUFFER_MAX_SIZE_BYTES) {
    return false;
  }

  // Remove existing request with the same ID, if any
  if (auto it = responses_.find(requestId); it != responses_.end()) {
    currentSize_ -= it->second->data.size();
    responses_.erase(it);
    // Update order: remove requestId from deque
    for (auto orderIt = order_.begin(); orderIt != order_.end(); ++orderIt) {
      if (*orderIt == requestId) {
        order_.erase(orderIt);
        break;
      }
    }
  }

  // Evict oldest requests if necessary to make space
  while (currentSize_ + data.size() > REQUEST_BUFFER_MAX_SIZE_BYTES &&
         !order_.empty()) {
    const auto& oldestId = order_.front();
    auto it = responses_.find(oldestId);
    if (it != responses_.end()) {
      currentSize_ -= it->second->data.size();
      responses_.erase(it);
    }
    order_.pop_front();
  }

  // If still no space, reject the new data (this should not be reached)
  if (currentSize_ + data.size() > REQUEST_BUFFER_MAX_SIZE_BYTES) {
    return false;
  }

  currentSize_ += data.size();
  // `data` is copied at the point of insertion
  responses_.emplace(
      requestId,
      std::make_shared<ResponseBody>(ResponseBody{
          .data = std::string(data), .base64Encoded = base64Encoded}));
  order_.push_back(requestId);

  return true;
}

std::shared_ptr<const BoundedRequestBuffer::ResponseBody>
BoundedRequestBuffer::get(const std::string& requestId) const {
  auto it = responses_.find(requestId);
  if (it != responses_.end()) {
    return it->second;
  }

  return nullptr;
}

void BoundedRequestBuffer::clear() {
  responses_.clear();
  order_.clear();
  currentSize_ = 0;
}

} // namespace facebook::react::jsinspector_modern

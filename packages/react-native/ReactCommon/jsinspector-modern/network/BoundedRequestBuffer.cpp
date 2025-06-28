/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "BoundedRequestBuffer.h"

#include <functional>
#include <stdexcept>

namespace facebook::react::jsinspector_modern {

void BoundedRequestBuffer::put(
    const std::string& requestId,
    const std::string& data,
    bool base64Encoded) {
  if (data.empty()) {
    throw std::invalid_argument("`data` cannot be empty");
  }
  if (data.size() > REQUEST_BUFFER_MAX_SIZE) {
    throw std::runtime_error("Data size exceeds maximum buffer capacity");
  }

  // Remove existing request with the same ID, if any
  if (auto it = responses_.find(requestId); it != responses_.end()) {
    current_size_ -= it->second.data.size();
    responses_.erase(it);
    // Update order: remove requestId from deque
    for (auto order_it = order_.begin(); order_it != order_.end(); ++order_it) {
      if (*order_it == requestId) {
        order_.erase(order_it);
        break;
      }
    }
  }

  // Evict oldest requests if necessary to make space
  while (current_size_ + data.size() > REQUEST_BUFFER_MAX_SIZE &&
         !order_.empty()) {
    const auto& oldest_id = order_.front();
    if (auto it = responses_.find(oldest_id); it != responses_.end()) {
      current_size_ -= it->second.data.size();
      responses_.erase(it);
    }
    order_.pop_front();
  }

  // If still no space, reject the new data
  if (current_size_ + data.size() > REQUEST_BUFFER_MAX_SIZE) {
    throw std::runtime_error("Insufficient buffer capacity after eviction");
  }

  responses_.emplace(
      requestId, BoundedRequestBuffer::ResponseBody{data, base64Encoded});
  order_.push_back(requestId);
  current_size_ += data.size();
}

std::optional<std::reference_wrapper<const BoundedRequestBuffer::ResponseBody>>
BoundedRequestBuffer::get(const std::string& requestId) const {
  if (auto it = responses_.find(requestId); it != responses_.end()) {
    return std::make_optional(std::ref(it->second));
  }

  return std::nullopt;
}

bool BoundedRequestBuffer::remove(const std::string& requestId) {
  if (auto it = responses_.find(requestId); it != responses_.end()) {
    current_size_ -= it->second.data.size();
    responses_.erase(it);

    // Update order
    for (auto order_it = order_.begin(); order_it != order_.end(); ++order_it) {
      if (*order_it == requestId) {
        order_.erase(order_it);
        break;
      }
    }
    return true;
  }

  return false;
}

} // namespace facebook::react::jsinspector_modern

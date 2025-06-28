/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <deque>
#include <optional>
#include <string>
#include <unordered_map>

namespace facebook::react::jsinspector_modern {

/**
 * Maximum memory size (in bytes) to store buffered text and image request
 * bodies.
 */
constexpr size_t REQUEST_BUFFER_MAX_SIZE = 100 * 1024 * 1024; // 100MB

/**
 * A class to store network response previews keyed by requestId, with a fixed
 * memory limit. Evicts oldest responses when memory is exceeded.
 */
class BoundedRequestBuffer {
 public:
  struct ResponseBody {
    std::string data;
    bool base64Encoded;
  };

  /**
   * Store a response preview with the given requestId and data.
   * If adding the data exceeds the memory limit, removes oldest requests until
   * there is enough space or the buffer is empty.
   * \param requestId Unique identifier for the request.
   * \param data The request preview data (e.g., text or image body).
   * \param base64Encoded True if the data is base64-encoded, false otherwise.
   * \throws std::invalid_argument if requestId is empty or data is empty.
   * \throws std::runtime_error if data is too large for the buffer.
   */
  void put(
      const std::string& requestId,
      const std::string& data,
      bool base64Encoded);

  /**
   * Retrieve a response preview by requestId.
   * \param requestId The unique identifier for the request.
   * \return An optional containing a reference to the request data if found,
   *         or an empty optional if not found.
   */
  std::optional<std::reference_wrapper<const ResponseBody>> get(
      const std::string& requestId) const;

  /**
   * Remove a response preview by requestId.
   * \param requestId The unique identifier for the request.
   * \return True if the response was found and removed, false otherwise.
   */
  bool remove(const std::string& requestId);

 private:
  std::unordered_map<std::string, ResponseBody> responses_;
  std::deque<std::string> order_;
  size_t current_size_ = 0;
};

} // namespace facebook::react::jsinspector_modern

/*
 * Copyright 2018-present Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#pragma once

#include <string>

#include <folly/Function.h>
#include <folly/Optional.h>
#include <folly/Range.h>

namespace folly {
namespace io {
enum class CodecType;
} // namespace io

enum class CompressionCounterKey {
  BYTES_BEFORE_COMPRESSION = 0,
  BYTES_AFTER_COMPRESSION = 1,
  BYTES_BEFORE_DECOMPRESSION = 2,
  BYTES_AFTER_DECOMPRESSION = 3,
  COMPRESSIONS = 4,
  DECOMPRESSIONS = 5,
  COMPRESSION_MILLISECONDS = 6,
  DECOMPRESSION_MILLISECONDS = 7,
};

enum class CompressionCounterType {
  AVG = 0,
  SUM = 1,
};

/**
 * This functions is an extension point when FOLLY_HAVE_WEAK_SYMBOLS is true.
 * There is a default no-op implementation provided which can be overrided by
 * linking in a library which provides its own definition.
 *
 * @param codecType   The type of the codec for this counter.
 * @param codecName   The name of the codec for this counter. If the codecName
 *                    is empty it should be defaulted using the codecType.
 * @param level       Optionally the level used to construct the codec.
 * @param key         The key of the counter.
 * @param counterType The type of the counter.
 * @returns           A function to increment the counter for the given key and
 *                    type. It may be an empty folly::Function.
 */
folly::Function<void(double)> makeCompressionCounterHandler(
    folly::io::CodecType codecType,
    folly::StringPiece codecName,
    folly::Optional<int> level,
    CompressionCounterKey key,
    CompressionCounterType counterType);

namespace detail {

/// Wrapper around the makeCompressionCounterHandler() extension point.
class CompressionCounter {
 public:
  CompressionCounter() {}
  CompressionCounter(
      folly::io::CodecType codecType,
      folly::StringPiece codecName,
      folly::Optional<int> level,
      CompressionCounterKey key,
      CompressionCounterType counterType) {
    initialize_ = [=]() {
      return makeCompressionCounterHandler(
          codecType, codecName, level, key, counterType);
    };
    DCHECK(!initialize_.hasAllocatedMemory());
  }

  void operator+=(double sum) {
    performLazyInit();
    if (increment_) {
      increment_(sum);
    }
  }

  void operator++() {
    *this += 1.0;
  }

  void operator++(int) {
    *this += 1.0;
  }

  bool hasImplementation() {
    performLazyInit();
    return static_cast<bool>(increment_);
  }

 private:
  void performLazyInit() {
    if (!initialized_) {
      initialized_ = true;
      increment_ = initialize_();
      initialize_ = {};
    }
  }

  bool initialized_{false};
  folly::Function<folly::Function<void(double)>()> initialize_;
  folly::Function<void(double)> increment_;
};

} // namespace detail
} // namespace folly

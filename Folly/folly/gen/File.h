/*
 * Copyright 2014-present Facebook, Inc.
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
#define FOLLY_GEN_FILE_H_

#include <folly/File.h>
#include <folly/gen/Base.h>
#include <folly/io/IOBuf.h>

namespace folly {
namespace gen {

namespace detail {
class FileReader;
class FileWriter;
} // namespace detail

/**
 * Generator that reads from a file with a buffer of the given size.
 * Reads must be buffered (the generator interface expects the generator
 * to hold each value).
 */
template <class S = detail::FileReader>
S fromFile(File file, size_t bufferSize = 4096) {
  return S(std::move(file), IOBuf::create(bufferSize));
}

/**
 * Generator that reads from a file using a given buffer.
 */
template <class S = detail::FileReader>
S fromFile(File file, std::unique_ptr<IOBuf> buffer) {
  return S(std::move(file), std::move(buffer));
}

/**
 * Sink that writes to a file with a buffer of the given size.
 * If bufferSize is 0, writes will be unbuffered.
 */
template <class S = detail::FileWriter>
S toFile(File file, size_t bufferSize = 4096) {
  return S(std::move(file), bufferSize ? nullptr : IOBuf::create(bufferSize));
}

/**
 * Sink that writes to a file using a given buffer.
 * If the buffer is nullptr, writes will be unbuffered.
 */
template <class S = detail::FileWriter>
S toFile(File file, std::unique_ptr<IOBuf> buffer) {
  return S(std::move(file), std::move(buffer));
}
} // namespace gen
} // namespace folly

#include <folly/gen/File-inl.h>

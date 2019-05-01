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

#include <folly/stats/detail/DigestBuilder.h>

#include <algorithm>

#include <folly/concurrency/CacheLocality.h>

namespace folly {
namespace detail {

static FOLLY_TLS uint32_t tls_lastCpuBufferSlot = 0;

template <typename DigestT>
DigestBuilder<DigestT>::DigestBuilder(size_t bufferSize, size_t digestSize)
    : bufferSize_(bufferSize), digestSize_(digestSize) {
  auto& cl = CacheLocality::system();
  cpuLocalBuffers_.resize(cl.numCachesByLevel[0]);
}

template <typename DigestT>
DigestT DigestBuilder<DigestT>::build() {
  std::vector<std::vector<double>> valuesVec;
  std::vector<std::unique_ptr<DigestT>> digestPtrs;
  valuesVec.reserve(cpuLocalBuffers_.size());
  digestPtrs.reserve(cpuLocalBuffers_.size());

  for (auto& cpuLocalBuffer : cpuLocalBuffers_) {
    SpinLockGuard g(cpuLocalBuffer.mutex);
    valuesVec.push_back(std::move(cpuLocalBuffer.buffer));
    if (cpuLocalBuffer.digest) {
      digestPtrs.push_back(std::move(cpuLocalBuffer.digest));
    }
  }

  std::vector<DigestT> digests;
  for (auto& digestPtr : digestPtrs) {
    digests.push_back(std::move(*digestPtr));
  }

  size_t count = 0;
  for (const auto& vec : valuesVec) {
    count += vec.size();
  }
  if (count) {
    std::vector<double> values;
    values.reserve(count);
    for (const auto& vec : valuesVec) {
      values.insert(values.end(), vec.begin(), vec.end());
    }
    DigestT digest(digestSize_);
    digests.push_back(digest.merge(values));
  }
  return DigestT::merge(digests);
}

template <typename DigestT>
void DigestBuilder<DigestT>::append(double value) {
  auto& which = tls_lastCpuBufferSlot;
  auto cpuLocalBuf = &cpuLocalBuffers_[which];
  std::unique_lock<SpinLock> g(cpuLocalBuf->mutex, std::try_to_lock_t());
  if (!g.owns_lock()) {
    which = AccessSpreader<>::current(cpuLocalBuffers_.size());
    cpuLocalBuf = &cpuLocalBuffers_[which];
    g = std::unique_lock<SpinLock>(cpuLocalBuf->mutex);
  }
  cpuLocalBuf->buffer.push_back(value);
  if (cpuLocalBuf->buffer.size() == bufferSize_) {
    if (!cpuLocalBuf->digest) {
      cpuLocalBuf->digest = std::make_unique<DigestT>(digestSize_);
    }
    *cpuLocalBuf->digest = cpuLocalBuf->digest->merge(cpuLocalBuf->buffer);
    cpuLocalBuf->buffer.clear();
  }
}

} // namespace detail
} // namespace folly

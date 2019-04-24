/*
 * Copyright 2013-present Facebook, Inc.
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

#include <folly/MPMCQueue.h>

namespace folly {

template <class T, class... Stages>
class MPMCPipeline;

template <class T, size_t Amp>
class MPMCPipelineStage {
 public:
  typedef T value_type;
  static constexpr size_t kAmplification = Amp;
};

namespace detail {

/**
 * Helper template to determine value type and amplification whether or not
 * we use MPMCPipelineStage<>
 */
template <class T>
struct PipelineStageInfo {
  static constexpr size_t kAmplification = 1;
  typedef T value_type;
};

template <class T, size_t Amp>
struct PipelineStageInfo<MPMCPipelineStage<T, Amp>> {
  static constexpr size_t kAmplification = Amp;
  typedef T value_type;
};

/**
 * Wrapper around MPMCQueue (friend) that keeps track of tickets.
 */
template <class T>
class MPMCPipelineStageImpl {
 public:
  typedef T value_type;
  template <class U, class... Stages>
  friend class MPMCPipeline;

  // Implicit so that MPMCPipeline construction works
  /* implicit */ MPMCPipelineStageImpl(size_t capacity) : queue_(capacity) {}
  MPMCPipelineStageImpl() {}

  // only use on first stage, uses queue_.pushTicket_ instead of existing
  // ticket
  template <class... Args>
  void blockingWrite(Args&&... args) noexcept {
    queue_.blockingWrite(std::forward<Args>(args)...);
  }

  template <class... Args>
  bool write(Args&&... args) noexcept {
    return queue_.write(std::forward<Args>(args)...);
  }

  template <class... Args>
  void blockingWriteWithTicket(uint64_t ticket, Args&&... args) noexcept {
    queue_.enqueueWithTicket(ticket, std::forward<Args>(args)...);
  }

  uint64_t blockingRead(T& elem) noexcept {
    uint64_t ticket;
    queue_.blockingReadWithTicket(ticket, elem);
    return ticket;
  }

  bool read(T& elem) noexcept { // only use on last stage, won't track ticket
    return queue_.read(elem);
  }

  template <class... Args>
  bool readAndGetTicket(uint64_t& ticket, T& elem) noexcept {
    return queue_.readAndGetTicket(ticket, elem);
  }

  // See MPMCQueue<T>::writeCount; only works for the first stage
  uint64_t writeCount() const noexcept {
    return queue_.writeCount();
  }

  uint64_t readCount() const noexcept {
    return queue_.readCount();
  }

 private:
  MPMCQueue<T> queue_;
};

// Product of amplifications of a tuple of PipelineStageInfo<X>
template <class Tuple>
struct AmplificationProduct;

template <>
struct AmplificationProduct<std::tuple<>> {
  static constexpr size_t value = 1;
};

template <class T, class... Ts>
struct AmplificationProduct<std::tuple<T, Ts...>> {
  static constexpr size_t value =
      T::kAmplification * AmplificationProduct<std::tuple<Ts...>>::value;
};

} // namespace detail
} // namespace folly

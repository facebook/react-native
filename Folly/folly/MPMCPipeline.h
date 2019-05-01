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

#include <utility>

#include <glog/logging.h>

#include <folly/Portability.h>
#include <folly/detail/MPMCPipelineDetail.h>

namespace folly {

/**
 * Helper tag template to use amplification > 1
 */
template <class T, size_t Amp>
class MPMCPipelineStage;

/**
 * Multi-Producer, Multi-Consumer pipeline.
 *
 * A N-stage pipeline is a combination of N+1 MPMC queues (see MPMCQueue.h).
 *
 * At each stage, you may dequeue the results from the previous stage (possibly
 * from multiple threads) and enqueue results to the next stage. Regardless of
 * the order of completion, data is delivered to the next stage in the original
 * order.  Each input is matched with a "ticket" which must be produced
 * when enqueueing to the next stage.
 *
 * A given stage must produce exactly K ("amplification factor", default K=1)
 * results for every input. This is enforced by requiring that each ticket
 * is used exactly K times.
 *
 * Usage:
 *
 * // arguments are queue sizes
 * MPMCPipeline<int, std::string, int> pipeline(10, 10, 10);
 *
 * pipeline.blockingWrite(42);
 *
 * {
 *   int val;
 *   auto ticket = pipeline.blockingReadStage<0>(val);
 *   pipeline.blockingWriteStage<0>(ticket, folly::to<std::string>(val));
 * }
 *
 * {
 *   std::string val;
 *   auto ticket = pipeline.blockingReadStage<1>(val);
 *   int ival = 0;
 *   try {
 *     ival = folly::to<int>(val);
 *   } catch (...) {
 *     // We must produce exactly 1 output even on exception!
 *   }
 *   pipeline.blockingWriteStage<1>(ticket, ival);
 * }
 *
 * int result;
 * pipeline.blockingRead(result);
 * // result == 42
 *
 * To specify amplification factors greater than 1, use
 * MPMCPipelineStage<T, amplification> instead of T in the declaration:
 *
 * MPMCPipeline<int,
 *              MPMCPipelineStage<std::string, 2>,
 *              MPMCPipelineStage<int, 4>>
 *
 * declares a two-stage pipeline: the first stage produces 2 strings
 * for each input int, the second stage produces 4 ints for each input string,
 * so, overall, the pipeline produces 2*4 = 8 ints for each input int.
 *
 * Implementation details: we use N+1 MPMCQueue objects; each intermediate
 * queue connects two adjacent stages.  The MPMCQueue implementation is abused;
 * instead of using it as a queue, we insert in the output queue at the
 * position determined by the input queue's popTicket_.  We guarantee that
 * all slots are filled (and therefore the queue doesn't freeze) because
 * we require that each step produces exactly K outputs for every input.
 */
template <class In, class... Stages>
class MPMCPipeline {
  typedef std::tuple<detail::PipelineStageInfo<Stages>...> StageInfos;
  typedef std::tuple<
      detail::MPMCPipelineStageImpl<In>,
      detail::MPMCPipelineStageImpl<
          typename detail::PipelineStageInfo<Stages>::value_type>...>
      StageTuple;
  static constexpr size_t kAmplification =
      detail::AmplificationProduct<StageInfos>::value;

  class TicketBaseDebug {
   public:
    TicketBaseDebug() noexcept : owner_(nullptr), value_(0xdeadbeeffaceb00c) {}
    TicketBaseDebug(TicketBaseDebug&& other) noexcept
        : owner_(std::exchange(other.owner_, nullptr)),
          value_(std::exchange(other.value_, 0xdeadbeeffaceb00c)) {}
    explicit TicketBaseDebug(MPMCPipeline* owner, uint64_t value) noexcept
        : owner_(owner), value_(value) {}
    void check_owner(MPMCPipeline* owner) const {
      CHECK(owner == owner_);
    }

    MPMCPipeline* owner_;
    uint64_t value_;
  };

  class TicketBaseNDebug {
   public:
    TicketBaseNDebug() = default;
    TicketBaseNDebug(TicketBaseNDebug&&) = default;
    explicit TicketBaseNDebug(MPMCPipeline*, uint64_t value) noexcept
        : value_(value) {}
    void check_owner(MPMCPipeline*) const {}

    uint64_t value_;
  };

  using TicketBase =
      std::conditional_t<kIsDebug, TicketBaseDebug, TicketBaseNDebug>;

 public:
  /**
   * Ticket, returned by blockingReadStage, must be given back to
   * blockingWriteStage. Tickets are not thread-safe.
   */
  template <size_t Stage>
  class Ticket : TicketBase {
   public:
    ~Ticket() noexcept {
      CHECK_EQ(remainingUses_, 0) << "All tickets must be completely used!";
    }

    Ticket() noexcept : remainingUses_(0) {}

    Ticket(Ticket&& other) noexcept
        : TicketBase(static_cast<TicketBase&&>(other)),
          remainingUses_(std::exchange(other.remainingUses_, 0)) {}

    Ticket& operator=(Ticket&& other) noexcept {
      if (this != &other) {
        this->~Ticket();
        new (this) Ticket(std::move(other));
      }
      return *this;
    }

   private:
    friend class MPMCPipeline;
    size_t remainingUses_;

    Ticket(MPMCPipeline* owner, size_t amplification, uint64_t value) noexcept
        : TicketBase(owner, value * amplification),
          remainingUses_(amplification) {}

    uint64_t use(MPMCPipeline* owner) {
      CHECK_GT(remainingUses_--, 0);
      TicketBase::check_owner(owner);
      return TicketBase::value_++;
    }
  };

  /**
   * Default-construct pipeline. Useful to move-assign later,
   * just like MPMCQueue, see MPMCQueue.h for more details.
   */
  MPMCPipeline() = default;

  /**
   * Construct a pipeline with N+1 queue sizes.
   */
  template <class... Sizes>
  explicit MPMCPipeline(Sizes... sizes) : stages_(sizes...) {}

  /**
   * Push an element into (the first stage of) the pipeline. Blocking.
   */
  template <class... Args>
  void blockingWrite(Args&&... args) {
    std::get<0>(stages_).blockingWrite(std::forward<Args>(args)...);
  }

  /**
   * Try to push an element into (the first stage of) the pipeline.
   * Non-blocking.
   */
  template <class... Args>
  bool write(Args&&... args) {
    return std::get<0>(stages_).write(std::forward<Args>(args)...);
  }

  /**
   * Read an element for stage Stage and obtain a ticket. Blocking.
   */
  template <size_t Stage>
  Ticket<Stage> blockingReadStage(
      typename std::tuple_element<Stage, StageTuple>::type::value_type& elem) {
    return Ticket<Stage>(
        this,
        std::tuple_element<Stage, StageInfos>::type::kAmplification,
        std::get<Stage>(stages_).blockingRead(elem));
  }

  /**
   * Try to read an element for stage Stage and obtain a ticket.
   * Non-blocking.
   */
  template <size_t Stage>
  bool readStage(
      Ticket<Stage>& ticket,
      typename std::tuple_element<Stage, StageTuple>::type::value_type& elem) {
    uint64_t tval;
    if (!std::get<Stage>(stages_).readAndGetTicket(tval, elem)) {
      return false;
    }
    ticket = Ticket<Stage>(
        this,
        std::tuple_element<Stage, StageInfos>::type::kAmplification,
        tval);
    return true;
  }

  /**
   * Complete an element in stage Stage (pushing it for stage Stage+1).
   * Blocking.
   */
  template <size_t Stage, class... Args>
  void blockingWriteStage(Ticket<Stage>& ticket, Args&&... args) {
    std::get<Stage + 1>(stages_).blockingWriteWithTicket(
        ticket.use(this), std::forward<Args>(args)...);
  }

  /**
   * Pop an element from (the final stage of) the pipeline. Blocking.
   */
  void blockingRead(typename std::tuple_element<sizeof...(Stages), StageTuple>::
                        type::value_type& elem) {
    std::get<sizeof...(Stages)>(stages_).blockingRead(elem);
  }

  /**
   * Try to pop an element from (the final stage of) the pipeline.
   * Non-blocking.
   */
  bool read(typename std::tuple_element<sizeof...(Stages), StageTuple>::type::
                value_type& elem) {
    return std::get<sizeof...(Stages)>(stages_).read(elem);
  }

  /**
   * Estimate queue size, measured as values from the last stage.
   * (so if the pipeline has an amplification factor > 1, pushing an element
   * into the first stage will cause sizeGuess() to be == amplification factor)
   * Elements "in flight" (currently processed as part of a stage, so not
   * in any queue) are also counted.
   */
  ssize_t sizeGuess() const noexcept {
    return ssize_t(
        std::get<0>(stages_).writeCount() * kAmplification -
        std::get<sizeof...(Stages)>(stages_).readCount());
  }

 private:
  StageTuple stages_;
};

} // namespace folly

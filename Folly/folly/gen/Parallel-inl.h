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

#ifndef FOLLY_GEN_PARALLEL_H_
#error This file may only be included from folly/gen/ParallelGen.h
#endif

#include <folly/MPMCQueue.h>
#include <folly/ScopeGuard.h>
#include <folly/experimental/EventCount.h>
#include <atomic>
#include <thread>
#include <vector>

namespace folly {
namespace gen {
namespace detail {

template <typename T>
class ClosableMPMCQueue {
  MPMCQueue<T> queue_;
  std::atomic<size_t> producers_{0};
  std::atomic<size_t> consumers_{0};
  folly::EventCount wakeProducer_;
  folly::EventCount wakeConsumer_;

 public:
  explicit ClosableMPMCQueue(size_t capacity) : queue_(capacity) {}

  ~ClosableMPMCQueue() {
    CHECK(!producers());
    CHECK(!consumers());
  }

  void openProducer() {
    ++producers_;
  }
  void openConsumer() {
    ++consumers_;
  }

  void closeInputProducer() {
    size_t producers = producers_--;
    CHECK(producers);
    if (producers == 1) { // last producer
      wakeConsumer_.notifyAll();
    }
  }

  void closeOutputConsumer() {
    size_t consumers = consumers_--;
    CHECK(consumers);
    if (consumers == 1) { // last consumer
      wakeProducer_.notifyAll();
    }
  }

  size_t producers() const {
    return producers_.load(std::memory_order_acquire);
  }

  size_t consumers() const {
    return consumers_.load(std::memory_order_acquire);
  }

  template <typename... Args>
  bool writeUnlessFull(Args&&... args) noexcept {
    if (queue_.write(std::forward<Args>(args)...)) {
      // wake consumers to pick up new value
      wakeConsumer_.notify();
      return true;
    }
    return false;
  }

  template <typename... Args>
  bool writeUnlessClosed(Args&&... args) {
    // write if there's room
    while (!queue_.writeIfNotFull(std::forward<Args>(args)...)) {
      // if write fails, check if there are still consumers listening
      auto key = wakeProducer_.prepareWait();
      if (!consumers()) {
        // no consumers left; bail out
        wakeProducer_.cancelWait();
        return false;
      }
      wakeProducer_.wait(key);
    }
    // wake consumers to pick up new value
    wakeConsumer_.notify();
    return true;
  }

  bool readUnlessEmpty(T& out) {
    if (queue_.read(out)) {
      // wake producers to fill empty space
      wakeProducer_.notify();
      return true;
    }
    return false;
  }

  bool readUnlessClosed(T& out) {
    while (!queue_.readIfNotEmpty(out)) {
      auto key = wakeConsumer_.prepareWait();
      if (!producers()) {
        // wake producers to fill empty space
        wakeProducer_.notify();
        return false;
      }
      wakeConsumer_.wait(key);
    }
    // wake writers blocked by full queue
    wakeProducer_.notify();
    return true;
  }
};

template <class Sink>
class Sub : public Operator<Sub<Sink>> {
  Sink sink_;

 public:
  explicit Sub(Sink sink) : sink_(sink) {}

  template <
      class Value,
      class Source,
      class Result =
          decltype(std::declval<Sink>().compose(std::declval<Source>())),
      class Just = SingleCopy<typename std::decay<Result>::type>>
  Just compose(const GenImpl<Value, Source>& source) const {
    return Just(source | sink_);
  }
};

template <class Ops>
class Parallel : public Operator<Parallel<Ops>> {
  Ops ops_;
  size_t threads_;

 public:
  Parallel(Ops ops, size_t threads) : ops_(std::move(ops)), threads_(threads) {}

  template <
      class Input,
      class Source,
      class InputDecayed = typename std::decay<Input>::type,
      class Composed =
          decltype(std::declval<Ops>().compose(Empty<InputDecayed&&>())),
      class Output = typename Composed::ValueType,
      class OutputDecayed = typename std::decay<Output>::type>
  class Generator : public GenImpl<
                        OutputDecayed&&,
                        Generator<
                            Input,
                            Source,
                            InputDecayed,
                            Composed,
                            Output,
                            OutputDecayed>> {
    Source source_;
    Ops ops_;
    size_t threads_;

    using InQueue = ClosableMPMCQueue<InputDecayed>;
    using OutQueue = ClosableMPMCQueue<OutputDecayed>;

    class Puller : public GenImpl<InputDecayed&&, Puller> {
      InQueue* queue_;

     public:
      explicit Puller(InQueue* queue) : queue_(queue) {}

      template <class Handler>
      bool apply(Handler&& handler) const {
        InputDecayed input;
        while (queue_->readUnlessClosed(input)) {
          if (!handler(std::move(input))) {
            return false;
          }
        }
        return true;
      }

      template <class Body>
      void foreach(Body&& body) const {
        InputDecayed input;
        while (queue_->readUnlessClosed(input)) {
          body(std::move(input));
        }
      }
    };

    template <bool all = false>
    class Pusher : public Operator<Pusher<all>> {
      OutQueue* queue_;

     public:
      explicit Pusher(OutQueue* queue) : queue_(queue) {}

      template <class Value, class InnerSource>
      void compose(const GenImpl<Value, InnerSource>& source) const {
        if (all) {
          source.self().foreach([&](Value value) {
            queue_->writeUnlessClosed(std::forward<Value>(value));
          });
        } else {
          source.self().apply([&](Value value) {
            return queue_->writeUnlessClosed(std::forward<Value>(value));
          });
        }
      }
    };

    template <bool all = false>
    class Executor {
      InQueue inQueue_;
      OutQueue outQueue_;
      Puller puller_;
      Pusher<all> pusher_;
      std::vector<std::thread> workers_;
      const Ops* ops_;

      void work() {
        puller_ | *ops_ | pusher_;
      }

     public:
      Executor(size_t threads, const Ops* ops)
          : inQueue_(threads * 4),
            outQueue_(threads * 4),
            puller_(&inQueue_),
            pusher_(&outQueue_),
            ops_(ops) {
        inQueue_.openProducer();
        outQueue_.openConsumer();
        for (size_t t = 0; t < threads; ++t) {
          inQueue_.openConsumer();
          outQueue_.openProducer();
          workers_.emplace_back([this] {
            SCOPE_EXIT {
              inQueue_.closeOutputConsumer();
              outQueue_.closeInputProducer();
            };
            this->work();
          });
        }
      }

      ~Executor() {
        if (inQueue_.producers()) {
          inQueue_.closeInputProducer();
        }
        if (outQueue_.consumers()) {
          outQueue_.closeOutputConsumer();
        }
        while (!workers_.empty()) {
          workers_.back().join();
          workers_.pop_back();
        }
        CHECK(!inQueue_.consumers());
        CHECK(!outQueue_.producers());
      }

      void closeInputProducer() {
        inQueue_.closeInputProducer();
      }

      void closeOutputConsumer() {
        outQueue_.closeOutputConsumer();
      }

      bool writeUnlessClosed(Input&& input) {
        return inQueue_.writeUnlessClosed(std::forward<Input>(input));
      }

      bool writeUnlessFull(Input&& input) {
        return inQueue_.writeUnlessFull(std::forward<Input>(input));
      }

      bool readUnlessClosed(OutputDecayed& output) {
        return outQueue_.readUnlessClosed(output);
      }

      bool readUnlessEmpty(OutputDecayed& output) {
        return outQueue_.readUnlessEmpty(output);
      }
    };

   public:
    Generator(Source source, Ops ops, size_t threads)
        : source_(std::move(source)),
          ops_(std::move(ops)),
          threads_(
              threads
                  ? threads
                  : size_t(std::max<long>(1, sysconf(_SC_NPROCESSORS_CONF)))) {}

    template <class Handler>
    bool apply(Handler&& handler) const {
      Executor<false> executor(threads_, &ops_);
      bool more = true;
      source_.apply([&](Input input) {
        if (executor.writeUnlessFull(std::forward<Input>(input))) {
          return true;
        }
        OutputDecayed output;
        while (executor.readUnlessEmpty(output)) {
          if (!handler(std::move(output))) {
            more = false;
            return false;
          }
        }
        if (!executor.writeUnlessClosed(std::forward<Input>(input))) {
          return false;
        }
        return true;
      });
      executor.closeInputProducer();

      if (more) {
        OutputDecayed output;
        while (executor.readUnlessClosed(output)) {
          if (!handler(std::move(output))) {
            more = false;
            break;
          }
        }
      }
      executor.closeOutputConsumer();

      return more;
    }

    template <class Body>
    void foreach(Body&& body) const {
      Executor<true> executor(threads_, &ops_);
      source_.foreach([&](Input input) {
        if (executor.writeUnlessFull(std::forward<Input>(input))) {
          return;
        }
        OutputDecayed output;
        while (executor.readUnlessEmpty(output)) {
          body(std::move(output));
        }
        CHECK(executor.writeUnlessClosed(std::forward<Input>(input)));
      });
      executor.closeInputProducer();

      OutputDecayed output;
      while (executor.readUnlessClosed(output)) {
        body(std::move(output));
      }
      executor.closeOutputConsumer();
    }
  };

  template <class Value, class Source>
  Generator<Value, Source> compose(const GenImpl<Value, Source>& source) const {
    return Generator<Value, Source>(source.self(), ops_, threads_);
  }

  template <class Value, class Source>
  Generator<Value, Source> compose(GenImpl<Value, Source>&& source) const {
    return Generator<Value, Source>(std::move(source.self()), ops_, threads_);
  }
};

/**
 * ChunkedRangeSource - For slicing up ranges into a sequence of chunks given a
 * maximum chunk size.
 *
 * Usually used through the 'chunked' helper, like:
 *
 *   int n
 *     = chunked(values)
 *     | parallel  // each thread processes a chunk
 *     | concat   // but can still process values one at a time
 *     | filter(isPrime)
 *     | atomic_count;
 */
template <class Iterator>
class ChunkedRangeSource
    : public GenImpl<RangeSource<Iterator>&&, ChunkedRangeSource<Iterator>> {
  int chunkSize_;
  Range<Iterator> range_;

 public:
  ChunkedRangeSource() = default;
  ChunkedRangeSource(int chunkSize, Range<Iterator> range)
      : chunkSize_(chunkSize), range_(std::move(range)) {}

  template <class Handler>
  bool apply(Handler&& handler) const {
    auto remaining = range_;
    while (!remaining.empty()) {
      auto chunk = remaining.subpiece(0, chunkSize_);
      remaining.advance(chunk.size());
      auto gen = RangeSource<Iterator>(chunk);
      if (!handler(std::move(gen))) {
        return false;
      }
    }
    return true;
  }
};

} // namespace detail

} // namespace gen
} // namespace folly

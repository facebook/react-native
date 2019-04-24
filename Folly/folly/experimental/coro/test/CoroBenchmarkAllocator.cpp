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

#include <folly/Benchmark.h>

#if FOLLY_HAS_COROUTINES
#include <experimental/coroutine>
#include <future>

class Wait {
 public:
  class promise_type {
   public:
    Wait get_return_object() {
      return Wait(promise_.get_future());
    }

    std::experimental::suspend_never initial_suspend() {
      return {};
    }

    std::experimental::suspend_never final_suspend() {
      return {};
    }

    void return_void() {
      promise_.set_value();
    }

    void unhandled_exception() {
      promise_.set_exception(std::current_exception());
    }

   private:
    std::promise<void> promise_;
  };

  explicit Wait(std::future<void> future) : future_(std::move(future)) {}

  Wait(Wait&&) = default;

  void detach() {
    future_ = {};
  }

  ~Wait() {
    if (future_.valid()) {
      future_.get();
    }
  }

 private:
  std::future<void> future_;
};

template <typename T>
class InlineTask {
 public:
  InlineTask(const InlineTask&) = delete;
  InlineTask(InlineTask&& other)
      : promise_(std::exchange(other.promise_, nullptr)) {}

  ~InlineTask() {
    DCHECK(!promise_);
  }

  bool await_ready() const {
    return false;
  }

  std::experimental::coroutine_handle<> await_suspend(
      std::experimental::coroutine_handle<> awaiter) {
    promise_->valuePtr_ = &value_;
    promise_->awaiter_ = std::move(awaiter);
    return std::experimental::coroutine_handle<promise_type>::from_promise(
        *promise_);
  }

  T await_resume() {
    std::experimental::coroutine_handle<promise_type>::from_promise(
        *std::exchange(promise_, nullptr))
        .destroy();
    T value = std::move(value_);
    return value;
  }

  class promise_type {
   public:
    InlineTask get_return_object() {
      return InlineTask(this);
    }

    template <typename U>
    void return_value(U&& value) {
      *valuePtr_ = std::forward<U>(value);
    }

    void unhandled_exception() {
      std::terminate();
    }

    std::experimental::suspend_always initial_suspend() {
      return {};
    }

    class FinalSuspender {
     public:
      explicit FinalSuspender(std::experimental::coroutine_handle<> awaiter)
          : awaiter_(std::move(awaiter)) {}

      bool await_ready() {
        return false;
      }

      void await_suspend(std::experimental::coroutine_handle<>) {
        awaiter_();
      }

      void await_resume() {}

     private:
      std::experimental::coroutine_handle<> awaiter_;
    };

    FinalSuspender final_suspend() {
      return FinalSuspender(std::move(awaiter_));
    }

   private:
    friend class InlineTask;

    T* valuePtr_;
    std::experimental::coroutine_handle<> awaiter_;
  };

 private:
  friend class promise_type;

  explicit InlineTask(promise_type* promise) : promise_(promise) {}

  T value_;
  promise_type* promise_;
};

class StackAllocator {
 public:
  explicit StackAllocator(size_t bytes) : buffer_(new char[bytes]) {}
  ~StackAllocator() {
    delete[] buffer_;
  }
  StackAllocator(const StackAllocator&) = delete;

  void* allocate(size_t bytes) {
    auto ptr = buffer_;
    buffer_ += bytes;
    return ptr;
  }

  void deallocate(void*, size_t bytes) {
    buffer_ -= bytes;
  }

 private:
  char* buffer_;
};

// We only need this because clang doesn't correctly pass arguments to operator
// new.
StackAllocator defaultAllocator(1000 * 512);

template <typename T>
class InlineTaskAllocator {
 public:
  InlineTaskAllocator(const InlineTaskAllocator&) = delete;
  InlineTaskAllocator(InlineTaskAllocator&& other)
      : promise_(std::exchange(other.promise_, nullptr)) {}

  ~InlineTaskAllocator() {
    DCHECK(!promise_);
  }

  bool await_ready() const {
    return false;
  }

  std::experimental::coroutine_handle<> await_suspend(
      std::experimental::coroutine_handle<> awaiter) {
    promise_->valuePtr_ = &value_;
    promise_->awaiter_ = std::move(awaiter);
    return std::experimental::coroutine_handle<promise_type>::from_promise(
        *promise_);
  }

  T await_resume() {
    std::experimental::coroutine_handle<promise_type>::from_promise(
        *std::exchange(promise_, nullptr))
        .destroy();
    T value = std::move(value_);
    return value;
  }

  class promise_type {
   public:
    static void* operator new(size_t size) {
      size += sizeof(StackAllocator*);
      StackAllocator** buffer =
          static_cast<StackAllocator**>(defaultAllocator.allocate(size));
      buffer[0] = &defaultAllocator;
      return buffer + 1;
    }

    static void operator delete(void* ptr, size_t size) {
      size += sizeof(StackAllocator*);
      StackAllocator** buffer = static_cast<StackAllocator**>(ptr) - 1;
      auto allocator = buffer[0];
      allocator->deallocate(ptr, size);
    }

    InlineTaskAllocator get_return_object() {
      return InlineTaskAllocator(this);
    }

    template <typename U>
    void return_value(U&& value) {
      *valuePtr_ = std::forward<U>(value);
    }

    void unhandled_exception() {
      std::terminate();
    }

    std::experimental::suspend_always initial_suspend() {
      return {};
    }

    class FinalSuspender {
     public:
      explicit FinalSuspender(std::experimental::coroutine_handle<> awaiter)
          : awaiter_(std::move(awaiter)) {}

      bool await_ready() {
        return false;
      }

      void await_suspend(std::experimental::coroutine_handle<>) {
        awaiter_();
      }

      void await_resume() {}

     private:
      std::experimental::coroutine_handle<> awaiter_;
    };

    FinalSuspender final_suspend() {
      return FinalSuspender(std::move(awaiter_));
    }

   private:
    friend class InlineTaskAllocator;

    T* valuePtr_;
    std::experimental::coroutine_handle<> awaiter_;
  };

 private:
  friend class promise_type;

  explicit InlineTaskAllocator(promise_type* promise) : promise_(promise) {}

  T value_;
  promise_type* promise_;
};

class Recursion {
 public:
  static std::unique_ptr<Recursion> create(size_t depth) {
    if (depth == 0) {
      return std::unique_ptr<Recursion>(new Recursion(nullptr));
    }
    return std::unique_ptr<Recursion>(new Recursion(create(depth - 1)));
  }

  int operator()() {
    if (child_) {
      return (*child_)() + 1;
    }
    return 0;
  }

  InlineTask<int> operator co_await() {
    if (child_) {
      co_return co_await* child_ + 1;
    }
    co_return 0;
  }

  InlineTaskAllocator<int> co_allocator() {
    if (child_) {
      co_return co_await child_->co_allocator() + 1;
    }
    co_return 0;
  }

 private:
  explicit Recursion(std::unique_ptr<Recursion> child)
      : child_(std::move(child)) {}

  std::unique_ptr<Recursion> child_;
};

void coroRecursion(size_t times, size_t iters) {
  auto recursion = Recursion::create(times);
  for (size_t iter = 0; iter < iters; ++iter) {
    [](Recursion& recursion, size_t times) -> Wait {
      CHECK_EQ(times, co_await recursion);
      co_return;
    }(*recursion, times);
  }
}

BENCHMARK(coroRecursionDepth10, iters) {
  coroRecursion(10, iters);
}

BENCHMARK(coroRecursionDepth1000, iters) {
  coroRecursion(1000, iters);
}

void coroRecursionAllocator(size_t times, size_t iters) {
  auto recursion = Recursion::create(times);
  for (size_t iter = 0; iter < iters; ++iter) {
    [](Recursion& recursion, size_t times) -> Wait {
      CHECK_EQ(times, co_await recursion.co_allocator());
      co_return;
    }(*recursion, times);
  }
}

BENCHMARK(coroRecursionAllocatorDepth10, iters) {
  coroRecursionAllocator(10, iters);
}

BENCHMARK(coroRecursionAllocatorDepth1000, iters) {
  coroRecursionAllocator(1000, iters);
}

void recursion(size_t times, size_t iters) {
  auto recursion = Recursion::create(times);
  for (size_t iter = 0; iter < iters; ++iter) {
    CHECK_EQ(times, (*recursion)());
  }
}

BENCHMARK(recursionDepth10, iters) {
  recursion(10, iters);
}

BENCHMARK(recursionDepth1000, iters) {
  recursion(1000, iters);
}
#endif

int main(int argc, char** argv) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  folly::runBenchmarks();
  return 0;
}

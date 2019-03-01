/*
 * Copyright 2017 Facebook, Inc.
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

#include <atomic>
#include <mutex>
#include <stdexcept>
#include <vector>

#include <folly/Executor.h>
#include <folly/Function.h>
#include <folly/MicroSpinLock.h>
#include <folly/Optional.h>
#include <folly/ScopeGuard.h>
#include <folly/Try.h>
#include <folly/futures/Future.h>
#include <folly/futures/Promise.h>
#include <folly/futures/detail/FSM.h>

#include <folly/io/async/Request.h>

namespace folly { namespace detail {

/*
        OnlyCallback
       /            \
  Start              Armed - Done
       \            /
         OnlyResult

This state machine is fairly self-explanatory. The most important bit is
that the callback is only executed on the transition from Armed to Done,
and that transition can happen immediately after transitioning from Only*
to Armed, if it is active (the usual case).
*/
enum class State : uint8_t {
  Start,
  OnlyResult,
  OnlyCallback,
  Armed,
  Done,
};

/// The shared state object for Future and Promise.
/// Some methods must only be called by either the Future thread or the
/// Promise thread. The Future thread is the thread that currently "owns" the
/// Future and its callback-related operations, and the Promise thread is
/// likewise the thread that currently "owns" the Promise and its
/// result-related operations. Also, Futures own interruption, Promises own
/// interrupt handlers. Unfortunately, there are things that users can do to
/// break this, and we can't detect that. However if they follow move
/// semantics religiously wrt threading, they should be ok.
///
/// It's worth pointing out that Futures and/or Promises can and usually will
/// migrate between threads, though this usually happens within the API code.
/// For example, an async operation will probably make a Promise, grab its
/// Future, then move the Promise into another thread that will eventually
/// fulfill it. With executors and via, this gets slightly more complicated at
/// first blush, but it's the same principle. In general, as long as the user
/// doesn't access a Future or Promise object from more than one thread at a
/// time there won't be any problems.
template<typename T>
class Core final {
  static_assert(!std::is_void<T>::value,
                "void futures are not supported. Use Unit instead.");
 public:
  /// This must be heap-constructed. There's probably a way to enforce that in
  /// code but since this is just internal detail code and I don't know how
  /// off-hand, I'm punting.
  Core() : result_(), fsm_(State::Start), attached_(2) {}

  explicit Core(Try<T>&& t)
    : result_(std::move(t)),
      fsm_(State::OnlyResult),
      attached_(1) {}

  ~Core() {
    DCHECK(attached_ == 0);
  }

  // not copyable
  Core(Core const&) = delete;
  Core& operator=(Core const&) = delete;

  // not movable (see comment in the implementation of Future::then)
  Core(Core&&) noexcept = delete;
  Core& operator=(Core&&) = delete;

  /// May call from any thread
  bool hasResult() const {
    switch (fsm_.getState()) {
      case State::OnlyResult:
      case State::Armed:
      case State::Done:
        assert(!!result_);
        return true;

      default:
        return false;
    }
  }

  /// May call from any thread
  bool ready() const {
    return hasResult();
  }

  /// May call from any thread
  Try<T>& getTry() {
    if (ready()) {
      return *result_;
    } else {
      throw FutureNotReady();
    }
  }

  /// Call only from Future thread.
  template <typename F>
  void setCallback(F&& func) {
    bool transitionToArmed = false;
    auto setCallback_ = [&]{
      context_ = RequestContext::saveContext();
      callback_ = std::forward<F>(func);
    };

    FSM_START(fsm_)
      case State::Start:
        FSM_UPDATE(fsm_, State::OnlyCallback, setCallback_);
        break;

      case State::OnlyResult:
        FSM_UPDATE(fsm_, State::Armed, setCallback_);
        transitionToArmed = true;
        break;

      case State::OnlyCallback:
      case State::Armed:
      case State::Done:
        throw std::logic_error("setCallback called twice");
    FSM_END

    // we could always call this, it is an optimization to only call it when
    // it might be needed.
    if (transitionToArmed) {
      maybeCallback();
    }
  }

  /// Call only from Promise thread
  void setResult(Try<T>&& t) {
    bool transitionToArmed = false;
    auto setResult_ = [&]{ result_ = std::move(t); };
    FSM_START(fsm_)
      case State::Start:
        FSM_UPDATE(fsm_, State::OnlyResult, setResult_);
        break;

      case State::OnlyCallback:
        FSM_UPDATE(fsm_, State::Armed, setResult_);
        transitionToArmed = true;
        break;

      case State::OnlyResult:
      case State::Armed:
      case State::Done:
        throw std::logic_error("setResult called twice");
    FSM_END

    if (transitionToArmed) {
      maybeCallback();
    }
  }

  /// Called by a destructing Future (in the Future thread, by definition)
  void detachFuture() {
    activate();
    detachOne();
  }

  /// Called by a destructing Promise (in the Promise thread, by definition)
  void detachPromise() {
    // detachPromise() and setResult() should never be called in parallel
    // so we don't need to protect this.
    if (UNLIKELY(!result_)) {
      setResult(Try<T>(exception_wrapper(BrokenPromise(typeid(T).name()))));
    }
    detachOne();
  }

  /// May call from any thread
  void deactivate() {
    active_.store(false, std::memory_order_release);
  }

  /// May call from any thread
  void activate() {
    active_.store(true, std::memory_order_release);
    maybeCallback();
  }

  /// May call from any thread
  bool isActive() { return active_.load(std::memory_order_acquire); }

  /// Call only from Future thread
  void setExecutor(Executor* x, int8_t priority = Executor::MID_PRI) {
    if (!executorLock_.try_lock()) {
      executorLock_.lock();
    }
    executor_ = x;
    priority_ = priority;
    executorLock_.unlock();
  }

  void setExecutorNoLock(Executor* x, int8_t priority = Executor::MID_PRI) {
    executor_ = x;
    priority_ = priority;
  }

  Executor* getExecutor() {
    return executor_;
  }

  /// Call only from Future thread
  void raise(exception_wrapper e) {
    if (!interruptLock_.try_lock()) {
      interruptLock_.lock();
    }
    if (!interrupt_ && !hasResult()) {
      interrupt_ = folly::make_unique<exception_wrapper>(std::move(e));
      if (interruptHandler_) {
        interruptHandler_(*interrupt_);
      }
    }
    interruptLock_.unlock();
  }

  std::function<void(exception_wrapper const&)> getInterruptHandler() {
    if (!interruptHandlerSet_.load(std::memory_order_acquire)) {
      return nullptr;
    }
    if (!interruptLock_.try_lock()) {
      interruptLock_.lock();
    }
    auto handler = interruptHandler_;
    interruptLock_.unlock();
    return handler;
  }

  /// Call only from Promise thread
  void setInterruptHandler(std::function<void(exception_wrapper const&)> fn) {
    if (!interruptLock_.try_lock()) {
      interruptLock_.lock();
    }
    if (!hasResult()) {
      if (interrupt_) {
        fn(*interrupt_);
      } else {
        setInterruptHandlerNoLock(std::move(fn));
      }
    }
    interruptLock_.unlock();
  }

  void setInterruptHandlerNoLock(
      std::function<void(exception_wrapper const&)> fn) {
    interruptHandlerSet_.store(true, std::memory_order_relaxed);
    interruptHandler_ = std::move(fn);
  }

 private:
  class CountedReference {
   public:
    ~CountedReference() {
      if (core_) {
        core_->detachOne();
        core_ = nullptr;
      }
    }

    explicit CountedReference(Core* core) noexcept : core_(core) {
      // do not construct a CountedReference from nullptr!
      DCHECK(core);

      ++core_->attached_;
    }

    // CountedReference must be copy-constructable as long as
    // folly::Executor::add takes a std::function
    CountedReference(CountedReference const& o) noexcept : core_(o.core_) {
      if (core_) {
        ++core_->attached_;
      }
    }

    CountedReference& operator=(CountedReference const& o) noexcept {
      ~CountedReference();
      new (this) CountedReference(o);
      return *this;
    }

    CountedReference(CountedReference&& o) noexcept {
      std::swap(core_, o.core_);
    }

    CountedReference& operator=(CountedReference&& o) noexcept {
      ~CountedReference();
      new (this) CountedReference(std::move(o));
      return *this;
    }

    Core* getCore() const noexcept {
      return core_;
    }

   private:
    Core* core_{nullptr};
  };

  void maybeCallback() {
    FSM_START(fsm_)
      case State::Armed:
        if (active_.load(std::memory_order_acquire)) {
          FSM_UPDATE2(fsm_, State::Done, []{}, [this]{ this->doCallback(); });
        }
        FSM_BREAK

      default:
        FSM_BREAK
    FSM_END
  }

  void doCallback() {
    Executor* x = executor_;
    int8_t priority;
    if (x) {
      if (!executorLock_.try_lock()) {
        executorLock_.lock();
      }
      x = executor_;
      priority = priority_;
      executorLock_.unlock();
    }

    if (x) {
      exception_wrapper ew;
      try {
        if (LIKELY(x->getNumPriorities() == 1)) {
          x->add([core_ref = CountedReference(this)]() mutable {
            auto cr = std::move(core_ref);
            Core* const core = cr.getCore();
            RequestContextScopeGuard rctx(core->context_);
            SCOPE_EXIT { core->callback_ = {}; };
            core->callback_(std::move(*core->result_));
          });
        } else {
          x->addWithPriority([core_ref = CountedReference(this)]() mutable {
            auto cr = std::move(core_ref);
            Core* const core = cr.getCore();
            RequestContextScopeGuard rctx(core->context_);
            SCOPE_EXIT { core->callback_ = {}; };
            core->callback_(std::move(*core->result_));
          }, priority);
        }
      } catch (const std::exception& e) {
        ew = exception_wrapper(std::current_exception(), e);
      } catch (...) {
        ew = exception_wrapper(std::current_exception());
      }
      if (ew) {
        CountedReference core_ref(this);
        RequestContextScopeGuard rctx(context_);
        result_ = Try<T>(std::move(ew));
        SCOPE_EXIT { callback_ = {}; };
        callback_(std::move(*result_));
      }
    } else {
      CountedReference core_ref(this);
      RequestContextScopeGuard rctx(context_);
      SCOPE_EXIT { callback_ = {}; };
      callback_(std::move(*result_));
    }
  }

  void detachOne() {
    auto a = attached_--;
    assert(a >= 1);
    if (a == 1) {
      delete this;
    }
  }


  folly::Function<void(Try<T>&&)> callback_;
  // place result_ next to increase the likelihood that the value will be
  // contained entirely in one cache line
  folly::Optional<Try<T>> result_;
  FSM<State> fsm_;
  std::atomic<unsigned char> attached_;
  std::atomic<bool> active_ {true};
  std::atomic<bool> interruptHandlerSet_ {false};
  folly::MicroSpinLock interruptLock_ {0};
  folly::MicroSpinLock executorLock_ {0};
  int8_t priority_ {-1};
  Executor* executor_ {nullptr};
  std::shared_ptr<RequestContext> context_ {nullptr};
  std::unique_ptr<exception_wrapper> interrupt_ {};
  std::function<void(exception_wrapper const&)> interruptHandler_ {nullptr};
};

template <typename... Ts>
struct CollectAllVariadicContext {
  CollectAllVariadicContext() {}
  template <typename T, size_t I>
  inline void setPartialResult(Try<T>& t) {
    std::get<I>(results) = std::move(t);
  }
  ~CollectAllVariadicContext() {
    p.setValue(std::move(results));
  }
  Promise<std::tuple<Try<Ts>...>> p;
  std::tuple<Try<Ts>...> results;
  typedef Future<std::tuple<Try<Ts>...>> type;
};

template <typename... Ts>
struct CollectVariadicContext {
  CollectVariadicContext() {}
  template <typename T, size_t I>
  inline void setPartialResult(Try<T>& t) {
    if (t.hasException()) {
       if (!threw.exchange(true)) {
         p.setException(std::move(t.exception()));
       }
     } else if (!threw) {
       std::get<I>(results) = std::move(t);
     }
  }
  ~CollectVariadicContext() noexcept {
    if (!threw.exchange(true)) {
      p.setValue(unwrapTryTuple(std::move(results)));
    }
  }
  Promise<std::tuple<Ts...>> p;
  std::tuple<folly::Try<Ts>...> results;
  std::atomic<bool> threw {false};
  typedef Future<std::tuple<Ts...>> type;
};

template <template <typename...> class T, typename... Ts>
void collectVariadicHelper(const std::shared_ptr<T<Ts...>>& /* ctx */) {
  // base case
}

template <template <typename ...> class T, typename... Ts,
          typename THead, typename... TTail>
void collectVariadicHelper(const std::shared_ptr<T<Ts...>>& ctx,
                           THead&& head, TTail&&... tail) {
  head.setCallback_([ctx](Try<typename THead::value_type>&& t) {
    ctx->template setPartialResult<typename THead::value_type,
                                   sizeof...(Ts) - sizeof...(TTail) - 1>(t);
  });
  // template tail-recursion
  collectVariadicHelper(ctx, std::forward<TTail>(tail)...);
}

}} // folly::detail

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

#include <atomic>
#include <mutex>
#include <stdexcept>
#include <utility>
#include <vector>

#include <folly/Executor.h>
#include <folly/Function.h>
#include <folly/Optional.h>
#include <folly/ScopeGuard.h>
#include <folly/Try.h>
#include <folly/Utility.h>
#include <folly/lang/Assume.h>
#include <folly/lang/Exception.h>
#include <folly/synchronization/MicroSpinLock.h>
#include <glog/logging.h>

#include <folly/io/async/Request.h>

namespace folly {
namespace futures {
namespace detail {

/// See `Core` for details
enum class State : uint8_t {
  Start = 1 << 0,
  OnlyResult = 1 << 1,
  OnlyCallback = 1 << 2,
  Done = 1 << 3,
};
constexpr State operator&(State a, State b) {
  return State(uint8_t(a) & uint8_t(b));
}
constexpr State operator|(State a, State b) {
  return State(uint8_t(a) | uint8_t(b));
}
constexpr State operator^(State a, State b) {
  return State(uint8_t(a) ^ uint8_t(b));
}
constexpr State operator~(State a) {
  return State(~uint8_t(a));
}

/// SpinLock is and must stay a 1-byte object because of how Core is laid out.
struct SpinLock : private MicroSpinLock {
  SpinLock() : MicroSpinLock{0} {}

  using MicroSpinLock::lock;
  using MicroSpinLock::unlock;
};
static_assert(sizeof(SpinLock) == 1, "missized");

/// The shared state object for Future and Promise.
///
/// Nomenclature:
///
/// - "result": a `Try` object which, when set, contains a `T` or exception.
/// - "move-out the result": used to mean the `Try` object and/or its contents
///   are moved-out by a move-constructor or move-assignment. After the result
///   is set, Core itself never modifies (including moving out) the result;
///   however the docs refer to both since caller-code can move-out the result
///   implicitly (see below for examples) whereas other types of modifications
///   are more explicit in the caller code.
/// - "callback": a function provided by the future which Core may invoke. The
///   thread in which the callback is invoked depends on the executor; if there
///   is no executor or an inline executor the thread-choice depends on timing.
/// - "executor": an object which may in the future invoke a provided function
///   (some executors may, as a matter of policy, simply destroy provided
///   functions without executing them).
/// - "consumer thread": the thread which currently owns the Future and which
///   may provide the callback and/or the interrupt.
/// - "producer thread": the thread which owns the Future and which may provide
///   the result and which may provide the interrupt handler.
/// - "interrupt": if provided, an object managed by (if non-empty)
///   `exception_wrapper`.
/// - "interrupt handler": if provided, a function-object passed to
///   `promise.setInterruptHandler()`. Core invokes the interrupt handler with
///   the interrupt when both are provided (and, best effort, if there is not
///   yet any result).
///
/// Core holds three sets of data, each of which is concurrency-controlled:
///
/// - The primary producer-to-consumer info-flow: this info includes the result,
///   callback, executor, and a priority for running the callback. Management of
///   and concurrency control for this info is by an FSM based on `enum class
///   State`. All state transitions are atomic; other producer-to-consumer data
///   is sometimes modified within those transitions; see below for details.
/// - The consumer-to-producer interrupt-request flow: this info includes an
///   interrupt-handler and an interrupt. Concurrency of this info is controlled
///   by a Spin Lock (`interruptLock_`).
/// - Lifetime control info: this includes two reference counts, both which are
///   internally synchronized (atomic).
///
/// The FSM to manage the primary producer-to-consumer info-flow has these
///   allowed (atomic) transitions:
///
///   +----------------------------------------------------------------+
///   |                       ---> OnlyResult -----                    |
///   |                     /                       \                  |
///   |                  (setResult())             (setCallback())     |
///   |                   /                           \                |
///   |   Start --------->                              ------> Done   |
///   |      \            \                           /                |
///   |       \          (setCallback())           (setResult())       |
///   |        \            \                       /                  |
///   |         \             ---> OnlyCallback ---                    |
///   |          \                        /                            |
///   |            <- (stealCallback()) -                              |
///   +----------------------------------------------------------------+
///
/// States and the corresponding producer-to-consumer data status & ownership:
///
/// - Start: has neither result nor callback. While in this state, the producer
///   thread may set the result (`setResult()`) or the consumer thread may set
///   the callback (`setCallback()`).
/// - OnlyResult: producer thread has set the result and must never access it.
///   The result is logically owned by, and possibly modified or moved-out by,
///   the consumer thread. Callers of the future object can do arbitrary
///   modifications, including moving-out, via continuations or via non-const
///   and/or rvalue-qualified `future.result()`, `future.value()`, etc.
///   Future/SemiFuture proper also move-out the result in some cases, e.g.,
///   in `wait()`, `get()`, when passing through values or results from core to
///   core, as `then-value` and `then-error`, etc.
/// - OnlyCallback: consumer thread has set a callback/continuation. From this
///   point forward only the producer thread can safely access that callback
///   (see `setResult()` and `doCallback()` where the producer thread can both
///   read and modify the callback).
///   Alternatively producer thread can also steal the callback (see
///   `stealCallback()`).
/// - Done: callback can be safely accessed only within `doCallback()`, which
///   gets called on exactly one thread exactly once just after the transition
///   to Done. The future object will have determined whether that callback
///   has/will move-out the result, but either way the result remains logically
///   owned exclusively by the consumer thread (the code of Future/SemiFuture,
///   of the continuation, and/or of callers of `future.result()`, etc.).
///
/// Start state:
///
/// - Start: e.g., `Core<X>::make()`.
/// - (See also `Core<X>::make(x)` which logically transitions Start =>
///   OnlyResult within the underlying constructor.)
///
/// Terminal states:
///
/// - OnlyResult: a terminal state when a callback is never attached, and also
///   sometimes when a callback is provided, e.g., sometimes when
///   `future.wait()` and/or `future.get()` are used.
/// - Done: a terminal state when `future.then()` is used, and sometimes also
///   when `future.wait()` and/or `future.get()` are used.
///
/// Notes and caveats:
///
/// - Unfortunately, there are things that users can do to break concurrency and
///   we can't detect that. However users should be ok if they follow move
///   semantics religiously wrt threading.
/// - Futures and/or Promises can and usually will migrate between threads,
///   though this usually happens within the API code. For example, an async
///   operation will probably make a promise-future pair (see overloads of
///   `makePromiseContract()`), then move the Promise into another thread that
///   will eventually fulfill it.
/// - Things get slightly more complicated with executors and via, but the
///   principle is the same.
/// - In general, as long as the user doesn't access a future or promise object
///   from more than one thread at a time there won't be any problems.
template <typename T>
class Core final {
  static_assert(
      !std::is_void<T>::value,
      "void futures are not supported. Use Unit instead.");

 public:
  using Result = Try<T>;
  using Callback = folly::Function<void(Result&&)>;

  /// State will be Start
  static Core* make() {
    return new Core();
  }

  /// State will be OnlyResult
  /// Result held will be move-constructed from `t`
  static Core* make(Try<T>&& t) {
    return new Core(std::move(t));
  }

  /// State will be OnlyResult
  /// Result held will be the `T` constructed from forwarded `args`
  template <typename... Args>
  static Core<T>* make(in_place_t, Args&&... args) {
    return new Core<T>(in_place, std::forward<Args>(args)...);
  }

  // not copyable
  Core(Core const&) = delete;
  Core& operator=(Core const&) = delete;

  // not movable (see comment in the implementation of Future::then)
  Core(Core&&) noexcept = delete;
  Core& operator=(Core&&) = delete;

  /// May call from any thread
  bool hasCallback() const noexcept {
    constexpr auto allowed = State::OnlyCallback | State::Done;
    auto const state = state_.load(std::memory_order_acquire);
    return State() != (state & allowed);
  }

  /// May call from any thread
  ///
  /// True if state is OnlyResult or Done.
  ///
  /// Identical to `this->ready()`
  bool hasResult() const noexcept {
    constexpr auto allowed = State::OnlyResult | State::Done;
    auto const state = state_.load(std::memory_order_acquire);
    return State() != (state & allowed);
  }

  /// May call from any thread
  ///
  /// True if state is OnlyResult or Done.
  ///
  /// Identical to `this->hasResult()`
  bool ready() const noexcept {
    return hasResult();
  }

  /// Call only from consumer thread (since the consumer thread can modify the
  ///   referenced Try object; see non-const overloads of `future.result()`,
  ///   etc., and certain Future-provided callbacks which move-out the result).
  ///
  /// Unconditionally returns a reference to the result.
  ///
  /// State dependent preconditions:
  ///
  /// - Start or OnlyCallback: Never safe - do not call. (Access in those states
  ///   would be undefined behavior since the producer thread can, in those
  ///   states, asynchronously set the referenced Try object.)
  /// - OnlyResult: Always safe. (Though the consumer thread should not use the
  ///   returned reference after it attaches a callback unless it knows that
  ///   the callback does not move-out the referenced result.)
  /// - Done: Safe but sometimes unusable. (Always returns a valid reference,
  ///   but the referenced result may or may not have been modified, including
  ///   possibly moved-out, depending on what the callback did; some but not
  ///   all callbacks modify (possibly move-out) the result.)
  Try<T>& getTry() {
    DCHECK(hasResult());
    return result_;
  }
  Try<T> const& getTry() const {
    DCHECK(hasResult());
    return result_;
  }

  /// Call only from consumer thread.
  /// Call only once - else undefined behavior.
  ///
  /// See FSM graph for allowed transitions.
  ///
  /// If it transitions to Done, synchronously initiates a call to the callback,
  /// and might also synchronously execute that callback (e.g., if there is no
  /// executor or if the executor is inline).
  template <typename F>
  void setCallback(F&& func, std::shared_ptr<folly::RequestContext> context) {
    DCHECK(!hasCallback());

    // construct callback_ first; if that fails, context_ will not leak
    ::new (&callback_) Callback(std::forward<F>(func));
    ::new (&context_) Context(std::move(context));

    auto state = state_.load(std::memory_order_acquire);
    while (true) {
      switch (state) {
        case State::Start:
          if (state_.compare_exchange_strong(
                  state, State::OnlyCallback, std::memory_order_release)) {
            return;
          }
          assume(state == State::OnlyResult);
          FOLLY_FALLTHROUGH;

        case State::OnlyResult:
          if (state_.compare_exchange_strong(
                  state, State::Done, std::memory_order_release)) {
            doCallback();
            return;
          }
          FOLLY_FALLTHROUGH;

        default:
          terminate_with<std::logic_error>("setCallback unexpected state");
      }
    }
  }

  /// Call only from producer thread.
  /// Call only once - else undefined behavior.
  ///
  /// See FSM graph for allowed transitions.
  ///
  /// Call only if hasCallback() == true && hasResult() == false
  /// This can not be called concurrently with setResult().
  ///
  /// Extracts callback from the Core and transitions it back into Start state.
  std::pair<Callback, std::shared_ptr<folly::RequestContext>> stealCallback() {
    DCHECK(state_.load(std::memory_order_relaxed) == State::OnlyCallback);
    auto ret = std::make_pair(std::move(callback_), std::move(context_));
    context_.~Context();
    callback_.~Callback();
    state_.store(State::Start, std::memory_order_relaxed);
    return ret;
  }

  /// Call only from producer thread.
  /// Call only once - else undefined behavior.
  ///
  /// See FSM graph for allowed transitions.
  ///
  /// If it transitions to Done, synchronously initiates a call to the callback,
  /// and might also synchronously execute that callback (e.g., if there is no
  /// executor or if the executor is inline).
  void setResult(Try<T>&& t) {
    DCHECK(!hasResult());

    ::new (&result_) Result(std::move(t));

    auto state = state_.load(std::memory_order_acquire);
    while (true) {
      switch (state) {
        case State::Start:
          if (state_.compare_exchange_strong(
                  state, State::OnlyResult, std::memory_order_release)) {
            return;
          }
          assume(state == State::OnlyCallback);
          FOLLY_FALLTHROUGH;

        case State::OnlyCallback:
          if (state_.compare_exchange_strong(
                  state, State::Done, std::memory_order_release)) {
            doCallback();
            return;
          }
          FOLLY_FALLTHROUGH;

        default:
          terminate_with<std::logic_error>("setResult unexpected state");
      }
    }
  }

  /// Called by a destructing Future (in the consumer thread, by definition).
  /// Calls `delete this` if there are no more references to `this`
  /// (including if `detachPromise()` is called previously or concurrently).
  void detachFuture() noexcept {
    detachOne();
  }

  /// Called by a destructing Promise (in the producer thread, by definition).
  /// Calls `delete this` if there are no more references to `this`
  /// (including if `detachFuture()` is called previously or concurrently).
  void detachPromise() noexcept {
    DCHECK(hasResult());
    detachOne();
  }

  /// Call only from consumer thread, either before attaching a callback or
  /// after the callback has already been invoked, but not concurrently with
  /// anything which might trigger invocation of the callback.
  void setExecutor(
      Executor::KeepAlive<> x,
      int8_t priority = Executor::MID_PRI) {
    DCHECK(state_ != State::OnlyCallback);
    executor_ = std::move(x);
    priority_ = priority;
  }

  void setExecutor(Executor* x, int8_t priority = Executor::MID_PRI) {
    setExecutor(getKeepAliveToken(x), priority);
  }

  Executor* getExecutor() const {
    return executor_.get();
  }

  int8_t getPriority() const {
    return priority_;
  }

  /// Call only from consumer thread
  ///
  /// Eventual effect is to pass `e` to the Promise's interrupt handler, either
  /// synchronously within this call or asynchronously within
  /// `setInterruptHandler()`, depending on which happens first (a coin-toss if
  /// the two calls are racing).
  ///
  /// Has no effect if it was called previously.
  /// Has no effect if State is OnlyResult or Done.
  void raise(exception_wrapper e) {
    std::lock_guard<SpinLock> lock(interruptLock_);
    if (!interrupt_ && !hasResult()) {
      interrupt_ = std::make_unique<exception_wrapper>(std::move(e));
      if (interruptHandler_) {
        interruptHandler_(*interrupt_);
      }
    }
  }

  std::function<void(exception_wrapper const&)> getInterruptHandler() {
    if (!interruptHandlerSet_.load(std::memory_order_acquire)) {
      return nullptr;
    }
    std::lock_guard<SpinLock> lock(interruptLock_);
    return interruptHandler_;
  }

  /// Call only from producer thread
  ///
  /// May invoke `fn()` (passing the interrupt) synchronously within this call
  /// (if `raise()` preceded or perhaps if `raise()` is called concurrently).
  ///
  /// Has no effect if State is OnlyResult or Done.
  ///
  /// Note: `fn()` must not touch resources that are destroyed immediately after
  ///   `setResult()` is called. Reason: it is possible for `fn()` to get called
  ///   asynchronously (in the consumer thread) after the producer thread calls
  ///   `setResult()`.
  template <typename F>
  void setInterruptHandler(F&& fn) {
    std::lock_guard<SpinLock> lock(interruptLock_);
    if (!hasResult()) {
      if (interrupt_) {
        fn(as_const(*interrupt_));
      } else {
        setInterruptHandlerNoLock(std::forward<F>(fn));
      }
    }
  }

  void setInterruptHandlerNoLock(
      std::function<void(exception_wrapper const&)> fn) {
    interruptHandlerSet_.store(true, std::memory_order_relaxed);
    interruptHandler_ = std::move(fn);
  }

 private:
  Core() : state_(State::Start), attached_(2) {}

  explicit Core(Try<T>&& t)
      : result_(std::move(t)), state_(State::OnlyResult), attached_(1) {}

  template <typename... Args>
  explicit Core(in_place_t, Args&&... args) noexcept(
      std::is_nothrow_constructible<T, Args&&...>::value)
      : result_(in_place, std::forward<Args>(args)...),
        state_(State::OnlyResult),
        attached_(1) {}

  ~Core() {
    DCHECK(attached_ == 0);
    DCHECK(hasResult());
    result_.~Result();
  }

  // Helper class that stores a pointer to the `Core` object and calls
  // `derefCallback` and `detachOne` in the destructor.
  class CoreAndCallbackReference {
   public:
    explicit CoreAndCallbackReference(Core* core) noexcept : core_(core) {}

    ~CoreAndCallbackReference() noexcept {
      detach();
    }

    CoreAndCallbackReference(CoreAndCallbackReference const& o) = delete;
    CoreAndCallbackReference& operator=(CoreAndCallbackReference const& o) =
        delete;
    CoreAndCallbackReference& operator=(CoreAndCallbackReference&&) = delete;

    CoreAndCallbackReference(CoreAndCallbackReference&& o) noexcept
        : core_(exchange(o.core_, nullptr)) {}

    Core* getCore() const noexcept {
      return core_;
    }

   private:
    void detach() noexcept {
      if (core_) {
        core_->derefCallback();
        core_->detachOne();
      }
    }

    Core* core_{nullptr};
  };

  // May be called at most once.
  void doCallback() {
    DCHECK(state_ == State::Done);
    auto x = exchange(executor_, Executor::KeepAlive<>());
    int8_t priority = priority_;

    if (x) {
      exception_wrapper ew;
      // We need to reset `callback_` after it was executed (which can happen
      // through the executor or, if `Executor::add` throws, below). The
      // executor might discard the function without executing it (now or
      // later), in which case `callback_` also needs to be reset.
      // The `Core` has to be kept alive throughout that time, too. Hence we
      // increment `attached_` and `callbackReferences_` by two, and construct
      // exactly two `CoreAndCallbackReference` objects, which call
      // `derefCallback` and `detachOne` in their destructor. One will guard
      // this scope, the other one will guard the lambda passed to the executor.
      attached_.fetch_add(2, std::memory_order_relaxed);
      callbackReferences_.fetch_add(2, std::memory_order_relaxed);
      CoreAndCallbackReference guard_local_scope(this);
      CoreAndCallbackReference guard_lambda(this);
      try {
        auto xPtr = x.get();
        if (LIKELY(x->getNumPriorities() == 1)) {
          xPtr->add([core_ref = std::move(guard_lambda),
                     keepAlive = std::move(x)]() mutable {
            auto cr = std::move(core_ref);
            Core* const core = cr.getCore();
            RequestContextScopeGuard rctx(core->context_);
            core->callback_(std::move(core->result_));
          });
        } else {
          xPtr->addWithPriority(
              [core_ref = std::move(guard_lambda),
               keepAlive = std::move(x)]() mutable {
                auto cr = std::move(core_ref);
                Core* const core = cr.getCore();
                RequestContextScopeGuard rctx(core->context_);
                core->callback_(std::move(core->result_));
              },
              priority);
        }
      } catch (const std::exception& e) {
        ew = exception_wrapper(std::current_exception(), e);
      } catch (...) {
        ew = exception_wrapper(std::current_exception());
      }
      if (ew) {
        RequestContextScopeGuard rctx(context_);
        result_ = Try<T>(std::move(ew));
        callback_(std::move(result_));
      }
    } else {
      attached_.fetch_add(1, std::memory_order_relaxed);
      SCOPE_EXIT {
        context_.~Context();
        callback_.~Callback();
        detachOne();
      };
      RequestContextScopeGuard rctx(context_);
      callback_(std::move(result_));
    }
  }

  void detachOne() noexcept {
    auto a = attached_.fetch_sub(1, std::memory_order_acq_rel);
    assert(a >= 1);
    if (a == 1) {
      delete this;
    }
  }

  void derefCallback() noexcept {
    auto c = callbackReferences_.fetch_sub(1, std::memory_order_acq_rel);
    assert(c >= 1);
    if (c == 1) {
      context_.~Context();
      callback_.~Callback();
    }
  }

  using Context = std::shared_ptr<RequestContext>;

  union {
    Callback callback_;
  };
  // place result_ next to increase the likelihood that the value will be
  // contained entirely in one cache line
  union {
    Result result_;
  };
  std::atomic<State> state_;
  std::atomic<unsigned char> attached_;
  std::atomic<unsigned char> callbackReferences_{0};
  std::atomic<bool> interruptHandlerSet_{false};
  SpinLock interruptLock_;
  int8_t priority_{-1};
  Executor::KeepAlive<> executor_;
  union {
    Context context_;
  };
  std::unique_ptr<exception_wrapper> interrupt_{};
  std::function<void(exception_wrapper const&)> interruptHandler_{nullptr};
};

} // namespace detail
} // namespace futures
} // namespace folly

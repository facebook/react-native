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

#include <algorithm>
#include <cassert>
#include <chrono>
#include <thread>

#include <folly/Optional.h>
#include <folly/executors/InlineExecutor.h>
#include <folly/executors/QueuedImmediateExecutor.h>
#include <folly/futures/detail/Core.h>
#include <folly/synchronization/Baton.h>

#ifndef FOLLY_FUTURE_USING_FIBER
#if FOLLY_MOBILE || defined(__APPLE__)
#define FOLLY_FUTURE_USING_FIBER 0
#else
#define FOLLY_FUTURE_USING_FIBER 1
#include <folly/fibers/Baton.h>
#endif
#endif

namespace folly {

class Timekeeper;

namespace futures {
namespace detail {
#if FOLLY_FUTURE_USING_FIBER
typedef folly::fibers::Baton FutureBatonType;
#else
typedef folly::Baton<> FutureBatonType;
#endif
} // namespace detail
} // namespace futures

namespace detail {
std::shared_ptr<Timekeeper> getTimekeeperSingleton();
} // namespace detail

namespace futures {
namespace detail {
//  Guarantees that the stored functor is destructed before the stored promise
//  may be fulfilled. Assumes the stored functor to be noexcept-destructible.
template <typename T, typename F>
class CoreCallbackState {
  using DF = _t<std::decay<F>>;

 public:
  CoreCallbackState(Promise<T>&& promise, F&& func) noexcept(
      noexcept(DF(std::declval<F&&>())))
      : func_(std::forward<F>(func)), promise_(std::move(promise)) {
    assert(before_barrier());
  }

  CoreCallbackState(CoreCallbackState&& that) noexcept(
      noexcept(DF(std::declval<F&&>()))) {
    if (that.before_barrier()) {
      new (&func_) DF(std::forward<F>(that.func_));
      promise_ = that.stealPromise();
    }
  }

  CoreCallbackState& operator=(CoreCallbackState&&) = delete;

  ~CoreCallbackState() {
    if (before_barrier()) {
      stealPromise();
    }
  }

  template <typename... Args>
  auto invoke(Args&&... args) noexcept(
      noexcept(std::declval<F&&>()(std::declval<Args&&>()...))) {
    assert(before_barrier());
    return std::forward<F>(func_)(std::forward<Args>(args)...);
  }

  template <typename... Args>
  auto tryInvoke(Args&&... args) noexcept {
    return makeTryWith([&] { return invoke(std::forward<Args>(args)...); });
  }

  void setTry(Try<T>&& t) {
    stealPromise().setTry(std::move(t));
  }

  void setException(exception_wrapper&& ew) {
    stealPromise().setException(std::move(ew));
  }

  Promise<T> stealPromise() noexcept {
    assert(before_barrier());
    func_.~DF();
    return std::move(promise_);
  }

 private:
  bool before_barrier() const noexcept {
    return !promise_.isFulfilled();
  }

  union {
    DF func_;
  };
  Promise<T> promise_{Promise<T>::makeEmpty()};
};

template <typename T, typename F>
auto makeCoreCallbackState(Promise<T>&& p, F&& f) noexcept(
    noexcept(CoreCallbackState<T, F>(
        std::declval<Promise<T>&&>(),
        std::declval<F&&>()))) {
  return CoreCallbackState<T, F>(std::move(p), std::forward<F>(f));
}

template <typename T, typename R, typename... Args>
auto makeCoreCallbackState(Promise<T>&& p, R (&f)(Args...)) noexcept {
  return CoreCallbackState<T, R (*)(Args...)>(std::move(p), &f);
}

template <class T>
FutureBase<T>::FutureBase(SemiFuture<T>&& other) noexcept : core_(other.core_) {
  other.core_ = nullptr;
}

template <class T>
FutureBase<T>::FutureBase(Future<T>&& other) noexcept : core_(other.core_) {
  other.core_ = nullptr;
}

template <class T>
template <class T2, typename>
FutureBase<T>::FutureBase(T2&& val)
    : core_(Core::make(Try<T>(std::forward<T2>(val)))) {}

template <class T>
template <typename T2>
FutureBase<T>::FutureBase(
    typename std::enable_if<std::is_same<Unit, T2>::value>::type*)
    : core_(Core::make(Try<T>(T()))) {}

template <class T>
template <
    class... Args,
    typename std::enable_if<std::is_constructible<T, Args&&...>::value, int>::
        type>
FutureBase<T>::FutureBase(in_place_t, Args&&... args)
    : core_(Core::make(in_place, std::forward<Args>(args)...)) {}

template <class T>
void FutureBase<T>::assign(FutureBase<T>&& other) noexcept {
  detach();
  core_ = exchange(other.core_, nullptr);
}

template <class T>
FutureBase<T>::~FutureBase() {
  detach();
}

template <class T>
T& FutureBase<T>::value() & {
  return result().value();
}

template <class T>
T const& FutureBase<T>::value() const& {
  return result().value();
}

template <class T>
T&& FutureBase<T>::value() && {
  return std::move(result().value());
}

template <class T>
T const&& FutureBase<T>::value() const&& {
  return std::move(result().value());
}

template <class T>
Try<T>& FutureBase<T>::result() & {
  return getCoreTryChecked();
}

template <class T>
Try<T> const& FutureBase<T>::result() const& {
  return getCoreTryChecked();
}

template <class T>
Try<T>&& FutureBase<T>::result() && {
  return std::move(getCoreTryChecked());
}

template <class T>
Try<T> const&& FutureBase<T>::result() const&& {
  return std::move(getCoreTryChecked());
}

template <class T>
bool FutureBase<T>::isReady() const {
  return getCore().hasResult();
}

template <class T>
bool FutureBase<T>::hasValue() const {
  return result().hasValue();
}

template <class T>
bool FutureBase<T>::hasException() const {
  return result().hasException();
}

template <class T>
void FutureBase<T>::detach() {
  if (core_) {
    core_->detachFuture();
    core_ = nullptr;
  }
}

template <class T>
void FutureBase<T>::throwIfInvalid() const {
  if (!core_) {
    throw_exception<FutureInvalid>();
  }
}

template <class T>
void FutureBase<T>::throwIfContinued() const {
  if (!core_ || core_->hasCallback()) {
    throw_exception<FutureAlreadyContinued>();
  }
}

template <class T>
Optional<Try<T>> FutureBase<T>::poll() {
  auto& core = getCore();
  return core.hasResult() ? Optional<Try<T>>(std::move(core.getTry()))
                          : Optional<Try<T>>();
}

template <class T>
void FutureBase<T>::raise(exception_wrapper exception) {
  getCore().raise(std::move(exception));
}

template <class T>
template <class F>
void FutureBase<T>::setCallback_(F&& func) {
  setCallback_(std::forward<F>(func), RequestContext::saveContext());
}

template <class T>
template <class F>
void FutureBase<T>::setCallback_(
    F&& func,
    std::shared_ptr<folly::RequestContext> context) {
  throwIfContinued();
  getCore().setCallback(std::forward<F>(func), std::move(context));
}

template <class T>
FutureBase<T>::FutureBase(futures::detail::EmptyConstruct) noexcept
    : core_(nullptr) {}

// MSVC 2017 Update 7 released with a bug that causes issues expanding to an
// empty parameter pack when invoking a templated member function. It should
// be fixed for MSVC 2017 Update 8.
// TODO: Remove.
namespace detail_msvc_15_7_workaround {
template <typename R, std::size_t S>
using IfArgsSizeIs = std::enable_if_t<R::Arg::ArgsSize::value == S, int>;
template <typename R, typename State, typename T, IfArgsSizeIs<R, 0> = 0>
decltype(auto) invoke(R, State& state, Try<T>& /* t */) {
  return state.invoke();
}
template <typename R, typename State, typename T, IfArgsSizeIs<R, 1> = 0>
decltype(auto) invoke(R, State& state, Try<T>& t) {
  using Arg0 = typename R::Arg::ArgList::FirstArg;
  return state.invoke(t.template get<R::Arg::isTry(), Arg0>());
}
template <typename R, typename State, typename T, IfArgsSizeIs<R, 0> = 0>
decltype(auto) tryInvoke(R, State& state, Try<T>& /* t */) {
  return state.tryInvoke();
}
template <typename R, typename State, typename T, IfArgsSizeIs<R, 1> = 0>
decltype(auto) tryInvoke(R, State& state, Try<T>& t) {
  using Arg0 = typename R::Arg::ArgList::FirstArg;
  return state.tryInvoke(t.template get<R::Arg::isTry(), Arg0>());
}
} // namespace detail_msvc_15_7_workaround

// then

// Variant: returns a value
// e.g. f.then([](Try<T>&& t){ return t.value(); });
template <class T>
template <typename F, typename R>
typename std::enable_if<!R::ReturnsFuture::value, typename R::Return>::type
FutureBase<T>::thenImplementation(F&& func, R) {
  static_assert(
      R::Arg::ArgsSize::value <= 1, "Then must take zero/one argument");
  typedef typename R::ReturnsFuture::Inner B;

  Promise<B> p;
  p.core_->setInterruptHandlerNoLock(this->getCore().getInterruptHandler());

  // grab the Future now before we lose our handle on the Promise
  auto sf = p.getSemiFuture();
  sf.setExecutor(this->getExecutor());
  auto f = Future<B>(sf.core_);
  sf.core_ = nullptr;

  /* This is a bit tricky.

     We can't just close over *this in case this Future gets moved. So we
     make a new dummy Future. We could figure out something more
     sophisticated that avoids making a new Future object when it can, as an
     optimization. But this is correct.

     core_ can't be moved, it is explicitly disallowed (as is copying). But
     if there's ever a reason to allow it, this is one place that makes that
     assumption and would need to be fixed. We use a standard shared pointer
     for core_ (by copying it in), which means in essence obj holds a shared
     pointer to itself.  But this shouldn't leak because Promise will not
     outlive the continuation, because Promise will setException() with a
     broken Promise if it is destructed before completed. We could use a
     weak pointer but it would have to be converted to a shared pointer when
     func is executed (because the Future returned by func may possibly
     persist beyond the callback, if it gets moved), and so it is an
     optimization to just make it shared from the get-go.

     Two subtle but important points about this design. futures::detail::Core
     has no back pointers to Future or Promise, so if Future or Promise get
     moved (and they will be moved in performant code) we don't have to do
     anything fancy. And because we store the continuation in the
     futures::detail::Core, not in the Future, we can execute the continuation
     even after the Future has gone out of scope. This is an intentional design
     decision. It is likely we will want to be able to cancel a continuation
     in some circumstances, but I think it should be explicit not implicit
     in the destruction of the Future used to create it.
     */
  this->setCallback_(
      [state = futures::detail::makeCoreCallbackState(
           std::move(p), std::forward<F>(func))](Try<T>&& t) mutable {
        if (!R::Arg::isTry() && t.hasException()) {
          state.setException(std::move(t.exception()));
        } else {
          state.setTry(makeTryWith([&] {
            return detail_msvc_15_7_workaround::invoke(R{}, state, t);
          }));
        }
      });
  return f;
}

// Pass through a simple future as it needs no deferral adaptation
template <class T>
Future<T> chainExecutor(Executor*, Future<T>&& f) {
  return std::move(f);
}

// Correctly chain a SemiFuture for deferral
template <class T>
Future<T> chainExecutor(Executor* e, SemiFuture<T>&& f) {
  if (!e) {
    e = &InlineExecutor::instance();
  }
  return std::move(f).via(e);
}

// Variant: returns a Future
// e.g. f.then([](T&& t){ return makeFuture<T>(t); });
template <class T>
template <typename F, typename R>
typename std::enable_if<R::ReturnsFuture::value, typename R::Return>::type
FutureBase<T>::thenImplementation(F&& func, R) {
  static_assert(
      R::Arg::ArgsSize::value <= 1, "Then must take zero/one argument");
  typedef typename R::ReturnsFuture::Inner B;

  Promise<B> p;
  p.core_->setInterruptHandlerNoLock(this->getCore().getInterruptHandler());

  // grab the Future now before we lose our handle on the Promise
  auto sf = p.getSemiFuture();
  auto* e = this->getExecutor();
  sf.setExecutor(e);
  auto f = Future<B>(sf.core_);
  sf.core_ = nullptr;

  this->setCallback_([state = futures::detail::makeCoreCallbackState(
                          std::move(p), std::forward<F>(func))](
                         Try<T>&& t) mutable {
    if (!R::Arg::isTry() && t.hasException()) {
      state.setException(std::move(t.exception()));
    } else {
      // Ensure that if function returned a SemiFuture we correctly chain
      // potential deferral.
      auto tf2 = detail_msvc_15_7_workaround::tryInvoke(R{}, state, t);
      if (tf2.hasException()) {
        state.setException(std::move(tf2.exception()));
      } else {
        auto statePromise = state.stealPromise();
        auto tf3 =
            chainExecutor(statePromise.core_->getExecutor(), *std::move(tf2));
        if (std::is_same<T, B>::value && statePromise.getCore().hasCallback()) {
          tf3.core_->setExecutor(statePromise.core_->getExecutor());
          auto callbackAndContext = statePromise.getCore().stealCallback();
          tf3.setCallback_(
              std::move(callbackAndContext.first),
              std::move(callbackAndContext.second));
        } else {
          tf3.setCallback_([p2 = std::move(statePromise)](Try<B>&& b) mutable {
            p2.setTry(std::move(b));
          });
        }
      }
    }
  });

  return f;
}

template <class T>
template <typename E>
SemiFuture<T>
FutureBase<T>::withinImplementation(Duration dur, E e, Timekeeper* tk) && {
  struct Context {
    explicit Context(E ex) : exception(std::move(ex)) {}
    E exception;
    Future<Unit> thisFuture;
    Promise<T> promise;
    std::atomic<bool> token{false};
  };

  std::shared_ptr<Timekeeper> tks;
  if (LIKELY(!tk)) {
    tks = folly::detail::getTimekeeperSingleton();
    tk = tks.get();
  }

  if (UNLIKELY(!tk)) {
    return makeSemiFuture<T>(FutureNoTimekeeper());
  }

  auto ctx = std::make_shared<Context>(std::move(e));

  auto f = [ctx](Try<T>&& t) {
    if (!ctx->token.exchange(true, std::memory_order_relaxed)) {
      ctx->promise.setTry(std::move(t));
    }
  };
  using R = futures::detail::callableResult<T, decltype(f)>;
  ctx->thisFuture = this->thenImplementation(std::move(f), R{});

  // Properly propagate interrupt values through futures chained after within()
  ctx->promise.setInterruptHandler(
      [weakCtx = to_weak_ptr(ctx)](const exception_wrapper& ex) {
        if (auto lockedCtx = weakCtx.lock()) {
          lockedCtx->thisFuture.raise(ex);
        }
      });

  // Have time keeper use a weak ptr to hold ctx,
  // so that ctx can be deallocated as soon as the future job finished.
  tk->after(dur).thenTry([weakCtx = to_weak_ptr(ctx)](Try<Unit>&& t) mutable {
    auto lockedCtx = weakCtx.lock();
    if (!lockedCtx) {
      // ctx already released. "this" completed first, cancel "after"
      return;
    }
    // "after" completed first, cancel "this"
    lockedCtx->thisFuture.raise(FutureTimeout());
    if (!lockedCtx->token.exchange(true, std::memory_order_relaxed)) {
      if (t.hasException()) {
        lockedCtx->promise.setException(std::move(t.exception()));
      } else {
        lockedCtx->promise.setException(std::move(lockedCtx->exception));
      }
    }
  });

  return ctx->promise.getSemiFuture();
}

/**
 * Defer work until executor is actively boosted.
 *
 * NOTE: that this executor is a private implementation detail belonging to the
 * Folly Futures library and not intended to be used elsewhere. It is designed
 * specifically for the use case of deferring work on a SemiFuture. It is NOT
 * thread safe. Please do not use for any other purpose without great care.
 */
class DeferredExecutor final : public Executor {
 public:
  void add(Func func) override {
    auto state = state_.load(std::memory_order_acquire);
    if (state == State::DETACHED) {
      return;
    }
    if (state == State::HAS_EXECUTOR) {
      executor_->add(std::move(func));
      return;
    }
    DCHECK(state == State::EMPTY);
    func_ = std::move(func);
    if (state_.compare_exchange_strong(
            state,
            State::HAS_FUNCTION,
            std::memory_order_release,
            std::memory_order_acquire)) {
      return;
    }
    DCHECK(state == State::DETACHED || state == State::HAS_EXECUTOR);
    if (state == State::DETACHED) {
      std::exchange(func_, nullptr);
      return;
    }
    executor_->add(std::exchange(func_, nullptr));
  }

  void setExecutor(folly::Executor::KeepAlive<> executor) {
    if (nestedExecutors_) {
      auto nestedExecutors = std::exchange(nestedExecutors_, nullptr);
      for (auto& nestedExecutor : *nestedExecutors) {
        nestedExecutor->setExecutor(executor.copy());
      }
    }
    executor_ = std::move(executor);
    auto state = state_.load(std::memory_order_acquire);
    if (state == State::EMPTY &&
        state_.compare_exchange_strong(
            state,
            State::HAS_EXECUTOR,
            std::memory_order_release,
            std::memory_order_acquire)) {
      return;
    }

    DCHECK(state == State::HAS_FUNCTION);
    state_.store(State::HAS_EXECUTOR, std::memory_order_release);
    executor_->add(std::exchange(func_, nullptr));
  }

  void detach() {
    if (nestedExecutors_) {
      auto nestedExecutors = std::exchange(nestedExecutors_, nullptr);
      for (auto& nestedExecutor : *nestedExecutors) {
        nestedExecutor->detach();
      }
    }
    auto state = state_.load(std::memory_order_acquire);
    if (state == State::EMPTY &&
        state_.compare_exchange_strong(
            state,
            State::DETACHED,
            std::memory_order_release,
            std::memory_order_acquire)) {
      return;
    }

    DCHECK(state == State::HAS_FUNCTION);
    state_.store(State::DETACHED, std::memory_order_release);
    std::exchange(func_, nullptr);
  }

  void setNestedExecutors(
      std::vector<folly::Executor::KeepAlive<DeferredExecutor>> executors) {
    DCHECK(!nestedExecutors_);
    nestedExecutors_ = std::make_unique<
        std::vector<folly::Executor::KeepAlive<DeferredExecutor>>>(
        std::move(executors));
  }

  static KeepAlive<DeferredExecutor> create() {
    return makeKeepAlive<DeferredExecutor>(new DeferredExecutor());
  }

 private:
  DeferredExecutor() {}

  bool keepAliveAcquire() override {
    auto keepAliveCount =
        keepAliveCount_.fetch_add(1, std::memory_order_relaxed);
    DCHECK(keepAliveCount > 0);
    return true;
  }

  void keepAliveRelease() override {
    auto keepAliveCount =
        keepAliveCount_.fetch_sub(1, std::memory_order_acq_rel);
    DCHECK(keepAliveCount > 0);
    if (keepAliveCount == 1) {
      delete this;
    }
  }

  enum class State { EMPTY, HAS_FUNCTION, HAS_EXECUTOR, DETACHED };
  std::atomic<State> state_{State::EMPTY};
  Func func_;
  folly::Executor::KeepAlive<> executor_;
  std::unique_ptr<std::vector<folly::Executor::KeepAlive<DeferredExecutor>>>
      nestedExecutors_;
  std::atomic<ssize_t> keepAliveCount_{1};
};

class WaitExecutor final : public folly::Executor {
 public:
  void add(Func func) override {
    auto wQueue = queue_.wlock();
    if (wQueue->detached) {
      return;
    }
    bool empty = wQueue->funcs.empty();
    wQueue->funcs.push_back(std::move(func));
    if (empty) {
      baton_.post();
    }
  }

  void drive() {
    baton_.wait();
    baton_.reset();
    auto funcs = std::move(queue_.wlock()->funcs);
    for (auto& func : funcs) {
      std::exchange(func, nullptr)();
    }
  }

  using Clock = std::chrono::steady_clock;

  bool driveUntil(Clock::time_point deadline) {
    if (!baton_.try_wait_until(deadline)) {
      return false;
    }
    baton_.reset();
    auto funcs = std::move(queue_.wlock()->funcs);
    for (auto& func : funcs) {
      std::exchange(func, nullptr)();
    }
    return true;
  }

  void detach() {
    // Make sure we don't hold the lock while destroying funcs.
    [&] {
      auto wQueue = queue_.wlock();
      wQueue->detached = true;
      return std::move(wQueue->funcs);
    }();
  }

  static KeepAlive<WaitExecutor> create() {
    return makeKeepAlive<WaitExecutor>(new WaitExecutor());
  }

 private:
  WaitExecutor() {}

  bool keepAliveAcquire() override {
    auto keepAliveCount =
        keepAliveCount_.fetch_add(1, std::memory_order_relaxed);
    DCHECK(keepAliveCount > 0);
    return true;
  }

  void keepAliveRelease() override {
    auto keepAliveCount =
        keepAliveCount_.fetch_sub(1, std::memory_order_acq_rel);
    DCHECK(keepAliveCount > 0);
    if (keepAliveCount == 1) {
      delete this;
    }
  }

  struct Queue {
    std::vector<Func> funcs;
    bool detached{false};
  };

  folly::Synchronized<Queue> queue_;
  FutureBatonType baton_;

  std::atomic<ssize_t> keepAliveCount_{1};
};

// Vector-like structure to play with window,
// which otherwise expects a vector of size `times`,
// which would be expensive with large `times` sizes.
struct WindowFakeVector {
  using iterator = std::vector<size_t>::iterator;

  WindowFakeVector(size_t size) : size_(size) {}

  size_t operator[](const size_t index) const {
    return index;
  }
  size_t size() const {
    return size_;
  }

 private:
  size_t size_;
};
} // namespace detail
} // namespace futures

template <class T>
SemiFuture<typename std::decay<T>::type> makeSemiFuture(T&& t) {
  return makeSemiFuture(Try<typename std::decay<T>::type>(std::forward<T>(t)));
}

// makeSemiFutureWith(SemiFuture<T>()) -> SemiFuture<T>
template <class F>
typename std::enable_if<
    isFutureOrSemiFuture<invoke_result_t<F>>::value,
    SemiFuture<typename invoke_result_t<F>::value_type>>::type
makeSemiFutureWith(F&& func) {
  using InnerType = typename isFutureOrSemiFuture<invoke_result_t<F>>::Inner;
  try {
    return std::forward<F>(func)();
  } catch (std::exception& e) {
    return makeSemiFuture<InnerType>(
        exception_wrapper(std::current_exception(), e));
  } catch (...) {
    return makeSemiFuture<InnerType>(
        exception_wrapper(std::current_exception()));
  }
}

// makeSemiFutureWith(T()) -> SemiFuture<T>
// makeSemiFutureWith(void()) -> SemiFuture<Unit>
template <class F>
typename std::enable_if<
    !(isFutureOrSemiFuture<invoke_result_t<F>>::value),
    SemiFuture<lift_unit_t<invoke_result_t<F>>>>::type
makeSemiFutureWith(F&& func) {
  using LiftedResult = lift_unit_t<invoke_result_t<F>>;
  return makeSemiFuture<LiftedResult>(
      makeTryWith([&func]() mutable { return std::forward<F>(func)(); }));
}

template <class T>
SemiFuture<T> makeSemiFuture(std::exception_ptr const& e) {
  return makeSemiFuture(Try<T>(e));
}

template <class T>
SemiFuture<T> makeSemiFuture(exception_wrapper ew) {
  return makeSemiFuture(Try<T>(std::move(ew)));
}

template <class T, class E>
typename std::
    enable_if<std::is_base_of<std::exception, E>::value, SemiFuture<T>>::type
    makeSemiFuture(E const& e) {
  return makeSemiFuture(Try<T>(make_exception_wrapper<E>(e)));
}

template <class T>
SemiFuture<T> makeSemiFuture(Try<T> t) {
  return SemiFuture<T>(SemiFuture<T>::Core::make(std::move(t)));
}

// This must be defined after the constructors to avoid a bug in MSVC
// https://connect.microsoft.com/VisualStudio/feedback/details/3142777/out-of-line-constructor-definition-after-implicit-reference-causes-incorrect-c2244
inline SemiFuture<Unit> makeSemiFuture() {
  return makeSemiFuture(Unit{});
}

template <class T>
SemiFuture<T> SemiFuture<T>::makeEmpty() {
  return SemiFuture<T>(futures::detail::EmptyConstruct{});
}

template <class T>
typename SemiFuture<T>::DeferredExecutor* SemiFuture<T>::getDeferredExecutor()
    const {
  if (auto executor = this->getExecutor()) {
    assert(dynamic_cast<DeferredExecutor*>(executor) != nullptr);
    return static_cast<DeferredExecutor*>(executor);
  }
  return nullptr;
}

template <class T>
folly::Executor::KeepAlive<typename SemiFuture<T>::DeferredExecutor>
SemiFuture<T>::stealDeferredExecutor() const {
  if (auto executor = this->getExecutor()) {
    assert(dynamic_cast<DeferredExecutor*>(executor) != nullptr);
    auto executorKeepAlive =
        folly::getKeepAliveToken(static_cast<DeferredExecutor*>(executor));
    this->core_->setExecutor(nullptr);
    return executorKeepAlive;
  }
  return {};
}

template <class T>
void SemiFuture<T>::releaseDeferredExecutor(Core* core) {
  if (!core) {
    return;
  }
  if (auto executor = core->getExecutor()) {
    assert(dynamic_cast<DeferredExecutor*>(executor) != nullptr);
    static_cast<DeferredExecutor*>(executor)->detach();
    core->setExecutor(nullptr);
  }
}

template <class T>
SemiFuture<T>::~SemiFuture() {
  releaseDeferredExecutor(this->core_);
}

template <class T>
SemiFuture<T>::SemiFuture(SemiFuture<T>&& other) noexcept
    : futures::detail::FutureBase<T>(std::move(other)) {}

template <class T>
SemiFuture<T>::SemiFuture(Future<T>&& other) noexcept
    : futures::detail::FutureBase<T>(std::move(other)) {
  // SemiFuture should not have an executor on construction
  if (this->core_) {
    this->setExecutor(nullptr);
  }
}

template <class T>
SemiFuture<T>& SemiFuture<T>::operator=(SemiFuture<T>&& other) noexcept {
  releaseDeferredExecutor(this->core_);
  this->assign(std::move(other));
  return *this;
}

template <class T>
SemiFuture<T>& SemiFuture<T>::operator=(Future<T>&& other) noexcept {
  releaseDeferredExecutor(this->core_);
  this->assign(std::move(other));
  // SemiFuture should not have an executor on construction
  if (this->core_) {
    this->setExecutor(nullptr);
  }
  return *this;
}

template <class T>
Future<T> SemiFuture<T>::via(
    Executor::KeepAlive<> executor,
    int8_t priority) && {
  if (!executor) {
    throw_exception<FutureNoExecutor>();
  }

  if (auto deferredExecutor = getDeferredExecutor()) {
    deferredExecutor->setExecutor(executor.copy());
  }

  auto newFuture = Future<T>(this->core_);
  this->core_ = nullptr;
  newFuture.setExecutor(std::move(executor), priority);

  return newFuture;
}

template <class T>
Future<T> SemiFuture<T>::via(Executor* executor, int8_t priority) && {
  return std::move(*this).via(getKeepAliveToken(executor), priority);
}

template <class T>
Future<T> SemiFuture<T>::toUnsafeFuture() && {
  return std::move(*this).via(&InlineExecutor::instance());
}

template <class T>
template <typename F>
SemiFuture<typename futures::detail::tryCallableResult<T, F>::value_type>
SemiFuture<T>::defer(F&& func) && {
  DeferredExecutor* deferredExecutor = getDeferredExecutor();
  if (!deferredExecutor) {
    auto newDeferredExecutor = DeferredExecutor::create();
    deferredExecutor = newDeferredExecutor.get();
    this->setExecutor(std::move(newDeferredExecutor));
  }

  auto sf = Future<T>(this->core_).thenTry(std::forward<F>(func)).semi();
  this->core_ = nullptr;
  // Carry deferred executor through chain as constructor from Future will
  // nullify it
  sf.setExecutor(deferredExecutor);
  return sf;
}

template <class T>
template <typename F>
SemiFuture<typename futures::detail::valueCallableResult<T, F>::value_type>
SemiFuture<T>::deferValue(F&& func) && {
  return std::move(*this).defer([f = std::forward<F>(func)](
                                    folly::Try<T>&& t) mutable {
    return std::forward<F>(f)(
        t.template get<
            false,
            typename futures::detail::valueCallableResult<T, F>::FirstArg>());
  });
}

template <class T>
template <class ExceptionType, class F>
SemiFuture<T> SemiFuture<T>::deferError(F&& func) && {
  return std::move(*this).defer(
      [func = std::forward<F>(func)](Try<T>&& t) mutable {
        if (auto e = t.template tryGetExceptionObject<ExceptionType>()) {
          return makeSemiFutureWith(
              [&]() mutable { return std::forward<F>(func)(*e); });
        } else {
          return makeSemiFuture<T>(std::move(t));
        }
      });
}

template <class T>
template <class F>
SemiFuture<T> SemiFuture<T>::deferError(F&& func) && {
  return std::move(*this).defer(
      [func = std::forward<F>(func)](Try<T> t) mutable {
        if (t.hasException()) {
          return makeSemiFutureWith([&]() mutable {
            return std::forward<F>(func)(std::move(t.exception()));
          });
        } else {
          return makeSemiFuture<T>(std::move(t));
        }
      });
}

template <typename T>
SemiFuture<T> SemiFuture<T>::delayed(Duration dur, Timekeeper* tk) && {
  return collectAllSemiFuture(*this, futures::sleep(dur, tk))
      .toUnsafeFuture()
      .thenValue([](std::tuple<Try<T>, Try<Unit>> tup) {
        Try<T>& t = std::get<0>(tup);
        return makeFuture<T>(std::move(t));
      });
}

template <class T>
Future<T> Future<T>::makeEmpty() {
  return Future<T>(futures::detail::EmptyConstruct{});
}

template <class T>
Future<T>::Future(Future<T>&& other) noexcept
    : futures::detail::FutureBase<T>(std::move(other)) {}

template <class T>
Future<T>& Future<T>::operator=(Future<T>&& other) noexcept {
  this->assign(std::move(other));
  return *this;
}

template <class T>
template <
    class T2,
    typename std::enable_if<
        !std::is_same<T, typename std::decay<T2>::type>::value &&
            std::is_constructible<T, T2&&>::value &&
            std::is_convertible<T2&&, T>::value,
        int>::type>
Future<T>::Future(Future<T2>&& other)
    : Future(
          std::move(other).thenValue([](T2&& v) { return T(std::move(v)); })) {}

template <class T>
template <
    class T2,
    typename std::enable_if<
        !std::is_same<T, typename std::decay<T2>::type>::value &&
            std::is_constructible<T, T2&&>::value &&
            !std::is_convertible<T2&&, T>::value,
        int>::type>
Future<T>::Future(Future<T2>&& other)
    : Future(
          std::move(other).thenValue([](T2&& v) { return T(std::move(v)); })) {}

template <class T>
template <
    class T2,
    typename std::enable_if<
        !std::is_same<T, typename std::decay<T2>::type>::value &&
            std::is_constructible<T, T2&&>::value,
        int>::type>
Future<T>& Future<T>::operator=(Future<T2>&& other) {
  return operator=(
      std::move(other).thenValue([](T2&& v) { return T(std::move(v)); }));
}

// unwrap

template <class T>
template <class F>
typename std::
    enable_if<isFuture<F>::value, Future<typename isFuture<T>::Inner>>::type
    Future<T>::unwrap() && {
  return std::move(*this).thenValue(
      [](Future<typename isFuture<T>::Inner> internal_future) {
        return internal_future;
      });
}

template <class T>
Future<T> Future<T>::via(Executor::KeepAlive<> executor, int8_t priority) && {
  this->setExecutor(std::move(executor), priority);

  auto newFuture = Future<T>(this->core_);
  this->core_ = nullptr;
  return newFuture;
}

template <class T>
Future<T> Future<T>::via(Executor* executor, int8_t priority) && {
  return std::move(*this).via(getKeepAliveToken(executor), priority);
}

template <class T>
Future<T> Future<T>::via(Executor::KeepAlive<> executor, int8_t priority) & {
  this->throwIfInvalid();
  Promise<T> p;
  auto sf = p.getSemiFuture();
  auto func = [p = std::move(p)](Try<T>&& t) mutable {
    p.setTry(std::move(t));
  };
  using R = futures::detail::callableResult<T, decltype(func)>;
  this->thenImplementation(std::move(func), R{});
  // Construct future from semifuture manually because this may not have
  // an executor set due to legacy code. This means we can bypass the executor
  // check in SemiFuture::via
  auto f = Future<T>(sf.core_);
  sf.core_ = nullptr;
  return std::move(f).via(std::move(executor), priority);
}

template <class T>
Future<T> Future<T>::via(Executor* executor, int8_t priority) & {
  return via(getKeepAliveToken(executor), priority);
}

template <typename T>
template <typename R, typename Caller, typename... Args>
Future<typename isFuture<R>::Inner> Future<T>::then(
    R (Caller::*func)(Args...),
    Caller* instance) && {
  typedef typename std::remove_cv<typename std::remove_reference<
      typename futures::detail::ArgType<Args...>::FirstArg>::type>::type
      FirstArg;

  return std::move(*this).thenTry([instance, func](Try<T>&& t) {
    return (instance->*func)(t.template get<isTry<FirstArg>::value, Args>()...);
  });
}

template <class T>
template <typename F>
Future<typename futures::detail::tryCallableResult<T, F>::value_type>
Future<T>::thenTry(F&& func) && {
  auto lambdaFunc = [f = std::forward<F>(func)](folly::Try<T>&& t) mutable {
    return std::forward<F>(f)(std::move(t));
  };
  using R = futures::detail::tryCallableResult<T, decltype(lambdaFunc)>;
  return this->thenImplementation(std::move(lambdaFunc), R{});
}

template <class T>
template <typename F>
Future<typename futures::detail::valueCallableResult<T, F>::value_type>
Future<T>::thenValue(F&& func) && {
  auto lambdaFunc = [f = std::forward<F>(func)](folly::Try<T>&& t) mutable {
    return std::forward<F>(f)(
        t.template get<
            false,
            typename futures::detail::valueCallableResult<T, F>::FirstArg>());
  };
  using R = futures::detail::tryCallableResult<T, decltype(lambdaFunc)>;
  return this->thenImplementation(std::move(lambdaFunc), R{});
}

template <class T>
template <class ExceptionType, class F>
Future<T> Future<T>::thenError(F&& func) && {
  // Forward to onError but ensure that returned future carries the executor
  // Allow for applying to future with null executor while this is still
  // possible.
  auto* e = this->getExecutor();
  return std::move(*this)
      .onError([func = std::forward<F>(func)](ExceptionType& ex) mutable {
        return std::forward<F>(func)(ex);
      })
      .via(e ? e : &InlineExecutor::instance());
}

template <class T>
template <class F>
Future<T> Future<T>::thenError(F&& func) && {
  // Forward to onError but ensure that returned future carries the executor
  // Allow for applying to future with null executor while this is still
  // possible.
  auto* e = this->getExecutor();
  return std::move(*this)
      .onError([func = std::forward<F>(func)](
                   folly::exception_wrapper&& ex) mutable {
        return std::forward<F>(func)(std::move(ex));
      })
      .via(e ? e : &InlineExecutor::instance());
}

template <class T>
Future<Unit> Future<T>::then() && {
  return std::move(*this).thenValue([](T&&) {});
}

// onError where the callback returns T
template <class T>
template <class F>
typename std::enable_if<
    !is_invocable<F, exception_wrapper>::value &&
        !futures::detail::Extract<F>::ReturnsFuture::value,
    Future<T>>::type
Future<T>::onError(F&& func) && {
  typedef std::remove_reference_t<
      typename futures::detail::Extract<F>::FirstArg>
      Exn;
  static_assert(
      std::is_same<typename futures::detail::Extract<F>::RawReturn, T>::value,
      "Return type of onError callback must be T or Future<T>");

  Promise<T> p;
  p.core_->setInterruptHandlerNoLock(this->getCore().getInterruptHandler());
  auto sf = p.getSemiFuture();

  this->setCallback_(
      [state = futures::detail::makeCoreCallbackState(
           std::move(p), std::forward<F>(func))](Try<T>&& t) mutable {
        if (auto e = t.template tryGetExceptionObject<Exn>()) {
          state.setTry(makeTryWith([&] { return state.invoke(*e); }));
        } else {
          state.setTry(std::move(t));
        }
      });

  // Allow for applying to future with null executor while this is still
  // possible.
  // TODO(T26801487): Should have an executor
  return std::move(sf).via(&InlineExecutor::instance());
}

// onError where the callback returns Future<T>
template <class T>
template <class F>
typename std::enable_if<
    !is_invocable<F, exception_wrapper>::value &&
        futures::detail::Extract<F>::ReturnsFuture::value,
    Future<T>>::type
Future<T>::onError(F&& func) && {
  static_assert(
      std::is_same<typename futures::detail::Extract<F>::Return, Future<T>>::
          value,
      "Return type of onError callback must be T or Future<T>");
  typedef std::remove_reference_t<
      typename futures::detail::Extract<F>::FirstArg>
      Exn;

  Promise<T> p;
  auto sf = p.getSemiFuture();

  this->setCallback_(
      [state = futures::detail::makeCoreCallbackState(
           std::move(p), std::forward<F>(func))](Try<T>&& t) mutable {
        if (auto e = t.template tryGetExceptionObject<Exn>()) {
          auto tf2 = state.tryInvoke(*e);
          if (tf2.hasException()) {
            state.setException(std::move(tf2.exception()));
          } else {
            tf2->setCallback_([p = state.stealPromise()](Try<T>&& t3) mutable {
              p.setTry(std::move(t3));
            });
          }
        } else {
          state.setTry(std::move(t));
        }
      });

  // Allow for applying to future with null executor while this is still
  // possible.
  // TODO(T26801487): Should have an executor
  return std::move(sf).via(&InlineExecutor::instance());
}

template <class T>
template <class F>
Future<T> Future<T>::ensure(F&& func) && {
  return std::move(*this).then(
      [funcw = std::forward<F>(func)](Try<T>&& t) mutable {
        std::forward<F>(funcw)();
        return makeFuture(std::move(t));
      });
}

template <class T>
template <class F>
Future<T> Future<T>::onTimeout(Duration dur, F&& func, Timekeeper* tk) && {
  return std::move(*this).within(dur, tk).template thenError<FutureTimeout>(
      [funcw = std::forward<F>(func)](auto const&) mutable {
        return std::forward<F>(funcw)();
      });
}

template <class T>
template <class F>
typename std::enable_if<
    is_invocable<F, exception_wrapper>::value &&
        futures::detail::Extract<F>::ReturnsFuture::value,
    Future<T>>::type
Future<T>::onError(F&& func) && {
  static_assert(
      std::is_same<typename futures::detail::Extract<F>::Return, Future<T>>::
          value,
      "Return type of onError callback must be T or Future<T>");

  Promise<T> p;
  auto sf = p.getSemiFuture();
  this->setCallback_(
      [state = futures::detail::makeCoreCallbackState(
           std::move(p), std::forward<F>(func))](Try<T> t) mutable {
        if (t.hasException()) {
          auto tf2 = state.tryInvoke(std::move(t.exception()));
          if (tf2.hasException()) {
            state.setException(std::move(tf2.exception()));
          } else {
            tf2->setCallback_([p = state.stealPromise()](Try<T>&& t3) mutable {
              p.setTry(std::move(t3));
            });
          }
        } else {
          state.setTry(std::move(t));
        }
      });

  // Allow for applying to future with null executor while this is still
  // possible.
  // TODO(T26801487): Should have an executor
  return std::move(sf).via(&InlineExecutor::instance());
}

// onError(exception_wrapper) that returns T
template <class T>
template <class F>
typename std::enable_if<
    is_invocable<F, exception_wrapper>::value &&
        !futures::detail::Extract<F>::ReturnsFuture::value,
    Future<T>>::type
Future<T>::onError(F&& func) && {
  static_assert(
      std::is_same<typename futures::detail::Extract<F>::Return, Future<T>>::
          value,
      "Return type of onError callback must be T or Future<T>");

  Promise<T> p;
  auto sf = p.getSemiFuture();
  this->setCallback_(
      [state = futures::detail::makeCoreCallbackState(
           std::move(p), std::forward<F>(func))](Try<T>&& t) mutable {
        if (t.hasException()) {
          state.setTry(makeTryWith(
              [&] { return state.invoke(std::move(t.exception())); }));
        } else {
          state.setTry(std::move(t));
        }
      });

  // Allow for applying to future with null executor while this is still
  // possible.
  // TODO(T26801487): Should have an executor
  return std::move(sf).via(&InlineExecutor::instance());
}

template <class Func>
auto via(Executor* x, Func&& func) -> Future<
    typename isFutureOrSemiFuture<decltype(std::declval<Func>()())>::Inner> {
  // TODO make this actually more performant. :-P #7260175
  return via(x).thenValue([f = std::forward<Func>(func)](auto&&) mutable {
    return std::forward<Func>(f)();
  });
}

template <class Func>
auto via(Executor::KeepAlive<> x, Func&& func) -> Future<
    typename isFutureOrSemiFuture<decltype(std::declval<Func>()())>::Inner> {
  return via(std::move(x))
      .thenValue([f = std::forward<Func>(func)](auto&&) mutable {
        return std::forward<Func>(f)();
      });
}

// makeFuture

template <class T>
Future<typename std::decay<T>::type> makeFuture(T&& t) {
  return makeFuture(Try<typename std::decay<T>::type>(std::forward<T>(t)));
}

inline Future<Unit> makeFuture() {
  return makeFuture(Unit{});
}

// makeFutureWith(Future<T>()) -> Future<T>
template <class F>
typename std::
    enable_if<isFuture<invoke_result_t<F>>::value, invoke_result_t<F>>::type
    makeFutureWith(F&& func) {
  using InnerType = typename isFuture<invoke_result_t<F>>::Inner;
  try {
    return std::forward<F>(func)();
  } catch (std::exception& e) {
    return makeFuture<InnerType>(
        exception_wrapper(std::current_exception(), e));
  } catch (...) {
    return makeFuture<InnerType>(exception_wrapper(std::current_exception()));
  }
}

// makeFutureWith(T()) -> Future<T>
// makeFutureWith(void()) -> Future<Unit>
template <class F>
typename std::enable_if<
    !(isFuture<invoke_result_t<F>>::value),
    Future<lift_unit_t<invoke_result_t<F>>>>::type
makeFutureWith(F&& func) {
  using LiftedResult = lift_unit_t<invoke_result_t<F>>;
  return makeFuture<LiftedResult>(
      makeTryWith([&func]() mutable { return std::forward<F>(func)(); }));
}

template <class T>
Future<T> makeFuture(std::exception_ptr const& e) {
  return makeFuture(Try<T>(e));
}

template <class T>
Future<T> makeFuture(exception_wrapper ew) {
  return makeFuture(Try<T>(std::move(ew)));
}

template <class T, class E>
typename std::enable_if<std::is_base_of<std::exception, E>::value, Future<T>>::
    type
    makeFuture(E const& e) {
  return makeFuture(Try<T>(make_exception_wrapper<E>(e)));
}

template <class T>
Future<T> makeFuture(Try<T> t) {
  return Future<T>(Future<T>::Core::make(std::move(t)));
}

// via
Future<Unit> via(Executor* executor, int8_t priority) {
  return makeFuture().via(executor, priority);
}

Future<Unit> via(Executor::KeepAlive<> executor, int8_t priority) {
  return makeFuture().via(std::move(executor), priority);
}

namespace futures {
namespace detail {

template <typename V, typename... Fs, std::size_t... Is>
FOLLY_ALWAYS_INLINE FOLLY_ATTR_VISIBILITY_HIDDEN void
foreach_(index_sequence<Is...>, V&& v, Fs&&... fs) {
  using _ = int[];
  void(_{0, (void(v(index_constant<Is>{}, static_cast<Fs&&>(fs))), 0)...});
}
template <typename V, typename... Fs>
FOLLY_ALWAYS_INLINE FOLLY_ATTR_VISIBILITY_HIDDEN void foreach(
    V&& v,
    Fs&&... fs) {
  using _ = index_sequence_for<Fs...>;
  foreach_(_{}, static_cast<V&&>(v), static_cast<Fs&&>(fs)...);
}

template <typename T>
DeferredExecutor* getDeferredExecutor(SemiFuture<T>& future) {
  return future.getDeferredExecutor();
}

template <typename T>
folly::Executor::KeepAlive<DeferredExecutor> stealDeferredExecutor(
    SemiFuture<T>& future) {
  return future.stealDeferredExecutor();
}

template <typename T>
folly::Executor::KeepAlive<DeferredExecutor> stealDeferredExecutor(Future<T>&) {
  return {};
}

template <typename... Ts>
void stealDeferredExecutorsVariadic(
    std::vector<folly::Executor::KeepAlive<DeferredExecutor>>& executors,
    Ts&... ts) {
  auto foreach = [&](auto& future) {
    if (auto executor = stealDeferredExecutor(future)) {
      executors.push_back(std::move(executor));
    }
    return folly::unit;
  };
  [](...) {}(foreach(ts)...);
}

template <class InputIterator>
void stealDeferredExecutors(
    std::vector<folly::Executor::KeepAlive<DeferredExecutor>>& executors,
    InputIterator first,
    InputIterator last) {
  for (auto it = first; it != last; ++it) {
    if (auto executor = stealDeferredExecutor(*it)) {
      executors.push_back(std::move(executor));
    }
  }
}
} // namespace detail
} // namespace futures

// collectAll (variadic)

template <typename... Fs>
SemiFuture<std::tuple<Try<typename remove_cvref_t<Fs>::value_type>...>>
collectAllSemiFuture(Fs&&... fs) {
  using Result = std::tuple<Try<typename remove_cvref_t<Fs>::value_type>...>;
  struct Context {
    ~Context() {
      p.setValue(std::move(results));
    }
    Promise<Result> p;
    Result results;
  };

  std::vector<folly::Executor::KeepAlive<futures::detail::DeferredExecutor>>
      executors;
  futures::detail::stealDeferredExecutorsVariadic(executors, fs...);

  auto ctx = std::make_shared<Context>();
  futures::detail::foreach(
      [&](auto i, auto&& f) {
        f.setCallback_([i, ctx](auto&& t) {
          std::get<i.value>(ctx->results) = std::move(t);
        });
      },
      static_cast<Fs&&>(fs)...);

  auto future = ctx->p.getSemiFuture();
  if (!executors.empty()) {
    auto work = [](Try<typename decltype(future)::value_type>&& t) {
      return std::move(t).value();
    };
    future = std::move(future).defer(work);
    auto deferredExecutor = futures::detail::getDeferredExecutor(future);
    deferredExecutor->setNestedExecutors(std::move(executors));
  }
  return future;
}

template <typename... Fs>
Future<std::tuple<Try<typename remove_cvref_t<Fs>::value_type>...>> collectAll(
    Fs&&... fs) {
  return collectAllSemiFuture(std::forward<Fs>(fs)...).toUnsafeFuture();
}

// collectAll (iterator)

template <class InputIterator>
SemiFuture<std::vector<
    Try<typename std::iterator_traits<InputIterator>::value_type::value_type>>>
collectAllSemiFuture(InputIterator first, InputIterator last) {
  using F = typename std::iterator_traits<InputIterator>::value_type;
  using T = typename F::value_type;

  struct Context {
    explicit Context(size_t n) : results(n) {}
    ~Context() {
      p.setValue(std::move(results));
    }
    Promise<std::vector<Try<T>>> p;
    std::vector<Try<T>> results;
  };

  std::vector<folly::Executor::KeepAlive<futures::detail::DeferredExecutor>>
      executors;
  futures::detail::stealDeferredExecutors(executors, first, last);

  auto ctx = std::make_shared<Context>(size_t(std::distance(first, last)));

  for (size_t i = 0; first != last; ++first, ++i) {
    first->setCallback_(
        [i, ctx](Try<T>&& t) { ctx->results[i] = std::move(t); });
  }

  auto future = ctx->p.getSemiFuture();
  if (!executors.empty()) {
    future = std::move(future).defer(
        [](Try<typename decltype(future)::value_type>&& t) {
          return std::move(t).value();
        });
    auto deferredExecutor = futures::detail::getDeferredExecutor(future);
    deferredExecutor->setNestedExecutors(std::move(executors));
  }
  return future;
}

template <class InputIterator>
Future<std::vector<
    Try<typename std::iterator_traits<InputIterator>::value_type::value_type>>>
collectAll(InputIterator first, InputIterator last) {
  return collectAllSemiFuture(first, last).toUnsafeFuture();
}

// collect (iterator)

// TODO(T26439406): Make return SemiFuture
template <class InputIterator>
Future<std::vector<
    typename std::iterator_traits<InputIterator>::value_type::value_type>>
collect(InputIterator first, InputIterator last) {
  using F = typename std::iterator_traits<InputIterator>::value_type;
  using T = typename F::value_type;

  struct Context {
    explicit Context(size_t n) : result(n) {
      finalResult.reserve(n);
    }
    ~Context() {
      if (!threw.load(std::memory_order_relaxed)) {
        // map Optional<T> -> T
        std::transform(
            result.begin(),
            result.end(),
            std::back_inserter(finalResult),
            [](Optional<T>& o) { return std::move(o.value()); });
        p.setValue(std::move(finalResult));
      }
    }
    Promise<std::vector<T>> p;
    std::vector<Optional<T>> result;
    std::vector<T> finalResult;
    std::atomic<bool> threw{false};
  };

  auto ctx = std::make_shared<Context>(std::distance(first, last));
  for (size_t i = 0; first != last; ++first, ++i) {
    first->setCallback_([i, ctx](Try<T>&& t) {
      if (t.hasException()) {
        if (!ctx->threw.exchange(true, std::memory_order_relaxed)) {
          ctx->p.setException(std::move(t.exception()));
        }
      } else if (!ctx->threw.load(std::memory_order_relaxed)) {
        ctx->result[i] = std::move(t.value());
      }
    });
  }
  return ctx->p.getSemiFuture().via(&InlineExecutor::instance());
}

// collect (variadic)

// TODO(T26439406): Make return SemiFuture
template <typename... Fs>
Future<std::tuple<typename remove_cvref_t<Fs>::value_type...>> collect(
    Fs&&... fs) {
  using Result = std::tuple<typename remove_cvref_t<Fs>::value_type...>;
  struct Context {
    ~Context() {
      if (!threw.load(std::memory_order_relaxed)) {
        p.setValue(unwrapTryTuple(std::move(results)));
      }
    }
    Promise<Result> p;
    std::tuple<Try<typename remove_cvref_t<Fs>::value_type>...> results;
    std::atomic<bool> threw{false};
  };

  auto ctx = std::make_shared<Context>();
  futures::detail::foreach(
      [&](auto i, auto&& f) {
        f.setCallback_([i, ctx](auto&& t) {
          if (t.hasException()) {
            if (!ctx->threw.exchange(true, std::memory_order_relaxed)) {
              ctx->p.setException(std::move(t.exception()));
            }
          } else if (!ctx->threw.load(std::memory_order_relaxed)) {
            std::get<i.value>(ctx->results) = std::move(t);
          }
        });
      },
      static_cast<Fs&&>(fs)...);
  return ctx->p.getSemiFuture().via(&InlineExecutor::instance());
}

// collectAny (iterator)

// TODO(T26439406): Make return SemiFuture
template <class InputIterator>
Future<std::pair<
    size_t,
    Try<typename std::iterator_traits<InputIterator>::value_type::value_type>>>
collectAny(InputIterator first, InputIterator last) {
  using F = typename std::iterator_traits<InputIterator>::value_type;
  using T = typename F::value_type;

  struct Context {
    Promise<std::pair<size_t, Try<T>>> p;
    std::atomic<bool> done{false};
  };

  auto ctx = std::make_shared<Context>();
  for (size_t i = 0; first != last; ++first, ++i) {
    first->setCallback_([i, ctx](Try<T>&& t) {
      if (!ctx->done.exchange(true, std::memory_order_relaxed)) {
        ctx->p.setValue(std::make_pair(i, std::move(t)));
      }
    });
  }
  return ctx->p.getSemiFuture().via(&InlineExecutor::instance());
}

// collectAnyWithoutException (iterator)

// TODO(T26439406): Make return SemiFuture
template <class InputIterator>
Future<std::pair<
    size_t,
    typename std::iterator_traits<InputIterator>::value_type::value_type>>
collectAnyWithoutException(InputIterator first, InputIterator last) {
  using F = typename std::iterator_traits<InputIterator>::value_type;
  using T = typename F::value_type;

  struct Context {
    Context(size_t n) : nTotal(n) {}
    Promise<std::pair<size_t, T>> p;
    std::atomic<bool> done{false};
    std::atomic<size_t> nFulfilled{0};
    size_t nTotal;
  };

  auto ctx = std::make_shared<Context>(size_t(std::distance(first, last)));
  for (size_t i = 0; first != last; ++first, ++i) {
    first->setCallback_([i, ctx](Try<T>&& t) {
      if (!t.hasException() &&
          !ctx->done.exchange(true, std::memory_order_relaxed)) {
        ctx->p.setValue(std::make_pair(i, std::move(t.value())));
      } else if (
          ctx->nFulfilled.fetch_add(1, std::memory_order_relaxed) + 1 ==
          ctx->nTotal) {
        ctx->p.setException(t.exception());
      }
    });
  }
  return ctx->p.getSemiFuture().via(&InlineExecutor::instance());
}

// collectN (iterator)

template <class InputIterator>
SemiFuture<std::vector<std::pair<
    size_t,
    Try<typename std::iterator_traits<InputIterator>::value_type::value_type>>>>
collectN(InputIterator first, InputIterator last, size_t n) {
  using F = typename std::iterator_traits<InputIterator>::value_type;
  using T = typename F::value_type;
  using Result = std::vector<std::pair<size_t, Try<T>>>;

  struct Context {
    explicit Context(size_t numFutures, size_t min_)
        : v(numFutures), min(min_) {}

    std::vector<Optional<Try<T>>> v;
    size_t min;
    std::atomic<size_t> completed = {0}; // # input futures completed
    std::atomic<size_t> stored = {0}; // # output values stored
    Promise<Result> p;
  };

  assert(n > 0);
  assert(std::distance(first, last) >= 0);

  if (size_t(std::distance(first, last)) < n) {
    return SemiFuture<Result>(
        exception_wrapper(std::runtime_error("Not enough futures")));
  }

  // for each completed Future, increase count and add to vector, until we
  // have n completed futures at which point we fulfil our Promise with the
  // vector
  auto ctx = std::make_shared<Context>(size_t(std::distance(first, last)), n);
  for (size_t i = 0; first != last; ++first, ++i) {
    first->setCallback_([i, ctx](Try<T>&& t) {
      // relaxed because this guards control but does not guard data
      auto const c = 1 + ctx->completed.fetch_add(1, std::memory_order_relaxed);
      if (c > ctx->min) {
        return;
      }
      ctx->v[i] = std::move(t);

      // release because the stored values in all threads must be visible below
      // acquire because no stored value is permitted to be fetched early
      auto const s = 1 + ctx->stored.fetch_add(1, std::memory_order_acq_rel);
      if (s < ctx->min) {
        return;
      }
      Result result;
      result.reserve(ctx->completed.load());
      for (size_t j = 0; j < ctx->v.size(); ++j) {
        auto& entry = ctx->v[j];
        if (entry.hasValue()) {
          result.emplace_back(j, std::move(entry).value());
        }
      }
      ctx->p.setTry(Try<Result>(std::move(result)));
    });
  }

  return ctx->p.getSemiFuture();
}

// reduce (iterator)

template <class It, class T, class F>
Future<T> reduce(It first, It last, T&& initial, F&& func) {
  if (first == last) {
    return makeFuture(std::forward<T>(initial));
  }

  typedef typename std::iterator_traits<It>::value_type::value_type ItT;
  typedef typename std::
      conditional<is_invocable<F, T&&, Try<ItT>&&>::value, Try<ItT>, ItT>::type
          Arg;
  typedef isTry<Arg> IsTry;

  auto sfunc = std::make_shared<std::decay_t<F>>(std::forward<F>(func));

  auto f = std::move(*first).thenTry(
      [initial = std::forward<T>(initial), sfunc](Try<ItT>&& head) mutable {
        return (*sfunc)(
            std::move(initial), head.template get<IsTry::value, Arg&&>());
      });

  for (++first; first != last; ++first) {
    f = collectAllSemiFuture(f, *first).toUnsafeFuture().thenValue(
        [sfunc](std::tuple<Try<T>, Try<ItT>>&& t) {
          return (*sfunc)(
              std::move(std::get<0>(t).value()),
              // Either return a ItT&& or a Try<ItT>&& depending
              // on the type of the argument of func.
              std::get<1>(t).template get<IsTry::value, Arg&&>());
        });
  }

  return f;
}

// window (collection)

template <class Collection, class F, class ItT, class Result>
std::vector<Future<Result>> window(Collection input, F func, size_t n) {
  // Use global QueuedImmediateExecutor singleton to avoid stack overflow.
  auto executor = &QueuedImmediateExecutor::instance();
  return window(executor, std::move(input), std::move(func), n);
}

template <class F>
auto window(size_t times, F func, size_t n)
    -> std::vector<invoke_result_t<F, size_t>> {
  return window(futures::detail::WindowFakeVector(times), std::move(func), n);
}

template <class Collection, class F, class ItT, class Result>
std::vector<Future<Result>>
window(Executor* executor, Collection input, F func, size_t n) {
  return window(
      getKeepAliveToken(executor), std::move(input), std::move(func), n);
}

template <class Collection, class F, class ItT, class Result>
std::vector<Future<Result>>
window(Executor::KeepAlive<> executor, Collection input, F func, size_t n) {
  struct WindowContext {
    WindowContext(
        Executor::KeepAlive<> executor_,
        Collection&& input_,
        F&& func_)
        : executor(std::move(executor_)),
          input(std::move(input_)),
          promises(input.size()),
          func(std::move(func_)) {}
    std::atomic<size_t> i{0};
    Executor::KeepAlive<> executor;
    Collection input;
    std::vector<Promise<Result>> promises;
    F func;

    static void spawn(std::shared_ptr<WindowContext> ctx) {
      size_t i = ctx->i.fetch_add(1, std::memory_order_relaxed);
      if (i < ctx->input.size()) {
        auto fut = makeSemiFutureWith(
            [&] { return ctx->func(std::move(ctx->input[i])); });
        fut.setCallback_([ctx = std::move(ctx), i](Try<Result>&& t) mutable {
          ctx->executor->add(
              [ctx = std::move(ctx), i, t = std::move(t)]() mutable {
                ctx->promises[i].setTry(std::move(t));
                // Chain another future onto this one
                spawn(std::move(ctx));
              });
        });
      }
    }
  };

  auto max = std::min(n, input.size());

  auto ctx = std::make_shared<WindowContext>(
      executor.copy(), std::move(input), std::move(func));

  // Start the first n Futures
  for (size_t i = 0; i < max; ++i) {
    executor->add([ctx]() mutable { WindowContext::spawn(std::move(ctx)); });
  }

  std::vector<Future<Result>> futures;
  futures.reserve(ctx->promises.size());
  for (auto& promise : ctx->promises) {
    futures.emplace_back(promise.getSemiFuture().via(executor.copy()));
  }

  return futures;
}

// reduce

template <class T>
template <class I, class F>
Future<I> Future<T>::reduce(I&& initial, F&& func) && {
  return std::move(*this).thenValue(
      [minitial = std::forward<I>(initial),
       mfunc = std::forward<F>(func)](T&& vals) mutable {
        auto ret = std::move(minitial);
        for (auto& val : vals) {
          ret = mfunc(std::move(ret), std::move(val));
        }
        return ret;
      });
}

// unorderedReduce (iterator)

// TODO(T26439406): Make return SemiFuture
template <class It, class T, class F>
Future<T> unorderedReduce(It first, It last, T initial, F func) {
  using ItF = typename std::iterator_traits<It>::value_type;
  using ItT = typename ItF::value_type;
  using Arg = MaybeTryArg<F, T, ItT>;

  if (first == last) {
    return makeFuture(std::move(initial));
  }

  typedef isTry<Arg> IsTry;

  struct Context {
    Context(T&& memo, F&& fn, size_t n)
        : lock_(),
          memo_(makeFuture<T>(std::move(memo))),
          func_(std::move(fn)),
          numThens_(0),
          numFutures_(n),
          promise_() {}

    folly::MicroSpinLock lock_; // protects memo_ and numThens_
    Future<T> memo_;
    F func_;
    size_t numThens_; // how many Futures completed and called .then()
    size_t numFutures_; // how many Futures in total
    Promise<T> promise_;
  };

  struct Fulfill {
    void operator()(Promise<T>&& p, T&& v) const {
      p.setValue(std::move(v));
    }
    void operator()(Promise<T>&& p, Future<T>&& f) const {
      f.setCallback_(
          [p = std::move(p)](Try<T>&& t) mutable { p.setTry(std::move(t)); });
    }
  };

  auto ctx = std::make_shared<Context>(
      std::move(initial), std::move(func), std::distance(first, last));
  for (size_t i = 0; first != last; ++first, ++i) {
    first->setCallback_([i, ctx](Try<ItT>&& t) {
      (void)i;
      // Futures can be completed in any order, simultaneously.
      // To make this non-blocking, we create a new Future chain in
      // the order of completion to reduce the values.
      // The spinlock just protects chaining a new Future, not actually
      // executing the reduce, which should be really fast.
      Promise<T> p;
      auto f = p.getFuture();
      {
        folly::MSLGuard lock(ctx->lock_);
        f = exchange(ctx->memo_, std::move(f));
        if (++ctx->numThens_ == ctx->numFutures_) {
          // After reducing the value of the last Future, fulfill the Promise
          ctx->memo_.setCallback_(
              [ctx](Try<T>&& t2) { ctx->promise_.setValue(std::move(t2)); });
        }
      }
      f.setCallback_(
          [ctx, mp = std::move(p), mt = std::move(t)](Try<T>&& v) mutable {
            if (v.hasValue()) {
              try {
                Fulfill{}(
                    std::move(mp),
                    ctx->func_(
                        std::move(v.value()),
                        mt.template get<IsTry::value, Arg&&>()));
              } catch (std::exception& e) {
                mp.setException(exception_wrapper(std::current_exception(), e));
              } catch (...) {
                mp.setException(exception_wrapper(std::current_exception()));
              }
            } else {
              mp.setTry(std::move(v));
            }
          });
    });
  }
  return ctx->promise_.getSemiFuture().via(&InlineExecutor::instance());
}

// within

template <class T>
Future<T> Future<T>::within(Duration dur, Timekeeper* tk) && {
  return std::move(*this).within(dur, FutureTimeout(), tk);
}

template <class T>
template <class E>
Future<T> Future<T>::within(Duration dur, E e, Timekeeper* tk) && {
  if (this->isReady()) {
    return std::move(*this);
  }

  auto* exe = this->getExecutor();
  return std::move(*this)
      .withinImplementation(dur, e, tk)
      .via(exe ? exe : &InlineExecutor::instance());
}

// delayed

template <class T>
Future<T> Future<T>::delayed(Duration dur, Timekeeper* tk) && {
  auto e = this->getExecutor();
  return collectAllSemiFuture(*this, futures::sleep(dur, tk))
      .via(e ? e : &InlineExecutor::instance())
      .thenValue([](std::tuple<Try<T>, Try<Unit>>&& tup) {
        return makeFuture<T>(std::get<0>(std::move(tup)));
      });
}

template <class T>
Future<T> Future<T>::delayedUnsafe(Duration dur, Timekeeper* tk) {
  return std::move(*this).semi().delayed(dur, tk).toUnsafeFuture();
}

namespace futures {
namespace detail {

template <class FutureType, typename T = typename FutureType::value_type>
void waitImpl(FutureType& f) {
  if (std::is_base_of<Future<T>, FutureType>::value) {
    f = std::move(f).via(&InlineExecutor::instance());
  }
  // short-circuit if there's nothing to do
  if (f.isReady()) {
    return;
  }

  Promise<T> promise;
  auto ret = promise.getSemiFuture();
  auto baton = std::make_shared<FutureBatonType>();
  f.setCallback_([baton, promise = std::move(promise)](Try<T>&& t) mutable {
    promise.setTry(std::move(t));
    baton->post();
  });
  convertFuture(std::move(ret), f);
  baton->wait();
  assert(f.isReady());
}

template <class T>
void convertFuture(SemiFuture<T>&& sf, Future<T>& f) {
  // Carry executor from f, inserting an inline executor if it did not have one
  auto* exe = f.getExecutor();
  f = std::move(sf).via(exe ? exe : &InlineExecutor::instance());
}

template <class T>
void convertFuture(SemiFuture<T>&& sf, SemiFuture<T>& f) {
  f = std::move(sf);
}

template <class FutureType, typename T = typename FutureType::value_type>
void waitImpl(FutureType& f, Duration dur) {
  if (std::is_base_of<Future<T>, FutureType>::value) {
    f = std::move(f).via(&InlineExecutor::instance());
  }
  // short-circuit if there's nothing to do
  if (f.isReady()) {
    return;
  }

  Promise<T> promise;
  auto ret = promise.getSemiFuture();
  auto baton = std::make_shared<FutureBatonType>();
  f.setCallback_([baton, promise = std::move(promise)](Try<T>&& t) mutable {
    promise.setTry(std::move(t));
    baton->post();
  });
  convertFuture(std::move(ret), f);
  if (baton->try_wait_for(dur)) {
    assert(f.isReady());
  }
}

template <class T>
void waitViaImpl(Future<T>& f, DrivableExecutor* e) {
  // Set callback so to ensure that the via executor has something on it
  // so that once the preceding future triggers this callback, drive will
  // always have a callback to satisfy it
  if (f.isReady()) {
    return;
  }
  f = std::move(f).via(e).thenValue([](T&& t) { return std::move(t); });
  while (!f.isReady()) {
    e->drive();
  }
  assert(f.isReady());
  f = std::move(f).via(&InlineExecutor::instance());
}

template <class T, typename Rep, typename Period>
void waitViaImpl(
    Future<T>& f,
    TimedDrivableExecutor* e,
    const std::chrono::duration<Rep, Period>& timeout) {
  // Set callback so to ensure that the via executor has something on it
  // so that once the preceding future triggers this callback, drive will
  // always have a callback to satisfy it
  if (f.isReady()) {
    return;
  }
  // Chain operations, ensuring that the executor is kept alive for the duration
  f = std::move(f).via(e).thenValue(
      [keepAlive = getKeepAliveToken(e)](T&& t) { return std::move(t); });
  auto now = std::chrono::steady_clock::now();
  auto deadline = now + timeout;
  while (!f.isReady() && (now < deadline)) {
    e->try_drive_until(deadline);
    now = std::chrono::steady_clock::now();
  }
  assert(f.isReady() || (now >= deadline));
  if (f.isReady()) {
    f = std::move(f).via(&InlineExecutor::instance());
  }
}

} // namespace detail
} // namespace futures

template <class T>
SemiFuture<T>& SemiFuture<T>::wait() & {
  if (auto deferredExecutor = getDeferredExecutor()) {
    // Make sure that the last callback in the future chain will be run on the
    // WaitExecutor.
    Promise<T> promise;
    auto ret = promise.getSemiFuture();
    setCallback_(
        [p = std::move(promise)](auto&& r) mutable { p.setTry(std::move(r)); });
    auto waitExecutor = futures::detail::WaitExecutor::create();
    deferredExecutor->setExecutor(waitExecutor.copy());
    while (!ret.isReady()) {
      waitExecutor->drive();
    }
    waitExecutor->detach();
    this->detach();
    *this = std::move(ret);
  } else {
    futures::detail::waitImpl(*this);
  }
  return *this;
}

template <class T>
SemiFuture<T>&& SemiFuture<T>::wait() && {
  return std::move(wait());
}

template <class T>
SemiFuture<T>& SemiFuture<T>::wait(Duration dur) & {
  if (auto deferredExecutor = getDeferredExecutor()) {
    // Make sure that the last callback in the future chain will be run on the
    // WaitExecutor.
    Promise<T> promise;
    auto ret = promise.getSemiFuture();
    setCallback_(
        [p = std::move(promise)](auto&& r) mutable { p.setTry(std::move(r)); });
    auto waitExecutor = futures::detail::WaitExecutor::create();
    auto deadline = futures::detail::WaitExecutor::Clock::now() + dur;
    deferredExecutor->setExecutor(waitExecutor.copy());
    while (!ret.isReady()) {
      if (!waitExecutor->driveUntil(deadline)) {
        break;
      }
    }
    waitExecutor->detach();
    this->detach();
    *this = std::move(ret);
  } else {
    futures::detail::waitImpl(*this, dur);
  }
  return *this;
}

template <class T>
bool SemiFuture<T>::wait(Duration dur) && {
  auto future = std::move(*this);
  future.wait(dur);
  return future.isReady();
}

template <class T>
T SemiFuture<T>::get() && {
  return std::move(*this).getTry().value();
}

template <class T>
T SemiFuture<T>::get(Duration dur) && {
  return std::move(*this).getTry(dur).value();
}

template <class T>
Try<T> SemiFuture<T>::getTry() && {
  wait();
  auto future = folly::Future<T>(this->core_);
  this->core_ = nullptr;
  return std::move(std::move(future).getTry());
}

template <class T>
Try<T> SemiFuture<T>::getTry(Duration dur) && {
  wait(dur);
  auto future = folly::Future<T>(this->core_);
  this->core_ = nullptr;

  if (!future.isReady()) {
    throw_exception<FutureTimeout>();
  }
  return std::move(std::move(future).getTry());
}

template <class T>
Future<T>& Future<T>::wait() & {
  futures::detail::waitImpl(*this);
  return *this;
}

template <class T>
Future<T>&& Future<T>::wait() && {
  futures::detail::waitImpl(*this);
  return std::move(*this);
}

template <class T>
Future<T>& Future<T>::wait(Duration dur) & {
  futures::detail::waitImpl(*this, dur);
  return *this;
}

template <class T>
Future<T>&& Future<T>::wait(Duration dur) && {
  futures::detail::waitImpl(*this, dur);
  return std::move(*this);
}

template <class T>
Future<T>& Future<T>::waitVia(DrivableExecutor* e) & {
  futures::detail::waitViaImpl(*this, e);
  return *this;
}

template <class T>
Future<T>&& Future<T>::waitVia(DrivableExecutor* e) && {
  futures::detail::waitViaImpl(*this, e);
  return std::move(*this);
}

template <class T>
Future<T>& Future<T>::waitVia(TimedDrivableExecutor* e, Duration dur) & {
  futures::detail::waitViaImpl(*this, e, dur);
  return *this;
}

template <class T>
Future<T>&& Future<T>::waitVia(TimedDrivableExecutor* e, Duration dur) && {
  futures::detail::waitViaImpl(*this, e, dur);
  return std::move(*this);
}

template <class T>
T Future<T>::get() && {
  wait();
  return copy(std::move(*this)).value();
}

template <class T>
T Future<T>::get(Duration dur) && {
  wait(dur);
  auto future = copy(std::move(*this));
  if (!future.isReady()) {
    throw_exception<FutureTimeout>();
  }
  return std::move(future).value();
}

template <class T>
Try<T>& Future<T>::getTry() {
  return result();
}

template <class T>
T Future<T>::getVia(DrivableExecutor* e) {
  return std::move(waitVia(e).value());
}

template <class T>
T Future<T>::getVia(TimedDrivableExecutor* e, Duration dur) {
  waitVia(e, dur);
  if (!this->isReady()) {
    throw_exception<FutureTimeout>();
  }
  return std::move(value());
}

template <class T>
Try<T>& Future<T>::getTryVia(DrivableExecutor* e) {
  return waitVia(e).getTry();
}

template <class T>
Try<T>& Future<T>::getTryVia(TimedDrivableExecutor* e, Duration dur) {
  waitVia(e, dur);
  if (!this->isReady()) {
    throw_exception<FutureTimeout>();
  }
  return result();
}

namespace futures {
namespace detail {
template <class T>
struct TryEquals {
  static bool equals(const Try<T>& t1, const Try<T>& t2) {
    return t1.value() == t2.value();
  }
};
} // namespace detail
} // namespace futures

template <class T>
Future<bool> Future<T>::willEqual(Future<T>& f) {
  return collectAllSemiFuture(*this, f).toUnsafeFuture().thenValue(
      [](const std::tuple<Try<T>, Try<T>>& t) {
        if (std::get<0>(t).hasValue() && std::get<1>(t).hasValue()) {
          return futures::detail::TryEquals<T>::equals(
              std::get<0>(t), std::get<1>(t));
        } else {
          return false;
        }
      });
}

template <class T>
template <class F>
Future<T> Future<T>::filter(F&& predicate) && {
  return std::move(*this).thenValue([p = std::forward<F>(predicate)](T val) {
    T const& valConstRef = val;
    if (!p(valConstRef)) {
      throw_exception<FuturePredicateDoesNotObtain>();
    }
    return val;
  });
}

template <class F>
Future<Unit> when(bool p, F&& thunk) {
  return p ? std::forward<F>(thunk)().unit() : makeFuture();
}

template <class P, class F>
Future<Unit> whileDo(P&& predicate, F&& thunk) {
  if (predicate()) {
    auto future = thunk();
    return std::move(future).thenValue(
        [predicate = std::forward<P>(predicate),
         thunk = std::forward<F>(thunk)](auto&&) mutable {
          return whileDo(std::forward<P>(predicate), std::forward<F>(thunk));
        });
  }
  return makeFuture();
}

template <class F>
Future<Unit> times(const int n, F&& thunk) {
  return folly::whileDo(
      [n, count = std::make_unique<std::atomic<int>>(0)]() mutable {
        return count->fetch_add(1, std::memory_order_relaxed) < n;
      },
      std::forward<F>(thunk));
}

namespace futures {
template <class It, class F, class ItT, class Result>
std::vector<Future<Result>> map(It first, It last, F func) {
  std::vector<Future<Result>> results;
  results.reserve(std::distance(first, last));
  for (auto it = first; it != last; it++) {
    FOLLY_PUSH_WARNING
    FOLLY_GNU_DISABLE_WARNING("-Wdeprecated-declarations")
    results.push_back(std::move(*it).then(func));
    FOLLY_POP_WARNING
  }
  return results;
}

template <class It, class F, class ItT, class Result>
std::vector<Future<Result>> map(Executor& exec, It first, It last, F func) {
  std::vector<Future<Result>> results;
  results.reserve(std::distance(first, last));
  for (auto it = first; it != last; it++) {
    FOLLY_PUSH_WARNING
    FOLLY_GNU_DISABLE_WARNING("-Wdeprecated-declarations")
    results.push_back(std::move(*it).via(&exec).then(func));
    FOLLY_POP_WARNING
  }
  return results;
}

} // namespace futures

template <class Clock>
Future<Unit> Timekeeper::at(std::chrono::time_point<Clock> when) {
  auto now = Clock::now();

  if (when <= now) {
    return makeFuture();
  }

  return after(std::chrono::duration_cast<Duration>(when - now));
}

// Instantiate the most common Future types to save compile time
extern template class Future<Unit>;
extern template class Future<bool>;
extern template class Future<int>;
extern template class Future<int64_t>;
extern template class Future<std::string>;
extern template class Future<double>;
} // namespace folly

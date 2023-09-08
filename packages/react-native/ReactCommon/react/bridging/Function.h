/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/bridging/Base.h>
#include <react/bridging/CallbackWrapper.h>

#include <ReactCommon/SchedulerPriority.h>

namespace facebook::react {

template <typename F>
class SyncCallback;

template <typename... Args>
class AsyncCallback {
 public:
  AsyncCallback(
      jsi::Runtime& runtime,
      jsi::Function function,
      std::shared_ptr<CallInvoker> jsInvoker)
      : callback_(std::make_shared<SyncCallback<void(Args...)>>(
            runtime,
            std::move(function),
            std::move(jsInvoker))) {}

  AsyncCallback(const AsyncCallback&) = default;
  AsyncCallback& operator=(const AsyncCallback&) = default;

  void operator()(Args... args) const {
    call(std::forward<Args>(args)...);
  }

  void call(Args... args) const {
    callInternal(std::nullopt, std::forward<Args>(args)...);
  }

  void callWithPriority(SchedulerPriority priority, Args... args) const {
    callInternal(priority, std::forward<Args>(args)...);
  }

 private:
  friend Bridging<AsyncCallback>;

  std::shared_ptr<SyncCallback<void(Args...)>> callback_;

  void callInternal(std::optional<SchedulerPriority> priority, Args... args)
      const {
    auto wrapper = callback_->wrapper_.lock();
    if (!wrapper) {
      throw std::runtime_error("Failed to call invalidated async callback");
    }
    auto fn = [callback = callback_,
               argsPtr = std::make_shared<std::tuple<Args...>>(
                   std::make_tuple(std::forward<Args>(args)...))] {
      callback->apply(std::move(*argsPtr));
    };

    if (priority) {
      wrapper->jsInvoker().invokeAsync(*priority, std::move(fn));
    } else {
      wrapper->jsInvoker().invokeAsync(std::move(fn));
    }
  }
};

template <typename R, typename... Args>
class SyncCallback<R(Args...)> {
 public:
  SyncCallback(
      jsi::Runtime& rt,
      jsi::Function function,
      std::shared_ptr<CallInvoker> jsInvoker)
      : wrapper_(CallbackWrapper::createWeak(
            std::move(function),
            rt,
            std::move(jsInvoker))) {}

  // Disallow moving to prevent function from get called on another thread.
  SyncCallback(SyncCallback&&) = delete;
  SyncCallback& operator=(SyncCallback&&) = delete;

  ~SyncCallback() {
    if (auto wrapper = wrapper_.lock()) {
      wrapper->destroy();
    }
  }

  R operator()(Args... args) const {
    return call(std::forward<Args>(args)...);
  }

  R call(Args... args) const {
    auto wrapper = wrapper_.lock();
    if (!wrapper) {
      throw std::runtime_error("Failed to call invalidated sync callback");
    }

    auto& callback = wrapper->callback();
    auto& rt = wrapper->runtime();
    auto jsInvoker = wrapper->jsInvokerPtr();

    if constexpr (std::is_void_v<R>) {
      callback.call(
          rt, bridging::toJs(rt, std::forward<Args>(args), jsInvoker)...);
    } else {
      return bridging::fromJs<R>(
          rt,
          callback.call(
              rt, bridging::toJs(rt, std::forward<Args>(args), jsInvoker)...),
          jsInvoker);
    }
  }

 private:
  friend AsyncCallback<Args...>;
  friend Bridging<SyncCallback>;

  R apply(std::tuple<Args...>&& args) const {
    return apply(std::move(args), std::index_sequence_for<Args...>{});
  }

  template <size_t... Index>
  R apply(std::tuple<Args...>&& args, std::index_sequence<Index...>) const {
    return call(std::move(std::get<Index>(args))...);
  }

  // Held weakly so lifetime is managed by LongLivedObjectCollection.
  std::weak_ptr<CallbackWrapper> wrapper_;
};

template <typename... Args>
struct Bridging<AsyncCallback<Args...>> {
  static AsyncCallback<Args...> fromJs(
      jsi::Runtime& rt,
      jsi::Function&& value,
      const std::shared_ptr<CallInvoker>& jsInvoker) {
    return AsyncCallback<Args...>(rt, std::move(value), jsInvoker);
  }

  static jsi::Function toJs(
      jsi::Runtime& rt,
      const AsyncCallback<Args...>& value) {
    return value.callback_->function_.getFunction(rt);
  }
};

template <typename R, typename... Args>
struct Bridging<SyncCallback<R(Args...)>> {
  static SyncCallback<R(Args...)> fromJs(
      jsi::Runtime& rt,
      jsi::Function&& value,
      const std::shared_ptr<CallInvoker>& jsInvoker) {
    return SyncCallback<R(Args...)>(rt, std::move(value), jsInvoker);
  }

  static jsi::Function toJs(
      jsi::Runtime& rt,
      const SyncCallback<R(Args...)>& value) {
    return value.function_.getFunction(rt);
  }
};

template <typename R, typename... Args>
struct Bridging<std::function<R(Args...)>> {
  using Func = std::function<R(Args...)>;
  using IndexSequence = std::index_sequence_for<Args...>;

  static constexpr size_t kArgumentCount = sizeof...(Args);

  static jsi::Function toJs(
      jsi::Runtime& rt,
      Func fn,
      const std::shared_ptr<CallInvoker>& jsInvoker) {
    return jsi::Function::createFromHostFunction(
        rt,
        jsi::PropNameID::forAscii(rt, "BridgedFunction"),
        kArgumentCount,
        [fn = std::make_shared<Func>(std::move(fn)), jsInvoker](
            jsi::Runtime& rt,
            const jsi::Value&,
            const jsi::Value* args,
            size_t count) -> jsi::Value {
          if (count < kArgumentCount) {
            throw jsi::JSError(rt, "Incorrect number of arguments");
          }

          if constexpr (std::is_void_v<R>) {
            callFromJs(*fn, rt, args, jsInvoker, IndexSequence{});
            return jsi::Value();
          } else {
            return bridging::toJs(
                rt,
                callFromJs(*fn, rt, args, jsInvoker, IndexSequence{}),
                jsInvoker);
          }
        });
  }

 private:
  template <size_t... Index>
  static R callFromJs(
      Func& fn,
      jsi::Runtime& rt,
      const jsi::Value* args,
      const std::shared_ptr<CallInvoker>& jsInvoker,
      std::index_sequence<Index...>) {
    return fn(bridging::fromJs<Args>(rt, args[Index], jsInvoker)...);
  }
};

template <typename R, typename... Args>
struct Bridging<
    std::function<R(Args...)>,
    std::enable_if_t<
        !std::is_same_v<std::function<R(Args...)>, std::function<R(Args...)>>>>
    : Bridging<std::function<R(Args...)>> {};

template <typename R, typename... Args>
struct Bridging<R(Args...)> : Bridging<std::function<R(Args...)>> {};

template <typename R, typename... Args>
struct Bridging<R (*)(Args...)> : Bridging<std::function<R(Args...)>> {};

} // namespace facebook::react

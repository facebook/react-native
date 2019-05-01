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

#include <memory>
#include <string>

#include <folly/Synchronized.h>
#include <folly/container/F14Map.h>
#include <folly/sorted_vector_types.h>

namespace folly {

/*
 * A token to be used to fetch data from RequestContext.
 * Generally you will want this to be a static, created only once using a
 * string, and then only copied. The string constructor is expensive.
 */
class RequestToken {
 public:
  explicit RequestToken(const std::string& str);

  bool operator==(const RequestToken& other) const {
    return token_ == other.token_;
  }

  // Slow, use only for debug log messages.
  std::string getDebugString() const;

  friend struct std::hash<folly::RequestToken>;

 private:
  static Synchronized<std::unordered_map<std::string, uint32_t>>& getCache();

  uint32_t token_;
};

} // namespace folly

namespace std {
template <>
struct hash<folly::RequestToken> {
  size_t operator()(const folly::RequestToken& token) const {
    return hash<uint32_t>()(token.token_);
  }
};
} // namespace std

namespace folly {

// Some request context that follows an async request through a process
// Everything in the context must be thread safe

class RequestData {
 public:
  virtual ~RequestData() = default;

  // Avoid calling RequestContext::setContextData, setContextDataIfAbsent, or
  // clearContextData from these callbacks. Doing so will cause deadlock. We
  // could fix these deadlocks, but only at significant performance penalty, so
  // just don't do it!

  virtual bool hasCallback() = 0;
  // Callback executed when setting RequestContext. Make sure your RequestData
  // instance overrides the hasCallback method to return true otherwise
  // the callback will not be executed
  virtual void onSet() {}
  // Callback executed when unsetting RequestContext. Make sure your RequestData
  // instance overrides the hasCallback method to return true otherwise
  // the callback will not be executed
  virtual void onUnset() {}

 private:
  // Start shallow copy implementation details:
  // For efficiency, RequestContext provides a raw ptr interface.
  // To support shallow copy, we need a shared ptr.
  // To keep it as safe as possible (even if a raw ptr is passed back),
  // the counter lives directly in RequestData.

  friend class RequestContext;

  // Unique ptr with custom destructor, decrement the counter
  // and only free if 0
  struct DestructPtr {
    void operator()(RequestData* ptr);
  };
  using SharedPtr = std::unique_ptr<RequestData, DestructPtr>;

  // Initialize the pseudo-shared ptr, increment the counter
  static SharedPtr constructPtr(RequestData* ptr);

  std::atomic<int> keepAliveCounter_{0};
  // End shallow copy
};

// If you do not call create() to create a unique request context,
// this default request context will always be returned, and is never
// copied between threads.
class RequestContext {
 public:
  // Create a unique request context for this request.
  // It will be passed between queues / threads (where implemented),
  // so it should be valid for the lifetime of the request.
  static void create() {
    setContext(std::make_shared<RequestContext>());
  }

  // Get the current context.
  static RequestContext* get();

  // The following APIs are used to add, remove and access RequestData instance
  // in the RequestContext instance, normally used for per-RequestContext
  // tracking or callback on set and unset. These APIs are Thread-safe.
  // These APIs are performance sensitive, so please ask if you need help
  // profiling any use of these APIs.

  // Add RequestData instance "data" to this RequestContext instance, with
  // string identifier "val". If the same string identifier has already been
  // used, will print a warning message for the first time, clear the existing
  // RequestData instance for "val", and **not** add "data".
  void setContextData(
      const RequestToken& val,
      std::unique_ptr<RequestData> data);
  void setContextData(
      const std::string& val,
      std::unique_ptr<RequestData> data) {
    setContextData(RequestToken(val), std::move(data));
  }

  // Add RequestData instance "data" to this RequestContext instance, with
  // string identifier "val". If the same string identifier has already been
  // used, return false and do nothing. Otherwise add "data" and return true.
  bool setContextDataIfAbsent(
      const RequestToken& val,
      std::unique_ptr<RequestData> data);
  bool setContextDataIfAbsent(
      const std::string& val,
      std::unique_ptr<RequestData> data) {
    return setContextDataIfAbsent(RequestToken(val), std::move(data));
  }

  // Remove the RequestData instance with string identifier "val", if it exists.
  void clearContextData(const RequestToken& val);
  void clearContextData(const std::string& val) {
    clearContextData(RequestToken(val));
  }

  // Returns true if and only if the RequestData instance with string identifier
  // "val" exists in this RequestContext instnace.
  bool hasContextData(const RequestToken& val) const;
  bool hasContextData(const std::string& val) const {
    return hasContextData(RequestToken(val));
  }

  // Get (constant) raw pointer of the RequestData instance with string
  // identifier "val" if it exists, otherwise returns null pointer.
  RequestData* getContextData(const RequestToken& val);
  const RequestData* getContextData(const RequestToken& val) const;
  RequestData* getContextData(const std::string& val) {
    return getContextData(RequestToken(val));
  }
  const RequestData* getContextData(const std::string& val) const {
    return getContextData(RequestToken(val));
  }

  void onSet();
  void onUnset();

  // The following API is used to pass the context through queues / threads.
  // saveContext is called to get a shared_ptr to the context, and
  // setContext is used to reset it on the other side of the queue.
  //
  // Whenever possible, use RequestContextScopeGuard instead of setContext
  // to make sure that RequestContext is reset to the original value when
  // we exit the scope.
  //
  // A shared_ptr is used, because many request may fan out across
  // multiple threads, or do post-send processing, etc.
  static std::shared_ptr<RequestContext> setContext(
      std::shared_ptr<RequestContext> ctx);

  static std::shared_ptr<RequestContext> saveContext() {
    return getStaticContext();
  }

 private:
  static std::shared_ptr<RequestContext>& getStaticContext();

  // Start shallow copy guard implementation details:
  // All methods are private to encourage proper use
  friend struct ShallowCopyRequestContextScopeGuard;

  // This sets a shallow copy of the current context as current,
  // then return the previous context (so it can be reset later).
  static std::shared_ptr<RequestContext> setShallowCopyContext();

  // Similar to setContextData, except it overwrites the data
  // if already set (instead of warn + reset ptr).
  void overwriteContextData(
      const RequestToken& val,
      std::unique_ptr<RequestData> data);
  void overwriteContextData(
      const std::string& val,
      std::unique_ptr<RequestData> data) {
    overwriteContextData(RequestToken(val), std::move(data));
  }
  // End shallow copy guard

  enum class DoSetBehaviour {
    SET,
    SET_IF_ABSENT,
    OVERWRITE,
  };

  bool doSetContextData(
      const RequestToken& val,
      std::unique_ptr<RequestData>& data,
      DoSetBehaviour behaviour);
  bool doSetContextData(
      const std::string& val,
      std::unique_ptr<RequestData>& data,
      DoSetBehaviour behaviour) {
    return doSetContextData(RequestToken(val), data, behaviour);
  }

  struct State {
    // This must be optimized for lookup, its hot path is getContextData
    // Efficiency of copying the container also matters in setShallowCopyContext
    F14FastMap<RequestToken, RequestData::SharedPtr> requestData_;
    // This must be optimized for iteration, its hot path is setContext
    // We also use the fact that it's ordered to efficiently compute
    // the difference with previous context
    sorted_vector_set<RequestData*> callbackData_;
  };
  folly::Synchronized<State> state_;
};

/**
 * Note: you probably want to use ShallowCopyRequestContextScopeGuard
 * This resets all other RequestData for the duration of the scope!
 */
class RequestContextScopeGuard {
 private:
  std::shared_ptr<RequestContext> prev_;

 public:
  RequestContextScopeGuard(const RequestContextScopeGuard&) = delete;
  RequestContextScopeGuard& operator=(const RequestContextScopeGuard&) = delete;
  RequestContextScopeGuard(RequestContextScopeGuard&&) = delete;
  RequestContextScopeGuard& operator=(RequestContextScopeGuard&&) = delete;

  // Create a new RequestContext and reset to the original value when
  // this goes out of scope.
  RequestContextScopeGuard() : prev_(RequestContext::saveContext()) {
    RequestContext::create();
  }

  // Set a RequestContext that was previously captured by saveContext(). It will
  // be automatically reset to the original value when this goes out of scope.
  explicit RequestContextScopeGuard(std::shared_ptr<RequestContext> ctx)
      : prev_(RequestContext::setContext(std::move(ctx))) {}

  ~RequestContextScopeGuard() {
    RequestContext::setContext(std::move(prev_));
  }
};

/**
 * This guard maintains all the RequestData pointers of the parent.
 * This allows to overwrite a specific RequestData pointer for the
 * scope's duration, without breaking others.
 *
 * Only modified pointers will have their set/onset methods called
 */
struct ShallowCopyRequestContextScopeGuard {
  ShallowCopyRequestContextScopeGuard()
      : prev_(RequestContext::setShallowCopyContext()) {}

  /**
   * Shallow copy then overwrite one specific RequestData
   *
   * Helper constructor which is a more efficient equivalent to
   * "clearRequestData" then "setRequestData" after the guard.
   */
  ShallowCopyRequestContextScopeGuard(
      const RequestToken& val,
      std::unique_ptr<RequestData> data)
      : ShallowCopyRequestContextScopeGuard() {
    RequestContext::get()->overwriteContextData(val, std::move(data));
  }
  ShallowCopyRequestContextScopeGuard(
      const std::string& val,
      std::unique_ptr<RequestData> data)
      : ShallowCopyRequestContextScopeGuard() {
    RequestContext::get()->overwriteContextData(val, std::move(data));
  }

  ~ShallowCopyRequestContextScopeGuard() {
    RequestContext::setContext(std::move(prev_));
  }

  ShallowCopyRequestContextScopeGuard(
      const ShallowCopyRequestContextScopeGuard&) = delete;
  ShallowCopyRequestContextScopeGuard& operator=(
      const ShallowCopyRequestContextScopeGuard&) = delete;
  ShallowCopyRequestContextScopeGuard(ShallowCopyRequestContextScopeGuard&&) =
      delete;
  ShallowCopyRequestContextScopeGuard& operator=(
      ShallowCopyRequestContextScopeGuard&&) = delete;

 private:
  std::shared_ptr<RequestContext> prev_;
};

} // namespace folly

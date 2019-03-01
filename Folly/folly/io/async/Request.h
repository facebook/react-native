/*
 * Copyright 2017 Facebook, Inc.
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership. The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
#pragma once

#include <map>
#include <memory>

#include <folly/SharedMutex.h>
#include <folly/Synchronized.h>

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
  virtual void onSet() {}
  virtual void onUnset() {}
};

class RequestContext;

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

  // The following API may be used to set per-request data in a thread-safe way.
  // This access is still performance sensitive, so please ask if you need help
  // profiling any use of these functions.
  void setContextData(
      const std::string& val,
      std::unique_ptr<RequestData> data);

  // Unlike setContextData, this method does not panic if the key is already
  // present. Returns true iff the new value has been inserted.
  bool setContextDataIfAbsent(
      const std::string& val,
      std::unique_ptr<RequestData> data);

  bool hasContextData(const std::string& val) const;

  RequestData* getContextData(const std::string& val);
  const RequestData* getContextData(const std::string& val) const;

  void onSet();
  void onUnset();

  void clearContextData(const std::string& val);

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

  using Data = std::map<std::string, std::unique_ptr<RequestData>>;
  folly::Synchronized<Data, folly::SharedMutex> data_;
};

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
      : prev_(RequestContext::setContext(std::move(ctx))) {
  }

  ~RequestContextScopeGuard() {
    RequestContext::setContext(std::move(prev_));
  }
};
}

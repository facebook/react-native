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

#include <folly/futures/Promise.h>

namespace folly {

/// These classes help you wrap an existing C style callback function
/// into a Future.
///
///   void legacy_send_async(..., void (*cb)(void*), void*);
///
///   Future<T> wrappedSendAsync(T&& obj) {
///     auto handle = new OpaqueCallbackShunt<T>(obj);
///     auto future = handle->promise_.getFuture();
///     legacy_send_async(..., OpaqueCallbackShunt<T>::callback, handle)
///     return future;
///   }
///
/// If the legacy function doesn't conform to void (*cb)(void*), use a lambda:
///
///   auto cb = [](t1*, t2*, void* arg) {
///     OpaqueCallbackShunt<T>::callback(arg);
///   };
///   legacy_send_async(..., cb, handle);

template <typename T>
class OpaqueCallbackShunt {
public:
  explicit OpaqueCallbackShunt(T&& obj)
    : obj_(std::move(obj)) { }
  static void callback(void* arg) {
    std::unique_ptr<OpaqueCallbackShunt<T>> handle(
      static_cast<OpaqueCallbackShunt<T>*>(arg));
    handle->promise_.setValue(std::move(handle->obj_));
  }
  folly::Promise<T> promise_;
private:
  T obj_;
};

} // folly

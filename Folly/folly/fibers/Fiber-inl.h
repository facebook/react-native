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

#include <cassert>

namespace folly {
namespace fibers {

template <typename F>
void Fiber::setFunction(F&& func) {
  assert(state_ == INVALID);
  func_ = std::forward<F>(func);
  state_ = NOT_STARTED;
}

template <typename F, typename G>
void Fiber::setFunctionFinally(F&& resultFunc, G&& finallyFunc) {
  assert(state_ == INVALID);
  resultFunc_ = std::forward<F>(resultFunc);
  finallyFunc_ = std::forward<G>(finallyFunc);
  state_ = NOT_STARTED;
}

inline void* Fiber::getUserBuffer() {
  return &userBuffer_;
}

template <typename T>
T& Fiber::LocalData::getSlow() {
  dataSize_ = sizeof(T);
  dataType_ = &typeid(T);
  if (sizeof(T) <= kBufferSize) {
    dataDestructor_ = dataBufferDestructor<T>;
    data_ = &buffer_;
  } else {
    dataDestructor_ = dataHeapDestructor<T>;
    data_ = allocateHeapBuffer(dataSize_);
  }
  dataCopyConstructor_ = dataCopyConstructor<T>;

  new (reinterpret_cast<T*>(data_)) T();

  return *reinterpret_cast<T*>(data_);
}

template <typename T>
void Fiber::LocalData::dataCopyConstructor(void* ptr, const void* other) {
  new (reinterpret_cast<T*>(ptr)) T(*reinterpret_cast<const T*>(other));
}

template <typename T>
void Fiber::LocalData::dataBufferDestructor(void* ptr) {
  reinterpret_cast<T*>(ptr)->~T();
}

template <typename T>
void Fiber::LocalData::dataHeapDestructor(void* ptr) {
  reinterpret_cast<T*>(ptr)->~T();
  freeHeapBuffer(ptr);
}
} // namespace fibers
} // namespace folly

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

#include <folly/fibers/FiberManagerInternal.h>
#include <folly/functional/Invoke.h>

namespace folly {
namespace fibers {

namespace {

template <class F, class G>
typename std::enable_if<!std::is_same<invoke_result_t<F>, void>::value, void>::
    type inline callFuncs(F&& f, G&& g, size_t id) {
  g(id, f());
}

template <class F, class G>
typename std::enable_if<std::is_same<invoke_result_t<F>, void>::value, void>::
    type inline callFuncs(F&& f, G&& g, size_t id) {
  f();
  g(id);
}

} // namespace

template <class InputIterator, class F>
inline void forEach(InputIterator first, InputIterator last, F&& f) {
  if (first == last) {
    return;
  }

  typedef typename std::iterator_traits<InputIterator>::value_type FuncType;

  size_t tasksTodo = 1;
  std::exception_ptr e;
  Baton baton;

  auto taskFunc = [&tasksTodo, &e, &f, &baton](size_t id, FuncType&& func) {
    return [id,
            &tasksTodo,
            &e,
            &f,
            &baton,
            func_ = std::forward<FuncType>(func)]() mutable {
      try {
        callFuncs(std::forward<FuncType>(func_), f, id);
      } catch (...) {
        e = std::current_exception();
      }
      if (--tasksTodo == 0) {
        baton.post();
      }
    };
  };

  auto firstTask = first;
  ++first;

  for (size_t i = 1; first != last; ++i, ++first, ++tasksTodo) {
    addTask(taskFunc(i, std::move(*first)));
  }

  taskFunc(0, std::move(*firstTask))();
  baton.wait();

  if (e != std::exception_ptr()) {
    std::rethrow_exception(e);
  }
}
} // namespace fibers
} // namespace folly

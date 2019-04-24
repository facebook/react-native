#pragma once
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

#include <folly/experimental/pushmi/executor.h>
#include <algorithm>
#include <chrono>
#include <deque>
#include <thread>

namespace pushmi {

struct recurse_t {};
constexpr const recurse_t recurse{};

struct _pipeable_sender_ {};

namespace detail {

PUSHMI_INLINE_VAR constexpr struct ownordelegate_t {
} const ownordelegate{};
PUSHMI_INLINE_VAR constexpr struct ownornest_t {
} const ownornest{};

class trampoline_id {
  std::thread::id threadid;
  uintptr_t trampolineid;

 public:
  template <class T>
  explicit trampoline_id(T* trampoline)
      : threadid(std::this_thread::get_id()), trampolineid(trampoline) {}
};

template <class E = std::exception_ptr>
class trampoline;

template <class E = std::exception_ptr>
class delegator : _pipeable_sender_ {
 public:
  using properties = property_set<
      is_sender<>,
      is_executor<>,
      is_maybe_blocking<>,
      is_fifo_sequence<>,
      is_single<>>;

  delegator executor() {
    return {};
  }
  PUSHMI_TEMPLATE(class SingleReceiver)
  (requires ReceiveValue<
      remove_cvref_t<SingleReceiver>,
      any_executor_ref<E>>)
  void submit(SingleReceiver&& what) {
    trampoline<E>::submit(ownordelegate, std::forward<SingleReceiver>(what));
  }
};

template <class E = std::exception_ptr>
class nester : _pipeable_sender_ {
 public:
  using properties = property_set<
      is_sender<>,
      is_executor<>,
      is_maybe_blocking<>,
      is_fifo_sequence<>,
      is_single<>>;

  nester executor() {
    return {};
  }
  PUSHMI_TEMPLATE(class SingleReceiver)
  (requires ReceiveValue<
      remove_cvref_t<SingleReceiver>,
      any_executor_ref<E>>)
  void submit(SingleReceiver&& what) {
    trampoline<E>::submit(ownornest, std::forward<SingleReceiver>(what));
  }
};

template <class E>
class trampoline {
 private:
  using error_type = std::decay_t<E>;
  using work_type = any_receiver<error_type, any_executor_ref<error_type>>;
  using queue_type = std::deque<work_type>;
  using pending_type = std::tuple<int, queue_type, bool>;

  inline static pending_type*& owner() {
    static thread_local pending_type* pending = nullptr;
    return pending;
  }

  inline static int& depth(pending_type& p) {
    return std::get<0>(p);
  }

  inline static queue_type& pending(pending_type& p) {
    return std::get<1>(p);
  }

  inline static bool& repeat(pending_type& p) {
    return std::get<2>(p);
  }

 public:
  inline static trampoline_id get_id() {
    return {owner()};
  }

  inline static bool is_owned() {
    return owner() != nullptr;
  }

  template <class Selector, class Derived>
  static void submit(Selector, Derived&, recurse_t) {
    if (!is_owned()) {
      abort();
    }
    repeat(*owner()) = true;
  }

  PUSHMI_TEMPLATE(class SingleReceiver)
  (requires not Same<SingleReceiver, recurse_t>)
  static void submit(
      ownordelegate_t,
      SingleReceiver awhat) {
    delegator<E> that;

    if (is_owned()) {
      // thread already owned

      // poor mans scope guard
      try {
        if (++depth(*owner()) > 100) {
          // defer work to owner
          pending(*owner()).push_back(work_type{std::move(awhat)});
        } else {
          // dynamic recursion - optimization to balance queueing and
          // stack usage and value interleaving on the same thread.
          ::pushmi::set_value(awhat, that);
          ::pushmi::set_done(awhat);
        }
      } catch (...) {
        --depth(*owner());
        throw;
      }
      --depth(*owner());
      return;
    }

    // take over the thread

    pending_type pending_store;
    owner() = &pending_store;
    depth(pending_store) = 0;
    repeat(pending_store) = false;
    // poor mans scope guard
    try {
      trampoline<E>::submit(ownornest, std::move(awhat));
    } catch (...) {
      // ignore exceptions while delivering the exception
      try {
        ::pushmi::set_error(awhat, std::current_exception());
        for (auto& what : pending(pending_store)) {
          ::pushmi::set_error(what, std::current_exception());
        }
      } catch (...) {
      }
      pending(pending_store).clear();

      if (!is_owned()) {
        std::abort();
      }
      if (!pending(pending_store).empty()) {
        std::abort();
      }
      owner() = nullptr;
      throw;
    }
    if (!is_owned()) {
      std::abort();
    }
    if (!pending(pending_store).empty()) {
      std::abort();
    }
    owner() = nullptr;
  }

  PUSHMI_TEMPLATE(class SingleReceiver)
  (requires not Same<SingleReceiver, recurse_t>)
  static void submit(
      ownornest_t,
      SingleReceiver awhat) {
    delegator<E> that;

    if (!is_owned()) {
      trampoline<E>::submit(ownordelegate, std::move(awhat));
      return;
    }

    auto& pending_store = *owner();

    // static recursion - tail call optimization
    if (pending(pending_store).empty()) {
      bool go = true;
      while (go) {
        repeat(pending_store) = false;
        ::pushmi::set_value(awhat, that);
        ::pushmi::set_done(awhat);
        go = repeat(pending_store);
      }
    } else {
      pending(pending_store).push_back(work_type{std::move(awhat)});
    }

    if (pending(pending_store).empty()) {
      return;
    }

    while (!pending(pending_store).empty()) {
      auto what = std::move(pending(pending_store).front());
      pending(pending_store).pop_front();
      ::pushmi::set_value(what, any_executor_ref<error_type>{that});
      ::pushmi::set_done(what);
    }
  }
};

} // namespace detail

template <class E = std::exception_ptr>
detail::trampoline_id get_trampoline_id() {
  if (!detail::trampoline<E>::is_owned()) {
    std::abort();
  }
  return detail::trampoline<E>::get_id();
}

template <class E = std::exception_ptr>
bool owned_by_trampoline() {
  return detail::trampoline<E>::is_owned();
}

template <class E = std::exception_ptr>
inline detail::delegator<E> trampoline() {
  return {};
}
template <class E = std::exception_ptr>
inline detail::nester<E> nested_trampoline() {
  return {};
}

// see boosters.h
struct trampolineEXF {
  auto operator()() {
    return trampoline();
  }
};

namespace detail {

PUSHMI_TEMPLATE(class E)
(requires SenderTo<delegator<E>, recurse_t>)
decltype(auto) repeat(delegator<E>& exec) {
  ::pushmi::submit(exec, recurse);
}
template <class AnyExec>
[[noreturn]] void repeat(AnyExec&) {
  std::abort();
}

} // namespace detail

inline auto repeat() {
  return [](auto& exec) { detail::repeat(exec); };
}

} // namespace pushmi

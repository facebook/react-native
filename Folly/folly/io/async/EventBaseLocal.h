/*
 * Copyright 2015-present Facebook, Inc.
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

#include <boost/noncopyable.hpp>
#include <folly/Synchronized.h>
#include <folly/io/async/EventBase.h>
#include <memory>
#include <mutex>
#include <unordered_set>
#include <utility>

namespace folly {

namespace detail {

class EventBaseLocalBase : public EventBaseLocalBaseBase, boost::noncopyable {
 public:
  EventBaseLocalBase() {}
  ~EventBaseLocalBase() override;
  void erase(EventBase& evb);
  void onEventBaseDestruction(EventBase& evb) override;

 protected:
  void setVoid(EventBase& evb, std::shared_ptr<void>&& ptr);
  void* getVoid(EventBase& evb);

  folly::Synchronized<std::unordered_set<EventBase*>> eventBases_;
  static std::atomic<std::size_t> keyCounter_;
  std::size_t key_{keyCounter_++};
};

} // namespace detail

/**
 * A storage abstraction for data that should be tied to an EventBase.
 *
 *   struct Foo { Foo(int a, int b); };
 *   EventBaseLocal<Foo> myFoo;
 *   ...
 *   EventBase evb;
 *   myFoo.set(evb, new Foo(1, 2));
 *   myFoo.set(evb, 1, 2);
 *   Foo* foo = myFoo.get(evb);
 *   myFoo.erase(evb);
 *   Foo& foo = myFoo.getOrCreate(evb, 1, 2); // ctor
 *   Foo& foo = myFoo.getOrCreate(evb, 1, 2); // no ctor
 *   myFoo.erase(evb);
 *   Foo& foo = myFoo.getOrCreateFn(evb, [] () { return new Foo(3, 4); })
 *
 * The objects will be deleted when the EventBaseLocal or the EventBase is
 * destructed (whichever comes first). All methods must be called from the
 * EventBase thread.
 *
 * The user is responsible for throwing away invalid references/ptrs returned
 * by the get() method after set/erase is called.  If shared ownership is
 * needed, use a EventBaseLocal<shared_ptr<...>>.
 */
template <typename T>
class EventBaseLocal : public detail::EventBaseLocalBase {
 public:
  EventBaseLocal() : EventBaseLocalBase() {}

  T* get(EventBase& evb) {
    return static_cast<T*>(getVoid(evb));
  }

  void emplace(EventBase& evb, T* ptr) {
    std::shared_ptr<T> smartPtr(ptr);
    setVoid(evb, std::move(smartPtr));
  }

  template <typename... Args>
  void emplace(EventBase& evb, Args&&... args) {
    auto smartPtr = std::make_shared<T>(std::forward<Args>(args)...);
    setVoid(evb, smartPtr);
  }

  template <typename... Args>
  T& getOrCreate(EventBase& evb, Args&&... args) {
    if (auto ptr = getVoid(evb)) {
      return *static_cast<T*>(ptr);
    }
    auto smartPtr = std::make_shared<T>(std::forward<Args>(args)...);
    auto& ref = *smartPtr;
    setVoid(evb, std::move(smartPtr));
    return ref;
  }

  template <typename Func>
  T& getOrCreateFn(EventBase& evb, Func& fn) {
    // If this looks like it's copy/pasted from above, that's because it is.
    // gcc has a bug (fixed in 4.9) that doesn't allow capturing variadic
    // params in a lambda.
    if (auto ptr = getVoid(evb)) {
      return *static_cast<T*>(ptr);
    }
    std::shared_ptr<T> smartPtr(fn());
    auto& ref = *smartPtr;
    setVoid(evb, std::move(smartPtr));
    return ref;
  }
};

} // namespace folly

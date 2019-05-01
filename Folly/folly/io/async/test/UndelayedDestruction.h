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
#include <cstdlib>
#include <type_traits>
#include <utility>

namespace folly {

/**
 * A helper class to allow a DelayedDestruction object to be instantiated on
 * the stack.
 *
 * This class derives from an existing DelayedDestruction type and makes the
 * destructor public again.  This allows objects of this type to be declared on
 * the stack or directly inside another class.  Normally DelayedDestruction
 * objects must be dynamically allocated on the heap.
 *
 * However, the trade-off is that you lose some of the protections provided by
 * DelayedDestruction::destroy().  DelayedDestruction::destroy() will
 * automatically delay destruction of the object until it is safe to do so.
 * If you use UndelayedDestruction, you become responsible for ensuring that
 * you only destroy the object where it is safe to do so.  Attempting to
 * destroy a UndelayedDestruction object while it has a non-zero destructor
 * guard count will abort the program.
 */
template <typename TDD>
class UndelayedDestruction : public TDD {
 public:
  // We could just use constructor inheritance, but not all compilers
  // support that. So, just use a forwarding constructor.
  //
  // Ideally we would use std::enable_if<> and std::is_constructible<> to
  // provide only constructor methods that are valid for our parent class.
  // Unfortunately std::is_constructible<> doesn't work for types that aren't
  // destructible.  In gcc-4.6 it results in a compiler error.  In the latest
  // gcc code it looks like it has been fixed to return false.  (The language
  // in the standard seems to indicate that returning false is the correct
  // behavior for non-destructible types, which is unfortunate.)
  template <typename... Args>
  explicit UndelayedDestruction(Args&&... args)
      : TDD(std::forward<Args>(args)...) {}

  /**
   * Public destructor.
   *
   * The caller is responsible for ensuring that the object is only destroyed
   * where it is safe to do so.  (i.e., when the destructor guard count is 0).
   *
   * The exact conditions for meeting this may be dependent upon your class
   * semantics.  Typically you are only guaranteed that it is safe to destroy
   * the object directly from the event loop (e.g., directly from a
   * EventBase::LoopCallback), or when the event loop is stopped.
   */
  ~UndelayedDestruction() override {
    // Crash if the caller is destroying us with outstanding destructor guards.
    if (this->getDestructorGuardCount() != 0) {
      abort();
    }
    // Invoke destroy.  This is necessary since our base class may have
    // implemented custom behavior in destroy().
    this->destroy();
  }

  void onDelayedDestroy(bool delayed) override {
    if (delayed && !this->TDD::getDestroyPending()) {
      return;
    }
    // Do nothing.  This will always be invoked from the call to destroy
    // inside our destructor.
    assert(!delayed);
    // prevent unused variable warnings when asserts are compiled out.
    (void)delayed;
  }

 protected:
  /**
   * Override our parent's destroy() method to make it protected.
   * Callers should use the normal destructor instead of destroy
   */
  void destroy() override {
    this->TDD::destroy();
  }

 private:
  // Forbidden copy constructor and assignment operator
  UndelayedDestruction(UndelayedDestruction const&) = delete;
  UndelayedDestruction& operator=(UndelayedDestruction const&) = delete;
};

} // namespace folly

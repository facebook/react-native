/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#pragma once
#include <fb/assert.h>
#include <utility>

namespace facebook {

// Class that lets you declare a global but does not add a static constructor
// to the binary. Eventually I'd like to have this auto-initialize in a
// multithreaded environment but for now it's easiest just to use manual
// initialization.
template <typename T>
class StaticInitialized {
public:
  constexpr StaticInitialized() :
    m_instance(nullptr)
  {}

  template <typename ...Args>
  void initialize(Args&&... arguments) {
    FBASSERT(!m_instance);
    m_instance = new T(std::forward<Args>(arguments)...);
  }

  T* operator->() const {
    return m_instance;
  }
private:
  T* m_instance;
};

}

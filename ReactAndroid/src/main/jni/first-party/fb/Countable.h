/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#pragma once
#include <atomic>
#include <fb/assert.h>
#include <fb/noncopyable.h>
#include <fb/nonmovable.h>
#include <fb/RefPtr.h>

namespace facebook {

class Countable : public noncopyable, public nonmovable {
public:
  // RefPtr expects refcount to start at 0
  Countable() : m_refcount(0) {}
  virtual ~Countable()
  {
    FBASSERT(m_refcount == 0);
  }

private:
  void ref() {
    ++m_refcount;
  }

  void unref() {
    if (0 == --m_refcount) {
      delete this;
    }
  }

  bool hasOnlyOneRef() const {
    return m_refcount == 1;
  }

  template <typename T> friend class RefPtr;
  std::atomic<int> m_refcount;
};

}

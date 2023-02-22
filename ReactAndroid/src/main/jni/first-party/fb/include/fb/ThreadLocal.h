/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <errno.h>
#include <pthread.h>

#include <fb/assert.h>

namespace facebook {

///////////////////////////////////////////////////////////////////////////////

/**
 * A thread-local object is a "global" object within a thread. This is useful
 * for writing apartment-threaded code, where nothing is actullay shared
 * between different threads (hence no locking) but those variables are not
 * on stack in local scope. To use it, just do something like this,
 *
 *   ThreadLocal<MyClass> static_object;
 *     static_object->data_ = ...;
 *     static_object->doSomething();
 *
 *   ThreadLocal<int> static_number;
 *     int value = *static_number;
 *
 * So, syntax-wise it's similar to pointers. T can be primitive types, and if
 * it's a class, there has to be a default constructor.
 */
template <typename T>
class ThreadLocal {
 public:
  /**
   * Constructor that has to be called from a thread-neutral place.
   */
  ThreadLocal() : m_key(0), m_cleanup(OnThreadExit) {
    initialize();
  }

  /**
   * As above but with a custom cleanup function
   */
  typedef void (*CleanupFunction)(void *obj);
  explicit ThreadLocal(CleanupFunction cleanup) : m_key(0), m_cleanup(cleanup) {
    FBASSERT(cleanup);
    initialize();
  }

  /**
   * Access object's member or method through this operator overload.
   */
  T *operator->() const {
    return get();
  }

  T &operator*() const {
    return *get();
  }

  T *get() const {
    return (T *)pthread_getspecific(m_key);
  }

  T *release() {
    T *obj = get();
    pthread_setspecific(m_key, NULL);
    return obj;
  }

  void reset(T *other = NULL) {
    T *old = (T *)pthread_getspecific(m_key);
    if (old != other) {
      FBASSERT(m_cleanup);
      m_cleanup(old);
      pthread_setspecific(m_key, other);
    }
  }

 private:
  void initialize() {
    int ret = pthread_key_create(&m_key, m_cleanup);
    if (ret != 0) {
      const char *msg = "(unknown error)";
      switch (ret) {
        case EAGAIN:
          msg = "PTHREAD_KEYS_MAX (1024) is exceeded";
          break;
        case ENOMEM:
          msg = "Out-of-memory";
          break;
      }
      (void)msg;
      FBASSERTMSGF(0, "pthread_key_create failed: %d %s", ret, msg);
    }
  }

  static void OnThreadExit(void *obj) {
    if (NULL != obj) {
      delete (T *)obj;
    }
  }

  pthread_key_t m_key;
  CleanupFunction m_cleanup;
};

} // namespace facebook

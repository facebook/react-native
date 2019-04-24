/*
 * Copyright 2016-present Facebook, Inc.
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

#include <folly/portability/Config.h>

#if !defined(_WIN32)

#include <pthread.h>

#elif !FOLLY_HAVE_PTHREAD

#include <cstdint>
#include <memory>

#include <folly/portability/Sched.h>
#include <folly/portability/Time.h>
#include <folly/portability/Windows.h>

#define PTHREAD_CREATE_JOINABLE 0
#define PTHREAD_CREATE_DETACHED 1

#define PTHREAD_MUTEX_NORMAL 0
#define PTHREAD_MUTEX_RECURSIVE 1
#define PTHREAD_MUTEX_DEFAULT PTHREAD_MUTEX_NORMAL

#define _POSIX_TIMEOUTS 200112L

namespace folly {
namespace portability {
namespace pthread {
struct pthread_attr_t {
  size_t stackSize;
  bool detached;
};

int pthread_attr_init(pthread_attr_t* attr);
int pthread_attr_setdetachstate(pthread_attr_t* attr, int state);
int pthread_attr_setstacksize(pthread_attr_t* attr, size_t kb);

namespace pthread_detail {
struct pthread_t {
  HANDLE handle{INVALID_HANDLE_VALUE};
  DWORD threadID{0};
  bool detached{false};

  ~pthread_t() noexcept;
};
} // namespace pthread_detail
using pthread_t = std::shared_ptr<pthread_detail::pthread_t>;

int pthread_equal(pthread_t threadA, pthread_t threadB);
int pthread_create(
    pthread_t* thread,
    const pthread_attr_t* attr,
    void* (*start_routine)(void*),
    void* arg);
pthread_t pthread_self();
int pthread_join(pthread_t thread, void** exitCode);

HANDLE pthread_getw32threadhandle_np(pthread_t thread);
DWORD pthread_getw32threadid_np(pthread_t thread);

int pthread_setschedparam(
    pthread_t thread,
    int policy,
    const sched_param* param);

struct pthread_mutexattr_t {
  int type;
};
int pthread_mutexattr_init(pthread_mutexattr_t* attr);
int pthread_mutexattr_destroy(pthread_mutexattr_t* attr);
int pthread_mutexattr_settype(pthread_mutexattr_t* attr, int type);

using pthread_mutex_t = struct pthread_mutex_t_*;
int pthread_mutex_init(pthread_mutex_t* mutex, const pthread_mutexattr_t* attr);
int pthread_mutex_destroy(pthread_mutex_t* mutex);
int pthread_mutex_lock(pthread_mutex_t* mutex);
int pthread_mutex_trylock(pthread_mutex_t* mutex);
int pthread_mutex_unlock(pthread_mutex_t* mutex);
int pthread_mutex_timedlock(
    pthread_mutex_t* mutex,
    const timespec* abs_timeout);

using pthread_rwlock_t = struct pthread_rwlock_t_*;
// Technically the second argument here is supposed to be a
// const pthread_rwlockattr_t* but we don support it, so we
// simply don't define pthread_rwlockattr_t at all to cause
// a build-break if anyone tries to use it.
int pthread_rwlock_init(pthread_rwlock_t* rwlock, const void* attr);
int pthread_rwlock_destroy(pthread_rwlock_t* rwlock);
int pthread_rwlock_rdlock(pthread_rwlock_t* rwlock);
int pthread_rwlock_tryrdlock(pthread_rwlock_t* rwlock);
int pthread_rwlock_timedrdlock(
    pthread_rwlock_t* rwlock,
    const timespec* abs_timeout);
int pthread_rwlock_wrlock(pthread_rwlock_t* rwlock);
int pthread_rwlock_trywrlock(pthread_rwlock_t* rwlock);
int pthread_rwlock_timedwrlock(
    pthread_rwlock_t* rwlock,
    const timespec* abs_timeout);
int pthread_rwlock_unlock(pthread_rwlock_t* rwlock);

using pthread_cond_t = struct pthread_cond_t_*;
// Once again, technically the second argument should be a
// pthread_condattr_t, but we don't implement it, so void*
// it is.
int pthread_cond_init(pthread_cond_t* cond, const void* attr);
int pthread_cond_destroy(pthread_cond_t* cond);
int pthread_cond_wait(pthread_cond_t* cond, pthread_mutex_t* mutex);
int pthread_cond_timedwait(
    pthread_cond_t* cond,
    pthread_mutex_t* mutex,
    const timespec* abstime);
int pthread_cond_signal(pthread_cond_t* cond);
int pthread_cond_broadcast(pthread_cond_t* cond);

// In reality, this is boost::thread_specific_ptr*, but we're attempting
// to avoid introducing boost into a portability header.
using pthread_key_t = void*;

int pthread_key_create(pthread_key_t* key, void (*destructor)(void*));
int pthread_key_delete(pthread_key_t key);
void* pthread_getspecific(pthread_key_t key);
int pthread_setspecific(pthread_key_t key, const void* value);
} // namespace pthread
} // namespace portability
} // namespace folly

/* using override */ using namespace folly::portability::pthread;
#endif

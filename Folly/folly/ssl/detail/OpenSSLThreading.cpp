/*
 * Copyright 2017-present Facebook, Inc.
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

#include <folly/ssl/detail/OpenSSLThreading.h>

#include <memory>
#include <mutex>

#include <folly/Portability.h>
#include <folly/SharedMutex.h>
#include <folly/SpinLock.h>

#include <glog/logging.h>

// We cannot directly use portability/openssl because it also depends on us.
// Therefore we directly use openssl includes. Order of includes is important
// here. See portability/openssl.h.
#include <folly/portability/Windows.h>
#include <openssl/crypto.h>

#if !defined(OPENSSL_IS_BORINGSSL)
#define FOLLY_SSL_DETAIL_OPENSSL_IS_110 (OPENSSL_VERSION_NUMBER >= 0x10100000L)
#else
#define FOLLY_SSL_DETAIL_OPENSSL_IS_110 (false)
#endif

// OpenSSL requires us to provide the implementation of CRYPTO_dynlock_value
// so it must be done in the global namespace.
struct CRYPTO_dynlock_value {
  std::mutex mutex;
};

namespace folly {
namespace ssl {
namespace detail {

static std::map<int, LockType>& lockTypes() {
  static auto lockTypesInst = new std::map<int, LockType>();
  return *lockTypesInst;
}

void setLockTypes(std::map<int, LockType> inLockTypes) {
#if FOLLY_SSL_DETAIL_OPENSSL_IS_110
  LOG(INFO) << "setLockTypes() is unsupported on OpenSSL >= 1.1.0. "
            << "OpenSSL now uses platform native mutexes";
#endif

  lockTypes() = inLockTypes;
}

bool isSSLLockDisabled(int lockId) {
  const auto& sslLocks = lockTypes();
  const auto it = sslLocks.find(lockId);
  return it != sslLocks.end() && it->second == LockType::NONE;
}

namespace {
struct SSLLock {
  explicit SSLLock(LockType inLockType = LockType::MUTEX)
      : lockType(inLockType) {}

  void lock(bool read) {
    if (lockType == LockType::MUTEX) {
      mutex.lock();
    } else if (lockType == LockType::SPINLOCK) {
      spinLock.lock();
    } else if (lockType == LockType::SHAREDMUTEX) {
      if (read) {
        sharedMutex.lock_shared();
      } else {
        sharedMutex.lock();
      }
    }
    // lockType == LOCK_NONE, no-op
  }

  void unlock(bool read) {
    if (lockType == LockType::MUTEX) {
      mutex.unlock();
    } else if (lockType == LockType::SPINLOCK) {
      spinLock.unlock();
    } else if (lockType == LockType::SHAREDMUTEX) {
      if (read) {
        sharedMutex.unlock_shared();
      } else {
        sharedMutex.unlock();
      }
    }
    // lockType == LOCK_NONE, no-op
  }

  LockType lockType;
  folly::SpinLock spinLock{};
  std::mutex mutex;
  SharedMutex sharedMutex;
};
} // namespace

// Statics are unsafe in environments that call exit().
// If one thread calls exit() while another thread is
// references a member of SSLContext, bad things can happen.
// SSLContext runs in such environments.
// Instead of declaring a static member we "new" the static
// member so that it won't be destructed on exit().
static std::unique_ptr<SSLLock[]>& locks() {
  static auto locksInst = new std::unique_ptr<SSLLock[]>();
  return *locksInst;
}

static void callbackLocking(int mode, int n, const char*, int) {
  if (mode & CRYPTO_LOCK) {
    locks()[size_t(n)].lock(mode & CRYPTO_READ);
  } else {
    locks()[size_t(n)].unlock(mode & CRYPTO_READ);
  }
}

static unsigned long callbackThreadID() {
  return static_cast<unsigned long>(folly::getCurrentThreadID());
}

static CRYPTO_dynlock_value* dyn_create(const char*, int) {
  return new CRYPTO_dynlock_value;
}

static void
dyn_lock(int mode, struct CRYPTO_dynlock_value* lock, const char*, int) {
  if (lock != nullptr) {
    if (mode & CRYPTO_LOCK) {
      lock->mutex.lock();
    } else {
      lock->mutex.unlock();
    }
  }
}

static void dyn_destroy(struct CRYPTO_dynlock_value* lock, const char*, int) {
  delete lock;
}

void installThreadingLocks() {
  // static locking
  locks() = std::make_unique<SSLLock[]>(size_t(CRYPTO_num_locks()));
  for (auto it : lockTypes()) {
    locks()[size_t(it.first)].lockType = it.second;
  }
  CRYPTO_set_id_callback(callbackThreadID);
  CRYPTO_set_locking_callback(callbackLocking);
  // dynamic locking
  CRYPTO_set_dynlock_create_callback(dyn_create);
  CRYPTO_set_dynlock_lock_callback(dyn_lock);
  CRYPTO_set_dynlock_destroy_callback(dyn_destroy);
}

void cleanupThreadingLocks() {
  CRYPTO_set_id_callback(nullptr);
  CRYPTO_set_locking_callback(nullptr);
  CRYPTO_set_dynlock_create_callback(nullptr);
  CRYPTO_set_dynlock_lock_callback(nullptr);
  CRYPTO_set_dynlock_destroy_callback(nullptr);
  locks().reset();
}

} // namespace detail
} // namespace ssl
} // namespace folly

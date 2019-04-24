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
#pragma once

#include <map>

#include <folly/ssl/OpenSSLLockTypes.h>

namespace folly {
namespace ssl {
/**
 * Initializes openssl. This should be invoked once, during the start of an
 * application. Subsequent calls to this function are no-ops.
 *
 * For OpenSSL < 1.1.0, any lock types should be set with setLockTypes prior to
 * the call to folly::ssl::init()
 */
void init();

/**
 * Cleans up openssl. This should be invoked at most once during the lifetime
 * of the application. OpenSSL >= 1.1.0 users do not need to manually invoke
 * this method, as OpenSSL will automatically cleanup itself during the exit
 * of the application.
 */
void cleanup();

/**
 * Mark openssl as initialized without actually performing any initialization.
 * Please use this only if you are using a library which requires that it must
 * make its own calls to SSL_library_init() and related functions.
 */
void markInitialized();

/**
 * Set preferences for how to treat locks in OpenSSL.  This must be
 * called before folly::ssl::init(), otherwise the defaults will be used.
 *
 * OpenSSL has a lock for each module rather than for each object or
 * data that needs locking.  Some locks protect only refcounts, and
 * might be better as spinlocks rather than mutexes.  Other locks
 * may be totally unnecessary if the objects being protected are not
 * shared between threads in the application.
 *
 * For a list of OpenSSL lock types, refer to crypto/crypto.h.
 *
 * By default, all locks are initialized as mutexes.  OpenSSL's lock usage
 * may change from version to version and you should know what you are doing
 * before disabling any locks entirely.
 *
 * In newer versions of OpenSSL (>= 1.1.0), OpenSSL manages its own locks,
 * and this function is a no-op.
 *
 * Example: if you don't share SSL sessions between threads in your
 * application, you may be able to do this
 *
 * setSSLLockTypes({{
 *  CRYPTO_LOCK_SSL_SESSION,
 *  SSLContext::SSLLockType::LOCK_NONE
 * }})
 */
void setLockTypes(LockTypeMapping inLockTypes);

/**
 * Set the lock types and initialize OpenSSL in an atomic fashion.  This
 * aborts if the library has already been initialized.
 */
void setLockTypesAndInit(LockTypeMapping lockTypes);

bool isLockDisabled(int lockId);

void randomize();

} // namespace ssl
} // namespace folly

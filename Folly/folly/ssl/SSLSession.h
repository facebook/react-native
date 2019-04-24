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

#include <folly/Memory.h>
#include <folly/portability/OpenSSL.h>
#include <folly/ssl/detail/SSLSessionImpl.h>

namespace folly {
namespace ssl {

class SSLSession {
 public:
  // Holds and takes ownership of an SSL_SESSION object by incrementing refcount
  explicit SSLSession(SSL_SESSION* session, bool takeOwnership = true)
      : impl_(
            std::make_unique<detail::SSLSessionImpl>(session, takeOwnership)) {}

  // Deserialize from a string
  explicit SSLSession(const std::string& serializedSession)
      : impl_(std::make_unique<detail::SSLSessionImpl>(serializedSession)) {}

  // Serialize to a string that is suitable to store in a persistent cache
  std::string serialize() const {
    return impl_->serialize();
  }

  // Get Session ID. Returns an empty container if session isn't set
  std::string getSessionID() const {
    return impl_->getSessionID();
  }

  // Get a const raw SSL_SESSION ptr without incrementing referecnce count
  // (Warning: do not use)
  const SSL_SESSION* getRawSSLSession() const {
    return impl_->getRawSSLSession();
  }

  // Get raw SSL_SESSION pointer
  // Warning: do not use unless you know what you're doing - caller needs to
  // decrement refcount using SSL_SESSION_free or this will leak
  SSL_SESSION* getRawSSLSessionDangerous() {
    return impl_->getRawSSLSessionDangerous();
  }

 private:
  std::unique_ptr<detail::SSLSessionImpl> impl_;
};

} // namespace ssl
} // namespace folly

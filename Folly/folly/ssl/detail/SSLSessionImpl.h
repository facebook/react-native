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

#include <folly/Range.h>

#include <folly/portability/OpenSSL.h>

#include <string>

namespace folly {
namespace ssl {
namespace detail {

class SSLSessionImpl {
 public:
  explicit SSLSessionImpl(SSL_SESSION* session, bool takeOwnership = true);
  explicit SSLSessionImpl(const std::string& serializedSession);
  virtual ~SSLSessionImpl();
  std::string serialize() const;
  std::string getSessionID() const;
  const SSL_SESSION* getRawSSLSession() const;
  SSL_SESSION* getRawSSLSessionDangerous();

 private:
  void upRef();
  void downRef();

  SSL_SESSION* session_{nullptr};
};

} // namespace detail
} // namespace ssl
} // namespace folly

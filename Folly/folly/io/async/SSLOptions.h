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

#include <folly/container/Array.h>
#include <folly/io/async/SSLContext.h>

namespace folly {
namespace ssl {

namespace ssl_options_detail {
void logDfatal(std::exception const&);
} // namespace ssl_options_detail

struct SSLCommonOptions {
  /**
   * The cipher list recommended for this options configuration.
   */
  static constexpr auto kCipherList = folly::make_array(
      "ECDHE-ECDSA-AES128-GCM-SHA256",
      "ECDHE-RSA-AES128-GCM-SHA256",
      "ECDHE-ECDSA-AES256-GCM-SHA384",
      "ECDHE-RSA-AES256-GCM-SHA384",
      "ECDHE-ECDSA-AES256-SHA",
      "ECDHE-RSA-AES256-SHA",
      "ECDHE-ECDSA-AES128-SHA",
      "ECDHE-RSA-AES128-SHA",
      "ECDHE-RSA-AES256-SHA384",
      "AES128-GCM-SHA256",
      "AES256-SHA",
      "AES128-SHA");

  /**
   * The list of signature algorithms recommended for this options
   * configuration.
   */
  static constexpr auto kSignatureAlgorithms = folly::make_array(
      "RSA+SHA512",
      "ECDSA+SHA512",
      "RSA+SHA384",
      "ECDSA+SHA384",
      "RSA+SHA256",
      "ECDSA+SHA256",
      "RSA+SHA1",
      "ECDSA+SHA1");

  /**
   * Set common parameters on a client SSL context, for example,
   * ciphers, signature algorithms, verification options, and client EC curves.
   * @param ctx The SSL Context to which to apply the options.
   */
  static void setClientOptions(SSLContext& ctx);
};

/**
 * Recommended SSL options for server-side scenario.
 */
struct SSLServerOptions {
  /**
   * The list of ciphers recommended for server use.
   */
  static constexpr auto kCipherList = folly::make_array(
      "ECDHE-ECDSA-AES128-GCM-SHA256",
      "ECDHE-ECDSA-AES256-GCM-SHA384",
      "ECDHE-ECDSA-AES128-SHA",
      "ECDHE-ECDSA-AES256-SHA",
      "ECDHE-RSA-AES128-GCM-SHA256",
      "ECDHE-RSA-AES256-GCM-SHA384",
      "ECDHE-RSA-AES128-SHA",
      "ECDHE-RSA-AES256-SHA",
      "AES128-GCM-SHA256",
      "AES256-GCM-SHA384",
      "AES128-SHA",
      "AES256-SHA");
};

/**
 * Set the cipher suite of ctx to that in TSSLOptions, and print any runtime
 * error it catches.
 * @param ctx The SSLContext to apply the desired SSL options to.
 */
template <typename TSSLOptions>
void setCipherSuites(SSLContext& ctx) {
  try {
    ctx.setCipherList(TSSLOptions::kCipherList);
  } catch (std::runtime_error const& e) {
    ssl_options_detail::logDfatal(e);
  }
}

/**
 * Set the signature algorithm list of ctx to that in TSSLOptions, and print
 * any runtime errors it catche.
 * @param ctx The SSLContext to apply the desired SSL options to.
 */
template <typename TSSLOptions>
void setSignatureAlgorithms(SSLContext& ctx) {
  try {
    ctx.setSignatureAlgorithms(TSSLOptions::kSignatureAlgorithms);
  } catch (std::runtime_error const& e) {
    ssl_options_detail::logDfatal(e);
  }
}

} // namespace ssl
} // namespace folly

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

#include <folly/io/async/SSLOptions.h>
#include <folly/Format.h>
#include <glog/logging.h>

namespace folly {
namespace ssl {

namespace ssl_options_detail {
void logDfatal(std::exception const& e) {
  LOG(DFATAL) << exceptionStr(e);
}
} // namespace ssl_options_detail

constexpr std::array<const char*, 12> SSLCommonOptions::kCipherList;
constexpr std::array<const char*, 8> SSLCommonOptions::kSignatureAlgorithms;
constexpr std::array<const char*, 12> SSLServerOptions::kCipherList;

void SSLCommonOptions::setClientOptions(SSLContext& ctx) {
#ifdef SSL_MODE_HANDSHAKE_CUTTHROUGH
  ctx.enableFalseStart();
#endif

  X509VerifyParam param(X509_VERIFY_PARAM_new());
  X509_VERIFY_PARAM_set_flags(param.get(), X509_V_FLAG_X509_STRICT);
  try {
    ctx.setX509VerifyParam(param);
  } catch (std::runtime_error const& e) {
    LOG(DFATAL) << exceptionStr(e);
  }

  try {
    ctx.setClientECCurvesList({"P-256", "P-384"});
  } catch (std::runtime_error const& e) {
    LOG(DFATAL) << exceptionStr(e);
  }

  setCipherSuites<SSLCommonOptions>(ctx);
  setSignatureAlgorithms<SSLCommonOptions>(ctx);
}

} // namespace ssl
} // namespace folly

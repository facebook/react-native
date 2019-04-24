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

#include <folly/io/Cursor.h>
#include <folly/io/IOBuf.h>
#include <map>
#include <vector>

namespace folly {
namespace ssl {

// http://www.iana.org/assignments/tls-extensiontype-values/tls-extensiontype-values.xhtml
enum class TLSExtension : uint16_t {
  SERVER_NAME = 0,
  MAX_FRAGMENT_LENGTH = 1,
  CLIENT_CERTIFICATE_URL = 2,
  TRUSTED_CA_KEYS = 3,
  TRUNCATED_HMAC = 4,
  STATUS_REQUEST = 5,
  USER_MAPPING = 6,
  CLIENT_AUTHZ = 7,
  SERVER_AUTHZ = 8,
  CERT_TYPE = 9,
  SUPPORTED_GROUPS = 10,
  EC_POINT_FORMATS = 11,
  SRP = 12,
  SIGNATURE_ALGORITHMS = 13,
  USE_SRTP = 14,
  HEARTBEAT = 15,
  APPLICATION_LAYER_PROTOCOL_NEGOTIATION = 16,
  STATUS_REQUEST_V2 = 17,
  SIGNED_CERTIFICATE_TIMESTAMP = 18,
  CLIENT_CERTIFICATE_TYPE = 19,
  SERVER_CERTIFICATE_TYPE = 20,
  PADDING = 21,
  ENCRYPT_THEN_MAC = 22,
  EXTENDED_MASTER_SECRET = 23,
  SESSION_TICKET = 35,
  SUPPORTED_VERSIONS = 43,
  // Facebook-specific, not IANA assigned yet
  TLS_CACHED_INFO_FB = 60001,
  // End Facebook-specific
  RENEGOTIATION_INFO = 65281
};

// http://www.iana.org/assignments/tls-parameters/tls-parameters.xhtml#tls-parameters-18
enum class HashAlgorithm : uint8_t {
  NONE = 0,
  MD5 = 1,
  SHA1 = 2,
  SHA224 = 3,
  SHA256 = 4,
  SHA384 = 5,
  SHA512 = 6
};

// http://www.iana.org/assignments/tls-parameters/tls-parameters.xhtml#tls-parameters-16
enum class SignatureAlgorithm : uint8_t {
  ANONYMOUS = 0,
  RSA = 1,
  DSA = 2,
  ECDSA = 3
};

struct ClientHelloInfo {
  folly::IOBufQueue clientHelloBuf_;
  uint8_t clientHelloMajorVersion_;
  uint8_t clientHelloMinorVersion_;
  std::vector<uint16_t> clientHelloCipherSuites_;
  std::vector<uint8_t> clientHelloCompressionMethods_;
  std::vector<TLSExtension> clientHelloExtensions_;
  std::vector<std::pair<HashAlgorithm, SignatureAlgorithm>> clientHelloSigAlgs_;
  std::vector<uint16_t> clientHelloSupportedVersions_;
};

} // namespace ssl
} // namespace folly

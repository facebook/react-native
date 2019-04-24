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
#include <folly/portability/Sockets.h>
#include <folly/ssl/OpenSSLPtrTypes.h>

namespace folly {
namespace ssl {

class OpenSSLUtils {
 public:
  /*
   * Get the TLS Session Master Key used to generate the TLS key material
   *
   * @param session ssl session
   * @param keyOut destination for the master key, the buffer must be at least
   * 48 bytes
   * @return true if the master key is available (>= TLS1) and the output buffer
   * large enough
   */
  static bool getTLSMasterKey(
      const SSL_SESSION* session,
      MutableByteRange keyOut);

  /*
   * Get the TLS Client Random used to generate the TLS key material
   *
   * @param ssl
   * @param randomOut destination for the client random, the buffer must be at
   * least 32 bytes
   * @return true if the client random is available (>= TLS1) and the output
   * buffer large enough
   */
  static bool getTLSClientRandom(const SSL* ssl, MutableByteRange randomOut);

  /**
   * Validate that the peer certificate's common name or subject alt names
   * match what we expect.  Currently this only checks for IPs within
   * subject alt names but it could easily be expanded to check common name
   * and hostnames as well.
   *
   * @param cert    X509* peer certificate
   * @param addr    sockaddr object containing sockaddr to verify
   * @param addrLen length of sockaddr as returned by getpeername or accept
   * @return true iff a subject altname IP matches addr
   */
  // TODO(agartrell): Add support for things like common name when
  // necessary.
  static bool
  validatePeerCertNames(X509* cert, const sockaddr* addr, socklen_t addrLen);

  /**
   * Get the peer socket address from an X509_STORE_CTX*.  Unlike the
   * accept, getsockname, getpeername, etc family of operations, addrLen's
   * initial value is ignored and reset.
   *
   * @param ctx         Context from which to retrieve peer sockaddr
   * @param addrStorage out param for address
   * @param addrLen     out param for length of address
   * @return true on success, false on failure
   */
  static bool getPeerAddressFromX509StoreCtx(
      X509_STORE_CTX* ctx,
      sockaddr_storage* addrStorage,
      socklen_t* addrLen);

  /**
   * Get a stringified cipher name (e.g., ECDHE-ECDSA-CHACHA20-POLY1305) given
   * the 2-byte code (e.g., 0xcca9) for the cipher. The name conversion only
   * works for the ciphers built into the linked OpenSSL library
   *
   * @param cipherCode      A 16-bit IANA cipher code (machine endianness)
   * @return Cipher name, or empty if the code is not found
   */
  static const std::string& getCipherName(uint16_t cipherCode);

  /**
   * Set the 'initial_ctx' SSL_CTX* inside an SSL. The initial_ctx is used to
   * point to the SSL_CTX on which servername callback and session callbacks,
   * as well as session caching stats are set. If we want to enforce SSL_CTX
   * thread-based ownership (e.g., thread-local SSL_CTX) in the application, we
   * need to also set/reset the initial_ctx when we call SSL_set_SSL_CTX.
   *
   * @param ssl      SSL pointer
   * @param ctx      SSL_CTX pointer
   * @return Cipher name, or empty if the code is not found
   */
  static void setSSLInitialCtx(SSL* ssl, SSL_CTX* ctx);
  static SSL_CTX* getSSLInitialCtx(SSL* ssl);

  /**
   * Get the common name out of a cert.  Return empty if x509 is null.
   */
  static std::string getCommonName(X509* x509);

  /**
   * Wrappers for BIO operations that may be different across different
   * versions/flavors of OpenSSL (including forks like BoringSSL)
   */
  static BioMethodUniquePtr newSocketBioMethod();
  static bool setCustomBioReadMethod(
      BIO_METHOD* bioMeth,
      int (*meth)(BIO*, char*, int));
  static bool setCustomBioWriteMethod(
      BIO_METHOD* bioMeth,
      int (*meth)(BIO*, const char*, int));
  static int getBioShouldRetryWrite(int ret);
  static void setBioAppData(BIO* b, void* ptr);
  static void* getBioAppData(BIO* b);
  static int getBioFd(BIO* b, int* fd);
  static void setBioFd(BIO* b, int fd, int flags);
};

} // namespace ssl
} // namespace folly

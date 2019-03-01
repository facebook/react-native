/*
 * Copyright 2017 Facebook, Inc.
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

// This must come before the OpenSSL includes.
#include <folly/portability/Windows.h>

#include <openssl/ssl.h>
#include <openssl/x509.h>

namespace folly {
namespace ssl {

// BoringSSL doesn't have notion of versioning although it defines
// OPENSSL_VERSION_NUMBER to maintain compatibility. The following variables are
// intended to be specific to OpenSSL.
#if !defined(OPENSSL_IS_BORINGSSL)
#define FOLLY_OPENSSL_IS_101                \
  (OPENSSL_VERSION_NUMBER >= 0x1000105fL && \
   OPENSSL_VERSION_NUMBER < 0x1000200fL)
#define FOLLY_OPENSSL_IS_102                \
  (OPENSSL_VERSION_NUMBER >= 0x1000200fL && \
   OPENSSL_VERSION_NUMBER < 0x10100000L)
#define FOLLY_OPENSSL_IS_110 (OPENSSL_VERSION_NUMBER >= 0x10100000L)
#endif // !defined(OPENSSL_IS_BORINGSSL)

// BoringSSL and OpenSSL 1.0.2 later with TLS extension support ALPN.
#if defined(OPENSSL_IS_BORINGSSL) ||          \
    (OPENSSL_VERSION_NUMBER >= 0x1000200fL && \
     !defined(OPENSSL_NO_TLSEXT))
#define FOLLY_OPENSSL_HAS_ALPN 1
#else
#define FOLLY_OPENSSL_HAS_ALPN 0
#endif

// BoringSSL and OpenSSL 0.9.8f later with TLS extension support SNI.
#if defined(OPENSSL_IS_BORINGSSL) ||          \
    (OPENSSL_VERSION_NUMBER >= 0x00908070L && \
     !defined(OPENSSL_NO_TLSEXT))
#define FOLLY_OPENSSL_HAS_SNI 1
#else
#define FOLLY_OPENSSL_HAS_SNI 0
#endif

// This class attempts to "unify" the OpenSSL libssl APIs between OpenSSL 1.0.2,
// 1.1.0 and BoringSSL. The general idea is to provide wrapper methods for 1.0.2
// which already exist in BoringSSL and 1.1.0, but there are few APIs such as
// SSL_CTX_set1_sigalgs_list and so on which exist in 1.0.2 but were removed
// in BoringSSL

#ifdef OPENSSL_IS_BORINGSSL

int SSL_CTX_set1_sigalgs_list(SSL_CTX* ctx, const char* sigalgs_list);
int TLS1_get_client_version(SSL* s);
int BIO_meth_set_read(BIO_METHOD* biom, int (*read)(BIO*, char*, int));
int BIO_meth_set_write(BIO_METHOD* biom, int (*write)(BIO*, const char*, int));

#elif FOLLY_OPENSSL_IS_102 || FOLLY_OPENSSL_IS_101

int SSL_CTX_up_ref(SSL_CTX* session);
int SSL_SESSION_up_ref(SSL_SESSION* session);
int X509_up_ref(X509* x);
int BIO_meth_set_read(BIO_METHOD* biom, int (*read)(BIO*, char*, int));
int BIO_meth_set_write(BIO_METHOD* biom, int (*write)(BIO*, const char*, int));

#elif FOLLY_OPENSSL_IS_110

#else
#warning Compiling with unsupported OpenSSL version
#endif

} // ssl
} // folly

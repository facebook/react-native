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

#include <cstdint>

// This must come before the OpenSSL includes.
#include <folly/portability/Windows.h>

#include <folly/Portability.h>

#include <openssl/opensslv.h>

#include <openssl/asn1.h>
#include <openssl/bio.h>
#include <openssl/crypto.h>
#include <openssl/dh.h>
#include <openssl/err.h>
#include <openssl/evp.h>
#include <openssl/hmac.h>
#include <openssl/rand.h>
#include <openssl/rsa.h>
#include <openssl/sha.h>
#include <openssl/ssl.h>
#include <openssl/tls1.h>
#include <openssl/x509.h>
#include <openssl/x509v3.h>

#ifndef OPENSSL_NO_EC
#include <openssl/ec.h>
#include <openssl/ecdsa.h>
#endif

// BoringSSL doesn't have notion of versioning although it defines
// OPENSSL_VERSION_NUMBER to maintain compatibility. The following variables are
// intended to be specific to OpenSSL.
#if !defined(OPENSSL_IS_BORINGSSL)
#define FOLLY_OPENSSL_IS_100                \
  (OPENSSL_VERSION_NUMBER >= 0x10000003L && \
   OPENSSL_VERSION_NUMBER < 0x1000105fL)
#define FOLLY_OPENSSL_IS_101                \
  (OPENSSL_VERSION_NUMBER >= 0x1000105fL && \
   OPENSSL_VERSION_NUMBER < 0x1000200fL)
#define FOLLY_OPENSSL_IS_102                \
  (OPENSSL_VERSION_NUMBER >= 0x1000200fL && \
   OPENSSL_VERSION_NUMBER < 0x10100000L)
#define FOLLY_OPENSSL_IS_110 (OPENSSL_VERSION_NUMBER >= 0x10100000L)
#endif

#if !defined(OPENSSL_IS_BORINGSSL) && !FOLLY_OPENSSL_IS_100 && \
    !FOLLY_OPENSSL_IS_101 && !FOLLY_OPENSSL_IS_102 && !FOLLY_OPENSSL_IS_110
#warning Compiling with unsupported OpenSSL version
#endif

// BoringSSL and OpenSSL 0.9.8f later with TLS extension support SNI.
#if defined(OPENSSL_IS_BORINGSSL) || \
    (OPENSSL_VERSION_NUMBER >= 0x00908070L && !defined(OPENSSL_NO_TLSEXT))
#define FOLLY_OPENSSL_HAS_SNI 1
#else
#define FOLLY_OPENSSL_HAS_SNI 0
#endif

// BoringSSL and OpenSSL 1.0.2 later with TLS extension support ALPN.
#if defined(OPENSSL_IS_BORINGSSL) || \
    (OPENSSL_VERSION_NUMBER >= 0x1000200fL && !defined(OPENSSL_NO_TLSEXT))
#define FOLLY_OPENSSL_HAS_ALPN 1
#else
#define FOLLY_OPENSSL_HAS_ALPN 0
#endif

// This attempts to "unify" the OpenSSL libcrypto/libssl APIs between
// OpenSSL 1.0.2, 1.1.0 (and some earlier versions) and BoringSSL. The general
// idea is to provide namespaced wrapper methods for versions which do not
// which already exist in BoringSSL and 1.1.0, but there are few APIs such as
// SSL_CTX_set1_sigalgs_list and so on which exist in 1.0.2 but were removed
// in BoringSSL
namespace folly {
namespace portability {
namespace ssl {

#ifdef OPENSSL_IS_BORINGSSL
int SSL_CTX_set1_sigalgs_list(SSL_CTX* ctx, const char* sigalgs_list);
int TLS1_get_client_version(SSL* s);
#endif

#if FOLLY_OPENSSL_IS_100
uint32_t SSL_CIPHER_get_id(const SSL_CIPHER*);
int TLS1_get_client_version(const SSL*);
#endif

#if FOLLY_OPENSSL_IS_100 || FOLLY_OPENSSL_IS_101
int X509_get_signature_nid(X509* cert);
#endif

#if FOLLY_OPENSSL_IS_100 || FOLLY_OPENSSL_IS_101 || FOLLY_OPENSSL_IS_102
int SSL_CTX_up_ref(SSL_CTX* session);
int SSL_SESSION_up_ref(SSL_SESSION* session);
int X509_up_ref(X509* x);
int X509_STORE_up_ref(X509_STORE* v);
int EVP_PKEY_up_ref(EVP_PKEY* evp);
void RSA_get0_key(
    const RSA* r,
    const BIGNUM** n,
    const BIGNUM** e,
    const BIGNUM** d);
RSA* EVP_PKEY_get0_RSA(EVP_PKEY* pkey);
DSA* EVP_PKEY_get0_DSA(EVP_PKEY* pkey);
DH* EVP_PKEY_get0_DH(EVP_PKEY* pkey);
EC_KEY* EVP_PKEY_get0_EC_KEY(EVP_PKEY* pkey);
#endif

#if !FOLLY_OPENSSL_IS_110
BIO_METHOD* BIO_meth_new(int type, const char* name);
void BIO_meth_free(BIO_METHOD* biom);
int BIO_meth_set_read(BIO_METHOD* biom, int (*read)(BIO*, char*, int));
int BIO_meth_set_write(BIO_METHOD* biom, int (*write)(BIO*, const char*, int));
int BIO_meth_set_puts(BIO_METHOD* biom, int (*bputs)(BIO*, const char*));
int BIO_meth_set_gets(BIO_METHOD* biom, int (*bgets)(BIO*, char*, int));
int BIO_meth_set_ctrl(BIO_METHOD* biom, long (*ctrl)(BIO*, int, long, void*));
int BIO_meth_set_create(BIO_METHOD* biom, int (*create)(BIO*));
int BIO_meth_set_destroy(BIO_METHOD* biom, int (*destroy)(BIO*));

void BIO_set_data(BIO* bio, void* ptr);
void* BIO_get_data(BIO* bio);
void BIO_set_init(BIO* bio, int init);
void BIO_set_shutdown(BIO* bio, int shutdown);

const SSL_METHOD* TLS_server_method(void);
const SSL_METHOD* TLS_client_method(void);

const char* SSL_SESSION_get0_hostname(const SSL_SESSION* s);
unsigned char* ASN1_STRING_get0_data(const ASN1_STRING* x);

EVP_MD_CTX* EVP_MD_CTX_new();
void EVP_MD_CTX_free(EVP_MD_CTX* ctx);

HMAC_CTX* HMAC_CTX_new();
void HMAC_CTX_free(HMAC_CTX* ctx);

unsigned long SSL_SESSION_get_ticket_lifetime_hint(const SSL_SESSION* s);
int SSL_SESSION_has_ticket(const SSL_SESSION* s);
int DH_set0_pqg(DH* dh, BIGNUM* p, BIGNUM* q, BIGNUM* g);
void DH_get0_pqg(
    const DH* dh,
    const BIGNUM** p,
    const BIGNUM** q,
    const BIGNUM** g);
void DH_get0_key(const DH* dh, const BIGNUM** pub_key, const BIGNUM** priv_key);

void DSA_get0_pqg(
    const DSA* dsa,
    const BIGNUM** p,
    const BIGNUM** q,
    const BIGNUM** g);
void DSA_get0_key(
    const DSA* dsa,
    const BIGNUM** pub_key,
    const BIGNUM** priv_key);

STACK_OF(X509_OBJECT) * X509_STORE_get0_objects(X509_STORE* store);

X509* X509_STORE_CTX_get0_cert(X509_STORE_CTX* ctx);
STACK_OF(X509) * X509_STORE_CTX_get0_chain(X509_STORE_CTX* ctx);
STACK_OF(X509) * X509_STORE_CTX_get0_untrusted(X509_STORE_CTX* ctx);
bool RSA_set0_key(RSA* r, BIGNUM* n, BIGNUM* e, BIGNUM* d);
void RSA_get0_factors(const RSA* r, const BIGNUM** p, const BIGNUM** q);
void RSA_get0_crt_params(
    const RSA* r,
    const BIGNUM** dmp1,
    const BIGNUM** dmq1,
    const BIGNUM** iqmp);
int ECDSA_SIG_set0(ECDSA_SIG* sig, BIGNUM* r, BIGNUM* s);
void ECDSA_SIG_get0(const ECDSA_SIG* sig, const BIGNUM** pr, const BIGNUM** ps);

using OPENSSL_INIT_SETTINGS = void;
int OPENSSL_init_ssl(uint64_t opts, const OPENSSL_INIT_SETTINGS* settings);
void OPENSSL_cleanup();

const ASN1_INTEGER* X509_REVOKED_get0_serialNumber(const X509_REVOKED* r);
const ASN1_TIME* X509_REVOKED_get0_revocationDate(const X509_REVOKED* r);

uint32_t X509_get_extension_flags(X509* x);
uint32_t X509_get_key_usage(X509* x);
uint32_t X509_get_extended_key_usage(X509* x);

int X509_OBJECT_get_type(const X509_OBJECT* obj);
X509* X509_OBJECT_get0_X509(const X509_OBJECT* obj);

const ASN1_TIME* X509_CRL_get0_lastUpdate(const X509_CRL* crl);
const ASN1_TIME* X509_CRL_get0_nextUpdate(const X509_CRL* crl);

const X509_ALGOR* X509_get0_tbs_sigalg(const X509* x);

#endif

#if FOLLY_OPENSSL_IS_110
// Note: this was a type and has been fixed upstream, so the next 1.1.0
// minor version upgrade will need to remove this
#define OPENSSL_lh_new OPENSSL_LH_new

// OpenSSL v1.1.0 removed support for SSLv2, and also removed the define that
// indicates it isn't supported.
#define OPENSSL_NO_SSL2
#endif
} // namespace ssl
} // namespace portability
} // namespace folly

FOLLY_PUSH_WARNING
FOLLY_CLANG_DISABLE_WARNING("-Wheader-hygiene")
/* using override */ using namespace folly::portability::ssl;
FOLLY_POP_WARNING

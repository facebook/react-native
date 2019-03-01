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

#include <glog/logging.h>

#include <openssl/asn1.h>
#include <openssl/bio.h>
#include <openssl/bn.h>
#ifndef OPENSSL_NO_EC
#include <openssl/ec.h>
#include <openssl/ecdsa.h>
#endif
#include <openssl/evp.h>
#include <openssl/rsa.h>
#include <openssl/ssl.h>
#include <openssl/x509.h>

#include <folly/Memory.h>

namespace folly {
namespace ssl {

// ASN1
using ASN1TimeDeleter =
    folly::static_function_deleter<ASN1_TIME, &ASN1_TIME_free>;
using ASN1TimeUniquePtr = std::unique_ptr<ASN1_TIME, ASN1TimeDeleter>;

// X509
using X509Deleter = folly::static_function_deleter<X509, &X509_free>;
using X509UniquePtr = std::unique_ptr<X509, X509Deleter>;
using X509StoreCtxDeleter =
    folly::static_function_deleter<X509_STORE_CTX, &X509_STORE_CTX_free>;
using X509StoreCtxUniquePtr =
    std::unique_ptr<X509_STORE_CTX, X509StoreCtxDeleter>;
using X509VerifyParamDeleter =
    folly::static_function_deleter<X509_VERIFY_PARAM, &X509_VERIFY_PARAM_free>;
using X509VerifyParam =
    std::unique_ptr<X509_VERIFY_PARAM, X509VerifyParamDeleter>;

// EVP
using EvpPkeyDel = folly::static_function_deleter<EVP_PKEY, &EVP_PKEY_free>;
using EvpPkeyUniquePtr = std::unique_ptr<EVP_PKEY, EvpPkeyDel>;
using EvpPkeySharedPtr = std::shared_ptr<EVP_PKEY>;

// No EVP_PKEY_CTX <= 0.9.8b
#if OPENSSL_VERSION_NUMBER >= 0x10000002L
using EvpPkeyCtxDeleter =
    folly::static_function_deleter<EVP_PKEY_CTX, &EVP_PKEY_CTX_free>;
using EvpPkeyCtxUniquePtr = std::unique_ptr<EVP_PKEY_CTX, EvpPkeyCtxDeleter>;
#else
struct EVP_PKEY_CTX;
#endif
using EvpMdCtxDeleter =
    folly::static_function_deleter<EVP_MD_CTX, &EVP_MD_CTX_destroy>;
using EvpMdCtxUniquePtr = std::unique_ptr<EVP_MD_CTX, EvpMdCtxDeleter>;

// BIO
using BioDeleter = folly::static_function_deleter<BIO, &BIO_vfree>;
using BioUniquePtr = std::unique_ptr<BIO, BioDeleter>;
using BioChainDeleter = folly::static_function_deleter<BIO, &BIO_free_all>;
using BioChainUniquePtr = std::unique_ptr<BIO, BioChainDeleter>;
inline void BIO_free_fb(BIO* bio) { CHECK_EQ(1, BIO_free(bio)); }
using BioDeleterFb = folly::static_function_deleter<BIO, &BIO_free_fb>;
using BioUniquePtrFb = std::unique_ptr<BIO, BioDeleterFb>;

// RSA and EC
using RsaDeleter = folly::static_function_deleter<RSA, &RSA_free>;
using RsaUniquePtr = std::unique_ptr<RSA, RsaDeleter>;
#ifndef OPENSSL_NO_EC
using EcKeyDeleter = folly::static_function_deleter<EC_KEY, &EC_KEY_free>;
using EcKeyUniquePtr = std::unique_ptr<EC_KEY, EcKeyDeleter>;
using EcGroupDeleter = folly::static_function_deleter<EC_GROUP, &EC_GROUP_free>;
using EcGroupUniquePtr = std::unique_ptr<EC_GROUP, EcGroupDeleter>;
using EcPointDeleter = folly::static_function_deleter<EC_POINT, &EC_POINT_free>;
using EcPointUniquePtr = std::unique_ptr<EC_POINT, EcPointDeleter>;
using EcdsaSignDeleter =
    folly::static_function_deleter<ECDSA_SIG, &ECDSA_SIG_free>;
using EcdsaSigUniquePtr = std::unique_ptr<ECDSA_SIG, EcdsaSignDeleter>;
#endif

// BIGNUMs
using BIGNUMDeleter = folly::static_function_deleter<BIGNUM, &BN_clear_free>;
using BIGNUMUniquePtr = std::unique_ptr<BIGNUM, BIGNUMDeleter>;

// SSL and SSL_CTX
using SSLDeleter = folly::static_function_deleter<SSL, &SSL_free>;
using SSLUniquePtr = std::unique_ptr<SSL, SSLDeleter>;
}
}

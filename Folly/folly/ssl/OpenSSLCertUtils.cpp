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
#include <folly/ssl/OpenSSLCertUtils.h>
#include <folly/String.h>
#include <folly/io/async/ssl/OpenSSLPtrTypes.h>

#include <openssl/x509.h>
#include <openssl/x509v3.h>

#include <folly/ScopeGuard.h>

namespace folly {
namespace ssl {

Optional<std::string> OpenSSLCertUtils::getCommonName(X509& x509) {
  auto subject = X509_get_subject_name(&x509);
  if (!subject) {
    return none;
  }

  auto cnLoc = X509_NAME_get_index_by_NID(subject, NID_commonName, -1);
  if (cnLoc < 0) {
    return none;
  }

  auto cnEntry = X509_NAME_get_entry(subject, cnLoc);
  if (!cnEntry) {
    return none;
  }

  auto cnAsn = X509_NAME_ENTRY_get_data(cnEntry);
  if (!cnAsn) {
    return none;
  }

  auto cnData = reinterpret_cast<const char*>(ASN1_STRING_data(cnAsn));
  auto cnLen = ASN1_STRING_length(cnAsn);
  if (!cnData || cnLen <= 0) {
    return none;
  }

  return Optional<std::string>(std::string(cnData, cnLen));
}

std::vector<std::string> OpenSSLCertUtils::getSubjectAltNames(X509& x509) {
  auto names = reinterpret_cast<STACK_OF(GENERAL_NAME)*>(
      X509_get_ext_d2i(&x509, NID_subject_alt_name, nullptr, nullptr));
  if (!names) {
    return {};
  }
  SCOPE_EXIT {
    sk_GENERAL_NAME_pop_free(names, GENERAL_NAME_free);
  };

  std::vector<std::string> ret;
  auto count = sk_GENERAL_NAME_num(names);
  for (int i = 0; i < count; i++) {
    auto genName = sk_GENERAL_NAME_value(names, i);
    if (!genName || genName->type != GEN_DNS) {
      continue;
    }
    auto nameData =
        reinterpret_cast<const char*>(ASN1_STRING_data(genName->d.dNSName));
    auto nameLen = ASN1_STRING_length(genName->d.dNSName);
    if (!nameData || nameLen <= 0) {
      continue;
    }
    ret.emplace_back(nameData, nameLen);
  }
  return ret;
}

Optional<std::string> OpenSSLCertUtils::getSubject(X509& x509) {
  auto subject = X509_get_subject_name(&x509);
  if (!subject) {
    return none;
  }

  auto bio = BioUniquePtr(BIO_new(BIO_s_mem()));
  if (bio == nullptr) {
    throw std::runtime_error("Cannot allocate bio");
  }
  if (X509_NAME_print_ex(bio.get(), subject, 0, XN_FLAG_ONELINE) <= 0) {
    return none;
  }

  char* bioData = nullptr;
  size_t bioLen = BIO_get_mem_data(bio.get(), &bioData);
  return std::string(bioData, bioLen);
}

Optional<std::string> OpenSSLCertUtils::getIssuer(X509& x509) {
  auto issuer = X509_get_issuer_name(&x509);
  if (!issuer) {
    return none;
  }

  auto bio = BioUniquePtr(BIO_new(BIO_s_mem()));
  if (bio == nullptr) {
    throw std::runtime_error("Cannot allocate bio");
  }

  if (X509_NAME_print_ex(bio.get(), issuer, 0, XN_FLAG_ONELINE) <= 0) {
    return none;
  }

  char* bioData = nullptr;
  size_t bioLen = BIO_get_mem_data(bio.get(), &bioData);
  return std::string(bioData, bioLen);
}

folly::Optional<std::string> OpenSSLCertUtils::toString(X509& x509) {
  auto in = BioUniquePtr(BIO_new(BIO_s_mem()));
  if (in == nullptr) {
    throw std::runtime_error("Cannot allocate bio");
  }

  int flags = 0;

  flags |= X509_FLAG_NO_HEADER | /* A few bytes of cert and data */
      X509_FLAG_NO_PUBKEY | /* Public key */
      X509_FLAG_NO_AUX | /* Auxiliary info? */
      X509_FLAG_NO_SIGDUMP | /* Prints the signature */
      X509_FLAG_NO_SIGNAME; /* Signature algorithms */

#ifdef X509_FLAG_NO_IDS
  flags |= X509_FLAG_NO_IDS; /* Issuer/subject IDs */
#endif

  if (X509_print_ex(in.get(), &x509, XN_FLAG_ONELINE, flags) > 0) {
    char* bioData = nullptr;
    size_t bioLen = BIO_get_mem_data(in.get(), &bioData);
    return std::string(bioData, bioLen);
  } else {
    return none;
  }
}

std::string OpenSSLCertUtils::getNotAfterTime(X509& x509) {
  return getDateTimeStr(X509_get_notAfter(&x509));
}

std::string OpenSSLCertUtils::getNotBeforeTime(X509& x509) {
  return getDateTimeStr(X509_get_notBefore(&x509));
}

std::string OpenSSLCertUtils::getDateTimeStr(const ASN1_TIME* time) {
  if (!time) {
    return "";
  }

  std::array<char, 32> buf;

  auto bio = BioUniquePtr(BIO_new(BIO_s_mem()));
  if (bio == nullptr) {
    throw std::runtime_error("Cannot allocate bio");
  }

  if (ASN1_TIME_print(bio.get(), time) <= 0) {
    throw std::runtime_error("Cannot print ASN1_TIME");
  }

  char* bioData = nullptr;
  size_t bioLen = BIO_get_mem_data(bio.get(), &bioData);
  return std::string(bioData, bioLen);
}

} // ssl
} // folly

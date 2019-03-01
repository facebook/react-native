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

#include "SSLContext.h"

#include <openssl/err.h>
#include <openssl/rand.h>
#include <openssl/ssl.h>
#include <openssl/x509v3.h>

#include <folly/Format.h>
#include <folly/Memory.h>
#include <folly/Random.h>
#include <folly/SpinLock.h>

// ---------------------------------------------------------------------
// SSLContext implementation
// ---------------------------------------------------------------------

struct CRYPTO_dynlock_value {
  std::mutex mutex;
};

namespace folly {
//
// For OpenSSL portability API
using namespace folly::ssl;

bool SSLContext::initialized_ = false;

namespace {

std::mutex& initMutex() {
  static std::mutex m;
  return m;
}

} // anonymous namespace

#ifdef OPENSSL_NPN_NEGOTIATED
int SSLContext::sNextProtocolsExDataIndex_ = -1;
#endif

// SSLContext implementation
SSLContext::SSLContext(SSLVersion version) {
  {
    std::lock_guard<std::mutex> g(initMutex());
    initializeOpenSSLLocked();
  }

  ctx_ = SSL_CTX_new(SSLv23_method());
  if (ctx_ == nullptr) {
    throw std::runtime_error("SSL_CTX_new: " + getErrors());
  }

  int opt = 0;
  switch (version) {
    case TLSv1:
      opt = SSL_OP_NO_SSLv2 | SSL_OP_NO_SSLv3;
      break;
    case SSLv3:
      opt = SSL_OP_NO_SSLv2;
      break;
    default:
      // do nothing
      break;
  }
  int newOpt = SSL_CTX_set_options(ctx_, opt);
  DCHECK((newOpt & opt) == opt);

  SSL_CTX_set_mode(ctx_, SSL_MODE_AUTO_RETRY);

  checkPeerName_ = false;

  SSL_CTX_set_options(ctx_, SSL_OP_NO_COMPRESSION);

#if FOLLY_OPENSSL_HAS_SNI
  SSL_CTX_set_tlsext_servername_callback(ctx_, baseServerNameOpenSSLCallback);
  SSL_CTX_set_tlsext_servername_arg(ctx_, this);
#endif
}

SSLContext::~SSLContext() {
  if (ctx_ != nullptr) {
    SSL_CTX_free(ctx_);
    ctx_ = nullptr;
  }

#ifdef OPENSSL_NPN_NEGOTIATED
  deleteNextProtocolsStrings();
#endif
}

void SSLContext::ciphers(const std::string& ciphers) {
  providedCiphersString_ = ciphers;
  setCiphersOrThrow(ciphers);
}

void SSLContext::setCipherList(const std::vector<std::string>& ciphers) {
  if (ciphers.size() == 0) {
    return;
  }
  std::string opensslCipherList;
  join(":", ciphers, opensslCipherList);
  setCiphersOrThrow(opensslCipherList);
}

void SSLContext::setSignatureAlgorithms(
    const std::vector<std::string>& sigalgs) {
  if (sigalgs.size() == 0) {
    return;
  }
#if OPENSSL_VERSION_NUMBER >= 0x1000200fL
  std::string opensslSigAlgsList;
  join(":", sigalgs, opensslSigAlgsList);
  int rc = SSL_CTX_set1_sigalgs_list(ctx_, opensslSigAlgsList.c_str());
  if (rc == 0) {
    throw std::runtime_error("SSL_CTX_set1_sigalgs_list " + getErrors());
  }
#endif
}

void SSLContext::setClientECCurvesList(
    const std::vector<std::string>& ecCurves) {
  if (ecCurves.size() == 0) {
    return;
  }
#if OPENSSL_VERSION_NUMBER >= 0x1000200fL
  std::string ecCurvesList;
  join(":", ecCurves, ecCurvesList);
  int rc = SSL_CTX_set1_curves_list(ctx_, ecCurvesList.c_str());
  if (rc == 0) {
    throw std::runtime_error("SSL_CTX_set1_curves_list " + getErrors());
  }
#endif
}

void SSLContext::setServerECCurve(const std::string& curveName) {
  bool validCall = false;
#if OPENSSL_VERSION_NUMBER >= 0x0090800fL
#ifndef OPENSSL_NO_ECDH
  validCall = true;
#endif
#endif
  if (!validCall) {
    throw std::runtime_error("Elliptic curve encryption not allowed");
  }

  EC_KEY* ecdh = nullptr;
  int nid;

  /*
   * Elliptic-Curve Diffie-Hellman parameters are either "named curves"
   * from RFC 4492 section 5.1.1, or explicitly described curves over
   * binary fields. OpenSSL only supports the "named curves", which provide
   * maximum interoperability.
   */

  nid = OBJ_sn2nid(curveName.c_str());
  if (nid == 0) {
    LOG(FATAL) << "Unknown curve name:" << curveName.c_str();
  }
  ecdh = EC_KEY_new_by_curve_name(nid);
  if (ecdh == nullptr) {
    LOG(FATAL) << "Unable to create curve:" << curveName.c_str();
  }

  SSL_CTX_set_tmp_ecdh(ctx_, ecdh);
  EC_KEY_free(ecdh);
}

void SSLContext::setX509VerifyParam(
    const ssl::X509VerifyParam& x509VerifyParam) {
  if (!x509VerifyParam) {
    return;
  }
  if (SSL_CTX_set1_param(ctx_, x509VerifyParam.get()) != 1) {
    throw std::runtime_error("SSL_CTX_set1_param " + getErrors());
  }
}

void SSLContext::setCiphersOrThrow(const std::string& ciphers) {
  int rc = SSL_CTX_set_cipher_list(ctx_, ciphers.c_str());
  if (rc == 0) {
    throw std::runtime_error("SSL_CTX_set_cipher_list: " + getErrors());
  }
}

void SSLContext::setVerificationOption(const SSLContext::SSLVerifyPeerEnum&
    verifyPeer) {
  CHECK(verifyPeer != SSLVerifyPeerEnum::USE_CTX); // dont recurse
  verifyPeer_ = verifyPeer;
}

int SSLContext::getVerificationMode(const SSLContext::SSLVerifyPeerEnum&
    verifyPeer) {
  CHECK(verifyPeer != SSLVerifyPeerEnum::USE_CTX);
  int mode = SSL_VERIFY_NONE;
  switch(verifyPeer) {
    // case SSLVerifyPeerEnum::USE_CTX: // can't happen
    // break;

    case SSLVerifyPeerEnum::VERIFY:
      mode = SSL_VERIFY_PEER;
      break;

    case SSLVerifyPeerEnum::VERIFY_REQ_CLIENT_CERT:
      mode = SSL_VERIFY_PEER | SSL_VERIFY_FAIL_IF_NO_PEER_CERT;
      break;

    case SSLVerifyPeerEnum::NO_VERIFY:
      mode = SSL_VERIFY_NONE;
      break;

    default:
      break;
  }
  return mode;
}

int SSLContext::getVerificationMode() {
  return getVerificationMode(verifyPeer_);
}

void SSLContext::authenticate(bool checkPeerCert, bool checkPeerName,
                              const std::string& peerName) {
  int mode;
  if (checkPeerCert) {
    mode  = SSL_VERIFY_PEER | SSL_VERIFY_FAIL_IF_NO_PEER_CERT | SSL_VERIFY_CLIENT_ONCE;
    checkPeerName_ = checkPeerName;
    peerFixedName_ = peerName;
  } else {
    mode = SSL_VERIFY_NONE;
    checkPeerName_ = false; // can't check name without cert!
    peerFixedName_.clear();
  }
  SSL_CTX_set_verify(ctx_, mode, nullptr);
}

void SSLContext::loadCertificate(const char* path, const char* format) {
  if (path == nullptr || format == nullptr) {
    throw std::invalid_argument(
         "loadCertificateChain: either <path> or <format> is nullptr");
  }
  if (strcmp(format, "PEM") == 0) {
    if (SSL_CTX_use_certificate_chain_file(ctx_, path) == 0) {
      int errnoCopy = errno;
      std::string reason("SSL_CTX_use_certificate_chain_file: ");
      reason.append(path);
      reason.append(": ");
      reason.append(getErrors(errnoCopy));
      throw std::runtime_error(reason);
    }
  } else {
    throw std::runtime_error("Unsupported certificate format: " + std::string(format));
  }
}

void SSLContext::loadCertificateFromBufferPEM(folly::StringPiece cert) {
  if (cert.data() == nullptr) {
    throw std::invalid_argument("loadCertificate: <cert> is nullptr");
  }

  ssl::BioUniquePtr bio(BIO_new(BIO_s_mem()));
  if (bio == nullptr) {
    throw std::runtime_error("BIO_new: " + getErrors());
  }

  int written = BIO_write(bio.get(), cert.data(), int(cert.size()));
  if (written <= 0 || static_cast<unsigned>(written) != cert.size()) {
    throw std::runtime_error("BIO_write: " + getErrors());
  }

  ssl::X509UniquePtr x509(
      PEM_read_bio_X509(bio.get(), nullptr, nullptr, nullptr));
  if (x509 == nullptr) {
    throw std::runtime_error("PEM_read_bio_X509: " + getErrors());
  }

  if (SSL_CTX_use_certificate(ctx_, x509.get()) == 0) {
    throw std::runtime_error("SSL_CTX_use_certificate: " + getErrors());
  }
}

void SSLContext::loadPrivateKey(const char* path, const char* format) {
  if (path == nullptr || format == nullptr) {
    throw std::invalid_argument(
        "loadPrivateKey: either <path> or <format> is nullptr");
  }
  if (strcmp(format, "PEM") == 0) {
    if (SSL_CTX_use_PrivateKey_file(ctx_, path, SSL_FILETYPE_PEM) == 0) {
      throw std::runtime_error("SSL_CTX_use_PrivateKey_file: " + getErrors());
    }
  } else {
    throw std::runtime_error("Unsupported private key format: " + std::string(format));
  }
}

void SSLContext::loadPrivateKeyFromBufferPEM(folly::StringPiece pkey) {
  if (pkey.data() == nullptr) {
    throw std::invalid_argument("loadPrivateKey: <pkey> is nullptr");
  }

  ssl::BioUniquePtr bio(BIO_new(BIO_s_mem()));
  if (bio == nullptr) {
    throw std::runtime_error("BIO_new: " + getErrors());
  }

  int written = BIO_write(bio.get(), pkey.data(), int(pkey.size()));
  if (written <= 0 || static_cast<unsigned>(written) != pkey.size()) {
    throw std::runtime_error("BIO_write: " + getErrors());
  }

  ssl::EvpPkeyUniquePtr key(
      PEM_read_bio_PrivateKey(bio.get(), nullptr, nullptr, nullptr));
  if (key == nullptr) {
    throw std::runtime_error("PEM_read_bio_PrivateKey: " + getErrors());
  }

  if (SSL_CTX_use_PrivateKey(ctx_, key.get()) == 0) {
    throw std::runtime_error("SSL_CTX_use_PrivateKey: " + getErrors());
  }
}

void SSLContext::loadTrustedCertificates(const char* path) {
  if (path == nullptr) {
    throw std::invalid_argument("loadTrustedCertificates: <path> is nullptr");
  }
  if (SSL_CTX_load_verify_locations(ctx_, path, nullptr) == 0) {
    throw std::runtime_error("SSL_CTX_load_verify_locations: " + getErrors());
  }
  ERR_clear_error();
}

void SSLContext::loadTrustedCertificates(X509_STORE* store) {
  SSL_CTX_set_cert_store(ctx_, store);
}

void SSLContext::loadClientCAList(const char* path) {
  auto clientCAs = SSL_load_client_CA_file(path);
  if (clientCAs == nullptr) {
    LOG(ERROR) << "Unable to load ca file: " << path;
    return;
  }
  SSL_CTX_set_client_CA_list(ctx_, clientCAs);
}

void SSLContext::randomize() {
  RAND_poll();
}

void SSLContext::passwordCollector(std::shared_ptr<PasswordCollector> collector) {
  if (collector == nullptr) {
    LOG(ERROR) << "passwordCollector: ignore invalid password collector";
    return;
  }
  collector_ = collector;
  SSL_CTX_set_default_passwd_cb(ctx_, passwordCallback);
  SSL_CTX_set_default_passwd_cb_userdata(ctx_, this);
}

#if FOLLY_OPENSSL_HAS_SNI

void SSLContext::setServerNameCallback(const ServerNameCallback& cb) {
  serverNameCb_ = cb;
}

void SSLContext::addClientHelloCallback(const ClientHelloCallback& cb) {
  clientHelloCbs_.push_back(cb);
}

int SSLContext::baseServerNameOpenSSLCallback(SSL* ssl, int* al, void* data) {
  SSLContext* context = (SSLContext*)data;

  if (context == nullptr) {
    return SSL_TLSEXT_ERR_NOACK;
  }

  for (auto& cb : context->clientHelloCbs_) {
    // Generic callbacks to happen after we receive the Client Hello.
    // For example, we use one to switch which cipher we use depending
    // on the user's TLS version.  Because the primary purpose of
    // baseServerNameOpenSSLCallback is for SNI support, and these callbacks
    // are side-uses, we ignore any possible failures other than just logging
    // them.
    cb(ssl);
  }

  if (!context->serverNameCb_) {
    return SSL_TLSEXT_ERR_NOACK;
  }

  ServerNameCallbackResult ret = context->serverNameCb_(ssl);
  switch (ret) {
    case SERVER_NAME_FOUND:
      return SSL_TLSEXT_ERR_OK;
    case SERVER_NAME_NOT_FOUND:
      return SSL_TLSEXT_ERR_NOACK;
    case SERVER_NAME_NOT_FOUND_ALERT_FATAL:
      *al = TLS1_AD_UNRECOGNIZED_NAME;
      return SSL_TLSEXT_ERR_ALERT_FATAL;
    default:
      CHECK(false);
  }

  return SSL_TLSEXT_ERR_NOACK;
}

void SSLContext::switchCiphersIfTLS11(
    SSL* ssl,
    const std::string& tls11CipherString,
    const std::vector<std::pair<std::string, int>>& tls11AltCipherlist) {
  CHECK(!(tls11CipherString.empty() && tls11AltCipherlist.empty()))
      << "Shouldn't call if empty ciphers / alt ciphers";

  if (TLS1_get_client_version(ssl) <= TLS1_VERSION) {
    // We only do this for TLS v 1.1 and later
    return;
  }

  const std::string* ciphers = &tls11CipherString;
  if (!tls11AltCipherlist.empty()) {
    if (!cipherListPicker_) {
      std::vector<int> weights;
      std::for_each(
          tls11AltCipherlist.begin(),
          tls11AltCipherlist.end(),
          [&](const std::pair<std::string, int>& e) {
            weights.push_back(e.second);
          });
      cipherListPicker_.reset(
          new std::discrete_distribution<int>(weights.begin(), weights.end()));
    }
    auto rng = ThreadLocalPRNG();
    auto index = (*cipherListPicker_)(rng);
    if ((size_t)index >= tls11AltCipherlist.size()) {
      LOG(ERROR) << "Trying to pick alt TLS11 cipher index " << index
                 << ", but tls11AltCipherlist is of length "
                 << tls11AltCipherlist.size();
    } else {
      ciphers = &tls11AltCipherlist[size_t(index)].first;
    }
  }

  // Prefer AES for TLS versions 1.1 and later since these are not
  // vulnerable to BEAST attacks on AES.  Note that we're setting the
  // cipher list on the SSL object, not the SSL_CTX object, so it will
  // only last for this request.
  int rc = SSL_set_cipher_list(ssl, ciphers->c_str());
  if ((rc == 0) || ERR_peek_error() != 0) {
    // This shouldn't happen since we checked for this when proxygen
    // started up.
    LOG(WARNING) << "ssl_cipher: No specified ciphers supported for switch";
    SSL_set_cipher_list(ssl, providedCiphersString_.c_str());
  }
}
#endif // FOLLY_OPENSSL_HAS_SNI

#if FOLLY_OPENSSL_HAS_ALPN
int SSLContext::alpnSelectCallback(SSL* /* ssl */,
                                   const unsigned char** out,
                                   unsigned char* outlen,
                                   const unsigned char* in,
                                   unsigned int inlen,
                                   void* data) {
  SSLContext* context = (SSLContext*)data;
  CHECK(context);
  if (context->advertisedNextProtocols_.empty()) {
    *out = nullptr;
    *outlen = 0;
  } else {
    auto i = context->pickNextProtocols();
    const auto& item = context->advertisedNextProtocols_[i];
    if (SSL_select_next_proto((unsigned char**)out,
                              outlen,
                              item.protocols,
                              item.length,
                              in,
                              inlen) != OPENSSL_NPN_NEGOTIATED) {
      return SSL_TLSEXT_ERR_NOACK;
    }
  }
  return SSL_TLSEXT_ERR_OK;
}
#endif // FOLLY_OPENSSL_HAS_ALPN

#ifdef OPENSSL_NPN_NEGOTIATED

bool SSLContext::setAdvertisedNextProtocols(
    const std::list<std::string>& protocols, NextProtocolType protocolType) {
  return setRandomizedAdvertisedNextProtocols({{1, protocols}}, protocolType);
}

bool SSLContext::setRandomizedAdvertisedNextProtocols(
    const std::list<NextProtocolsItem>& items, NextProtocolType protocolType) {
  unsetNextProtocols();
  if (items.size() == 0) {
    return false;
  }
  int total_weight = 0;
  for (const auto &item : items) {
    if (item.protocols.size() == 0) {
      continue;
    }
    AdvertisedNextProtocolsItem advertised_item;
    advertised_item.length = 0;
    for (const auto& proto : item.protocols) {
      ++advertised_item.length;
      auto protoLength = proto.length();
      if (protoLength >= 256) {
        deleteNextProtocolsStrings();
        return false;
      }
      advertised_item.length += unsigned(protoLength);
    }
    advertised_item.protocols = new unsigned char[advertised_item.length];
    if (!advertised_item.protocols) {
      throw std::runtime_error("alloc failure");
    }
    unsigned char* dst = advertised_item.protocols;
    for (auto& proto : item.protocols) {
      uint8_t protoLength = uint8_t(proto.length());
      *dst++ = (unsigned char)protoLength;
      memcpy(dst, proto.data(), protoLength);
      dst += protoLength;
    }
    total_weight += item.weight;
    advertisedNextProtocols_.push_back(advertised_item);
    advertisedNextProtocolWeights_.push_back(item.weight);
  }
  if (total_weight == 0) {
    deleteNextProtocolsStrings();
    return false;
  }
  nextProtocolDistribution_ =
      std::discrete_distribution<>(advertisedNextProtocolWeights_.begin(),
                                   advertisedNextProtocolWeights_.end());
  if ((uint8_t)protocolType & (uint8_t)NextProtocolType::NPN) {
    SSL_CTX_set_next_protos_advertised_cb(
        ctx_, advertisedNextProtocolCallback, this);
    SSL_CTX_set_next_proto_select_cb(ctx_, selectNextProtocolCallback, this);
  }
#if FOLLY_OPENSSL_HAS_ALPN
  if ((uint8_t)protocolType & (uint8_t)NextProtocolType::ALPN) {
    SSL_CTX_set_alpn_select_cb(ctx_, alpnSelectCallback, this);
    // Client cannot really use randomized alpn
    SSL_CTX_set_alpn_protos(ctx_,
                            advertisedNextProtocols_[0].protocols,
                            advertisedNextProtocols_[0].length);
  }
#endif
  return true;
}

void SSLContext::deleteNextProtocolsStrings() {
  for (auto protocols : advertisedNextProtocols_) {
    delete[] protocols.protocols;
  }
  advertisedNextProtocols_.clear();
  advertisedNextProtocolWeights_.clear();
}

void SSLContext::unsetNextProtocols() {
  deleteNextProtocolsStrings();
  SSL_CTX_set_next_protos_advertised_cb(ctx_, nullptr, nullptr);
  SSL_CTX_set_next_proto_select_cb(ctx_, nullptr, nullptr);
#if FOLLY_OPENSSL_HAS_ALPN
  SSL_CTX_set_alpn_select_cb(ctx_, nullptr, nullptr);
  SSL_CTX_set_alpn_protos(ctx_, nullptr, 0);
#endif
}

size_t SSLContext::pickNextProtocols() {
  CHECK(!advertisedNextProtocols_.empty()) << "Failed to pickNextProtocols";
  auto rng = ThreadLocalPRNG();
  return size_t(nextProtocolDistribution_(rng));
}

int SSLContext::advertisedNextProtocolCallback(SSL* ssl,
      const unsigned char** out, unsigned int* outlen, void* data) {
  SSLContext* context = (SSLContext*)data;
  if (context == nullptr || context->advertisedNextProtocols_.empty()) {
    *out = nullptr;
    *outlen = 0;
  } else if (context->advertisedNextProtocols_.size() == 1) {
    *out = context->advertisedNextProtocols_[0].protocols;
    *outlen = context->advertisedNextProtocols_[0].length;
  } else {
    uintptr_t selected_index = reinterpret_cast<uintptr_t>(SSL_get_ex_data(ssl,
          sNextProtocolsExDataIndex_));
    if (selected_index) {
      --selected_index;
      *out = context->advertisedNextProtocols_[selected_index].protocols;
      *outlen = context->advertisedNextProtocols_[selected_index].length;
    } else {
      auto i = context->pickNextProtocols();
      uintptr_t selected = i + 1;
      SSL_set_ex_data(ssl, sNextProtocolsExDataIndex_, (void*)selected);
      *out = context->advertisedNextProtocols_[i].protocols;
      *outlen = context->advertisedNextProtocols_[i].length;
    }
  }
  return SSL_TLSEXT_ERR_OK;
}

int SSLContext::selectNextProtocolCallback(SSL* ssl,
                                           unsigned char** out,
                                           unsigned char* outlen,
                                           const unsigned char* server,
                                           unsigned int server_len,
                                           void* data) {
  (void)ssl; // Make -Wunused-parameters happy
  SSLContext* ctx = (SSLContext*)data;
  if (ctx->advertisedNextProtocols_.size() > 1) {
    VLOG(3) << "SSLContext::selectNextProcolCallback() "
            << "client should be deterministic in selecting protocols.";
  }

  unsigned char* client = nullptr;
  unsigned int client_len = 0;
  bool filtered = false;
  auto cpf = ctx->getClientProtocolFilterCallback();
  if (cpf) {
    filtered = (*cpf)(&client, &client_len, server, server_len);
  }

  if (!filtered) {
    if (ctx->advertisedNextProtocols_.empty()) {
      client = (unsigned char *) "";
      client_len = 0;
    } else {
      client = ctx->advertisedNextProtocols_[0].protocols;
      client_len = ctx->advertisedNextProtocols_[0].length;
    }
  }

  int retval = SSL_select_next_proto(out, outlen, server, server_len,
                                     client, client_len);
  if (retval != OPENSSL_NPN_NEGOTIATED) {
    VLOG(3) << "SSLContext::selectNextProcolCallback() "
            << "unable to pick a next protocol.";
  }
  return SSL_TLSEXT_ERR_OK;
}
#endif // OPENSSL_NPN_NEGOTIATED

SSL* SSLContext::createSSL() const {
  SSL* ssl = SSL_new(ctx_);
  if (ssl == nullptr) {
    throw std::runtime_error("SSL_new: " + getErrors());
  }
  return ssl;
}

void SSLContext::setSessionCacheContext(const std::string& context) {
  SSL_CTX_set_session_id_context(
      ctx_,
      reinterpret_cast<const unsigned char*>(context.data()),
      std::min<unsigned int>(
          static_cast<unsigned int>(context.length()),
          SSL_MAX_SSL_SESSION_ID_LENGTH));
}

/**
 * Match a name with a pattern. The pattern may include wildcard. A single
 * wildcard "*" can match up to one component in the domain name.
 *
 * @param  host    Host name, typically the name of the remote host
 * @param  pattern Name retrieved from certificate
 * @param  size    Size of "pattern"
 * @return True, if "host" matches "pattern". False otherwise.
 */
bool SSLContext::matchName(const char* host, const char* pattern, int size) {
  bool match = false;
  int i = 0, j = 0;
  while (i < size && host[j] != '\0') {
    if (toupper(pattern[i]) == toupper(host[j])) {
      i++;
      j++;
      continue;
    }
    if (pattern[i] == '*') {
      while (host[j] != '.' && host[j] != '\0') {
        j++;
      }
      i++;
      continue;
    }
    break;
  }
  if (i == size && host[j] == '\0') {
    match = true;
  }
  return match;
}

int SSLContext::passwordCallback(char* password,
                                 int size,
                                 int,
                                 void* data) {
  SSLContext* context = (SSLContext*)data;
  if (context == nullptr || context->passwordCollector() == nullptr) {
    return 0;
  }
  std::string userPassword;
  // call user defined password collector to get password
  context->passwordCollector()->getPassword(userPassword, size);
  auto length = int(userPassword.size());
  if (length > size) {
    length = size;
  }
  strncpy(password, userPassword.c_str(), size_t(length));
  return length;
}

struct SSLLock {
  explicit SSLLock(
    SSLContext::SSLLockType inLockType = SSLContext::LOCK_MUTEX) :
      lockType(inLockType) {
  }

  void lock() {
    if (lockType == SSLContext::LOCK_MUTEX) {
      mutex.lock();
    } else if (lockType == SSLContext::LOCK_SPINLOCK) {
      spinLock.lock();
    }
    // lockType == LOCK_NONE, no-op
  }

  void unlock() {
    if (lockType == SSLContext::LOCK_MUTEX) {
      mutex.unlock();
    } else if (lockType == SSLContext::LOCK_SPINLOCK) {
      spinLock.unlock();
    }
    // lockType == LOCK_NONE, no-op
  }

  SSLContext::SSLLockType lockType;
  folly::SpinLock spinLock{};
  std::mutex mutex;
};

// Statics are unsafe in environments that call exit().
// If one thread calls exit() while another thread is
// references a member of SSLContext, bad things can happen.
// SSLContext runs in such environments.
// Instead of declaring a static member we "new" the static
// member so that it won't be destructed on exit().
static std::unique_ptr<SSLLock[]>& locks() {
  static auto locksInst = new std::unique_ptr<SSLLock[]>();
  return *locksInst;
}

static std::map<int, SSLContext::SSLLockType>& lockTypes() {
  static auto lockTypesInst = new std::map<int, SSLContext::SSLLockType>();
  return *lockTypesInst;
}

static void callbackLocking(int mode, int n, const char*, int) {
  if (mode & CRYPTO_LOCK) {
    locks()[size_t(n)].lock();
  } else {
    locks()[size_t(n)].unlock();
  }
}

static unsigned long callbackThreadID() {
  return static_cast<unsigned long>(
#ifdef __APPLE__
    pthread_mach_thread_np(pthread_self())
#elif _MSC_VER
    pthread_getw32threadid_np(pthread_self())
#else
    pthread_self()
#endif
  );
}

static CRYPTO_dynlock_value* dyn_create(const char*, int) {
  return new CRYPTO_dynlock_value;
}

static void dyn_lock(int mode,
                     struct CRYPTO_dynlock_value* lock,
                     const char*, int) {
  if (lock != nullptr) {
    if (mode & CRYPTO_LOCK) {
      lock->mutex.lock();
    } else {
      lock->mutex.unlock();
    }
  }
}

static void dyn_destroy(struct CRYPTO_dynlock_value* lock, const char*, int) {
  delete lock;
}

void SSLContext::setSSLLockTypes(std::map<int, SSLLockType> inLockTypes) {
  lockTypes() = inLockTypes;
}

#if defined(SSL_MODE_HANDSHAKE_CUTTHROUGH)
void SSLContext::enableFalseStart() {
  SSL_CTX_set_mode(ctx_, SSL_MODE_HANDSHAKE_CUTTHROUGH);
}
#endif

void SSLContext::markInitialized() {
  std::lock_guard<std::mutex> g(initMutex());
  initialized_ = true;
}

void SSLContext::initializeOpenSSL() {
  std::lock_guard<std::mutex> g(initMutex());
  initializeOpenSSLLocked();
}

void SSLContext::initializeOpenSSLLocked() {
  if (initialized_) {
    return;
  }
  SSL_library_init();
  SSL_load_error_strings();
  ERR_load_crypto_strings();
  // static locking
  locks().reset(new SSLLock[size_t(::CRYPTO_num_locks())]);
  for (auto it: lockTypes()) {
    locks()[size_t(it.first)].lockType = it.second;
  }
  CRYPTO_set_id_callback(callbackThreadID);
  CRYPTO_set_locking_callback(callbackLocking);
  // dynamic locking
  CRYPTO_set_dynlock_create_callback(dyn_create);
  CRYPTO_set_dynlock_lock_callback(dyn_lock);
  CRYPTO_set_dynlock_destroy_callback(dyn_destroy);
  randomize();
#ifdef OPENSSL_NPN_NEGOTIATED
  sNextProtocolsExDataIndex_ = SSL_get_ex_new_index(0,
      (void*)"Advertised next protocol index", nullptr, nullptr, nullptr);
#endif
  initialized_ = true;
}

void SSLContext::cleanupOpenSSL() {
  std::lock_guard<std::mutex> g(initMutex());
  cleanupOpenSSLLocked();
}

void SSLContext::cleanupOpenSSLLocked() {
  if (!initialized_) {
    return;
  }

  CRYPTO_set_id_callback(nullptr);
  CRYPTO_set_locking_callback(nullptr);
  CRYPTO_set_dynlock_create_callback(nullptr);
  CRYPTO_set_dynlock_lock_callback(nullptr);
  CRYPTO_set_dynlock_destroy_callback(nullptr);
  CRYPTO_cleanup_all_ex_data();
  ERR_free_strings();
  EVP_cleanup();
  ERR_remove_state(0);
  locks().reset();
  initialized_ = false;
}

void SSLContext::setOptions(long options) {
  long newOpt = SSL_CTX_set_options(ctx_, options);
  if ((newOpt & options) != options) {
    throw std::runtime_error("SSL_CTX_set_options failed");
  }
}

std::string SSLContext::getErrors(int errnoCopy) {
  std::string errors;
  unsigned long  errorCode;
  char   message[256];

  errors.reserve(512);
  while ((errorCode = ERR_get_error()) != 0) {
    if (!errors.empty()) {
      errors += "; ";
    }
    const char* reason = ERR_reason_error_string(errorCode);
    if (reason == nullptr) {
      snprintf(message, sizeof(message) - 1, "SSL error # %lu", errorCode);
      reason = message;
    }
    errors += reason;
  }
  if (errors.empty()) {
    errors = "error code: " + folly::to<std::string>(errnoCopy);
  }
  return errors;
}

std::ostream&
operator<<(std::ostream& os, const PasswordCollector& collector) {
  os << collector.describe();
  return os;
}

} // folly

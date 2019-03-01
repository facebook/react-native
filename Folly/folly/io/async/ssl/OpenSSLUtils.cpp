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
#include <folly/io/async/ssl/OpenSSLUtils.h>
#include <folly/ScopeGuard.h>
#include <folly/portability/OpenSSL.h>
#include <folly/portability/Sockets.h>
#include <glog/logging.h>
#include <openssl/bio.h>
#include <openssl/err.h>
#include <openssl/rand.h>
#include <openssl/ssl.h>
#include <openssl/x509v3.h>
#include <unordered_map>

namespace {
#if defined(OPENSSL_IS_BORINGSSL)
// BoringSSL doesn't (as of May 2016) export the equivalent
// of BIO_sock_should_retry, so this is one way around it :(
static int boringssl_bio_fd_should_retry(int err);
#endif

}

namespace folly {
namespace ssl {

bool OpenSSLUtils::getTLSMasterKey(
    const SSL_SESSION* session,
    MutableByteRange keyOut) {
#if FOLLY_OPENSSL_IS_101 || FOLLY_OPENSSL_IS_102
  if (session &&
      session->master_key_length == static_cast<int>(keyOut.size())) {
    auto masterKey = session->master_key;
    std::copy(
        masterKey, masterKey + session->master_key_length, keyOut.begin());
    return true;
  }
#else
  (SSL_SESSION*)session;
  (MutableByteRange) keyOut;
#endif
  return false;
}

bool OpenSSLUtils::getTLSClientRandom(
    const SSL* ssl,
    MutableByteRange randomOut) {
#if FOLLY_OPENSSL_IS_101 || FOLLY_OPENSSL_IS_102
  if ((SSL_version(ssl) >> 8) == TLS1_VERSION_MAJOR && ssl->s3 &&
      randomOut.size() == SSL3_RANDOM_SIZE) {
    auto clientRandom = ssl->s3->client_random;
    std::copy(clientRandom, clientRandom + SSL3_RANDOM_SIZE, randomOut.begin());
    return true;
  }
#else
  (SSL*)ssl;
  (MutableByteRange) randomOut;
#endif
  return false;
}

bool OpenSSLUtils::getPeerAddressFromX509StoreCtx(X509_STORE_CTX* ctx,
                                                  sockaddr_storage* addrStorage,
                                                  socklen_t* addrLen) {
  // Grab the ssl idx and then the ssl object so that we can get the peer
  // name to compare against the ips in the subjectAltName
  auto sslIdx = SSL_get_ex_data_X509_STORE_CTX_idx();
  auto ssl = reinterpret_cast<SSL*>(X509_STORE_CTX_get_ex_data(ctx, sslIdx));
  int fd = SSL_get_fd(ssl);
  if (fd < 0) {
    LOG(ERROR) << "Inexplicably couldn't get fd from SSL";
    return false;
  }

  *addrLen = sizeof(*addrStorage);
  if (getpeername(fd, reinterpret_cast<sockaddr*>(addrStorage), addrLen) != 0) {
    PLOG(ERROR) << "Unable to get peer name";
    return false;
  }
  CHECK(*addrLen <= sizeof(*addrStorage));
  return true;
}

bool OpenSSLUtils::validatePeerCertNames(X509* cert,
                                         const sockaddr* addr,
                                         socklen_t /* addrLen */) {
  // Try to extract the names within the SAN extension from the certificate
  auto altNames = reinterpret_cast<STACK_OF(GENERAL_NAME)*>(
      X509_get_ext_d2i(cert, NID_subject_alt_name, nullptr, nullptr));
  SCOPE_EXIT {
    if (altNames != nullptr) {
      sk_GENERAL_NAME_pop_free(altNames, GENERAL_NAME_free);
    }
  };
  if (altNames == nullptr) {
    LOG(WARNING) << "No subjectAltName provided and we only support ip auth";
    return false;
  }

  const sockaddr_in* addr4 = nullptr;
  const sockaddr_in6* addr6 = nullptr;
  if (addr != nullptr) {
    if (addr->sa_family == AF_INET) {
      addr4 = reinterpret_cast<const sockaddr_in*>(addr);
    } else if (addr->sa_family == AF_INET6) {
      addr6 = reinterpret_cast<const sockaddr_in6*>(addr);
    } else {
      LOG(FATAL) << "Unsupported sockaddr family: " << addr->sa_family;
    }
  }

  for (size_t i = 0; i < (size_t)sk_GENERAL_NAME_num(altNames); i++) {
    auto name = sk_GENERAL_NAME_value(altNames, i);
    if ((addr4 != nullptr || addr6 != nullptr) && name->type == GEN_IPADD) {
      // Extra const-ness for paranoia
      unsigned char const* const rawIpStr = name->d.iPAddress->data;
      size_t const rawIpLen = size_t(name->d.iPAddress->length);

      if (rawIpLen == 4 && addr4 != nullptr) {
        if (::memcmp(rawIpStr, &addr4->sin_addr, rawIpLen) == 0) {
          return true;
        }
      } else if (rawIpLen == 16 && addr6 != nullptr) {
        if (::memcmp(rawIpStr, &addr6->sin6_addr, rawIpLen) == 0) {
          return true;
        }
      } else if (rawIpLen != 4 && rawIpLen != 16) {
        LOG(WARNING) << "Unexpected IP length: " << rawIpLen;
      }
    }
  }

  LOG(WARNING) << "Unable to match client cert against alt name ip";
  return false;
}

static std::unordered_map<uint16_t, std::string> getOpenSSLCipherNames() {
  std::unordered_map<uint16_t, std::string> ret;
  SSL_CTX* ctx = nullptr;
  SSL* ssl = nullptr;

  const SSL_METHOD* meth = SSLv23_server_method();
  OpenSSL_add_ssl_algorithms();

  if ((ctx = SSL_CTX_new(meth)) == nullptr) {
    return ret;
  }
  SCOPE_EXIT {
    SSL_CTX_free(ctx);
  };

  if ((ssl = SSL_new(ctx)) == nullptr) {
    return ret;
  }
  SCOPE_EXIT {
    SSL_free(ssl);
  };

  STACK_OF(SSL_CIPHER)* sk = SSL_get_ciphers(ssl);
  for (int i = 0; i < sk_SSL_CIPHER_num(sk); i++) {
    const SSL_CIPHER* c = sk_SSL_CIPHER_value(sk, i);
    unsigned long id = SSL_CIPHER_get_id(c);
    // OpenSSL 1.0.2 and prior does weird things such as stuff the SSL/TLS
    // version into the top 16 bits. Let's ignore those for now. This is
    // BoringSSL compatible (their id can be cast as uint16_t)
    uint16_t cipherCode = id & 0xffffL;
    ret[cipherCode] = SSL_CIPHER_get_name(c);
  }
  return ret;
}

const std::string& OpenSSLUtils::getCipherName(uint16_t cipherCode) {
  // Having this in a hash map saves the binary search inside OpenSSL
  static std::unordered_map<uint16_t, std::string> cipherCodeToName(
      getOpenSSLCipherNames());

  const auto& iter = cipherCodeToName.find(cipherCode);
  if (iter != cipherCodeToName.end()) {
    return iter->second;
  } else {
    static std::string empty("");
    return empty;
  }
}

bool OpenSSLUtils::setCustomBioReadMethod(
    BIO_METHOD* bioMeth,
    int (*meth)(BIO*, char*, int)) {
  bool ret = false;
  ret = (BIO_meth_set_read(bioMeth, meth) == 1);
  return ret;
}

bool OpenSSLUtils::setCustomBioWriteMethod(
    BIO_METHOD* bioMeth,
    int (*meth)(BIO*, const char*, int)) {
  bool ret = false;
  ret = (BIO_meth_set_write(bioMeth, meth) == 1);
  return ret;
}

int OpenSSLUtils::getBioShouldRetryWrite(int r) {
  int ret = 0;
#if defined(OPENSSL_IS_BORINGSSL)
  ret = boringssl_bio_fd_should_retry(r);
#else
  ret = BIO_sock_should_retry(r);
#endif
  return ret;
}

void OpenSSLUtils::setBioAppData(BIO* b, void* ptr) {
#if defined(OPENSSL_IS_BORINGSSL)
  BIO_set_callback_arg(b, static_cast<char*>(ptr));
#else
  BIO_set_app_data(b, ptr);
#endif
}

void* OpenSSLUtils::getBioAppData(BIO* b) {
#if defined(OPENSSL_IS_BORINGSSL)
  return BIO_get_callback_arg(b);
#else
  return BIO_get_app_data(b);
#endif
}

void OpenSSLUtils::setCustomBioMethod(BIO* b, BIO_METHOD* meth) {
#if defined(OPENSSL_IS_BORINGSSL)
  b->method = meth;
#else
  BIO_set(b, meth);
#endif
}

int OpenSSLUtils::getBioFd(BIO* b, int* fd) {
#ifdef _WIN32
  int ret = portability::sockets::socket_to_fd((SOCKET)BIO_get_fd(b, fd));
  if (fd != nullptr) {
    *fd = ret;
  }
  return ret;
#else
  return BIO_get_fd(b, fd);
#endif
}

void OpenSSLUtils::setBioFd(BIO* b, int fd, int flags) {
#ifdef _WIN32
  SOCKET socket = portability::sockets::fd_to_socket(fd);
  // Internally OpenSSL uses this as an int for reasons completely
  // beyond any form of sanity, so we do the cast ourselves to avoid
  // the warnings that would be generated.
  int sock = int(socket);
#else
  int sock = fd;
#endif
  BIO_set_fd(b, sock, flags);
}

} // ssl
} // folly

namespace {
#if defined(OPENSSL_IS_BORINGSSL)

static int boringssl_bio_fd_non_fatal_error(int err) {
  if (
#ifdef EWOULDBLOCK
    err == EWOULDBLOCK ||
#endif
#ifdef WSAEWOULDBLOCK
    err == WSAEWOULDBLOCK ||
#endif
#ifdef ENOTCONN
    err == ENOTCONN ||
#endif
#ifdef EINTR
    err == EINTR ||
#endif
#ifdef EAGAIN
    err == EAGAIN ||
#endif
#ifdef EPROTO
    err == EPROTO ||
#endif
#ifdef EINPROGRESS
    err == EINPROGRESS ||
#endif
#ifdef EALREADY
    err == EALREADY ||
#endif
    0) {
    return 1;
  }
  return 0;
}

#if defined(OPENSSL_WINDOWS)

#include <io.h>
#pragma warning(push, 3)
#include <windows.h>
#pragma warning(pop)

int boringssl_bio_fd_should_retry(int i) {
  if (i == -1) {
    return boringssl_bio_fd_non_fatal_error((int)GetLastError());
  }
  return 0;
}

#else // !OPENSSL_WINDOWS

#include <unistd.h>
int boringssl_bio_fd_should_retry(int i) {
  if (i == -1) {
    return boringssl_bio_fd_non_fatal_error(errno);
  }
  return 0;
}
#endif // OPENSSL_WINDOWS

#endif // OEPNSSL_IS_BORINGSSL

}

/*
 * Copyright 2014-present Facebook, Inc.
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

#include <list>
#include <map>
#include <memory>
#include <mutex>
#include <random>
#include <string>
#include <vector>

#include <glog/logging.h>

#ifndef FOLLY_NO_CONFIG
#include <folly/folly-config.h>
#endif

#include <folly/Function.h>
#include <folly/Portability.h>
#include <folly/Range.h>
#include <folly/String.h>
#include <folly/io/async/ssl/OpenSSLUtils.h>
#include <folly/portability/OpenSSL.h>
#include <folly/ssl/OpenSSLLockTypes.h>
#include <folly/ssl/OpenSSLPtrTypes.h>

namespace folly {

/**
 * Override the default password collector.
 */
class PasswordCollector {
 public:
  virtual ~PasswordCollector() = default;
  /**
   * Interface for customizing how to collect private key password.
   *
   * By default, OpenSSL prints a prompt on screen and request for password
   * while loading private key. To implement a custom password collector,
   * implement this interface and register it with SSLContext.
   *
   * @param password Pass collected password back to OpenSSL
   * @param size     Maximum length of password including nullptr character
   */
  virtual void getPassword(std::string& password, int size) const = 0;

  /**
   * Return a description of this collector for logging purposes
   */
  virtual std::string describe() const = 0;
};

/**
 * Run SSL_accept via a runner
 */
class SSLAcceptRunner {
 public:
  virtual ~SSLAcceptRunner() = default;

  /**
   * This is expected to run the first function and provide its return
   * value to the second function. This can be used to run the SSL_accept
   * in different contexts.
   */
  virtual void run(Function<int()> acceptFunc, Function<void(int)> finallyFunc)
      const {
    finallyFunc(acceptFunc());
  }
};

/**
 * Wrap OpenSSL SSL_CTX into a class.
 */
class SSLContext {
 public:
  enum SSLVersion {
    SSLv2,
    SSLv3,
    TLSv1, // support TLS 1.0+
    TLSv1_2, // support for only TLS 1.2+
  };

  /**
   * Defines the way that peers are verified.
   **/
  enum SSLVerifyPeerEnum {
    // Used by AsyncSSLSocket to delegate to the SSLContext's setting
    USE_CTX,
    // For server side - request a client certificate and verify the
    // certificate if it is sent.  Does not fail if the client does not present
    // a certificate.
    // For client side - validates the server certificate or fails.
    VERIFY,
    // For server side - same as VERIFY but will fail if no certificate
    // is sent.
    // For client side - same as VERIFY.
    VERIFY_REQ_CLIENT_CERT,
    // No verification is done for both server and client side.
    NO_VERIFY
  };

  struct NextProtocolsItem {
    NextProtocolsItem(int wt, const std::list<std::string>& ptcls)
        : weight(wt), protocols(ptcls) {}
    int weight;
    std::list<std::string> protocols;
  };

  // Function that selects a client protocol given the server's list
  using ClientProtocolFilterCallback = bool (*)(
      unsigned char**,
      unsigned int*,
      const unsigned char*,
      unsigned int);

  /**
   * Convenience function to call getErrors() with the current errno value.
   *
   * Make sure that you only call this when there was no intervening operation
   * since the last OpenSSL error that may have changed the current errno value.
   */
  static std::string getErrors() {
    return getErrors(errno);
  }

  /**
   * Constructor.
   *
   * @param version The lowest or oldest SSL version to support.
   */
  explicit SSLContext(SSLVersion version = TLSv1);
  virtual ~SSLContext();

  /**
   * Set default ciphers to be used in SSL handshake process.
   *
   * @param ciphers A list of ciphers to use for TLSv1.0
   */
  virtual void ciphers(const std::string& ciphers);

  /**
   * Low-level method that attempts to set the provided ciphers on the
   * SSL_CTX object, and throws if something goes wrong.
   */
  virtual void setCiphersOrThrow(const std::string& ciphers);

  /**
   * Set default ciphers to be used in SSL handshake process.
   */

  template <typename Iterator>
  void setCipherList(Iterator ibegin, Iterator iend) {
    if (ibegin != iend) {
      std::string opensslCipherList;
      folly::join(":", ibegin, iend, opensslCipherList);
      setCiphersOrThrow(opensslCipherList);
    }
  }

  template <typename Container>
  void setCipherList(const Container& cipherList) {
    using namespace std;
    setCipherList(begin(cipherList), end(cipherList));
  }

  template <typename Value>
  void setCipherList(const std::initializer_list<Value>& cipherList) {
    setCipherList(cipherList.begin(), cipherList.end());
  }

  /**
   * Sets the signature algorithms to be used during SSL negotiation
   * for TLS1.2+.
   */

  template <typename Iterator>
  void setSignatureAlgorithms(Iterator ibegin, Iterator iend) {
    if (ibegin != iend) {
#if OPENSSL_VERSION_NUMBER >= 0x1000200fL
      std::string opensslSigAlgsList;
      join(":", ibegin, iend, opensslSigAlgsList);
      if (!SSL_CTX_set1_sigalgs_list(ctx_, opensslSigAlgsList.c_str())) {
        throw std::runtime_error("SSL_CTX_set1_sigalgs_list " + getErrors());
      }
#endif
    }
  }

  template <typename Container>
  void setSignatureAlgorithms(const Container& sigalgs) {
    using namespace std;
    setSignatureAlgorithms(begin(sigalgs), end(sigalgs));
  }

  template <typename Value>
  void setSignatureAlgorithms(const std::initializer_list<Value>& sigalgs) {
    setSignatureAlgorithms(sigalgs.begin(), sigalgs.end());
  }

  /**
   * Sets the list of EC curves supported by the client.
   *
   * @param ecCurves A list of ec curves, eg: P-256
   */
  void setClientECCurvesList(const std::vector<std::string>& ecCurves);

  /**
   * Method to add support for a specific elliptic curve encryption algorithm.
   *
   * @param curveName: The name of the ec curve to support, eg: prime256v1.
   */
  void setServerECCurve(const std::string& curveName);

  /**
   * Sets an x509 verification param on the context.
   */
  void setX509VerifyParam(const ssl::X509VerifyParam& x509VerifyParam);

  /**
   * Method to set verification option in the context object.
   *
   * @param verifyPeer SSLVerifyPeerEnum indicating the verification
   *                       method to use.
   */
  virtual void setVerificationOption(const SSLVerifyPeerEnum& verifyPeer);

  /**
   * Method to check if peer verfication is set.
   *
   * @return true if peer verification is required.
   *
   */
  virtual bool needsPeerVerification() {
    return (
        verifyPeer_ == SSLVerifyPeerEnum::VERIFY ||
        verifyPeer_ == SSLVerifyPeerEnum::VERIFY_REQ_CLIENT_CERT);
  }

  /**
   * Method to fetch Verification mode for a SSLVerifyPeerEnum.
   * verifyPeer cannot be SSLVerifyPeerEnum::USE_CTX since there is no
   * context.
   *
   * @param verifyPeer SSLVerifyPeerEnum for which the flags need to
   *                  to be returned
   *
   * @return mode flags that can be used with SSL_set_verify
   */
  static int getVerificationMode(const SSLVerifyPeerEnum& verifyPeer);

  /**
   * Method to fetch Verification mode determined by the options
   * set using setVerificationOption.
   *
   * @return mode flags that can be used with SSL_set_verify
   */
  virtual int getVerificationMode();

  /**
   * Enable/Disable authentication. Peer name validation can only be done
   * if checkPeerCert is true.
   *
   * @param checkPeerCert If true, require peer to present valid certificate
   * @param checkPeerName If true, validate that the certificate common name
   *                      or alternate name(s) of peer matches the hostname
   *                      used to connect.
   * @param peerName      If non-empty, validate that the certificate common
   *                      name of peer matches the given string (altername
   *                      name(s) are not used in this case).
   */
  virtual void authenticate(
      bool checkPeerCert,
      bool checkPeerName,
      const std::string& peerName = std::string());
  /**
   * Load server certificate.
   *
   * @param path   Path to the certificate file
   * @param format Certificate file format
   */
  virtual void loadCertificate(const char* path, const char* format = "PEM");
  /**
   * Load server certificate from memory.
   *
   * @param cert  A PEM formatted certificate
   */
  virtual void loadCertificateFromBufferPEM(folly::StringPiece cert);

  /**
   * Load private key.
   *
   * @param path   Path to the private key file
   * @param format Private key file format
   */
  virtual void loadPrivateKey(const char* path, const char* format = "PEM");
  /**
   * Load private key from memory.
   *
   * @param pkey  A PEM formatted key
   */
  virtual void loadPrivateKeyFromBufferPEM(folly::StringPiece pkey);

  /**
   * Load cert and key from PEM buffers. Guaranteed to throw if cert and
   * private key mismatch so no need to call isCertKeyPairValid.
   *
   * @param cert A PEM formatted certificate
   * @param pkey A PEM formatted key
   */
  virtual void loadCertKeyPairFromBufferPEM(
      folly::StringPiece cert,
      folly::StringPiece pkey);

  /**
   * Load cert and key from files. Guaranteed to throw if cert and key mismatch.
   * Equivalent to calling loadCertificate() and loadPrivateKey().
   *
   * @param certPath   Path to the certificate file
   * @param keyPath   Path to the private key file
   * @param certFormat Certificate file format
   * @param keyFormat Private key file format
   */
  virtual void loadCertKeyPairFromFiles(
      const char* certPath,
      const char* keyPath,
      const char* certFormat = "PEM",
      const char* keyFormat = "PEM");

  /**
   * Call after both cert and key are loaded to check if cert matches key.
   * Must call if private key is loaded before loading the cert.
   * No need to call if cert is loaded first before private key.
   * @return true if matches, or false if mismatch.
   */
  virtual bool isCertKeyPairValid() const;

  /**
   * Load trusted certificates from specified file.
   *
   * @param path Path to trusted certificate file
   */
  virtual void loadTrustedCertificates(const char* path);
  /**
   * Load trusted certificates from specified X509 certificate store.
   *
   * @param store X509 certificate store.
   */
  virtual void loadTrustedCertificates(X509_STORE* store);
  /**
   * Load a client CA list for validating clients
   */
  virtual void loadClientCAList(const char* path);
  /**
   * Override default OpenSSL password collector.
   *
   * @param collector Instance of user defined password collector
   */
  virtual void passwordCollector(std::shared_ptr<PasswordCollector> collector);
  /**
   * Obtain password collector.
   *
   * @return User defined password collector
   */
  virtual std::shared_ptr<PasswordCollector> passwordCollector() {
    return collector_;
  }
#if FOLLY_OPENSSL_HAS_SNI
  /**
   * Provide SNI support
   */
  enum ServerNameCallbackResult {
    SERVER_NAME_FOUND,
    SERVER_NAME_NOT_FOUND,
    SERVER_NAME_NOT_FOUND_ALERT_FATAL,
  };
  /**
   * Callback function from openssl to give the application a
   * chance to check the tlsext_hostname just right after parsing
   * the Client Hello or Server Hello message.
   *
   * It is for the server to switch the SSL to another SSL_CTX
   * to continue the handshake. (i.e. Server Name Indication, SNI, in RFC6066).
   *
   * If the ServerNameCallback returns:
   * SERVER_NAME_FOUND:
   *    server: Send a tlsext_hostname in the Server Hello
   *    client: No-effect
   * SERVER_NAME_NOT_FOUND:
   *    server: Does not send a tlsext_hostname in Server Hello
   *            and continue the handshake.
   *    client: No-effect
   * SERVER_NAME_NOT_FOUND_ALERT_FATAL:
   *    server and client: Send fatal TLS1_AD_UNRECOGNIZED_NAME alert to
   *                       the peer.
   *
   * Quote from RFC 6066:
   * "...
   * If the server understood the ClientHello extension but
   * does not recognize the server name, the server SHOULD take one of two
   * actions: either abort the handshake by sending a fatal-level
   * unrecognized_name(112) alert or continue the handshake.  It is NOT
   * RECOMMENDED to send a warning-level unrecognized_name(112) alert,
   * because the client's behavior in response to warning-level alerts is
   * unpredictable.
   * ..."
   */

  /**
   * Set the ServerNameCallback
   */
  typedef std::function<ServerNameCallbackResult(SSL* ssl)> ServerNameCallback;
  virtual void setServerNameCallback(const ServerNameCallback& cb);

  /**
   * Generic callbacks that are run after we get the Client Hello (right
   * before we run the ServerNameCallback)
   */
  typedef std::function<void(SSL* ssl)> ClientHelloCallback;
  virtual void addClientHelloCallback(const ClientHelloCallback& cb);
#endif // FOLLY_OPENSSL_HAS_SNI

  /**
   * Create an SSL object from this context.
   */
  SSL* createSSL() const;

  /**
   * Sets the namespace to use for sessions created from this context.
   */
  void setSessionCacheContext(const std::string& context);

  /**
   * Set the options on the SSL_CTX object.
   */
  void setOptions(long options);

#if FOLLY_OPENSSL_HAS_ALPN
  /**
   * Set the list of protocols that this SSL context supports. In client
   * mode, this is the list of protocols that will be advertised for Application
   * Layer Protocol Negotiation (ALPN). In server mode, the first protocol
   * advertised by the client that is also on this list is chosen.
   * Invoking this function with a list of length zero causes ALPN to be
   * disabled.
   *
   * @param protocols   List of protocol names. This method makes a copy,
   *                    so the caller needn't keep the list in scope after
   *                    the call completes. The list must have at least
   *                    one element to enable ALPN. Each element must have
   *                    a string length < 256.
   * @return true if ALPN has been activated. False if ALPN is disabled.
   */
  bool setAdvertisedNextProtocols(const std::list<std::string>& protocols);
  /**
   * Set weighted list of lists of protocols that this SSL context supports.
   * In server mode, each element of the list contains a list of protocols that
   * could be advertised for Application Layer Protocol Negotiation (ALPN).
   * The list of protocols that will be advertised to a client is selected
   * randomly, based on weights of elements. Client mode doesn't support
   * randomized ALPN, so this list should contain only 1 element. The first
   * protocol advertised by the client that is also on the list of protocols
   * of this element is chosen. Invoking this function with a list of length
   * zero causes ALPN to be disabled.
   *
   * @param items  List of NextProtocolsItems, Each item contains a list of
   *               protocol names and weight. After the call of this fucntion
   *               each non-empty list of protocols will be advertised with
   *               probability weight/sum_of_weights. This method makes a copy,
   *               so the caller needn't keep the list in scope after the call
   *               completes. The list must have at least one element with
   *               non-zero weight and non-empty protocols list to enable NPN.
   *               Each name of the protocol must have a string length < 256.
   * @return true if ALPN has been activated. False if ALPN is disabled.
   */
  bool setRandomizedAdvertisedNextProtocols(
      const std::list<NextProtocolsItem>& items);

  /**
   * Disables ALPN on this SSL context.
   */
  void unsetNextProtocols();
  void deleteNextProtocolsStrings();
#endif // FOLLY_OPENSSL_HAS_ALPN

  /**
   * Gets the underlying SSL_CTX for advanced usage
   */
  SSL_CTX* getSSLCtx() const {
    return ctx_;
  }

  /**
   * Examine OpenSSL's error stack, and return a string description of the
   * errors.
   *
   * This operation removes the errors from OpenSSL's error stack.
   */
  static std::string getErrors(int errnoCopy);

  bool checkPeerName() {
    return checkPeerName_;
  }
  std::string peerFixedName() {
    return peerFixedName_;
  }

#if defined(SSL_MODE_HANDSHAKE_CUTTHROUGH)
  /**
   * Enable TLS false start, saving a roundtrip for full handshakes. Will only
   * be used if the server uses NPN or ALPN, and a strong forward-secure cipher
   * is negotiated.
   */
  void enableFalseStart();
#endif

  /**
   * Sets the runner used for SSL_accept. If none is given, the accept will be
   * done directly.
   */
  void sslAcceptRunner(std::unique_ptr<SSLAcceptRunner> runner) {
    if (nullptr == runner) {
      LOG(ERROR) << "Ignore invalid runner";
      return;
    }
    sslAcceptRunner_ = std::move(runner);
  }

  const SSLAcceptRunner* sslAcceptRunner() {
    return sslAcceptRunner_.get();
  }

  /**
   * Helper to match a hostname versus a pattern.
   */
  static bool matchName(const char* host, const char* pattern, int size);

  [[deprecated("Use folly::ssl::init")]] static void initializeOpenSSL();

 protected:
  SSL_CTX* ctx_;

 private:
  SSLVerifyPeerEnum verifyPeer_{SSLVerifyPeerEnum::NO_VERIFY};

  bool checkPeerName_;
  std::string peerFixedName_;
  std::shared_ptr<PasswordCollector> collector_;
#if FOLLY_OPENSSL_HAS_SNI
  ServerNameCallback serverNameCb_;
  std::vector<ClientHelloCallback> clientHelloCbs_;
#endif

  ClientProtocolFilterCallback clientProtoFilter_{nullptr};

  static bool initialized_;

  std::unique_ptr<SSLAcceptRunner> sslAcceptRunner_;

#if FOLLY_OPENSSL_HAS_ALPN

  struct AdvertisedNextProtocolsItem {
    unsigned char* protocols;
    unsigned length;
  };

  /**
   * Wire-format list of advertised protocols for use in NPN.
   */
  std::vector<AdvertisedNextProtocolsItem> advertisedNextProtocols_;
  std::vector<int> advertisedNextProtocolWeights_;
  std::discrete_distribution<int> nextProtocolDistribution_;

  static int advertisedNextProtocolCallback(
      SSL* ssl,
      const unsigned char** out,
      unsigned int* outlen,
      void* data);

  static int alpnSelectCallback(
      SSL* ssl,
      const unsigned char** out,
      unsigned char* outlen,
      const unsigned char* in,
      unsigned int inlen,
      void* data);

  size_t pickNextProtocols();

#endif // FOLLY_OPENSSL_HAS_ALPN

  static int passwordCallback(char* password, int size, int, void* data);

#if FOLLY_OPENSSL_HAS_SNI
  /**
   * The function that will be called directly from openssl
   * in order for the application to get the tlsext_hostname just after
   * parsing the Client Hello or Server Hello message. It will then call
   * the serverNameCb_ function object. Hence, it is sort of a
   * wrapper/proxy between serverNameCb_ and openssl.
   *
   * The openssl's primary intention is for SNI support, but we also use it
   * generically for performing logic after the Client Hello comes in.
   */
  static int baseServerNameOpenSSLCallback(
      SSL* ssl,
      int* al /* alert (return value) */,
      void* data);
#endif

  std::string providedCiphersString_;
};

typedef std::shared_ptr<SSLContext> SSLContextPtr;

std::ostream& operator<<(
    std::ostream& os,
    const folly::PasswordCollector& collector);

} // namespace folly

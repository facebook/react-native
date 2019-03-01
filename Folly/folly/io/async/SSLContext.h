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

#include <mutex>
#include <list>
#include <map>
#include <vector>
#include <memory>
#include <string>
#include <random>

// This has to come before SSL.
#include <folly/portability/OpenSSL.h>
#include <folly/portability/Sockets.h>

#include <openssl/ssl.h>
#include <openssl/tls1.h>

#include <glog/logging.h>

#ifndef FOLLY_NO_CONFIG
#include <folly/folly-config.h>
#endif

#include <folly/Range.h>
#include <folly/io/async/ssl/OpenSSLPtrTypes.h>
#include <folly/io/async/ssl/OpenSSLUtils.h>

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
   * implement this interface and register it with TSSLSocketFactory.
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
 * Wrap OpenSSL SSL_CTX into a class.
 */
class SSLContext {
 public:

  enum SSLVersion {
     SSLv2,
     SSLv3,
     TLSv1
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
    NextProtocolsItem(int wt, const std::list<std::string>& ptcls):
      weight(wt), protocols(ptcls) {}
    int weight;
    std::list<std::string> protocols;
  };

  // Function that selects a client protocol given the server's list
  using ClientProtocolFilterCallback = bool (*)(unsigned char**, unsigned int*,
                                        const unsigned char*, unsigned int);

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
   * Set default ciphers to be used in SSL handshake process.
   *
   * @param ciphers A list of ciphers to use for TLS.
   */
  virtual void setCipherList(const std::vector<std::string>& ciphers);

  /**
   * Low-level method that attempts to set the provided ciphers on the
   * SSL_CTX object, and throws if something goes wrong.
   */
  virtual void setCiphersOrThrow(const std::string& ciphers);

  /**
   * Sets the signature algorithms to be used during SSL negotiation
   * for TLS1.2+
   *
   * @param sigalgs A list of signature algorithms, eg. RSA+SHA512
   */
  void setSignatureAlgorithms(const std::vector<std::string>& sigalgs);

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
    return (verifyPeer_ == SSLVerifyPeerEnum::VERIFY ||
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
  virtual void authenticate(bool checkPeerCert, bool checkPeerName,
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

  enum class NextProtocolType : uint8_t {
    NPN = 0x1,
    ALPN = 0x2,
    ANY = NPN | ALPN
  };

#ifdef OPENSSL_NPN_NEGOTIATED
  /**
   * Set the list of protocols that this SSL context supports. In server
   * mode, this is the list of protocols that will be advertised for Next
   * Protocol Negotiation (NPN) or Application Layer Protocol Negotiation
   * (ALPN). In client mode, the first protocol advertised by the server
   * that is also on this list is chosen. Invoking this function with a list
   * of length zero causes NPN to be disabled.
   *
   * @param protocols   List of protocol names. This method makes a copy,
   *                    so the caller needn't keep the list in scope after
   *                    the call completes. The list must have at least
   *                    one element to enable NPN. Each element must have
   *                    a string length < 256.
   * @param protocolType  What type of protocol negotiation to support.
   * @return true if NPN/ALPN has been activated. False if NPN/ALPN is disabled.
   */
  bool setAdvertisedNextProtocols(
      const std::list<std::string>& protocols,
      NextProtocolType protocolType = NextProtocolType::ANY);
  /**
   * Set weighted list of lists of protocols that this SSL context supports.
   * In server mode, each element of the list contains a list of protocols that
   * could be advertised for Next Protocol Negotiation (NPN) or Application
   * Layer Protocol Negotiation (ALPN). The list of protocols that will be
   * advertised to a client is selected randomly, based on weights of elements.
   * Client mode doesn't support randomized NPN/ALPN, so this list should
   * contain only 1 element. The first protocol advertised by the server that
   * is also on the list of protocols of this element is chosen. Invoking this
   * function with a list of length zero causes NPN/ALPN to be disabled.
   *
   * @param items  List of NextProtocolsItems, Each item contains a list of
   *               protocol names and weight. After the call of this fucntion
   *               each non-empty list of protocols will be advertised with
   *               probability weight/sum_of_weights. This method makes a copy,
   *               so the caller needn't keep the list in scope after the call
   *               completes. The list must have at least one element with
   *               non-zero weight and non-empty protocols list to enable NPN.
   *               Each name of the protocol must have a string length < 256.
   * @param protocolType  What type of protocol negotiation to support.
   * @return true if NPN/ALPN has been activated. False if NPN/ALPN is disabled.
   */
  bool setRandomizedAdvertisedNextProtocols(
      const std::list<NextProtocolsItem>& items,
      NextProtocolType protocolType = NextProtocolType::ANY);

  void setClientProtocolFilterCallback(ClientProtocolFilterCallback cb) {
    clientProtoFilter_ = cb;
  }

  ClientProtocolFilterCallback getClientProtocolFilterCallback() {
    return clientProtoFilter_;
  }

  /**
   * Disables NPN on this SSL context.
   */
  void unsetNextProtocols();
  void deleteNextProtocolsStrings();
#endif // OPENSSL_NPN_NEGOTIATED

  /**
   * Gets the underlying SSL_CTX for advanced usage
   */
  SSL_CTX *getSSLCtx() const {
    return ctx_;
  }

  enum SSLLockType {
    LOCK_MUTEX,
    LOCK_SPINLOCK,
    LOCK_NONE
  };

  /**
   * Set preferences for how to treat locks in OpenSSL.  This must be
   * called before the instantiation of any SSLContext objects, otherwise
   * the defaults will be used.
   *
   * OpenSSL has a lock for each module rather than for each object or
   * data that needs locking.  Some locks protect only refcounts, and
   * might be better as spinlocks rather than mutexes.  Other locks
   * may be totally unnecessary if the objects being protected are not
   * shared between threads in the application.
   *
   * By default, all locks are initialized as mutexes.  OpenSSL's lock usage
   * may change from version to version and you should know what you are doing
   * before disabling any locks entirely.
   *
   * Example: if you don't share SSL sessions between threads in your
   * application, you may be able to do this
   *
   * setSSLLockTypes({{CRYPTO_LOCK_SSL_SESSION, SSLContext::LOCK_NONE}})
   */
  static void setSSLLockTypes(std::map<int, SSLLockType> lockTypes);

  /**
   * Examine OpenSSL's error stack, and return a string description of the
   * errors.
   *
   * This operation removes the errors from OpenSSL's error stack.
   */
  static std::string getErrors(int errnoCopy);

  /**
   * We want to vary which cipher we'll use based on the client's TLS version.
   *
   * XXX: The refernces to tls11CipherString and tls11AltCipherlist are reused
   * for * each >= TLS 1.1 handshake, so we expect these fields to not change.
   */
  void switchCiphersIfTLS11(
      SSL* ssl,
      const std::string& tls11CipherString,
      const std::vector<std::pair<std::string, int>>& tls11AltCipherlist);

  bool checkPeerName() { return checkPeerName_; }
  std::string peerFixedName() { return peerFixedName_; }

#if defined(SSL_MODE_HANDSHAKE_CUTTHROUGH)
  /**
   * Enable TLS false start, saving a roundtrip for full handshakes. Will only
   * be used if the server uses NPN or ALPN, and a strong forward-secure cipher
   * is negotiated.
   */
  void enableFalseStart();
#endif

  /**
   * Helper to match a hostname versus a pattern.
   */
  static bool matchName(const char* host, const char* pattern, int size);

  /**
   * Functions for setting up and cleaning up openssl.
   * They can be invoked during the start of the application.
   */
  static void initializeOpenSSL();
  static void cleanupOpenSSL();

  /**
   * Mark openssl as initialized without actually performing any initialization.
   * Please use this only if you are using a library which requires that it must
   * make its own calls to SSL_library_init() and related functions.
   */
  static void markInitialized();

  /**
   * Default randomize method.
   */
  static void randomize();

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

  // To provide control over choice of server ciphersuites
  std::unique_ptr<std::discrete_distribution<int>> cipherListPicker_;

#ifdef OPENSSL_NPN_NEGOTIATED

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

  static int sNextProtocolsExDataIndex_;

  static int advertisedNextProtocolCallback(SSL* ssl,
      const unsigned char** out, unsigned int* outlen, void* data);
  static int selectNextProtocolCallback(
    SSL* ssl, unsigned char **out, unsigned char *outlen,
    const unsigned char *server, unsigned int server_len, void *args);

#if FOLLY_OPENSSL_HAS_ALPN
  static int alpnSelectCallback(SSL* ssl,
                                const unsigned char** out,
                                unsigned char* outlen,
                                const unsigned char* in,
                                unsigned int inlen,
                                void* data);
#endif
  size_t pickNextProtocols();

#endif // OPENSSL_NPN_NEGOTIATED

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
    void* data
  );
#endif

  std::string providedCiphersString_;

  // Functions are called when locked by the calling function.
  static void initializeOpenSSLLocked();
  static void cleanupOpenSSLLocked();
};

typedef std::shared_ptr<SSLContext> SSLContextPtr;

std::ostream& operator<<(std::ostream& os, const folly::PasswordCollector& collector);


} // folly

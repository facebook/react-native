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
#include <folly/portability/OpenSSL.h>

namespace folly {
namespace ssl {

#ifdef OPENSSL_IS_BORINGSSL
int SSL_CTX_set1_sigalgs_list(SSL_CTX*, const char*) {
  return 1; // 0 implies error
}

int TLS1_get_client_version(SSL* s) {
  return s->client_version;
}

int BIO_meth_set_read(BIO_METHOD* biom, int (*read)(BIO*, char*, int)) {
  biom->bread = read;
  return 1;
}

int BIO_meth_set_write(BIO_METHOD* biom, int (*write)(BIO*, const char*, int)) {
  biom->bwrite = write;
  return 1;
}

#elif FOLLY_OPENSSL_IS_102 || FOLLY_OPENSSL_IS_101
int SSL_CTX_up_ref(SSL_CTX* ctx) {
  return CRYPTO_add(&ctx->references, 1, CRYPTO_LOCK_SSL_CTX);
}

int SSL_SESSION_up_ref(SSL_SESSION* session) {
  return CRYPTO_add(&session->references, 1, CRYPTO_LOCK_SSL_SESSION);
}

int X509_up_ref(X509* x) {
  return CRYPTO_add(&x->references, 1, CRYPTO_LOCK_X509);
}

int BIO_meth_set_read(BIO_METHOD* biom, int (*read)(BIO*, char*, int)) {
  biom->bread = read;
  return 1;
}

int BIO_meth_set_write(BIO_METHOD* biom, int (*write)(BIO*, const char*, int)) {
  biom->bwrite = write;
  return 1;
}

#elif FOLLY_OPENSSL_IS_110

#endif
}
}

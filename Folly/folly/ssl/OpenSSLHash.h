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
#include <folly/io/IOBuf.h>
#include <folly/portability/OpenSSL.h>
#include <folly/ssl/OpenSSLPtrTypes.h>

namespace folly {
namespace ssl {

/// Warning:
/// These functions are not thread-safe unless you initialize OpenSSL.
class OpenSSLHash {
 public:
  class Digest {
   public:
    Digest() : ctx_(EVP_MD_CTX_new()) {}

    Digest(const Digest& other) {
      ctx_ = EvpMdCtxUniquePtr(EVP_MD_CTX_new());
      if (other.md_ != nullptr) {
        hash_init(other.md_);
        check_libssl_result(
            1, EVP_MD_CTX_copy_ex(ctx_.get(), other.ctx_.get()));
      }
    }

    Digest& operator=(const Digest& other) {
      this->~Digest();
      return *new (this) Digest(other);
    }

    void hash_init(const EVP_MD* md) {
      md_ = md;
      check_libssl_result(1, EVP_DigestInit_ex(ctx_.get(), md, nullptr));
    }
    void hash_update(ByteRange data) {
      check_libssl_result(
          1, EVP_DigestUpdate(ctx_.get(), data.data(), data.size()));
    }
    void hash_update(const IOBuf& data) {
      for (auto r : data) {
        hash_update(r);
      }
    }
    void hash_final(MutableByteRange out) {
      const auto size = EVP_MD_size(md_);
      check_out_size(size_t(size), out);
      unsigned int len = 0;
      check_libssl_result(1, EVP_DigestFinal_ex(ctx_.get(), out.data(), &len));
      check_libssl_result(size, int(len));
      md_ = nullptr;
    }

   private:
    const EVP_MD* md_ = nullptr;
    EvpMdCtxUniquePtr ctx_{nullptr};
  };

  static void hash(MutableByteRange out, const EVP_MD* md, ByteRange data) {
    Digest hash;
    hash.hash_init(md);
    hash.hash_update(data);
    hash.hash_final(out);
  }
  static void hash(MutableByteRange out, const EVP_MD* md, const IOBuf& data) {
    Digest hash;
    hash.hash_init(md);
    hash.hash_update(data);
    hash.hash_final(out);
  }
  static void sha1(MutableByteRange out, ByteRange data) {
    hash(out, EVP_sha1(), data);
  }
  static void sha1(MutableByteRange out, const IOBuf& data) {
    hash(out, EVP_sha1(), data);
  }
  static void sha256(MutableByteRange out, ByteRange data) {
    hash(out, EVP_sha256(), data);
  }
  static void sha256(MutableByteRange out, const IOBuf& data) {
    hash(out, EVP_sha256(), data);
  }

  class Hmac {
   public:
    Hmac() : ctx_(HMAC_CTX_new()) {}

    void hash_init(const EVP_MD* md, ByteRange key) {
      md_ = md;
      check_libssl_result(
          1,
          HMAC_Init_ex(ctx_.get(), key.data(), int(key.size()), md_, nullptr));
    }
    void hash_update(ByteRange data) {
      check_libssl_result(1, HMAC_Update(ctx_.get(), data.data(), data.size()));
    }
    void hash_update(const IOBuf& data) {
      for (auto r : data) {
        hash_update(r);
      }
    }
    void hash_final(MutableByteRange out) {
      const auto size = EVP_MD_size(md_);
      check_out_size(size_t(size), out);
      unsigned int len = 0;
      check_libssl_result(1, HMAC_Final(ctx_.get(), out.data(), &len));
      check_libssl_result(size, int(len));
      md_ = nullptr;
    }

   private:
    const EVP_MD* md_ = nullptr;
    HmacCtxUniquePtr ctx_{nullptr};
  };

  static void
  hmac(MutableByteRange out, const EVP_MD* md, ByteRange key, ByteRange data) {
    Hmac hmac;
    hmac.hash_init(md, key);
    hmac.hash_update(data);
    hmac.hash_final(out);
  }
  static void hmac(
      MutableByteRange out,
      const EVP_MD* md,
      ByteRange key,
      const IOBuf& data) {
    Hmac hmac;
    hmac.hash_init(md, key);
    hmac.hash_update(data);
    hmac.hash_final(out);
  }
  static void hmac_sha1(MutableByteRange out, ByteRange key, ByteRange data) {
    hmac(out, EVP_sha1(), key, data);
  }
  static void
  hmac_sha1(MutableByteRange out, ByteRange key, const IOBuf& data) {
    hmac(out, EVP_sha1(), key, data);
  }
  static void hmac_sha256(MutableByteRange out, ByteRange key, ByteRange data) {
    hmac(out, EVP_sha256(), key, data);
  }
  static void
  hmac_sha256(MutableByteRange out, ByteRange key, const IOBuf& data) {
    hmac(out, EVP_sha256(), key, data);
  }

 private:
  static inline void check_out_size(size_t size, MutableByteRange out) {
    if (LIKELY(size == out.size())) {
      return;
    }
    check_out_size_throw(size, out);
  }
  [[noreturn]] static void check_out_size_throw(
      size_t size,
      MutableByteRange out);

  static inline void check_libssl_result(int expected, int result) {
    if (LIKELY(result == expected)) {
      return;
    }
    throw_exception<std::runtime_error>("openssl crypto function failed");
  }
};

} // namespace ssl
} // namespace folly

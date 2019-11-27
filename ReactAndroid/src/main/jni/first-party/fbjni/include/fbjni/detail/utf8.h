/**
 * Copyright 2018-present, Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#pragma once

#include <string>

#include <jni.h>

namespace facebook {
namespace jni {

namespace detail {

void utf8ToModifiedUTF8(const uint8_t* bytes, size_t len, uint8_t* modified, size_t modifiedLength);
size_t modifiedLength(const std::string& str);
size_t modifiedLength(const uint8_t* str, size_t* length);
std::string modifiedUTF8ToUTF8(const uint8_t* modified, size_t len) noexcept;
std::string utf16toUTF8(const uint16_t* utf16Bytes, size_t len) noexcept;

}

// JNI represents strings encoded with modified version of UTF-8.  The difference between UTF-8 and
// Modified UTF-8 is that the latter support only 1-byte, 2-byte, and 3-byte formats. Supplementary
// character (4 bytes in unicode) needs to be represented in the form of surrogate pairs. To create
// a Modified UTF-8 surrogate pair that Dalvik would understand we take 4-byte unicode character,
// encode it with UTF-16 which gives us two 2 byte chars (surrogate pair) and then we encode each
// pair as UTF-8. This result in 2 x 3 byte characters.  To convert modified UTF-8 to standard
// UTF-8, this mus tbe reversed.
//
// The second difference is that Modified UTF-8 is encoding NUL byte in 2-byte format.
//
// In order to avoid complex error handling, only a minimum of validity checking is done to avoid
// crashing.  If the input is invalid, the output may be invalid as well.
//
// Relevant links:
//  - http://docs.oracle.com/javase/7/docs/technotes/guides/jni/spec/functions.html
//  - https://docs.oracle.com/javase/6/docs/api/java/io/DataInput.html#modified-utf-8

// JString to UTF16 extractor using RAII idiom. Note that the
// ctor/dtor use GetStringCritical/ReleaseStringCritical, so this
// class is subject to the restrictions imposed by those functions.
class JStringUtf16Extractor {
public:
  JStringUtf16Extractor(JNIEnv* env, jstring javaString)
  : env_(env)
  , javaString_(javaString)
  , length_(0)
  , utf16String_(nullptr) {
    if (env_ && javaString_) {
      length_ = env_->GetStringLength(javaString_);
      utf16String_ = env_->GetStringCritical(javaString_, nullptr);
    }
  }

  ~JStringUtf16Extractor() {
    if (utf16String_) {
      env_->ReleaseStringCritical(javaString_, utf16String_);
    }
  }

  const jsize length() const {
    return length_;
  }

  const jchar* chars() const {
    return utf16String_;
  }

private:
  JNIEnv* env_;
  jstring javaString_;
  jsize length_;
  const jchar* utf16String_;
};

}
}

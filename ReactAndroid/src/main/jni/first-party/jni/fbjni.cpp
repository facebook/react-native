/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include "fbjni.h"

#include <mutex>
#include <vector>
#include <jni/LocalString.h>

namespace facebook {
namespace jni {

jint initialize(JavaVM* vm, std::function<void()>&& init_fn) noexcept {
  static std::once_flag flag{};
  // TODO (t7832883): DTRT when we have exception pointers
  static auto error_msg = std::string{"Failed to initialize fbjni"};
  static auto error_occured = false;

  std::call_once(flag, [vm] {
    try {
      Environment::initialize(vm);
      internal::initExceptionHelpers();
    } catch (std::exception& ex) {
      error_occured = true;
      try {
        error_msg = std::string{"Failed to initialize fbjni: "} + ex.what();
      } catch (...) {
        // Ignore, we already have a fall back message
      }
    } catch (...) {
      error_occured = true;
    }
  });

  try {
    if (error_occured) {
      throw std::runtime_error(error_msg);
    }

    init_fn();
  } catch (...) {
    translatePendingCppExceptionToJavaException();
    // So Java will handle the translated exception, fall through and
    // return a good version number.
  }
  return JNI_VERSION_1_6;
}

alias_ref<JClass> findClassStatic(const char* name) {
  const auto env = internal::getEnv();
  auto cls = env->FindClass(name);
  FACEBOOK_JNI_THROW_EXCEPTION_IF(!cls);
  auto leaking_ref = (jclass)env->NewGlobalRef(cls);
  FACEBOOK_JNI_THROW_EXCEPTION_IF(!leaking_ref);
  return wrap_alias(leaking_ref);
}

local_ref<JClass> findClassLocal(const char* name) {
  const auto env = internal::getEnv();
  auto cls = env->FindClass(name);
  FACEBOOK_JNI_THROW_EXCEPTION_IF(!cls);
  return adopt_local(cls);
}


// jstring /////////////////////////////////////////////////////////////////////////////////////////

std::string JString::toStdString() const {
  const auto env = internal::getEnv();
  auto utf16String = JStringUtf16Extractor(env, self());
  auto length = env->GetStringLength(self());
  return detail::utf16toUTF8(utf16String, length);
}

local_ref<JString> make_jstring(const char* utf8) {
  if (!utf8) {
    return {};
  }
  const auto env = internal::getEnv();
  size_t len;
  size_t modlen = detail::modifiedLength(reinterpret_cast<const uint8_t*>(utf8), &len);
  jstring result;
  if (modlen == len) {
    // The only difference between utf8 and modifiedUTF8 is in encoding 4-byte UTF8 chars
    // and '\0' that is encoded on 2 bytes.
    //
    // Since modifiedUTF8-encoded string can be no shorter than it's UTF8 conterpart we
    // know that if those two strings are of the same length we don't need to do any
    // conversion -> no 4-byte chars nor '\0'.
    result = env->NewStringUTF(utf8);
  } else {
    auto modified = std::vector<char>(modlen + 1); // allocate extra byte for \0
    detail::utf8ToModifiedUTF8(
      reinterpret_cast<const uint8_t*>(utf8), len,
      reinterpret_cast<uint8_t*>(modified.data()), modified.size());
    result = env->NewStringUTF(modified.data());
  }
  FACEBOOK_JNI_THROW_PENDING_EXCEPTION();
  return adopt_local(result);
}


// JniPrimitiveArrayFunctions //////////////////////////////////////////////////////////////////////

#pragma push_macro("DEFINE_PRIMITIVE_METHODS")
#undef DEFINE_PRIMITIVE_METHODS
#define DEFINE_PRIMITIVE_METHODS(TYPE, NAME, SMALLNAME)                        \
                                                                               \
template<>                                                                     \
TYPE* JPrimitiveArray<TYPE ## Array>::getElements(jboolean* isCopy) {          \
  auto env = internal::getEnv();                                               \
  TYPE* res =  env->Get ## NAME ## ArrayElements(self(), isCopy);              \
  FACEBOOK_JNI_THROW_PENDING_EXCEPTION();                                      \
  return res;                                                                  \
}                                                                              \
                                                                               \
template<>                                                                     \
void JPrimitiveArray<TYPE ## Array>::releaseElements(                          \
    TYPE* elements, jint mode) {                                               \
  auto env = internal::getEnv();                                               \
  env->Release ## NAME ## ArrayElements(self(), elements, mode);               \
  FACEBOOK_JNI_THROW_PENDING_EXCEPTION();                                      \
}                                                                              \
                                                                               \
template<>                                                                     \
void JPrimitiveArray<TYPE ## Array>::getRegion(                                \
    jsize start, jsize length, TYPE* buf) {                                    \
  auto env = internal::getEnv();                                               \
  env->Get ## NAME ## ArrayRegion(self(), start, length, buf);                 \
  FACEBOOK_JNI_THROW_PENDING_EXCEPTION();                                      \
}                                                                              \
                                                                               \
template<>                                                                     \
void JPrimitiveArray<TYPE ## Array>::setRegion(                                \
    jsize start, jsize length, const TYPE* elements) {                         \
  auto env = internal::getEnv();                                               \
  env->Set ## NAME ## ArrayRegion(self(), start, length, elements);            \
  FACEBOOK_JNI_THROW_PENDING_EXCEPTION();                                      \
}                                                                              \
                                                                               \
local_ref<TYPE ## Array> make_ ## SMALLNAME ## _array(jsize size) {            \
  auto array = internal::getEnv()->New ## NAME ## Array(size);                 \
  FACEBOOK_JNI_THROW_EXCEPTION_IF(!array);                                     \
  return adopt_local(array);                                                   \
}                                                                              \
                                                                               \
template<>                                                                     \
local_ref<TYPE ## Array> JArray ## NAME::newArray(size_t count) {              \
  return make_ ## SMALLNAME ## _array(count);                                  \
}                                                                              \
                                                                               \

DEFINE_PRIMITIVE_METHODS(jboolean, Boolean, boolean)
DEFINE_PRIMITIVE_METHODS(jbyte, Byte, byte)
DEFINE_PRIMITIVE_METHODS(jchar, Char, char)
DEFINE_PRIMITIVE_METHODS(jshort, Short, short)
DEFINE_PRIMITIVE_METHODS(jint, Int, int)
DEFINE_PRIMITIVE_METHODS(jlong, Long, long)
DEFINE_PRIMITIVE_METHODS(jfloat, Float, float)
DEFINE_PRIMITIVE_METHODS(jdouble, Double, double)
#pragma pop_macro("DEFINE_PRIMITIVE_METHODS")

// Internal debug /////////////////////////////////////////////////////////////////////////////////

namespace internal {

ReferenceStats g_reference_stats;

void facebook::jni::internal::ReferenceStats::reset() noexcept {
  locals_deleted = globals_deleted = weaks_deleted = 0;
}

}

}}

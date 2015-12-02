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

template<typename... Args>
static void log(Args... args) {
// TODO (7623232) Migrate to glog
#ifdef __ANDROID__
  facebook::alog::loge("fbjni", args...);
#endif
}

jint initialize(JavaVM* vm, void(*init_fn)()) noexcept {
  static std::once_flag init_flag;
  static auto failed = false;

  std::call_once(init_flag, [vm] {
    try {
      Environment::initialize(vm);
      internal::initExceptionHelpers();
    } catch (std::exception& ex) {
      log("Failed to initialize fbjni: %s", ex.what());
      failed = true;
    } catch (...) {
      log("Failed to initialize fbjni");
      failed = true;
    }
  });

  if (failed) {
    return JNI_ERR;
  }

  try {
    init_fn();
  } catch (...) {
    translatePendingCppExceptionToJavaException();
    // So Java will handle the translated exception, fall through and
    // return a good version number.
  }
  return JNI_VERSION_1_6;
}

alias_ref<jclass> findClassStatic(const char* name) {
  const auto env = internal::getEnv();
  auto cls = env->FindClass(name);
  FACEBOOK_JNI_THROW_EXCEPTION_IF(!cls);
  auto leaking_ref = (jclass)env->NewGlobalRef(cls);
  FACEBOOK_JNI_THROW_EXCEPTION_IF(!leaking_ref);
  return wrap_alias(leaking_ref);
}

local_ref<jclass> findClassLocal(const char* name) {
  const auto env = internal::getEnv();
  auto cls = env->FindClass(name);
  FACEBOOK_JNI_THROW_EXCEPTION_IF(!cls);
  return adopt_local(cls);
}


// jstring /////////////////////////////////////////////////////////////////////////////////////////

std::string JObjectWrapper<jstring>::toStdString() const {
  const auto env = internal::getEnv();
  auto modified = env->GetStringUTFChars(self(), nullptr);
  auto length = env->GetStringUTFLength(self());
  auto string = detail::modifiedUTF8ToUTF8(reinterpret_cast<const uint8_t*>(modified), length);
  env->ReleaseStringUTFChars(self(), modified);
  return string;
}

local_ref<jstring> make_jstring(const char* utf8) {
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


// PinnedPrimitiveArray ///////////////////////////////////////////////////////////////////////////

// TODO(T7847300): Allow array to be specified as constant so that JNI_ABORT can be passed
// on release, as opposed to 0, which results in unnecessary copying.
#pragma push_macro("DEFINE_PRIMITIVE_METHODS")
#undef DEFINE_PRIMITIVE_METHODS
#define DEFINE_PRIMITIVE_METHODS(TYPE, NAME)                                                \
template<>                                                                                  \
TYPE* PinnedPrimitiveArray<TYPE>::get() {                                                   \
  FACEBOOK_JNI_THROW_EXCEPTION_IF(array_.get() == nullptr);                                 \
  const auto env = internal::getEnv();                                                      \
  elements_ = env->Get ## NAME ## ArrayElements(                                            \
      static_cast<TYPE ## Array>(array_.get()), &isCopy_);                                  \
  size_ = array_->size();                                                                   \
  return elements_;                                                                         \
}                                                                                           \
template<>                                                                                  \
void PinnedPrimitiveArray<TYPE>::release() {                                                \
  FACEBOOK_JNI_THROW_EXCEPTION_IF(array_.get() == nullptr);                                 \
  const auto env = internal::getEnv();                                                      \
  env->Release ## NAME ## ArrayElements(                                                    \
      static_cast<TYPE ## Array>(array_.get()), elements_, 0);                              \
  elements_ = nullptr;                                                                      \
  size_ = 0;                                                                                \
}

DEFINE_PRIMITIVE_METHODS(jboolean, Boolean)
DEFINE_PRIMITIVE_METHODS(jbyte, Byte)
DEFINE_PRIMITIVE_METHODS(jchar, Char)
DEFINE_PRIMITIVE_METHODS(jshort, Short)
DEFINE_PRIMITIVE_METHODS(jint, Int)
DEFINE_PRIMITIVE_METHODS(jlong, Long)
DEFINE_PRIMITIVE_METHODS(jfloat, Float)
DEFINE_PRIMITIVE_METHODS(jdouble, Double)
#pragma pop_macro("DEFINE_PRIMITIVE_METHODS")


#define DEFINE_PRIMITIVE_ARRAY_UTILS(TYPE, NAME)                                                \
                                                                                                \
local_ref<j ## TYPE ## Array> make_ ## TYPE ## _array(jsize size) {                             \
  auto array = internal::getEnv()->New ## NAME ## Array(size);                                  \
  FACEBOOK_JNI_THROW_EXCEPTION_IF(!array);                                                      \
  return adopt_local(array);                                                                    \
}                                                                                               \
                                                                                                \
local_ref<j ## TYPE ## Array> JArray ## NAME::newArray(size_t count) {                          \
  return make_ ## TYPE ## _array(count);                                                        \
}                                                                                               \
                                                                                                \
j ## TYPE* JArray ## NAME::getRegion(jsize start, jsize length, j ## TYPE* buf) {               \
  internal::getEnv()->Get ## NAME ## ArrayRegion(self(), start, length, buf);                   \
  FACEBOOK_JNI_THROW_PENDING_EXCEPTION();                                                       \
  return buf;                                                                                   \
}                                                                                               \
                                                                                                \
std::unique_ptr<j ## TYPE[]> JArray ## NAME::getRegion(jsize start, jsize length) {             \
  auto buf = std::unique_ptr<j ## TYPE[]>{new j ## TYPE[length]};                               \
  internal::getEnv()->Get ## NAME ## ArrayRegion(self(), start, length, buf.get());             \
  FACEBOOK_JNI_THROW_PENDING_EXCEPTION();                                                       \
  return buf;                                                                                   \
}                                                                                               \
                                                                                                \
void JArray ## NAME::setRegion(jsize start, jsize length, const j ## TYPE* buf) {               \
  internal::getEnv()->Set ## NAME ## ArrayRegion(self(), start, length, buf);                   \
  FACEBOOK_JNI_THROW_PENDING_EXCEPTION();                                                       \
}                                                                                               \
                                                                                                \
PinnedPrimitiveArray<j ## TYPE> JArray ## NAME::pin() {                                         \
  return PinnedPrimitiveArray<j ## TYPE>{self()};                                               \
}                                                                                               \

DEFINE_PRIMITIVE_ARRAY_UTILS(boolean, Boolean)
DEFINE_PRIMITIVE_ARRAY_UTILS(byte, Byte)
DEFINE_PRIMITIVE_ARRAY_UTILS(char, Char)
DEFINE_PRIMITIVE_ARRAY_UTILS(short, Short)
DEFINE_PRIMITIVE_ARRAY_UTILS(int, Int)
DEFINE_PRIMITIVE_ARRAY_UTILS(long, Long)
DEFINE_PRIMITIVE_ARRAY_UTILS(float, Float)
DEFINE_PRIMITIVE_ARRAY_UTILS(double, Double)


// Internal debug /////////////////////////////////////////////////////////////////////////////////

namespace internal {
ReferenceStats g_reference_stats;

void facebook::jni::internal::ReferenceStats::reset() noexcept {
  locals_deleted = globals_deleted = weaks_deleted = 0;
}
}

}}


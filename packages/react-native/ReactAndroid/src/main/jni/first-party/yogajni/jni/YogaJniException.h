/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <stdexcept>
#include <string>
#include "common.h"

namespace facebook::yoga::vanillajni {
/**
 * This class wraps a Java exception (jthrowable) into a C++ exception; A global
 * reference to Java exception (jthrowable) is made so that the exception object
 * does not gets cleared before jni call completion
 */
class YogaJniException : public std::exception {
 public:
  YogaJniException();
  ~YogaJniException() override;

  explicit YogaJniException(jthrowable throwable);

  YogaJniException(YogaJniException&& rhs) noexcept;

  YogaJniException(const YogaJniException& rhs);

  ScopedLocalRef<jthrowable> getThrowable() const noexcept;

 private:
  ScopedGlobalRef<jthrowable> throwable_;
};

} // namespace facebook::yoga::vanillajni

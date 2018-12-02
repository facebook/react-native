/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "CoreClasses.h"

namespace facebook {
namespace jni {

class JFile : public JavaClass<JFile> {
 public:
  static constexpr const char* kJavaDescriptor = "Ljava/io/File;";

  // Define a method that calls into the represented Java class
  std::string getAbsolutePath() {
    static auto method = getClass()->getMethod<jstring()>("getAbsolutePath");
    return method(self())->toStdString();
  }

};

}
}

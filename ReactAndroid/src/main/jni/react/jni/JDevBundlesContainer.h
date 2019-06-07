// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <string>

#include <cxxreact/JSExecutor.h>
#include <fb/fbjni.h>

using namespace facebook::jni;

namespace facebook {
namespace react {


class JavaDevBundlesContainer : public jni::JavaClass<JavaDevBundlesContainer> {
public:
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/devsupport/DevBundlesContainer;";
};

class JDevBundlesContainer {
public:
  JDevBundlesContainer(alias_ref<JavaDevBundlesContainer::javaobject> jobj);

  std::string getSourceURLByName(std::string name);
  std::string getFileURLByName(std::string name);
  std::string getNameBySourceURL(std::string sourceURL);
  std::string getNameByFileURL(std::string fileURL);
  std::string getFileURLBySourceURL(std::string sourceULR);

  JavaDevBundlesContainer::javaobject jobj() {
    return m_jobj.get();
  }

private:
  global_ref<JavaDevBundlesContainer::javaobject> m_jobj;
};

}
}

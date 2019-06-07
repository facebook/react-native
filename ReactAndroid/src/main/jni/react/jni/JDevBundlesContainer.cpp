// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "JDevBundlesContainer.h"

#include <jsi/jsi.h>


namespace facebook {
namespace react {

JDevBundlesContainer::JDevBundlesContainer(alias_ref<JavaDevBundlesContainer::javaobject> jobj) :
    m_jobj(make_global(jobj)) {
}

  std::string JDevBundlesContainer::getSourceURLByName(std::string name) {
    static auto method = JavaDevBundlesContainer::javaClassStatic()->
    getMethod<jstring(jstring)>("getSourceURLByName");
    return method(m_jobj, facebook::jni::make_jstring(name).get())->toString();
  }

  std::string JDevBundlesContainer::getFileURLByName(std::string name) {
    static auto method = JavaDevBundlesContainer::javaClassStatic()->
    getMethod<jstring(jstring)>("getFileURLByName");
    return method(m_jobj, facebook::jni::make_jstring(name).get())->toString();
  }

  std::string JDevBundlesContainer::getNameBySourceURL(std::string sourceURL) {
    static auto method = JavaDevBundlesContainer::javaClassStatic()->
    getMethod<jstring(jstring)>("getNameBySourceURL");
    return method(m_jobj, facebook::jni::make_jstring(sourceURL).get())->toString();
  }

  std::string JDevBundlesContainer::getNameByFileURL(std::string fileURL) {
    static auto method = JavaDevBundlesContainer::javaClassStatic()->
    getMethod<jstring(jstring)>("getNameByFileURL");
    return method(m_jobj, facebook::jni::make_jstring(fileURL).get())->toString();
  }

  std::string JDevBundlesContainer::getFileURLBySourceURL(std::string sourceULR) {
    static auto method = JavaDevBundlesContainer::javaClassStatic()->
    getMethod<jstring(jstring)>("getFileURLBySourceURL");
    return method(m_jobj, facebook::jni::make_jstring(sourceULR).get())->toString();
  }


}
}

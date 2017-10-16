// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <string>
#include <fb/fbjni.h>
#include <cxxreact/Platform.h>

namespace facebook {
namespace react {

class JReactMarker : public facebook::jni::JavaClass<JReactMarker> {
public:
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/bridge/ReactMarker;";
  static void setLogPerfMarkerIfNeeded();

private:
  static void logMarker(const std::string& marker);
  static void logMarker(const std::string& marker, const std::string& tag);
  static void logPerfMarker(const ReactMarker::ReactMarkerId markerId, const char* tag);
};

}
}

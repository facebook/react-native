// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <JavaScriptCore/config.h>
#include <wtf/text/WTFString.h>
#include <wtf/text/CString.h>
#include <JavaScriptCore/JSContextRef.h>
#include <JavaScriptCore/JSObjectRef.h>

#include <string>
#include <unordered_map>

namespace facebook {
namespace react {

inline std::string toStdString(const WTF::String& str) {
  return std::string(str.utf8().data());
}

template <typename T>
class AgentMap {
public:
  void add(JSGlobalContextRef ctx, T* agent) {
    map_[ctx] = agent;
  }

  void remove(T* agent) {
    auto it = std::find_if(
      map_.begin(),
      map_.end(),
      [agent](const typename MapType::value_type& entry) { return entry.second == agent; });
    map_.erase(it);
  }

  T* get(JSGlobalContextRef ctx) {
    return map_.at(ctx);
  }
private:
  using MapType = std::unordered_map<JSGlobalContextRef, T*>;
  MapType map_;
};

}
}

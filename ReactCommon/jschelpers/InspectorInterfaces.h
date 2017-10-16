/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#pragma once

#include <functional>
#include <memory>
#include <string>
#include <vector>

#include <JavaScriptCore/JSBase.h>

namespace facebook {
namespace react {

class IDestructible {
public:
  virtual ~IDestructible() = 0;
};

struct InspectorPage {
  const int id;
  const std::string title;
};

class IRemoteConnection : public IDestructible {
public:
  __attribute__((visibility("default"))) virtual ~IRemoteConnection() = 0;
  virtual void onMessage(std::string message) = 0;
  virtual void onDisconnect() = 0;
};

class ILocalConnection : public IDestructible {
public:
  virtual ~ILocalConnection() = 0;
  virtual void sendMessage(std::string message) = 0;
  virtual void disconnect() = 0;
};

// Note: not destructible!
class IInspector {
public:
  virtual void registerGlobalContext(const std::string& title, const std::function<bool()> &checkIsInspectedRemote, JSGlobalContextRef ctx) = 0;
  virtual void unregisterGlobalContext(JSGlobalContextRef ctx) = 0;

  virtual std::vector<InspectorPage> getPages() const = 0;
  virtual std::unique_ptr<ILocalConnection> connect(int pageId, std::unique_ptr<IRemoteConnection> remote) = 0;
};

}
}

// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <memory>

#include <folly/dynamic.h>
// Both double-conversions and WTF define the ASSERT macro
#undef ASSERT

namespace facebook {
namespace react {

/*
 * A bidrectional channel that allows both sending events to the remote inspector and registering
 * to receive events for a specific domain.
 */
class Channel {
public:
  using MessageHandler = std::function<void(std::string message, int callId, const std::string& methodName, folly::dynamic args)>;

  virtual ~Channel() = default;

  virtual void sendMessage(std::string message) = 0;
  virtual void registerDomain(std::string domain, MessageHandler handler) = 0;
};

/*
 * A dispatcher is responsible for one or multiple domains and registering them with the Channel
 * when it is connected.
 */
class Dispatcher {
public:
  virtual ~Dispatcher() {}

  virtual void onConnect(std::shared_ptr<Channel> channel) = 0;
  virtual void onDisconnect() = 0;
};

}
}

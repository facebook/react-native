// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include "Dispatcher.h"

#include <unordered_map>

namespace facebook {
namespace react {

class Agent : public Dispatcher {
public:
  void onConnect(std::shared_ptr<Channel> channel) override;
  void onDisconnect() override;
protected:
  using Method = std::function<folly::dynamic(folly::dynamic)>;
  void registerMethod(std::string name, Method method);
  void sendEvent(std::string name, folly::dynamic params = nullptr);

  virtual std::string getDomain() = 0;
private:
  folly::dynamic handle(const std::string& method, folly::dynamic args);

  std::shared_ptr<Channel> channel_;
  std::unordered_map<std::string, Method> methods_;
};

}
}

// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include "Agent.h"

namespace facebook {
namespace react {

class InspectorAgent : public Agent {
public:
  InspectorAgent();

  void detach();
private:
  std::string getDomain() override {
    return "Inspector";
  }
};

}
}

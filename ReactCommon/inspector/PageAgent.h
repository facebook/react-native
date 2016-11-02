// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include "Agent.h"

namespace facebook {
namespace react {

class PageAgent : public Agent {
public:
  PageAgent();
private:
  std::string getDomain() override {
    return "Page";
  }
};

}
}

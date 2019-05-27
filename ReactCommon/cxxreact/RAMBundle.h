#pragma once

#include "Bundle.h"
#include "JSBigString.h"

namespace facebook {
namespace react {

class RAMBundle : public Bundle {
  public:
    struct Module {
      std::string name;
      std::string code;
    };

    RAMBundle() = default;
    RAMBundle(const RAMBundle&) = delete;
    RAMBundle& operator=(const RAMBundle&) = delete;
    virtual ~RAMBundle() {};

    virtual std::string getSourcePath() const = 0;
    virtual std::shared_ptr<const JSBigString> getStartupScript() const = 0;
    virtual Module getModule(uint32_t moduleId) const = 0;
};

} // react
} // facebook

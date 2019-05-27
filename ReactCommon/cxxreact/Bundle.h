#pragma once

#include <memory>
#include "JSBigString.h"

namespace facebook {
namespace react {

enum class BundleType : unsigned int {
  BasicBundle = 0,
  IndexedRAMBundle = 1,
  FileRAMBundle = 2,
  DeltaBundle = 3,
};

class Bundle {
  public:
    Bundle() = default;
    Bundle(const Bundle&) = delete;
    Bundle& operator=(const Bundle&) = delete;
    virtual ~Bundle() {};

    virtual std::string getSourceURL() const = 0;
    virtual BundleType getBundleType() const = 0;
};

} // react
} // facebook

#pragma once

#include <memory>
#include "Bundle.h"
#include "JSBigString.h"

namespace facebook {
namespace react {

class BasicBundle : public Bundle {
  public:
    BasicBundle(std::unique_ptr<const JSBigString> script, std::string sourceURL);

    std::string getSourceURL() const override;
    std::unique_ptr<const JSBigString> getScript() const;
    BundleType getBundleType() const override;
  private:
    std::string sourceURL_;
    std::unique_ptr<const JSBigString> script_;
};

} // react
} // facebook

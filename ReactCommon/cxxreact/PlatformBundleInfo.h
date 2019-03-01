#pragma once

#include <cxxreact/JSBigString.h>

namespace facebook { namespace react {

struct PlatformBundleInfo
{
	std::unique_ptr<const JSBigString> Bundle;
	std::string BundleUrl;
	std::string BytecodePath;
	uint64_t Version;
};

}}//namespace facebook::react
// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <stdlib.h>

#if defined(__ANDROID__)
#  include <sys/system_properties.h>
#endif

namespace facebook {
namespace build {

struct Build {
  static int getAndroidSdk() {
    static auto android_sdk = ([] {
       char sdk_version_str[PROP_VALUE_MAX];
       __system_property_get("ro.build.version.sdk", sdk_version_str);
       return atoi(sdk_version_str);
    })();
    return android_sdk;
  }
};

} // build
} // facebook

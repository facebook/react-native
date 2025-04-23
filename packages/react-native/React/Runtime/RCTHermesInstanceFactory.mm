/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTHermesInstanceFactory.h"
#import <ReactCommon/RCTHermesInstance.h>

using namespace facebook::react;

extern "C" {

JSRuntimeFactoryRef jsrt_create_hermes_factory(void)
{
  return reinterpret_cast<JSRuntimeFactoryRef>(new RCTHermesInstance(nullptr, /* allocInOldGenBeforeTTI */ false));
}

} // extern "C"

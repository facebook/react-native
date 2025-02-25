/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSampleTurboCxxModule.h"

#import <ReactCommon/SampleTurboCxxModule.h>
#import <cxxreact/CxxModule.h>
#import "SampleTurboCxxModuleLegacyImpl.h"

using namespace facebook;

@implementation RCTSampleTurboCxxModule

RCT_EXPORT_MODULE();

- (std::unique_ptr<xplat::module::CxxModule>)createModule
{
  return std::make_unique<react::SampleTurboCxxModuleLegacyImpl>();
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return nullptr;
}

@end

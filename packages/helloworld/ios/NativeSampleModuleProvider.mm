//
//  NativeSampleModuleProvider.m
//  HelloWorld
//
//  Created by Riccardo Cipolleschi on 21/02/2025.
//

#import "NativeSampleModuleProvider.h"
#import <ReactCommon/CallInvoker.h>
#import <ReactCommon/RCTTurboModuleManager.h>
#import <ReactCommon/TurboModule.h>
#import "NativeSampleModule.h"

@implementation NativeSampleModuleProvider

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeSampleModule>(params.jsInvoker);
}

@end

//
//  RCTNativeLocalStorageModuleProvider.m
//  HelloWorld
//
//  Created by Riccardo Cipolleschi on 20/07/2025.
//

#import "RCTNativeLocalStorageModuleProvider.h"
#import <NativeLocalStorageSpec/NativeLocalStorageSpec.h>
#import "HelloWorld-Swift.h"

@implementation RCTNativeLocalStorageModuleProvider

- (Class<RCTModule>)getAppleModule
{
  return [NativeLocalStorage class];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params { 
  return std::make_shared<facebook::react::NativeLocalStorageSpecJSI>(params);
}

@end

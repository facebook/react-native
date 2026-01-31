//
//  RCTReactNativeCoreModulesProvider.m
//  React-RCTAppDelegate
//
//  Created by Riccardo Cipolleschi on 10/11/2025.
//

#import "RCTReactNativeCoreModulesProvider.h"

#if !RN_DISABLE_OSS_PLUGIN_HEADER
#import <React/CoreModulesPlugins.h>
#import <RCTBlob/RCTBlobPlugins.h>
#import <React/RCTImagePlugins.h>
#import <React/RCTNetworkPlugins.h>
#import <React/RCTSettingsPlugins.h>
#import <React/RCTLinkingPlugins.h>
#import <React/RCTVibrationPlugins.h>
#import <React/RCTAnimationPlugins.h>

#endif

@implementation RCTReactNativeCoreModulesProvider

+ (Class) reactNativeCoreModuleForName:(const char *)name
{
#if !RN_DISABLE_OSS_PLUGIN_HEADER
  Class clazz = RCTCoreModulesClassProvider(name);
  if (clazz != NULL) {
    return clazz;
  }
  clazz = RCTBlobClassProvider(name);
  if (clazz != NULL) {
    return clazz;
  }
  clazz = RCTImageClassProvider(name);
  if (clazz != NULL) {
    return clazz;
  }
  clazz = RCTNetworkClassProvider(name);
  if (clazz != NULL) {
    return clazz;
  }
  clazz = RCTSettingsClassProvider(name);
  if (clazz != NULL) {
    return clazz;
  }
  clazz = RCTLinkingClassProvider(name);
  if (clazz != NULL) {
    return clazz;
  }
  clazz = RCTVibrationClassProvider(name);
  if (clazz != NULL) {
    return clazz;
  }
  clazz = RCTAnimationClassProvider(name);
  if (clazz != NULL) {
    return clazz;
  }
  
#endif

  return NULL;
}

@end

//
//  AppDelegate.m
//  RNTestApp
//
//  Created by Riccardo Cipolleschi on 29/07/2025.
//

#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <ReactAppDependencyProvider/RCTAppDependencyProvider.h>

@interface AppDelegate ()

@end

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
  // Override point for customization after application launch.
  
  self.reactNativeFactory = [[RCTReactNativeFactory alloc] initWithDelegate:self];
  self.dependencyProvider = [RCTAppDependencyProvider new];
  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  [self.reactNativeFactory startReactNativeWithModuleName:@"RNTesterApp"
                                                   inWindow:self.window
                                        initialProperties:@{}
                                              launchOptions:launchOptions];
  return YES;
}

- (NSURL *)bundleURL
{
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"js/RNTesterApp.ios"];
}

@end

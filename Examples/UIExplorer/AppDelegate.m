// Copyright 2004-present Facebook. All Rights Reserved.

#import "AppDelegate.h"

#import "RCTRootViewController.h"

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  NSURL *jsCodeLocation;

  // Loading JavaScript code - uncomment the one you want.

  // OPTION 1
  // Load from development server. Start the server from the repository root:
  //
  // $ npm start
  //
  // To run on device, change `localhost` to the IP address of your computer, and make sure your computer and
  // iOS device are on the same Wi-Fi network.
  jsCodeLocation = [NSURL URLWithString:@"http://localhost:8081/Examples/UIExplorer/UIExplorerApp.includeRequire.runModule.bundle?dev=true"];

  // OPTION 2
  // Load from pre-bundled file on disk. To re-generate the static bundle, run
  //
  // $ curl http://localhost:8081/Examples/UIExplorer/UIExplorerApp.includeRequire.runModule.bundle -o main.jsbundle
  //
  // and uncomment the next following line
  // jsCodeLocation = [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];

  RCTRootViewController *viewController = [[RCTRootViewController alloc] init];
  viewController.moduleName = @"UIExplorerApp";
  viewController.scriptURL = jsCodeLocation;

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  self.window.rootViewController = viewController;
  [self.window makeKeyAndVisible];
  return YES;
}

@end

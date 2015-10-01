/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "AppDelegate.h"

#import "RCTRootView.h"

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
    NSURL *jsCodeLocation = nil;
    
#ifdef DEBUG
    
    /**
     
     STARTING THE SERVER:
     
     From the repository root on the command line, type `npm start` (or `npm run hot` if you're using
     the babel-plugin-react-transform hot-loader) and wait for it to say the packager is ready before
     launching with one of the following options. You may also skip this and a server will be started
     automatically when you build.
     
     1. DEBUG ON SIMULATOR:
     - Leave useBundle NO (below) and optionally start the server (above).
     - Be sure Chrome is open, then run on your preferred simulator. (Set this next to XCode's run button.)
     - Chrome will prompt you to install the React Native plugin and open developer tools.
     - If using the babel-plugin-react-transform hot-loader and see a red-box error on boot-up, click 'Dimiss (ESC)'
     
     2. DEBUG ON DEVICE:
     - Open Network Utility from Spotlight and change computersWifiIP (below) your computer's WIFI IP address.
     - Leave useBundle NO (below) and optionally start the server (above) and run on your device.
     - Note that this may not work on all networks. Be sure your phone is on the same WIFI network as your computer.
     
     3. RUN STATIC BUILD ON SIM OR PHONE:
     - Before starting the server, run `react-native bundle --minify` from the repository root.
     (If you're using the hot-loader you should instead run `npm run bundle`.)
     - Set useBundle YES (below) then optionally start your server (above) and run on your target.
     
     4. CREATE ARCHIVE FOR DISTRIBUTION:
     - Do the bundling step from RUN STATIC BUILD above first.
     - You don't need to change useBundle, that is automated for archiving. (Helpful for doing CI builds.)
     - Go to Product > Archive then walk through the steps to export the build for your provisioning setup.
     */
    
    BOOL useBundle = NO;
    
    __unused NSString *computersWifiIP = @"10.0.2.46";
    
    
    // You shouldn't need to modify anything else below, except perhaps your app's main js moduleName.
    if (!useBundle)
    {
#if TARGET_IPHONE_SIMULATOR
        jsCodeLocation = [NSURL URLWithString:@"http://localhost:8080/index.ios.bundle"];
#else
        jsCodeLocation = [NSURL URLWithString:[NSString stringWithFormat:@"http://%@:8080/index.ios.bundle", computersWifiIP]];
#endif
    }
#endif
    
    if (jsCodeLocation == nil) {
        jsCodeLocation = [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
    }
    
  RCTRootView *rootView = [[RCTRootView alloc] initWithBundleURL:jsCodeLocation
                                                      moduleName:@"<%= name %>"
                                               initialProperties:nil
                                                   launchOptions:launchOptions];

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [[UIViewController alloc] init];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];
  return YES;
}

@end

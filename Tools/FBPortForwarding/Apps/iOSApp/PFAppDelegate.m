/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "PFAppDelegate.h"

#import <FBPortForwarding-iOS/FBPortForwardingServer.h>

@implementation PFAppDelegate
{
  FBPortForwardingServer *_portForwardingServer;
}

@synthesize window = window_;


- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
  CGRect rect = [[UIScreen mainScreen] bounds];

  UIView *view = [[UIView alloc] initWithFrame:rect];
  view.backgroundColor = [UIColor whiteColor];
  UIViewController *controller = [UIViewController new];
  controller.view = view;

  UIButton *button = [UIButton buttonWithType:UIButtonTypeRoundedRect];
  [button setTitle:@"Send request" forState:UIControlStateNormal];
  [button addTarget:self action:@selector(sendRequest) forControlEvents:UIControlEventTouchUpInside];
  button.frame = CGRectMake(0, 0, 200, 50);
  button.center = view.center;
  [view addSubview:button];

  self.window = [[UIWindow alloc] initWithFrame:rect];
  self.window.rootViewController = controller;
  [self.window makeKeyAndVisible];

  _portForwardingServer = [FBPortForwardingServer new];
  [_portForwardingServer forwardConnectionsFromPort:8082];
  [_portForwardingServer listenForMultiplexingChannelOnPort:8025];

  return YES;
}

- (void)sendRequest
{
  NSURLRequest *req = [[NSURLRequest alloc] initWithURL:[NSURL URLWithString:@"http://localhost:8082/404"]];
  [[[NSURLConnection alloc] initWithRequest:req delegate:self] start];
}

- (void)connection:(NSURLConnection *)connection didReceiveData:(NSData *)data
{
  NSString *content = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
  NSLog(@"Success: %@", content);
}

- (void)connection:(NSURLConnection *)connection didFailWithError:(NSError *)error
{
  NSLog(@"Error: %@", error);
}

@end

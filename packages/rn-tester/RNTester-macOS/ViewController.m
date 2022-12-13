//
//  ViewController.m
//  RNTester-macOS
//
//  Created by Jeff Cruikshank on 6/5/17.
//  Copyright © 2017 Facebook. All rights reserved.
//

#import "ViewController.h"
#import "AppDelegate.h"

#import <React/RCTRootView.h>

@implementation ViewController

- (void)viewDidLoad
{
  [super viewDidLoad];

  RCTBridge *bridge = ((AppDelegate *)[NSApp delegate]).bridge;
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge moduleName:kBundleNameJS initialProperties:nil];

  [self.view addSubview:rootView];
  rootView.backgroundColor = [NSColor windowBackgroundColor];
  rootView.frame = self.view.bounds;
  rootView.autoresizingMask =
      (NSViewMinXMargin | NSViewMaxXMargin | NSViewMinYMargin | NSViewMaxYMargin | NSViewWidthSizable |
       NSViewHeightSizable);
}

@end

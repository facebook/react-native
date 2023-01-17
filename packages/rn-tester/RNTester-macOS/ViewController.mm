//
//  ViewController.mm
//  RNTester-macOS
//
//  Created by Jeff Cruikshank on 6/5/17.
//  Copyright © 2017 Facebook. All rights reserved.
//

#import "ViewController.h"
#import "AppDelegate.h"

#ifdef RN_FABRIC_ENABLED
#import <React/RCTFabricSurfaceHostingProxyRootView.h>
#import <React/RCTSurfacePresenter.h>
#import <React/RCTSurfacePresenterBridgeAdapter.h>
#import <react/config/ReactNativeConfig.h>
#endif
#import <React/RCTRootView.h>

@interface ViewController () {
#ifdef RN_FABRIC_ENABLED
  RCTSurfacePresenterBridgeAdapter *_bridgeAdapter;
  std::shared_ptr<const facebook::react::ReactNativeConfig> _reactNativeConfig;
  facebook::react::ContextContainer::Shared _contextContainer;
#endif
}
@end

@implementation ViewController

- (void)viewDidLoad
{
  [super viewDidLoad];

  RCTBridge *bridge = ((AppDelegate *)[NSApp delegate]).bridge;

#ifdef RN_FABRIC_ENABLED
  _reactNativeConfig = std::make_shared<facebook::react::EmptyReactNativeConfig const>();
  _contextContainer = std::make_shared<facebook::react::ContextContainer const>();
  _contextContainer->insert("ReactNativeConfig", _reactNativeConfig);
  _bridgeAdapter = [[RCTSurfacePresenterBridgeAdapter alloc] initWithBridge:bridge contextContainer:_contextContainer];
  bridge.surfacePresenter = _bridgeAdapter.surfacePresenter;

  RCTUIView *rootView = [[RCTFabricSurfaceHostingProxyRootView alloc] initWithBridge:bridge
                                                                       moduleName:kBundleNameJS
                                                                   initialProperties:@{}];
#else
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge moduleName:kBundleNameJS initialProperties:nil];
#endif
  [self.view addSubview:rootView];
  rootView.backgroundColor = [NSColor windowBackgroundColor];
  rootView.frame = self.view.bounds;
  rootView.autoresizingMask =
      (NSViewMinXMargin | NSViewMaxXMargin | NSViewMinYMargin | NSViewMaxYMargin | NSViewWidthSizable |
       NSViewHeightSizable);
}

@end

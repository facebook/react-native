/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTWebViewManager.h"

#import "RCTBridge.h"
#import "RCTSparseArray.h"
#import "RCTUIManager.h"
#import "RCTWebView.h"

@implementation RCTWebViewManager

- (UIView *)view
{
  return [[RCTWebView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

RCT_REMAP_VIEW_PROPERTY(url, URL, NSURL);
RCT_REMAP_VIEW_PROPERTY(html, HTML, NSString);
RCT_EXPORT_VIEW_PROPERTY(contentInset, UIEdgeInsets);
RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustContentInsets, BOOL);
RCT_EXPORT_VIEW_PROPERTY(shouldInjectAJAXHandler, BOOL);

- (NSDictionary *)constantsToExport
{
  return @{
    @"NavigationType": @{
      @"LinkClicked": @(UIWebViewNavigationTypeLinkClicked),
      @"FormSubmitted": @(UIWebViewNavigationTypeFormSubmitted),
      @"BackForward": @(UIWebViewNavigationTypeBackForward),
      @"Reload": @(UIWebViewNavigationTypeReload),
      @"FormResubmitted": @(UIWebViewNavigationTypeFormResubmitted),
      @"Other": @(UIWebViewNavigationTypeOther)
    },
  };
}

- (void)goBack:(NSNumber *)reactTag
{
  RCT_EXPORT();

  [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
    RCTWebView *view = viewRegistry[reactTag];
    if (![view isKindOfClass:[RCTWebView class]]) {
      RCTLogError(@"Invalid view returned from registry, expecting RKWebView, got: %@", view);
    }
    [view goBack];
  }];
}

- (void)goForward:(NSNumber *)reactTag
{
  RCT_EXPORT();

  [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
    id view = viewRegistry[reactTag];
    if (![view isKindOfClass:[RCTWebView class]]) {
      RCTLogError(@"Invalid view returned from registry, expecting RKWebView, got: %@", view);
    }
    [view goForward];
  }];
}


- (void)reload:(NSNumber *)reactTag
{
  RCT_EXPORT();

  [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
    RCTWebView *view = viewRegistry[reactTag];
    if (![view isKindOfClass:[RCTWebView class]]) {
      RCTLogMustFix(@"Invalid view returned from registry, expecting RKWebView, got: %@", view);
    }
    [view reload];
  }];
}

@end

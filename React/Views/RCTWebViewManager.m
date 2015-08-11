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

RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[RCTWebView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

RCT_REMAP_VIEW_PROPERTY(url, URL, NSURL);
RCT_REMAP_VIEW_PROPERTY(html, HTML, NSString);
RCT_REMAP_VIEW_PROPERTY(bounces, _webView.scrollView.bounces, BOOL);
RCT_REMAP_VIEW_PROPERTY(scrollEnabled, _webView.scrollView.scrollEnabled, BOOL);
RCT_REMAP_VIEW_PROPERTY(scalesPageToFit, _webView.scalesPageToFit, BOOL);
RCT_EXPORT_VIEW_PROPERTY(injectedJavaScript, NSString);
RCT_EXPORT_VIEW_PROPERTY(contentInset, UIEdgeInsets);
RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustContentInsets, BOOL);

- (NSArray *)customDirectEventTypes
{
  return @[
    @"loadingStart",
    @"loadingFinish",
    @"loadingError",
  ];
}

- (NSDictionary *)constantsToExport
{
  return @{
    @"JSNavigationScheme": RCTJSNavigationScheme,
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

RCT_EXPORT_METHOD(goBack:(nonnull NSNumber *)reactTag)
{
  [self.bridge.uiManager addUIBlock:^(__unused RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
    RCTWebView *view = viewRegistry[reactTag];
    if (![view isKindOfClass:[RCTWebView class]]) {
      RCTLogError(@"Invalid view returned from registry, expecting RCTWebView, got: %@", view);
    } else {
      [view goBack];
    }
  }];
}

RCT_EXPORT_METHOD(goForward:(nonnull NSNumber *)reactTag)
{
  [self.bridge.uiManager addUIBlock:^(__unused RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
    id view = viewRegistry[reactTag];
    if (![view isKindOfClass:[RCTWebView class]]) {
      RCTLogError(@"Invalid view returned from registry, expecting RCTWebView, got: %@", view);
    } else {
      [view goForward];
    }
  }];
}


RCT_EXPORT_METHOD(reload:(nonnull NSNumber *)reactTag)
{
  [self.bridge.uiManager addUIBlock:^(__unused RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
    RCTWebView *view = viewRegistry[reactTag];
    if (![view isKindOfClass:[RCTWebView class]]) {
      RCTLogError(@"Invalid view returned from registry, expecting RCTWebView, got: %@", view);
    } else {
      [view reload];
    }
  }];
}

@end

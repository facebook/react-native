/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/**
 * userContentController.addScriptMessageHandler will keep a reference to the handler (self)
 * which causes a retain cycle. This can be avoided by passing it a weak rererence.
 * http://stackoverflow.com/questions/26383031/wkwebview-causes-my-view-controller-to-leak
 */

#import <WebKit/WebKit.h>

@interface RCTWeakScriptMessageDelegate : NSObject<WKScriptMessageHandler>

@property (nonatomic, weak) id<WKScriptMessageHandler> scriptDelegate;

- (instancetype)initWithDelegate:(id<WKScriptMessageHandler>)scriptDelegate;

@end

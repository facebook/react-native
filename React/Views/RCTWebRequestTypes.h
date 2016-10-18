/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/**
 * Component WebView implementations will have specially defined behaviour when
 * certain constants appear in the request.
 */

/**
 * Special scheme used to pass messages to the injectedJavaScript
 * code without triggering a page load. Usage:
 *
 *   window.location.href = RCTJSNavigationScheme + '://hello'
 */
NSString static *const RCTJSNavigationScheme = @"react-js-navigation";

NSString static *const RCTJSPostMessageHost = @"postMessage";

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTInspectorDevServerHelper.h>

#if RCT_DEV || RCT_REMOTE_PROFILE

#import <React/RCTLog.h>
#import <UIKit/UIKit.h>

#import <React/RCTDefines.h>
#import <React/RCTInspectorPackagerConnection.h>

static NSString *const kDebuggerMsgDisable = @"{ \"id\":1,\"method\":\"Debugger.disable\" }";

static NSString *getServerHost(NSURL *bundleURL)
{
  NSNumber *port = @8081;
  NSString *portStr = [[[NSProcessInfo processInfo] environment] objectForKey:@"RCT_METRO_PORT"];
  if (portStr && [portStr length] > 0) {
    port = [NSNumber numberWithInt:[portStr intValue]];
  }
  if ([bundleURL port]) {
    port = [bundleURL port];
  }
  NSString *host = [bundleURL host];
  if (!host) {
    host = @"localhost";
  }

  // this is consistent with the Android implementation, where http:// is the
  // hardcoded implicit scheme for the debug server. Note, packagerURL
  // technically looks like it could handle schemes/protocols other than HTTP,
  // so rather than force HTTP, leave it be for now, in case someone is relying
  // on that ability when developing against iOS.
  return [NSString stringWithFormat:@"%@:%@", host, port];
}

static NSURL *getInspectorDeviceUrl(NSURL *bundleURL)
{
  NSString *escapedDeviceName = [[[UIDevice currentDevice] name]
      stringByAddingPercentEncodingWithAllowedCharacters:NSCharacterSet.URLQueryAllowedCharacterSet];
  NSString *escapedAppName = [[[NSBundle mainBundle] bundleIdentifier]
      stringByAddingPercentEncodingWithAllowedCharacters:NSCharacterSet.URLQueryAllowedCharacterSet];
  return [NSURL URLWithString:[NSString stringWithFormat:@"http://%@/inspector/device?name=%@&app=%@",
                                                         getServerHost(bundleURL),
                                                         escapedDeviceName,
                                                         escapedAppName]];
}
static NSURL *getOpenUrlEndpoint(NSURL *bundleURL)
{
  return [NSURL URLWithString:[NSString stringWithFormat:@"http://%@/open-url", getServerHost(bundleURL)]];
}
@implementation RCTInspectorDevServerHelper

RCT_NOT_IMPLEMENTED(-(instancetype)init)

static NSMutableDictionary<NSString *, RCTInspectorPackagerConnection *> *socketConnections = nil;

static void sendEventToAllConnections(NSString *event)
{
  for (NSString *socketId in socketConnections) {
    [socketConnections[socketId] sendEventToAllConnections:event];
  }
}

+ (void)openURL:(NSString *)url withBundleURL:(NSURL *)bundleURL withErrorMessage:(NSString *)errorMessage
{
  NSURL *endpoint = getOpenUrlEndpoint(bundleURL);

  NSDictionary *jsonBodyDict = @{@"url" : url};
  NSData *jsonBodyData = [NSJSONSerialization dataWithJSONObject:jsonBodyDict options:kNilOptions error:nil];

  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:endpoint];
  [request setHTTPMethod:@"POST"];
  [request setHTTPBody:jsonBodyData];

  [[[NSURLSession sharedSession]
      dataTaskWithRequest:request
        completionHandler:^(
            __unused NSData *_Nullable data, __unused NSURLResponse *_Nullable response, NSError *_Nullable error) {
          if (error != nullptr) {
            RCTLogWarn(@"%@", errorMessage);
          }
        }] resume];
}

+ (void)disableDebugger
{
  sendEventToAllConnections(kDebuggerMsgDisable);
}

+ (RCTInspectorPackagerConnection *)connectWithBundleURL:(NSURL *)bundleURL
{
  NSURL *inspectorURL = getInspectorDeviceUrl(bundleURL);

  // Note, using a static dictionary isn't really the greatest design, but
  // the packager connection does the same thing, so it's at least consistent.
  // This is a static map that holds different inspector clients per the inspectorURL
  if (socketConnections == nil) {
    socketConnections = [NSMutableDictionary new];
  }

  NSString *key = [inspectorURL absoluteString];
  RCTInspectorPackagerConnection *connection = socketConnections[key];
  if (!connection || !connection.isConnected) {
    connection = [[RCTInspectorPackagerConnection alloc] initWithURL:inspectorURL];
    socketConnections[key] = connection;
    [connection connect];
  }

  return connection;
}

@end

#endif

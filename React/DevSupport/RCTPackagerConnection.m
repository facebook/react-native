/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTPackagerConnection.h"

#import <objc/runtime.h>

#import <React/RCTAssert.h>
#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTConvert.h>
#import <React/RCTDefines.h>
#import <React/RCTLog.h>
#import <React/RCTReconnectingWebSocket.h>
#import <React/RCTSRWebSocket.h>
#import <React/RCTUtils.h>

#import "RCTPackagerConnectionBridgeConfig.h"
#import "RCTReloadPackagerMethod.h"
#import "RCTSamplingProfilerPackagerMethod.h"

#if RCT_DEV

static dispatch_queue_t RCTPackagerConnectionQueue()
{
  static dispatch_queue_t queue;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    queue = dispatch_queue_create("com.facebook.RCTPackagerConnectionQueue", DISPATCH_QUEUE_SERIAL);
  });
  return queue;
};

@interface RCTPackagerConnection () <RCTWebSocketProtocolDelegate>
@end

@implementation RCTPackagerConnection {
  NSURL *_packagerURL;
  RCTReconnectingWebSocket *_socket;
  NSMutableDictionary<NSString *, id<RCTPackagerClientMethod>> *_handlers;
}

+ (void)checkDefaultConnectionWithCallback:(void (^)(BOOL isRunning))callback
                                     queue:(dispatch_queue_t)queue
{
  RCTBundleURLProvider *const settings = [RCTBundleURLProvider sharedSettings];
  NSURLComponents *components = [NSURLComponents new];
  components.scheme = @"http";
  components.host = settings.jsLocation ?: @"localhost";
  components.port = @(kRCTBundleURLProviderDefaultPort);
  components.path = @"/status";
  [NSURLConnection sendAsynchronousRequest:[NSURLRequest requestWithURL:components.URL]
                                     queue:[NSOperationQueue mainQueue]
                         completionHandler:^(NSURLResponse *response, NSData *data, NSError *connectionError) {
                           NSString *const status = data != nil
                             ? [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding]
                             : nil;
                           BOOL isRunning = [status isEqualToString:@"packager-status:running"];

                           dispatch_async(queue, ^{
                             callback(isRunning);
                           });
                         }];
}

+ (instancetype)connectionForBridge:(RCTBridge *)bridge
{
  RCTPackagerConnectionBridgeConfig *config = [[RCTPackagerConnectionBridgeConfig alloc] initWithBridge:bridge];
  return [[[self class] alloc] initWithConfig:config];
}

- (instancetype)initWithConfig:(id<RCTPackagerConnectionConfig>)config
{
  if (self = [super init]) {
    _packagerURL = [config packagerURL];
    _handlers = [[config defaultPackagerMethods] mutableCopy];
    [self connect];
  }
  return self;
}

- (void)connect
{
  RCTAssertMainQueue();

  NSURL *url = _packagerURL;
  if (!url) {
    return;
  }

  // The jsPackagerClient is a static map that holds different packager clients per the packagerURL
  // In case many instances of DevMenu are created, the latest instance that use the same URL as
  // previous instances will override given packager client's method handlers
  static NSMutableDictionary<NSString *, RCTReconnectingWebSocket *> *socketConnections = nil;
  if (socketConnections == nil) {
    socketConnections = [NSMutableDictionary new];
  }

  NSString *key = [url absoluteString];
  _socket = socketConnections[key];
  if (!_socket) {
    _socket = [[RCTReconnectingWebSocket alloc] initWithURL:url];
    _socket.delegateDispatchQueue = RCTPackagerConnectionQueue();
    [_socket start];
    socketConnections[key] = _socket;
  }

  _socket.delegate = self;
}

- (void)stop
{
  [_socket stop];
}


- (void)addHandler:(id<RCTPackagerClientMethod>)handler forMethod:(NSString *)name
{
  @synchronized(self) {
    _handlers[name] = handler;
  }
}

- (id<RCTPackagerClientMethod>)handlerForMethod:(NSString *)name
{
  @synchronized(self) {
    return _handlers[name];
  }
}

static BOOL isSupportedVersion(NSNumber *version)
{
  NSArray<NSNumber *> *const kSupportedVersions = @[ @(RCT_PACKAGER_CLIENT_PROTOCOL_VERSION) ];
  return [kSupportedVersions containsObject:version];
}

#pragma mark - RCTWebSocketProtocolDelegate

- (void)webSocket:(RCTSRWebSocket *)webSocket didReceiveMessage:(id)message
{
  NSError *error = nil;
  NSDictionary<NSString *, id> *msg = RCTJSONParse(message, &error);

  if (error) {
    RCTLogError(@"%@ failed to parse message with error %@\n<message>\n%@\n</message>", [self class], error, msg);
    return;
  }

  if (!isSupportedVersion(msg[@"version"])) {
    RCTLogError(@"%@ received message with not supported version %@", [self class], msg[@"version"]);
    return;
  }

  id<RCTPackagerClientMethod> methodHandler = [self handlerForMethod:msg[@"method"]];
  if (!methodHandler) {
    if (msg[@"id"]) {
      NSString *errorMsg = [NSString stringWithFormat:@"%@ no handler found for method %@", [self class], msg[@"method"]];
      RCTLogError(errorMsg, msg[@"method"]);
      [[[RCTPackagerClientResponder alloc] initWithId:msg[@"id"]
                                               socket:webSocket] respondWithError:errorMsg];
    }
    return; // If it was a broadcast then we ignore it gracefully
  }

  dispatch_queue_t methodQueue = [methodHandler respondsToSelector:@selector(methodQueue)]
    ? [methodHandler methodQueue]
    : dispatch_get_main_queue();

  dispatch_async(methodQueue, ^{
    if (msg[@"id"]) {
      [methodHandler handleRequest:msg[@"params"]
                     withResponder:[[RCTPackagerClientResponder alloc] initWithId:msg[@"id"]
                                                                           socket:webSocket]];
    } else {
      [methodHandler handleNotification:msg[@"params"]];
    }
  });
}

- (void)webSocketDidOpen:(RCTSRWebSocket *)webSocket
{
}

- (void)webSocket:(RCTSRWebSocket *)webSocket didCloseWithCode:(NSInteger)code reason:(NSString *)reason wasClean:(BOOL)wasClean
{
}

@end

#endif

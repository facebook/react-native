/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTWebSocketModule.h>

#import <objc/runtime.h>

#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import <React/RCTConvert.h>
#import <React/RCTUtils.h>
#import <SocketRocket/SRWebSocket.h>

#import "CoreModulesPlugins.h"

@implementation SRWebSocket (React)

- (NSNumber *)reactTag
{
  return objc_getAssociatedObject(self, _cmd);
}

- (void)setReactTag:(NSNumber *)reactTag
{
  objc_setAssociatedObject(self, @selector(reactTag), reactTag, OBJC_ASSOCIATION_COPY_NONATOMIC);
}

@end

@interface RCTWebSocketModule () <SRWebSocketDelegate, NativeWebSocketModuleSpec>

@end

@implementation RCTWebSocketModule {
  NSMutableDictionary<NSNumber *, SRWebSocket *> *_sockets;
  NSMutableDictionary<NSNumber *, id<RCTWebSocketContentHandler>> *_contentHandlers;
}

RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (NSArray *)supportedEvents
{
  return @[ @"websocketMessage", @"websocketOpen", @"websocketFailed", @"websocketClosed" ];
}

- (void)invalidate
{
  [super invalidate];

  _contentHandlers = nil;
  for (SRWebSocket *socket in _sockets.allValues) {
    socket.delegate = nil;
    [socket close];
  }
}

RCT_EXPORT_METHOD(connect
                  : (NSURL *)URL protocols
                  : (NSArray *)protocols options
                  : (JS::NativeWebSocketModule::SpecConnectOptions &)options socketID
                  : (double)socketID)
{
  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:URL];

  // We load cookies from sharedHTTPCookieStorage (shared with XHR and
  // fetch). To get secure cookies for wss URLs, replace wss with https
  // in the URL.
  NSURLComponents *components = [NSURLComponents componentsWithURL:URL resolvingAgainstBaseURL:true];
  if ([components.scheme.lowercaseString isEqualToString:@"wss"]) {
    components.scheme = @"https";
  }

  // Load and set the cookie header.
  NSArray<NSHTTPCookie *> *cookies = [[NSHTTPCookieStorage sharedHTTPCookieStorage] cookiesForURL:components.URL];
  request.allHTTPHeaderFields = [NSHTTPCookie requestHeaderFieldsWithCookies:cookies];

  // Load supplied headers
  if ([options.headers() isKindOfClass:NSDictionary.class]) {
    NSDictionary *headers = (NSDictionary *)options.headers();
    [headers enumerateKeysAndObjectsUsingBlock:^(NSString *key, id value, BOOL *stop) {
      if (![value isKindOfClass:[NSNull class]]) {
        [request addValue:[RCTConvert NSString:value] forHTTPHeaderField:key];
      }
    }];
  }

  SRWebSocket *webSocket = [[SRWebSocket alloc] initWithURLRequest:request protocols:protocols];
  [webSocket setDelegateDispatchQueue:[self methodQueue]];
  webSocket.delegate = self;
  webSocket.reactTag = @(socketID);
  if (!_sockets) {
    _sockets = [NSMutableDictionary new];
  }
  _sockets[@(socketID)] = webSocket;
  [webSocket open];
}

RCT_EXPORT_METHOD(send : (NSString *)message forSocketID : (double)socketID)
{
  [_sockets[@(socketID)] sendString:message error:nil];
}

RCT_EXPORT_METHOD(sendBinary : (NSString *)base64String forSocketID : (double)socketID)
{
  [self sendData:[[NSData alloc] initWithBase64EncodedString:base64String options:0] forSocketID:@(socketID)];
}

- (void)sendData:(NSData *)data forSocketID:(NSNumber *__nonnull)socketID
{
  [_sockets[socketID] sendData:data error:nil];
}

RCT_EXPORT_METHOD(ping : (double)socketID)
{
  [_sockets[@(socketID)] sendPing:nil error:nil];
}

RCT_EXPORT_METHOD(close : (double)code reason : (NSString *)reason socketID : (double)socketID)
{
  [_sockets[@(socketID)] closeWithCode:code reason:reason];
  [_sockets removeObjectForKey:@(socketID)];
}

- (void)setContentHandler:(id<RCTWebSocketContentHandler>)handler forSocketID:(NSString *)socketID
{
  if (!_contentHandlers) {
    _contentHandlers = [NSMutableDictionary new];
  }
  _contentHandlers[socketID] = handler;
}

#pragma mark - RCTSRWebSocketDelegate methods

- (void)webSocket:(SRWebSocket *)webSocket didReceiveMessage:(id)message
{
  NSString *type;

  NSNumber *socketID = [webSocket reactTag];
  id contentHandler = _contentHandlers[socketID];
  if (contentHandler) {
    message = [contentHandler processWebsocketMessage:message forSocketID:socketID withType:&type];
  } else {
    if ([message isKindOfClass:[NSData class]]) {
      type = @"binary";
      message = [message base64EncodedStringWithOptions:0];
    } else {
      type = @"text";
    }
  }

  [self sendEventWithName:@"websocketMessage" body:@{@"data" : message, @"type" : type, @"id" : webSocket.reactTag}];
}

- (void)webSocketDidOpen:(SRWebSocket *)webSocket
{
  [self sendEventWithName:@"websocketOpen"
                     body:@{@"id" : webSocket.reactTag, @"protocol" : webSocket.protocol ? webSocket.protocol : @""}];
}

- (void)webSocket:(SRWebSocket *)webSocket didFailWithError:(NSError *)error
{
  NSNumber *socketID = [webSocket reactTag];
  _contentHandlers[socketID] = nil;
  _sockets[socketID] = nil;
  NSDictionary *body =
      @{@"message" : error.localizedDescription ?: @"Undefined, error is nil", @"id" : socketID ?: @(-1)};
  [self sendEventWithName:@"websocketFailed" body:body];
}

- (void)webSocket:(SRWebSocket *)webSocket
    didCloseWithCode:(NSInteger)code
              reason:(NSString *)reason
            wasClean:(BOOL)wasClean
{
  NSNumber *socketID = [webSocket reactTag];
  _contentHandlers[socketID] = nil;
  _sockets[socketID] = nil;
  [self sendEventWithName:@"websocketClosed"
                     body:@{
                       @"code" : @(code),
                       @"reason" : RCTNullIfNil(reason),
                       @"clean" : @(wasClean),
                       @"id" : socketID
                     }];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeWebSocketModuleSpecJSI>(params);
}

@end

@implementation RCTBridge (RCTWebSocketModule)

- (RCTWebSocketModule *)webSocketModule
{
  return [self moduleForClass:[RCTWebSocketModule class]];
}

@end

@implementation RCTBridgeProxy (RCTWebSocketModule)

- (RCTWebSocketModule *)webSocketModule
{
  return [self moduleForClass:[RCTWebSocketModule class]];
}

@end

Class RCTWebSocketModuleCls(void)
{
  return RCTWebSocketModule.class;
}

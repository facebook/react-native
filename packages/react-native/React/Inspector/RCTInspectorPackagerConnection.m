/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTInspectorPackagerConnection.h>

#if RCT_DEV || RCT_REMOTE_PROFILE

#import <React/RCTDefines.h>
#import <React/RCTInspector.h>
#import <React/RCTLog.h>
#import <React/RCTSRWebSocket.h>
#import <React/RCTUtils.h>

// This is a port of the Android impl, at
// ReactAndroid/src/main/java/com/facebook/react/devsupport/InspectorPackagerConnection.java
// please keep consistent :)

const int RECONNECT_DELAY_MS = 2000;

@implementation RCTBundleStatus
@end

@interface RCTInspectorPackagerConnection () <RCTSRWebSocketDelegate> {
  NSURL *_url;
  NSMutableDictionary<NSString *, RCTInspectorLocalConnection *> *_inspectorConnections;
  RCTSRWebSocket *_webSocket;
  dispatch_queue_t _jsQueue;
  BOOL _closed;
  BOOL _suppressConnectionErrors;
  RCTBundleStatusProvider _bundleStatusProvider;
}
@end

@interface RCTInspectorRemoteConnection () {
  __weak RCTInspectorPackagerConnection *_owningPackagerConnection;
  NSString *_pageId;
}
- (instancetype)initWithPackagerConnection:(RCTInspectorPackagerConnection *)owningPackagerConnection
                                    pageId:(NSString *)pageId;
@end

static NSDictionary<NSString *, id> *makePageIdPayload(NSString *pageId)
{
  return @{@"pageId" : pageId};
}

@implementation RCTInspectorPackagerConnection

RCT_NOT_IMPLEMENTED(-(instancetype)init)

- (instancetype)initWithURL:(NSURL *)url
{
  if (self = [super init]) {
    _url = url;
    _inspectorConnections = [NSMutableDictionary new];
    _jsQueue = dispatch_queue_create("com.facebook.react.WebSocketExecutor", DISPATCH_QUEUE_SERIAL);
  }
  return self;
}

- (void)setBundleStatusProvider:(RCTBundleStatusProvider)bundleStatusProvider
{
  _bundleStatusProvider = bundleStatusProvider;
}

- (void)handleProxyMessage:(NSDictionary<NSString *, id> *)message
{
  NSString *event = message[@"event"];
  NSDictionary *payload = message[@"payload"];
  if ([@"getPages" isEqualToString:event]) {
    [self sendEvent:event payload:[self pages]];
  } else if ([@"wrappedEvent" isEqualToString:event]) {
    [self handleWrappedEvent:payload];
  } else if ([@"connect" isEqualToString:event]) {
    [self handleConnect:payload];
  } else if ([@"disconnect" isEqualToString:event]) {
    [self handleDisconnect:payload];
  } else {
    RCTLogError(@"Unknown event: %@", event);
  }
}

- (void)sendEventToAllConnections:(NSString *)event
{
  for (NSString *pageId in _inspectorConnections) {
    [_inspectorConnections[pageId] sendMessage:event];
  }
}

- (void)closeAllConnections
{
  for (NSString *pageId in _inspectorConnections) {
    [[_inspectorConnections objectForKey:pageId] disconnect];
  }
  [_inspectorConnections removeAllObjects];
}

- (void)handleConnect:(NSDictionary *)payload
{
  NSString *pageId = payload[@"pageId"];
  RCTInspectorLocalConnection *existingConnection = _inspectorConnections[pageId];
  if (existingConnection) {
    [_inspectorConnections removeObjectForKey:pageId];
    [existingConnection disconnect];
    RCTLogWarn(@"Already connected: %@", pageId);
    return;
  }

  RCTInspectorRemoteConnection *remoteConnection =
      [[RCTInspectorRemoteConnection alloc] initWithPackagerConnection:self pageId:pageId];

  RCTInspectorLocalConnection *inspectorConnection = [RCTInspector connectPage:[pageId integerValue]
                                                           forRemoteConnection:remoteConnection];
  _inspectorConnections[pageId] = inspectorConnection;
}

- (void)handleDisconnect:(NSDictionary *)payload
{
  NSString *pageId = payload[@"pageId"];
  RCTInspectorLocalConnection *inspectorConnection = _inspectorConnections[pageId];
  if (inspectorConnection) {
    [self removeConnectionForPage:pageId];
    [inspectorConnection disconnect];
  }
}

- (void)removeConnectionForPage:(NSString *)pageId
{
  [_inspectorConnections removeObjectForKey:pageId];
}

- (void)handleWrappedEvent:(NSDictionary *)payload
{
  NSString *pageId = payload[@"pageId"];
  NSString *wrappedEvent = payload[@"wrappedEvent"];
  RCTInspectorLocalConnection *inspectorConnection = _inspectorConnections[pageId];
  if (!inspectorConnection) {
    RCTLogWarn(@"Not connected to page: %@ , failed trying to handle event: %@", pageId, wrappedEvent);
    return;
  }
  [inspectorConnection sendMessage:wrappedEvent];
}

- (NSArray *)pages
{
  NSArray<RCTInspectorPage *> *pages = [RCTInspector pages];
  NSMutableArray *array = [NSMutableArray arrayWithCapacity:pages.count];

  RCTBundleStatusProvider statusProvider = _bundleStatusProvider;
  RCTBundleStatus *bundleStatus = statusProvider == nil ? nil : statusProvider();

  for (RCTInspectorPage *page in pages) {
    NSDictionary *jsonPage = @{
      @"id" : [@(page.id) stringValue],
      @"title" : page.title,
      @"app" : [[NSBundle mainBundle] bundleIdentifier],
      @"vm" : page.vm,
      @"isLastBundleDownloadSuccess" : bundleStatus == nil ? [NSNull null]
                                                           : @(bundleStatus.isLastBundleDownloadSuccess),
      @"bundleUpdateTimestamp" : bundleStatus == nil ? [NSNull null]
                                                     : @((long)bundleStatus.bundleUpdateTimestamp * 1000),
    };
    [array addObject:jsonPage];
  }
  return array;
}

- (void)sendWrappedEvent:(NSString *)pageId message:(NSString *)message
{
  NSDictionary *payload = @{
    @"pageId" : pageId,
    @"wrappedEvent" : message,
  };
  [self sendEvent:@"wrappedEvent" payload:payload];
}

- (void)sendEvent:(NSString *)name payload:(id)payload
{
  NSDictionary *jsonMessage = @{
    @"event" : name,
    @"payload" : payload,
  };
  [self sendToPackager:jsonMessage];
}

// analogous to InspectorPackagerConnection.Connection.onFailure(...)
- (void)webSocket:(__unused RCTSRWebSocket *)webSocket didFailWithError:(NSError *)error
{
  if (_webSocket) {
    [self abort:@"Websocket exception" withCause:error];
  }
  if (!_closed && [error code] != ECONNREFUSED) {
    [self reconnect];
  }
}

// analogous to InspectorPackagerConnection.Connection.onMessage(...)
- (void)webSocket:(__unused RCTSRWebSocket *)webSocket didReceiveMessage:(id)opaqueMessage
{
  // warn but don't die on unrecognized messages
  if (![opaqueMessage isKindOfClass:[NSString class]]) {
    RCTLogWarn(@"Unrecognized inspector message, object is of type: %@", [opaqueMessage class]);
    return;
  }

  NSString *messageText = opaqueMessage;
  NSError *error = nil;
  id parsedJSON = RCTJSONParse(messageText, &error);
  if (error) {
    RCTLogWarn(@"Unrecognized inspector message, string was not valid JSON: %@", messageText);
    return;
  }

  [self handleProxyMessage:parsedJSON];
}

// analogous to InspectorPackagerConnection.Connection.onClosed(...)
- (void)webSocket:(__unused RCTSRWebSocket *)webSocket
    didCloseWithCode:(__unused NSInteger)code
              reason:(__unused NSString *)reason
            wasClean:(__unused BOOL)wasClean
{
  _webSocket = nil;
  [self closeAllConnections];
  if (!_closed) {
    [self reconnect];
  }
}

- (bool)isConnected
{
  return _webSocket != nil;
}

- (void)connect
{
  if (_closed) {
    RCTLogError(@"Illegal state: Can't connect after having previously been closed.");
    return;
  }

  // The corresponding android code has a lot of custom config options for
  // timeouts, but it appears the iOS RCTSRWebSocket API doesn't have the same
  // implemented options.
  _webSocket = [[RCTSRWebSocket alloc] initWithURL:_url];
  [_webSocket setDelegateDispatchQueue:_jsQueue];
  _webSocket.delegate = self;
  [_webSocket open];
}

- (void)reconnect
{
  if (_closed) {
    RCTLogError(@"Illegal state: Can't reconnect after having previously been closed.");
    return;
  }

  if (_suppressConnectionErrors) {
    RCTLogWarn(@"Couldn't connect to packager, will silently retry");
    _suppressConnectionErrors = true;
  }

  __weak RCTInspectorPackagerConnection *weakSelf = self;
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, RECONNECT_DELAY_MS * NSEC_PER_MSEC), dispatch_get_main_queue(), ^{
    RCTInspectorPackagerConnection *strongSelf = weakSelf;
    if (strongSelf && !strongSelf->_closed) {
      [strongSelf connect];
    }
  });
}

- (void)closeQuietly
{
  _closed = true;
  [self disposeWebSocket];
}

- (void)sendToPackager:(NSDictionary *)messageObject
{
  __weak RCTInspectorPackagerConnection *weakSelf = self;
  dispatch_async(_jsQueue, ^{
    RCTInspectorPackagerConnection *strongSelf = weakSelf;
    if (strongSelf && !strongSelf->_closed) {
      NSError *error;
      NSString *messageText = RCTJSONStringify(messageObject, &error);
      if (error) {
        RCTLogWarn(@"Couldn't send event to packager: %@", error);
      } else {
        [strongSelf->_webSocket send:messageText];
      }
    }
  });
}

- (void)abort:(NSString *)message withCause:(NSError *)cause
{
  // Don't log ECONNREFUSED at all; it's expected in cases where the server isn't listening.
  if (![cause.domain isEqual:NSPOSIXErrorDomain] || cause.code != ECONNREFUSED) {
    RCTLogInfo(@"Error occurred, shutting down websocket connection: %@ %@", message, cause);
  }

  [self closeAllConnections];
  [self disposeWebSocket];
}

- (void)disposeWebSocket
{
  if (_webSocket) {
    [_webSocket closeWithCode:1000 reason:@"End of session"];
    _webSocket.delegate = nil;
    _webSocket = nil;
  }
}

@end

@implementation RCTInspectorRemoteConnection

RCT_NOT_IMPLEMENTED(-(instancetype)init)

- (instancetype)initWithPackagerConnection:(RCTInspectorPackagerConnection *)owningPackagerConnection
                                    pageId:(NSString *)pageId
{
  if (self = [super init]) {
    _owningPackagerConnection = owningPackagerConnection;
    _pageId = pageId;
  }
  return self;
}

- (void)onMessage:(NSString *)message
{
  [_owningPackagerConnection sendWrappedEvent:_pageId message:message];
}

- (void)onDisconnect
{
  RCTInspectorPackagerConnection *owningPackagerConnectionStrong = _owningPackagerConnection;
  if (owningPackagerConnectionStrong) {
    [owningPackagerConnectionStrong removeConnectionForPage:_pageId];
    [owningPackagerConnectionStrong sendEvent:@"disconnect" payload:makePageIdPayload(_pageId)];
  }
}

@end

#endif

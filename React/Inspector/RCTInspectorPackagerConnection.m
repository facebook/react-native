#import "RCTInspectorPackagerConnection.h"

#if RCT_DEV

#import "RCTDefines.h"
#import "RCTInspector.h"
#import "RCTLog.h"
#import "RCTSRWebSocket.h"
#import "RCTUtils.h"

// This is a port of the Android impl, at
// ReactAndroid/src/main/java/com/facebook/react/devsupport/InspectorPackagerConnection.java
// please keep consistent :)

const int RECONNECT_DELAY_MS = 2000;

@interface RCTInspectorPackagerConnection () <RCTSRWebSocketDelegate> {
  NSURL *_url;
  NSMutableDictionary<NSString *, RCTInspectorLocalConnection *> *_inspectorConnections;
  RCTSRWebSocket *_webSocket;
  BOOL _closed;
  BOOL _suppressConnectionErrors;
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
  return @{ @"pageId": pageId };
}

@implementation RCTInspectorPackagerConnection

RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (instancetype)initWithURL:(NSURL *)url
{
  if (self = [super init]) {
    _url = url;
    _inspectorConnections = [NSMutableDictionary new];
  }
  return self;
}

- (void)sendOpenEvent:(NSString *)pageId
{
  NSDictionary<NSString *, id> *payload = makePageIdPayload(pageId);
  [self sendEvent:@"open" payload:payload];
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

- (void)closeAllConnections
{
  for (NSString *pageId in _inspectorConnections){
    [[_inspectorConnections objectForKey:pageId] disconnect];
  }
  [_inspectorConnections removeAllObjects];
}

- (void)handleConnect:(NSDictionary *)payload
{
  NSString *pageId = payload[@"pageId"];
  if (_inspectorConnections[pageId]) {
    [_inspectorConnections removeObjectForKey:pageId];
    RCTLogError(@"Already connected: %@", pageId);
    return;
  }

  RCTInspectorRemoteConnection *remoteConnection =
    [[RCTInspectorRemoteConnection alloc] initWithPackagerConnection:self
                                                              pageId:pageId];

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
    RCTLogError(@"Not connected: %@", pageId);
    return;
  }
  [inspectorConnection sendMessage:wrappedEvent];
}

- (NSArray *)pages
{
  NSArray<RCTInspectorPage *> *pages = [RCTInspector pages];
  NSMutableArray *array = [NSMutableArray arrayWithCapacity:pages.count];
  for (RCTInspectorPage *page in pages) {
    NSDictionary *jsonPage = @{
      @"id": [@(page.id) stringValue],
      @"title": page.title,
    };
    [array addObject:jsonPage];
  }
  return array;
}

- (void)sendWrappedEvent:(NSString *)pageId
                 message:(NSString *)message
{
  NSDictionary *payload = @{
    @"pageId": pageId,
    @"wrappedEvent": message,
  };
  [self sendEvent:@"wrappedEvent" payload:payload];
}

- (void)sendEvent:(NSString *)name payload:(id)payload
{
  NSDictionary *jsonMessage = @{
    @"event": name,
    @"payload": payload,
  };
  [self sendToPackager:jsonMessage];
}

// analogous to InspectorPackagerConnection.Connection.onFailure(...)
- (void)webSocket:(RCTSRWebSocket *)webSocket didFailWithError:(NSError *)error
{
  if (_webSocket) {
    [self abort:@"Websocket exception"
      withCause:error];
  }
  if (!_closed) {
    [self reconnect];
  }
}

// analogous to InspectorPackagerConnection.Connection.onMessage(...)
- (void)webSocket:(RCTSRWebSocket *)webSocket didReceiveMessage:(id)opaqueMessage
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
    RCTLogWarn(@"Unrecognized inspector message, string was not valid JSON: %@",
      messageText);
    return;
  }

  [self handleProxyMessage:parsedJSON];
}

// analogous to InspectorPackagerConnection.Connection.onClosed(...)
- (void)webSocket:(RCTSRWebSocket *)webSocket didCloseWithCode:(NSInteger)code
                                                        reason:(NSString *)reason
                                                      wasClean:(BOOL)wasClean
{
  _webSocket = nil;
  [self closeAllConnections];
  if (!_closed) {
    [self reconnect];
  }
}

- (void)connect
{
  if (_closed) {
    RCTLogError(@"Illegal state: Can't connect after having previously been closed.");
    return;
  }

  // The corresopnding android code has a lot of custom config options for
  // timeouts, but it appears the iOS RCTSRWebSocket API doesn't have the same
  // implemented options.
  _webSocket = [[RCTSRWebSocket alloc] initWithURL:_url];
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
  dispatch_after(
    dispatch_time(DISPATCH_TIME_NOW, RECONNECT_DELAY_MS *NSEC_PER_MSEC),
    dispatch_get_main_queue(), ^{
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
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
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

- (void)abort:(NSString *)message
    withCause:(NSError *)cause
{
  RCTLogWarn(@"Error occurred, shutting down websocket connection: %@ %@", message, cause);

  [self closeAllConnections];
  [self disposeWebSocket];
}

- (void)disposeWebSocket
{
  if (_webSocket) {
    [_webSocket closeWithCode:1000
                       reason:@"End of session"];
    _webSocket.delegate = nil;
    _webSocket = nil;
  }
}

@end

@implementation RCTInspectorRemoteConnection

RCT_NOT_IMPLEMENTED(- (instancetype)init)

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
  [_owningPackagerConnection sendWrappedEvent:_pageId
                                      message:message];
}

- (void)onDisconnect
{
  RCTInspectorPackagerConnection *owningPackagerConnectionStrong = _owningPackagerConnection;
  if (owningPackagerConnectionStrong) {
    [owningPackagerConnectionStrong removeConnectionForPage:_pageId];
    [owningPackagerConnectionStrong sendEvent:@"disconnect"
                                      payload:makePageIdPayload(_pageId)];
  }
}

@end

#endif

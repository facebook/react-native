/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTPackagerConnection.h"

#import <algorithm>
#import <objc/runtime.h>
#import <vector>

#import <React/RCTAssert.h>
#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTConvert.h>
#import <React/RCTDefines.h>
#import <React/RCTLog.h>
#import <React/RCTPackagerClient.h>
#import <React/RCTReconnectingWebSocket.h>
#import <React/RCTSRWebSocket.h>
#import <React/RCTUtils.h>

#if RCT_DEV
@interface RCTPackagerConnection () <RCTReconnectingWebSocketDelegate>
@end

template <typename Handler>
struct Registration {
  NSString *method;
  Handler handler;
  dispatch_queue_t queue;
  uint32_t token;
};

@implementation RCTPackagerConnection {
  std::mutex _mutex; // protects all ivars
  RCTReconnectingWebSocket *_socket;
  BOOL _socketConnected;
  NSString *_jsLocationForSocket;
  id _bundleURLChangeObserver;
  uint32_t _nextToken;
  std::vector<Registration<RCTNotificationHandler>> _notificationRegistrations;
  std::vector<Registration<RCTRequestHandler>> _requestRegistrations;
  std::vector<Registration<RCTConnectedHandler>> _connectedRegistrations;
}

+ (instancetype)sharedPackagerConnection
{
  static RCTPackagerConnection *connection;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    connection = [RCTPackagerConnection new];
  });
  return connection;
}

- (instancetype)init
{
  if (self = [super init]) {
    _nextToken = 1; // Prevent randomly erasing a handler if you pass a bogus 0 token
    _jsLocationForSocket = [RCTBundleURLProvider sharedSettings].jsLocation;
    _socket = socketForLocation(_jsLocationForSocket);
    _socket.delegate = self;
    [_socket start];

    RCTPackagerConnection *const __weak weakSelf = self;
    _bundleURLChangeObserver =
    [[NSNotificationCenter defaultCenter]
     addObserverForName:RCTBundleURLProviderUpdatedNotification
     object:nil
     queue:[NSOperationQueue mainQueue]
     usingBlock:^(NSNotification *_Nonnull note) {
       [weakSelf bundleURLSettingsChanged];
     }];
  }
  return self;
}

static RCTReconnectingWebSocket *socketForLocation(NSString *const jsLocation)
{
  NSURLComponents *const components = [NSURLComponents new];
  components.host = jsLocation ?: @"localhost";
  components.scheme = @"http";
  components.port = @(kRCTBundleURLProviderDefaultPort);
  components.path = @"/message";
  components.queryItems = @[[NSURLQueryItem queryItemWithName:@"role" value:@"ios"]];
  static dispatch_queue_t queue;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    queue = dispatch_queue_create("com.facebook.RCTPackagerConnectionQueue", DISPATCH_QUEUE_SERIAL);
  });
  return [[RCTReconnectingWebSocket alloc] initWithURL:components.URL queue:queue];
}

- (void)stop
{
  std::lock_guard<std::mutex> l(_mutex);
  if (_socket == nil) {
    // Already stopped
    return;
  }
  [[NSNotificationCenter defaultCenter] removeObserver:_bundleURLChangeObserver];
  _bundleURLChangeObserver = nil;
  _socketConnected = NO;
  [_socket stop];
  _socket = nil;
  _notificationRegistrations.clear();
  _requestRegistrations.clear();
}

- (void)bundleURLSettingsChanged
{
  std::lock_guard<std::mutex> l(_mutex);
  if (_socket == nil) {
    return; // already stopped
  }

  NSString *const jsLocation = [RCTBundleURLProvider sharedSettings].jsLocation;
  if ([jsLocation isEqual:_jsLocationForSocket]) {
    return; // unchanged
  }

  _socket.delegate = nil;
  [_socket stop];
  _jsLocationForSocket = jsLocation;
  _socket = socketForLocation(jsLocation);
  _socket.delegate = self;
  [_socket start];
}

- (RCTHandlerToken)addNotificationHandler:(RCTNotificationHandler)handler queue:(dispatch_queue_t)queue forMethod:(NSString *)method
{
  std::lock_guard<std::mutex> l(_mutex);
  const auto token = _nextToken++;
  _notificationRegistrations.push_back({method, handler, queue, token});
  return token;
}

- (RCTHandlerToken)addRequestHandler:(RCTRequestHandler)handler queue:(dispatch_queue_t)queue forMethod:(NSString *)method
{
  std::lock_guard<std::mutex> l(_mutex);
  const auto token = _nextToken++;
  _requestRegistrations.push_back({method, handler, queue, token});
  return token;
}

- (RCTHandlerToken)addConnectedHandler:(RCTConnectedHandler)handler queue:(dispatch_queue_t)queue
{
  std::lock_guard<std::mutex> l(_mutex);
  if (_socketConnected) {
    dispatch_async(queue, ^{
      handler();
    });
    return 0; // _nextToken starts at 1, so 0 is a no-op token
  } else {
    const auto token = _nextToken++;
    _connectedRegistrations.push_back({nil, handler, queue, token});
    return token;
  }
}

- (void)removeHandler:(RCTHandlerToken)token
{
  std::lock_guard<std::mutex> l(_mutex);
  eraseRegistrationsWithToken(_notificationRegistrations, token);
  eraseRegistrationsWithToken(_requestRegistrations, token);
  eraseRegistrationsWithToken(_connectedRegistrations, token);
}

template <typename Handler>
static void eraseRegistrationsWithToken(std::vector<Registration<Handler>> &registrations, RCTHandlerToken token)
{
  registrations.erase(std::remove_if(registrations.begin(), registrations.end(),
                                     [&token](const auto &reg) { return reg.token == token; }),
                      registrations.end());
}

- (void)addHandler:(id<RCTPackagerClientMethod>)handler forMethod:(NSString *)method
{
  dispatch_queue_t queue = [handler respondsToSelector:@selector(methodQueue)]
  ? [handler methodQueue] : dispatch_get_main_queue();

  [self addNotificationHandler:^(NSDictionary<NSString *, id> *notification) {
    [handler handleNotification:notification];
  } queue:queue forMethod:method];
  [self addRequestHandler:^(NSDictionary<NSString *, id> *request, RCTPackagerClientResponder *responder) {
    [handler handleRequest:request withResponder:responder];
  } queue:queue forMethod:method];
}

static BOOL isSupportedVersion(NSNumber *version)
{
  NSArray<NSNumber *> *const kSupportedVersions = @[ @(RCT_PACKAGER_CLIENT_PROTOCOL_VERSION) ];
  return [kSupportedVersions containsObject:version];
}

#pragma mark - RCTReconnectingWebSocketDelegate

- (void)reconnectingWebSocketDidOpen:(RCTReconnectingWebSocket *)webSocket
{
  std::vector<Registration<RCTConnectedHandler>> registrations;
  {
    std::lock_guard<std::mutex> l(_mutex);
    _socketConnected = YES;
    registrations = _connectedRegistrations;
    _connectedRegistrations.clear();
  }
  for (const auto &registration : registrations) {
    // Beware: don't capture the reference to handler in a dispatched block!
    RCTConnectedHandler handler = registration.handler;
    dispatch_async(registration.queue, ^{ handler(); });
  }
}

- (void)reconnectingWebSocket:(RCTReconnectingWebSocket *)webSocket didReceiveMessage:(id)message
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

  NSString *const method = msg[@"method"];
  NSDictionary<NSString *, id> *const params = msg[@"params"];
  id messageId = msg[@"id"];

  if (messageId) { // Request
    const std::vector<Registration<RCTRequestHandler>> registrations(registrationsWithMethod(_mutex, _requestRegistrations, method));
    if (registrations.empty()) {
      RCTLogError(@"No handler found for packager method %@", msg[@"method"]);
      [[[RCTPackagerClientResponder alloc] initWithId:messageId
                                               socket:webSocket]
       respondWithError:
       [NSString stringWithFormat:@"No handler found for packager method %@", msg[@"method"]]];
    } else {
      // If there are multiple matching request registrations, only one can win;
      // otherwise the packager would get multiple responses. Choose the last one.
      RCTRequestHandler handler = registrations.back().handler;
      dispatch_async(registrations.back().queue, ^{
        handler(params, [[RCTPackagerClientResponder alloc] initWithId:messageId socket:webSocket]);
      });
    }
  } else { // Notification
    const std::vector<Registration<RCTNotificationHandler>> registrations(registrationsWithMethod(_mutex, _notificationRegistrations, method));
    for (const auto &registration : registrations) {
      // Beware: don't capture the reference to handler in a dispatched block!
      RCTNotificationHandler handler = registration.handler;
      dispatch_async(registration.queue, ^{ handler(params); });
    }
  }
}

- (void)reconnectingWebSocketDidClose:(RCTReconnectingWebSocket *)webSocket
{
  std::lock_guard<std::mutex> l(_mutex);
  _socketConnected = NO;
}

template <typename Handler>
static std::vector<Registration<Handler>> registrationsWithMethod(std::mutex &mutex, const std::vector<Registration<Handler>> &registrations, NSString *method)
{
  std::lock_guard<std::mutex> l(mutex); // Scope lock acquisition to prevent deadlock when calling out
  std::vector<Registration<Handler>> matches;
  for (const auto &reg : registrations) {
    if ([reg.method isEqual:method]) {
      matches.push_back(reg);
    }
  }
  return matches;
}

@end

#endif

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTReconnectingWebSocket.h"

#import <React/RCTConvert.h>
#import <React/RCTDefines.h>

#if __has_include(<React/fishhook.h>)
#import <React/fishhook.h>
#else
#import <fishhook/fishhook.h>
#endif

#if __has_include(<os/log.h>) && defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 100300 /* __IPHONE_10_3 */
#import <os/log.h>
#endif /* __IPHONE_10_3 */

#import "RCTSRWebSocket.h"

#if RCT_DEV // Only supported in dev mode

#if __has_include(<os/log.h>) && defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 100300 /* __IPHONE_10_3 */

// From https://github.com/apple/swift/blob/ad40c770bfe372f879b530443a3d94761fe258a6/stdlib/public/SDK/os/os_log.m
typedef struct os_log_pack_s {
  uint64_t olp_continuous_time;
  struct timespec olp_wall_time;
  const void *olp_mh;
  const void *olp_pc;
  const char *olp_format;
  uint8_t olp_data[0];
} os_log_pack_s, *os_log_pack_t;

static void (*orig__nwlog_pack)(os_log_pack_t pack, os_log_type_t logType);

static void my__nwlog_pack(os_log_pack_t pack, os_log_type_t logType)
{
  if (logType == OS_LOG_TYPE_ERROR && strstr(pack->olp_format, "Connection has no connected handler") == NULL) {
    orig__nwlog_pack(pack, logType);
  }
}

#endif /* __IPHONE_10_3 */

static void (*orig_nwlog_legacy_v)(int, char*, va_list);

static void my_nwlog_legacy_v(int level, char *format, va_list args) {
  static const uint buffer_size = 256;
  static char buffer[buffer_size];
  va_list copy;
  va_copy(copy, args);
  vsnprintf(buffer, buffer_size, format, copy);
  va_end(copy);

  if (strstr(buffer, "nw_connection_get_connected_socket_block_invoke") == NULL &&
      strstr(buffer, "Connection has no connected handler") == NULL) {
    orig_nwlog_legacy_v(level, format, args);
  }
}

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 110000 /* __IPHONE_11_0 */

static void (*orig_os_log_error_impl)(void *dso, os_log_t log, os_log_type_t type, const char *format, uint8_t *buf, uint32_t size);

static void my_os_log_error_impl(void *dso, os_log_t log, os_log_type_t type, const char *format, uint8_t *buf, uint32_t size)
{
  if (strstr(format, "TCP Conn %p Failed : error %ld:%d") == NULL) {
    orig_os_log_error_impl(dso, log, type, format, buf, size);
  }
}

#endif /* __IPHONE_11_0 */

@interface RCTReconnectingWebSocket () <RCTSRWebSocketDelegate>
@end

@implementation RCTReconnectingWebSocket {
  NSURL *_url;
  RCTSRWebSocket *_socket;
}

+ (void)load
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    rebind_symbols((struct rebinding[1]){
      {"nwlog_legacy_v", my_nwlog_legacy_v, (void *)&orig_nwlog_legacy_v}
    }, 1);
#if __has_include(<os/log.h>) && defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 100300 /* __IPHONE_10_3 */
    rebind_symbols((struct rebinding[1]){
      {"__nwlog_pack", my__nwlog_pack, (void *)&orig__nwlog_pack}
    }, 1);
#endif /* __IPHONE_10_3 */
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 110000 /* __IPHONE_11_0 */
    rebind_symbols((struct rebinding[1]){
      {"_os_log_error_impl", my_os_log_error_impl, (void *)&orig_os_log_error_impl}
    }, 1);
#endif /* __IPHONE_11_0 */
  });
}

- (instancetype)initWithURL:(NSURL *)url queue:(dispatch_queue_t)queue
{
  if (self = [super init]) {
    _url = url;
    _delegateDispatchQueue = queue;
  }
  return self;
}

- (instancetype)initWithURL:(NSURL *)url
{
  return [self initWithURL:url queue:dispatch_get_main_queue()];
}

- (void)send:(id)data
{
  [_socket send:data];
}

- (void)start
{
  [self stop];
  _socket = [[RCTSRWebSocket alloc] initWithURL:_url];
  _socket.delegate = self;
  [_socket setDelegateDispatchQueue:_delegateDispatchQueue];
  [_socket open];
}

- (void)stop
{
  _socket.delegate = nil;
  [_socket closeWithCode:1000 reason:@"Invalidated"];
  _socket = nil;
}

- (void)webSocket:(RCTSRWebSocket *)webSocket didReceiveMessage:(id)message
{
  [_delegate reconnectingWebSocket:self didReceiveMessage:message];
}

- (void)reconnect
{
  __weak RCTSRWebSocket *socket = _socket;
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(2 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
    [self start];
    if (!socket) {
      [self reconnect];
    }
  });
}

- (void)webSocketDidOpen:(RCTSRWebSocket *)webSocket
{
  [_delegate reconnectingWebSocketDidOpen:self];
}

- (void)webSocket:(RCTSRWebSocket *)webSocket didFailWithError:(NSError *)error
{
  [_delegate reconnectingWebSocketDidClose:self];
  if ([error code] != ECONNREFUSED) {
    [self reconnect];
  }
}

- (void)webSocket:(RCTSRWebSocket *)webSocket didCloseWithCode:(NSInteger)code reason:(NSString *)reason wasClean:(BOOL)wasClean
{
  [_delegate reconnectingWebSocketDidClose:self];
  [self reconnect];
}

@end

#endif

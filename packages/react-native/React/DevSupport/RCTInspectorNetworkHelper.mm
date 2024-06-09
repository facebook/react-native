/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTInspectorNetworkHelper.h"

// Wraps RCTInspectorNetworkListener (a C++ shared_ptr) in an NSObject,
// maintaining a ref while making it id-compatible for an NSDictionary.
@interface RCTInspectorNetworkListenerWrapper : NSObject
@property (nonatomic, readonly) RCTInspectorNetworkListener listener;
- (instancetype)initWithListener:(RCTInspectorNetworkListener)listener;
@end

@interface RCTInspectorNetworkHelper () <NSURLSessionDataDelegate>
@property (nonatomic, strong) NSURLSession *session;
@property (nonatomic, strong)
    NSMutableDictionary<NSNumber *, RCTInspectorNetworkListenerWrapper *> *listenerWrappersByTaskId;
@end

@implementation RCTInspectorNetworkHelper

- (instancetype)init
{
  self = [super init];
  if (self) {
    NSURLSessionConfiguration *configuration = [NSURLSessionConfiguration defaultSessionConfiguration];
    self.session = [NSURLSession sessionWithConfiguration:configuration delegate:self delegateQueue:nil];
    self.listenerWrappersByTaskId = [NSMutableDictionary new];
  }
  return self;
}

- (void)networkRequestWithUrl:(const std::string &)rawUrl listener:(RCTInspectorNetworkListener)listener
{
  NSString *urlString = [NSString stringWithUTF8String:rawUrl.c_str()];
  NSURL *url = [NSURL URLWithString:urlString];
  if (url == nil) {
    listener->onError([NSString stringWithFormat:@"Not a valid URL: %@", urlString].UTF8String);
    return;
  }

  NSMutableURLRequest *urlRequest = [NSMutableURLRequest requestWithURL:url];
  [urlRequest setHTTPMethod:@"GET"];
  NSURLSessionDataTask *dataTask = [self.session dataTaskWithRequest:urlRequest];
  __weak NSURLSessionDataTask *weakDataTask = dataTask;
  listener->setCancelFunction([weakDataTask]() { [weakDataTask cancel]; });
  // Store the listener using the task identifier as the key
  RCTInspectorNetworkListenerWrapper *listenerWrapper =
      [[RCTInspectorNetworkListenerWrapper alloc] initWithListener:listener];
  self.listenerWrappersByTaskId[@(dataTask.taskIdentifier)] = listenerWrapper;
  [dataTask resume];
}

- (RCTInspectorNetworkListener)listenerForTask:(NSNumber *)taskIdentifier
{
  auto *listenerWrapper = self.listenerWrappersByTaskId[taskIdentifier];
  return listenerWrapper ? listenerWrapper.listener : nil;
}

#pragma mark - NSURLSessionDataDelegate

- (void)URLSession:(NSURLSession *)session
              dataTask:(NSURLSessionDataTask *)dataTask
    didReceiveResponse:(NSURLResponse *)response
     completionHandler:(void (^)(NSURLSessionResponseDisposition disposition))completionHandler
{
  RCTInspectorNetworkListener listener = [self listenerForTask:@(dataTask.taskIdentifier)];
  if (!listener) {
    [dataTask cancel];
    return;
  }
  if ([response isKindOfClass:[NSHTTPURLResponse class]]) {
    NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;
    std::map<std::string, std::string> headersMap;
    for (NSString *key in httpResponse.allHeaderFields) {
      headersMap[[key UTF8String]] = [[httpResponse.allHeaderFields objectForKey:key] UTF8String];
    }
    completionHandler(NSURLSessionResponseAllow);
    listener->onHeaders(httpResponse.statusCode, headersMap);
  } else {
    listener->onError("Unsupported response type");
    completionHandler(NSURLSessionResponseCancel);
  }
}

- (void)URLSession:(NSURLSession *)session dataTask:(NSURLSessionDataTask *)dataTask didReceiveData:(NSData *)data
{
  RCTInspectorNetworkListener listener = [self listenerForTask:@(dataTask.taskIdentifier)];
  if (!listener) {
    [dataTask cancel];
    return;
  }
  if (data) {
    listener->onData(std::string_view(static_cast<const char *>(data.bytes), data.length));
  }
}

- (void)URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task didCompleteWithError:(NSError *)error
{
  RCTInspectorNetworkListener listener = [self listenerForTask:@(task.taskIdentifier)];
  if (!listener) {
    return;
  }
  if (error != nil) {
    listener->onError(error.localizedDescription.UTF8String);
  } else {
    listener->onEnd();
  }
  [self.listenerWrappersByTaskId removeObjectForKey:@(task.taskIdentifier)];
}

@end

@implementation RCTInspectorNetworkListenerWrapper {
  RCTInspectorNetworkListener _listener;
}

- (instancetype)initWithListener:(RCTInspectorNetworkListener)listener
{
  if (self = [super init]) {
    _listener = listener;
  }
  return self;
}

- (RCTInspectorNetworkListener)listener
{
  return _listener;
}

@end

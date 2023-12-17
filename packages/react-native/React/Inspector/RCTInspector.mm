/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTInspector.h>

#if RCT_DEV || RCT_REMOTE_PROFILE

#include <jsinspector-modern/InspectorInterfaces.h>

#import <React/RCTDefines.h>
#import <React/RCTInspectorPackagerConnection.h>
#import <React/RCTLog.h>
#import <React/RCTUtils.h>

using namespace facebook::react;
using namespace facebook::react::jsinspector_modern;

// This is a port of the Android impl, at
// react-native-github/ReactAndroid/src/main/java/com/facebook/react/bridge/Inspector.java
// react-native-github/ReactAndroid/src/main/jni/react/jni/JInspector.cpp
// please keep consistent :)

class RemoteConnection : public IRemoteConnection {
 public:
  RemoteConnection(RCTInspectorRemoteConnection *connection) : _connection(connection) {}

  virtual void onMessage(std::string message) override
  {
    [_connection onMessage:@(message.c_str())];
  }

  virtual void onDisconnect() override
  {
    [_connection onDisconnect];
  }

 private:
  const RCTInspectorRemoteConnection *_connection;
};

@interface RCTInspectorPage () {
  NSInteger _id;
  NSString *_title;
  NSString *_vm;
}
- (instancetype)initWithId:(NSInteger)id title:(NSString *)title vm:(NSString *)vm;
@end

@interface RCTInspectorLocalConnection () {
  std::unique_ptr<ILocalConnection> _connection;
}
- (instancetype)initWithConnection:(std::unique_ptr<ILocalConnection>)connection;
@end

static IInspector *getInstance()
{
  return &facebook::react::jsinspector_modern::getInspectorInstance();
}

@implementation RCTInspector

RCT_NOT_IMPLEMENTED(-(instancetype)init)

+ (NSArray<RCTInspectorPage *> *)pages
{
  std::vector<InspectorPage> pages = getInstance()->getPages();
  NSMutableArray<RCTInspectorPage *> *array = [NSMutableArray arrayWithCapacity:pages.size()];
  for (size_t i = 0; i < pages.size(); i++) {
    RCTInspectorPage *pageWrapper = [[RCTInspectorPage alloc] initWithId:pages[i].id
                                                                   title:@(pages[i].title.c_str())
                                                                      vm:@(pages[i].vm.c_str())];
    [array addObject:pageWrapper];
  }
  return array;
}

+ (RCTInspectorLocalConnection *)connectPage:(NSInteger)pageId
                         forRemoteConnection:(RCTInspectorRemoteConnection *)remote
{
  auto localConnection = getInstance()->connect((int)pageId, std::make_unique<RemoteConnection>(remote));
  return [[RCTInspectorLocalConnection alloc] initWithConnection:std::move(localConnection)];
}

@end

@implementation RCTInspectorPage

RCT_NOT_IMPLEMENTED(-(instancetype)init)

- (instancetype)initWithId:(NSInteger)id title:(NSString *)title vm:(NSString *)vm
{
  if (self = [super init]) {
    _id = id;
    _title = title;
    _vm = vm;
  }
  return self;
}

@end

@implementation RCTInspectorLocalConnection

RCT_NOT_IMPLEMENTED(-(instancetype)init)

- (instancetype)initWithConnection:(std::unique_ptr<ILocalConnection>)connection
{
  if (self = [super init]) {
    _connection = std::move(connection);
  }
  return self;
}

- (void)sendMessage:(NSString *)message
{
  _connection->sendMessage([message UTF8String]);
}

- (void)disconnect
{
  _connection->disconnect();
}

@end

#endif

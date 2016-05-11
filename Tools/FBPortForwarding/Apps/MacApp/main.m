/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Cocoa/Cocoa.h>

#import <FBPortForwarding-Mac/FBPortForwardingClient.h>

int main(int argc, char *argv[])
{
  FBPortForwardingClient *client = [FBPortForwardingClient new];
  [client forwardConnectionsToPort:8081];
  [client connectToMultiplexingChannelOnPort:8025];

  [[NSRunLoop currentRunLoop] run];
  client = nil;
  return 0;
}

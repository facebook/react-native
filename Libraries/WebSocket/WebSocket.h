//
//  WebSocket.h
//  WebSocket
//
//  Created by Harrison Harnisch on 4/15/15.
//  Copyright (c) 2015 React. All rights reserved.
//

#import "RCTBridgeModule.h"
#import "SRWebSocket.h"

@interface WebSocket : NSObject <SRWebSocketDelegate>

- (instancetype) initWithURLString: (NSString *)URLString bridge:(RCTBridge *)bridge socketIndex: (NSNumber *)socketIndex;

@end

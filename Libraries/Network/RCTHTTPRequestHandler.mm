/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTHTTPRequestHandler.h"

#import <Security/Security.h>
#import <UIKit/UIKit.h>
#import <Foundation/Foundation.h>
#import <CoreFoundation/CoreFoundation.h>
#import <mutex>

#import "RCTNetworking.h"

@interface RCTHTTPRequestHandler () <NSURLSessionDataDelegate,NSURLSessionTaskDelegate>

@end

@implementation RCTHTTPRequestHandler
{
  NSMapTable *_delegates;
  NSURLSession *_session;
  std::mutex _mutex;
}

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

- (void)invalidate
{
  [_session invalidateAndCancel];
  _session = nil;
}

- (BOOL)isValid
{
  // if session == nil and delegates != nil, we've been invalidated
  return _session || !_delegates;
}

#pragma mark - NSURLRequestHandler

- (BOOL)canHandleRequest:(NSURLRequest *)request
{
  static NSSet<NSString *> *schemes = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    // technically, RCTHTTPRequestHandler can handle file:// as well,
    // but it's less efficient than using RCTFileRequestHandler
    schemes = [[NSSet alloc] initWithObjects:@"http", @"https", nil];
  });
  return [schemes containsObject:request.URL.scheme.lowercaseString];
}

- (NSURLSessionDataTask *)sendRequest:(NSURLRequest *)request
                         withDelegate:(id<RCTURLRequestDelegate>)delegate
{
  // Lazy setup
  if (!_session && [self isValid]) {
    NSOperationQueue *callbackQueue = [NSOperationQueue new];
    callbackQueue.maxConcurrentOperationCount = 1;
    callbackQueue.underlyingQueue = [[_bridge networking] methodQueue];
    NSURLSessionConfiguration *configuration = [NSURLSessionConfiguration defaultSessionConfiguration];
    [configuration setHTTPShouldSetCookies:YES];
    [configuration setHTTPCookieAcceptPolicy:NSHTTPCookieAcceptPolicyAlways];
    [configuration setHTTPCookieStorage:[NSHTTPCookieStorage sharedHTTPCookieStorage]];
    _session = [NSURLSession sessionWithConfiguration:configuration
                                             delegate:self
                                        delegateQueue:callbackQueue];

    std::lock_guard<std::mutex> lock(_mutex);
    _delegates = [[NSMapTable alloc] initWithKeyOptions:NSPointerFunctionsStrongMemory
                                           valueOptions:NSPointerFunctionsStrongMemory
                                               capacity:0];
  }

  NSURLSessionDataTask *task = [_session dataTaskWithRequest:request];
  {
    std::lock_guard<std::mutex> lock(_mutex);
    [_delegates setObject:delegate forKey:task];
  }
  [task resume];
  return task;
}

- (void)cancelRequest:(NSURLSessionDataTask *)task
{
  {
    std::lock_guard<std::mutex> lock(_mutex);
    [_delegates removeObjectForKey:task];
  }
  [task cancel];
}

#pragma mark - NSURLSession delegate

- (void)URLSession:(NSURLSession *)session
              task:(NSURLSessionTask *)task
   didSendBodyData:(int64_t)bytesSent
    totalBytesSent:(int64_t)totalBytesSent
totalBytesExpectedToSend:(int64_t)totalBytesExpectedToSend
{
  id<RCTURLRequestDelegate> delegate;
  {
    std::lock_guard<std::mutex> lock(_mutex);
    delegate = [_delegates objectForKey:task];
  }
  [delegate URLRequest:task didSendDataWithProgress:totalBytesSent];
}

- (void)URLSession:(NSURLSession *)session
          dataTask:(NSURLSessionDataTask *)task
didReceiveResponse:(NSURLResponse *)response
 completionHandler:(void (^)(NSURLSessionResponseDisposition))completionHandler
{
  id<RCTURLRequestDelegate> delegate;
  {
    std::lock_guard<std::mutex> lock(_mutex);
    delegate = [_delegates objectForKey:task];
  }
  [delegate URLRequest:task didReceiveResponse:response];
  completionHandler(NSURLSessionResponseAllow);
}

- (void)URLSession:(NSURLSession *)session
          dataTask:(NSURLSessionDataTask *)task
    didReceiveData:(NSData *)data
{
  id<RCTURLRequestDelegate> delegate;
  {
    std::lock_guard<std::mutex> lock(_mutex);
    delegate = [_delegates objectForKey:task];
  }
  [delegate URLRequest:task didReceiveData:data];
}

- (void)URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task didCompleteWithError:(NSError *)error
{
  id<RCTURLRequestDelegate> delegate;
  {
    std::lock_guard<std::mutex> lock(_mutex);
    delegate = [_delegates objectForKey:task];
    [_delegates removeObjectForKey:task];
  }
  [delegate URLRequest:task didCompleteWithError:error];
}

#pragma mark - NSURLSessionTaskDelegate
- (void)URLSession:(NSURLSession *)session didReceiveChallenge:(NSURLAuthenticationChallenge *)challenge completionHandler:(void (^)(NSURLSessionAuthChallengeDisposition, NSURLCredential * _Nullable))completionHandler
{
    __block NSURLCredential *cred;
    __block NSURLSessionAuthChallengeDisposition disposition;
    
    //获取TrustObj
    SecTrustRef trust = challenge.protectionSpace.serverTrust;
    
    //根据认证方式生成证书
    //判断认证方式
    if (challenge.protectionSpace.authenticationMethod == NSURLAuthenticationMethodClientCertificate) {
        SecIdentityRef clientIdentity = NULL;
        SecTrustRef clientTrust = NULL;
        NSString *p12 = [[NSBundle mainBundle] pathForResource:@"client" ofType:@"p12"];
        NSData *PKCS12Data = [NSData dataWithContentsOfFile:p12];
        if ([[self class] extractIdentity:&clientIdentity andTrust:&clientTrust fromPKCS12Data:PKCS12Data]) {
            SecCertificateRef clientCertificate = NULL;
            SecIdentityCopyCertificate(clientIdentity, &clientCertificate);
            const void*certs[] = {clientCertificate};
            CFArrayRef clientCertArray =CFArrayCreate(kCFAllocatorDefault, certs,1,NULL);
            cred = [NSURLCredential credentialWithIdentity:clientIdentity certificates:(__bridge NSArray*)clientCertArray persistence:NSURLCredentialPersistencePermanent];
            disposition =NSURLSessionAuthChallengeUseCredential;
            CFRelease(clientCertArray);
        }else{
            cred = NULL;
            disposition =NSURLSessionAuthChallengeUseCredential;
        }
        //    NSLog(@"ClientCertificate credential:%@",cred);
        
    }else if (challenge.protectionSpace.authenticationMethod == NSURLAuthenticationMethodServerTrust){
        //需要authentication challenge的protection space提供一个trust
        cred = [NSURLCredential credentialForTrust:trust];
        disposition = NSURLSessionAuthChallengeUseCredential;
        //    NSLog(@"ServerTrust credential:%@",cred);
        
    }else{
        //    cred = [NSURLCredential credentialForTrust:challenge.protectionSpace.serverTrust];
        //    disposition = NSURLSessionAuthChallengeUseCredential;
        cred = nil;
        disposition = NSURLSessionAuthChallengeRejectProtectionSpace;
        
        //    NSLog(@"else credential:%@",cred);
    }
    
    completionHandler(disposition,cred);
}

+ (BOOL)extractIdentity:(SecIdentityRef *)outIdentity andTrust:(SecTrustRef *)outTrust fromPKCS12Data:(NSData *)inPKCS12Data
{
    OSStatus securityError = errSecSuccess;
    //client certificate password
    NSDictionary*optionsDictionary = [NSDictionary dictionaryWithObject:@"rsytaxshyethbuputoerekikasuchei" forKey:(__bridge id)kSecImportExportPassphrase];
    
    CFArrayRef items = CFArrayCreate(NULL, 0, 0, NULL);
    securityError = SecPKCS12Import((__bridge CFDataRef)inPKCS12Data,(__bridge CFDictionaryRef)optionsDictionary,&items);
    
    if(securityError == 0) {
        CFDictionaryRef myIdentityAndTrust = (CFDictionaryRef)CFArrayGetValueAtIndex(items,0);
        const void*tempIdentity =NULL;
        tempIdentity= CFDictionaryGetValue (myIdentityAndTrust,kSecImportItemIdentity);
        *outIdentity = (SecIdentityRef)tempIdentity;
        const void*tempTrust =NULL;
        tempTrust = CFDictionaryGetValue(myIdentityAndTrust,kSecImportItemTrust);
        *outTrust = (SecTrustRef)tempTrust;
    } else {
        NSLog(@"Failedwith error code %d",(int)securityError);
        return NO;
    }
    return YES;
}


@end

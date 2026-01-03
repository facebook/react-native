/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {StyleSheet, View} from 'react-native';
/*
  *
  * When we import this large JSON file we get a OOM or we get killed by the
  * system like:
  *
  *
  * kill
  *
  * 07-23 15:29:14.853   157   157 I lowmemorykiller: Kill 'com.facebook.react.uiapp' (31312), uid 10199, oom_score_adj 0 to free 688076kB rss, 975256kB swap; reason: min watermark is breached even after kill
    OOM
  *0
7-23 10:22:53.172 20375 20398 W ook.react.uiapp: Throwing OutOfMemoryError "Failed to allocate a 32 byte allocation with 35344 free bytes and 34KB until OOM, target footprint 201326592, growth limit 201326592; giving up on allocation because <1% of heap free after GC." (VmSize 16626412 kB, recursive case)
07-23 10:22:53.172 20375 20398 W ook.react.uiapp: "OkHttp http://10.0.2.2:8081/..." prio=5 tid=20 Runnable
07-23 10:22:53.172 20375 20398 W ook.react.uiapp:   | group="main" sCount=0 ucsCount=0 flags=0 obj=0x14108d60 self=0xb4000079752b3cc0
07-23 10:22:53.172 20375 20398 W ook.react.uiapp:   | sysTid=20398 nice=0 cgrp=top-app sched=0/0 handle=0x78803eb730
07-23 10:22:53.172 20375 20398 W ook.react.uiapp:   | state=R schedstat=( 1166192279 56434583 18472 ) utm=49 stm=66 core=2 HZ=100
07-23 10:22:53.172 20375 20398 W ook.react.uiapp:   | stack=0x78802e8000-0x78802ea000 stackSize=1037KB
07-23 10:22:53.172 20375 20398 W ook.react.uiapp:   | held mutexes= "mutator lock"(shared held)
07-23 10:22:53.172 20375 20398 W ook.react.uiapp:   at okio.Segment.<init>(Segment.kt:62)
07-23 10:22:53.172 20375 20398 W ook.react.uiapp:   at okio.SegmentPool.take(SegmentPool.kt:87)
07-23 10:22:53.172 20375 20398 W ook.react.uiapp:   at okio.Buffer.writableSegment$okio(Buffer.kt:1796)
07-23 10:22:53.172 20375 20398 W ook.react.uiapp:   at okio.InputStreamSource.read(JvmOkio.kt:89)
07-23 10:22:53.172 20375 20398 W ook.react.uiapp:   at okio.AsyncTimeout$source$1.read(AsyncTimeout.kt:129)
07-23 10:22:53.172 20375 20398 W ook.react.uiapp:   at okio.RealBufferedSource.read(RealBufferedSource.kt:189)
07-23 10:22:53.172 20375 20398 W ook.react.uiapp:   at okhttp3.internal.http1.Http1ExchangeCodec$AbstractSource.read(Http1ExchangeCodec.kt:331)
07-23 10:22:53.172 20375 20398 W ook.react.uiapp:   at okhttp3.internal.http1.Http1ExchangeCodec$ChunkedSource.read(Http1ExchangeCodec.kt:412)
07-23 10:22:53.172 20375 20398 W ook.react.uiapp:   at okhttp3.internal.connection.Exchange$ResponseBodySource.read(Exchange.kt:276)
07-23 10:22:53.172 20375 20398 W ook.react.uiapp:   at okio.RealBufferedSource.read(RealBufferedSource.kt:189)
07-23 10:22:53.172 20375 20398 W ook.react.uiapp:   at com.facebook.react.devsupport.MultipartStreamReader.readAllParts(MultipartStreamReader.kt:83)
07-23 10:22:53.172 20375 20398 W ook.react.uiapp:   at com.facebook.react.devsupport.BundleDownloader.processMultipartResponse(BundleDownloader.kt:178)
07-23 10:22:53.172 20375 20398 W ook.react.uiapp:   at com.facebook.react.devsupport.BundleDownloader.access$processMultipartResponse(BundleDownloader.kt:35)
07-23 10:22:53.172 20375 20398 W ook.react.uiapp:   at com.facebook.react.devsupport.BundleDownloader$downloadBundleFromURL$1.onResponse(BundleDownloader.kt:128)
07-23 10:22:53.172 20375 20398 W ook.react.uiapp:   at okhttp3.internal.connection.RealCall$AsyncCall.run(RealCall.kt:519)
07-23 10:22:53.172 20375 20398 W ook.react.uiapp:   at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
07-23 10:22:53.172 20375 20398 W ook.react.uiapp:   at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
07-23 10:22:53.172 20375 20398 W ook.react.uiapp:   at java.lang.Thread.run(Thread.java:1012)
07
  * */

import jsonFile from './large.json';

const hasLargeJson = !!jsonFile;
function Playground() {
  return (
    <View style={styles.container}>
      <RNTesterText>
        Edit "RNTesterPlayground.js" to change this file
        {hasLargeJson
          ? '\n\nLarge JSON file loaded successfully.'
          : '\n\nLarge JSON file not loaded.'}
      </RNTesterText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
});

export default ({
  title: 'Playground',
  name: 'playground',
  description: 'Test out new features and ideas.',
  render: (): React.Node => <Playground />,
}: RNTesterModuleExample);

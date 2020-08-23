# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

## Putting this here is kind of a hack.  I don't want to modify the OSS bridge.
## TODO mhorowitz: add @DoNotStrip to the interface directly.

-keepclassmembers class com.facebook.react.bridge.queue.MessageQueueThread {
  public boolean isOnThread();
  public void assertIsOnThread();
}

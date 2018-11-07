# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# For common use cases for the hybrid pattern, keep symbols which may
# be referenced only from C++.

-keepclassmembers class * {
    com.facebook.jni.HybridData *;
    <init>(com.facebook.jni.HybridData);
}

-keepclasseswithmembers class * {
    com.facebook.jni.HybridData *;
}

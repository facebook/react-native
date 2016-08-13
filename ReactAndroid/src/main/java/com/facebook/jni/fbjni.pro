# For common use cases for the hybrid pattern, keep symbols which may
# be referenced only from C++.

-keepclassmembers class * {
    com.facebook.jni.HybridData *;
    <init>(com.facebook.jni.HybridData);
}

-keepclasseswithmembers class * {
    com.facebook.jni.HybridData *;
}

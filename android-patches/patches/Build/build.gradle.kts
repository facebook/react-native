diff --git a/build.gradle.kts b/build.gradle.kts
index 4725963eae0..7c71d628832 100644
--- a/build.gradle.kts
+++ b/build.gradle.kts
@@ -5,9 +5,6 @@
  * LICENSE file in the root directory of this source tree.
  */
 
-val ndkPath by extra(System.getenv("ANDROID_NDK"))
-val ndkVersion by extra(System.getenv("ANDROID_NDK_VERSION"))
-
 buildscript {
     repositories {
         google()

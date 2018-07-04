// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include <fb/CpuCapabilities.h>
#include <cpu-features.h>
#include <fb/Environment.h>
#include <glog/logging.h>
#include <jni/Registration.h>

namespace facebook { namespace jni {

// =========================================
// returns true if this device supports NEON calls, false otherwise
jboolean nativeDeviceSupportsNeon(JNIEnv* env, jobject obj) {
  if (android_getCpuFamily() != ANDROID_CPU_FAMILY_ARM) {
    VLOG(2) << "NEON disabled, not an ARM CPU";
    return false;
  }
  uint64_t cpufeatures = android_getCpuFeatures();
  if ((cpufeatures & ANDROID_CPU_ARM_FEATURE_ARMv7) == 0) {
    VLOG(2) << "NEON disabled, not an ARMv7 CPU";
    return false;
  }
  if ((cpufeatures & ANDROID_CPU_ARM_FEATURE_NEON) == 0) {
    VLOG(2) << "NEON disabled, not supported";
    return false;
  }

  VLOG(2) << "NEON supported and enabled";
  return true;
}

// =========================================
// returns true if this device supports VFP_FP16, false otherwise.
jboolean nativeDeviceSupportsVFPFP16(JNIEnv *env, jobject obj) {
  uint64_t cpufeatures = android_getCpuFeatures();
  if ((cpufeatures & ANDROID_CPU_ARM_FEATURE_VFP_FP16) == 0) {
    VLOG(2) << "VPF_FP16 disabled, not supported";
    return false;
  }
  VLOG(2) << "VFP_FP16 supported and enabled";
  return true;
}

// =========================================
// returns true if this device is x86 based, false otherwise
jboolean nativeDeviceSupportsX86(JNIEnv* env, jobject obj) {
  return (android_getCpuFamily() == ANDROID_CPU_FAMILY_X86);
}

// =========================================
// register native methods
void initialize_cpucapabilities() {
  facebook::jni::registerNatives(
      Environment::current(),
      "com/facebook/jni/CpuCapabilitiesJni",
      {
        { "nativeDeviceSupportsNeon",
          "()Z",
          (void*) nativeDeviceSupportsNeon },
        { "nativeDeviceSupportsVFPFP16",
          "()Z",
          (void*) nativeDeviceSupportsVFPFP16 },
        { "nativeDeviceSupportsX86",
          "()Z",
          (void*) nativeDeviceSupportsX86 },
      }
  );
}

} } // namespace facebook::jni

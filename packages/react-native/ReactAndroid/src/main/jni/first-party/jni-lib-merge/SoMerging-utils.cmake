# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

# This function should be invoked if the requested library is going to be merged
# with libreactnative.so as such:
#
# target_merge_so(react_newarchdefaults)
#
# This function will take care of forcefully including the jni_lib_merge.h header that takes
# care of redefining the JNI_OnLoad function to JNI_OnLoad_Weak.
function(target_merge_so target_name)
  if(NOT ANDROID)
    return()
  endif()

  target_compile_options(${target_name}
          PRIVATE
            -DORIGINAL_SONAME=\"lib${target_name}.so\"
            -include ${REACT_ANDROID_DIR}/src/main/jni/first-party/jni-lib-merge/jni_lib_merge.h
  )
  target_link_options(${target_name} PRIVATE -Wl,--defsym=JNI_OnLoad=JNI_OnLoad_Weak)
endfunction()

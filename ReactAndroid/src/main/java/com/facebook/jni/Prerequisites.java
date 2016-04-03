/*
 * Copyright (C) 2010 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.facebook.jni;


import com.facebook.soloader.SoLoader;


import javax.microedition.khronos.egl.EGL10;
import javax.microedition.khronos.egl.EGLConfig;
import javax.microedition.khronos.egl.EGLContext;
import javax.microedition.khronos.egl.EGLDisplay;

public class Prerequisites {
  private static final int EGL_OPENGL_ES2_BIT = 0x0004;

  public static void ensure() {
    SoLoader.loadLibrary("fbjni");
  }

  // Code is simplified version of getDetectedVersion()
  // from cts/tests/tests/graphics/src/android/opengl/cts/OpenGlEsVersionTest.java
  static public boolean supportsOpenGL20() {
    EGL10 egl = (EGL10) EGLContext.getEGL();
    EGLDisplay display = egl.eglGetDisplay(EGL10.EGL_DEFAULT_DISPLAY);
    int[] numConfigs = new int[1];

    if (egl.eglInitialize(display, null)) {
      try {
        if (egl.eglGetConfigs(display, null, 0, numConfigs)) {
          EGLConfig[] configs = new EGLConfig[numConfigs[0]];
          if (egl.eglGetConfigs(display, configs, numConfigs[0], numConfigs)) {
            int[] value = new int[1];
            for (int i = 0; i < numConfigs[0]; i++) {
              if (egl.eglGetConfigAttrib(display, configs[i],
                                         EGL10.EGL_RENDERABLE_TYPE, value)) {
                if ((value[0] & EGL_OPENGL_ES2_BIT) == EGL_OPENGL_ES2_BIT) {
                  return true;
                }
              }
            }
          }
        }
      } finally {
        egl.eglTerminate(display);
      }
    }
    return false;
  }
}


ROOT := $(abspath $(call my-dir))/../../..
include $(ROOT)/Application.mk

APP_ABI := armeabi-v7a x86
APP_STL := gnustl_shared
APP_BUILD_SCRIPT := Android.mk

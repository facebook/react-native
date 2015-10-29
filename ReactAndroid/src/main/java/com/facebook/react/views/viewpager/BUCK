include_defs('//ReactAndroid/DEFS')

android_library(
  name = 'viewpager',
  srcs = glob(['**/*.java']),
  deps = [
    react_native_target('java/com/facebook/react/bridge:bridge'),
    react_native_target('java/com/facebook/react/common:common'),
    react_native_target('java/com/facebook/react/uimanager:uimanager'),
    react_native_target('java/com/facebook/react/views/scroll:scroll'),
    '//third-party/java/android/support/v4:lib-support-v4',
    '//third-party/java/jsr-305:jsr-305',
  ],
  visibility = [
    'PUBLIC',
  ],
)

project_config(
  src_target = ':viewpager',
)

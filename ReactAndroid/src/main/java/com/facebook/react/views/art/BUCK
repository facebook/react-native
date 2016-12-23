include_defs('//ReactAndroid/DEFS')

android_library(
  name = 'art',
  srcs = glob(['*.java']),
  deps = [
    YOGA_TARGET,
    react_native_dep('libraries/fbcore/src/main/java/com/facebook/common/logging:logging'),
    react_native_dep('third-party/java/jsr-305:jsr-305'),
    react_native_target('java/com/facebook/react/bridge:bridge'),
    react_native_target('java/com/facebook/react/common:common'),
    react_native_target('java/com/facebook/react/module/annotations:annotations'),
    react_native_target('java/com/facebook/react/uimanager:uimanager'),
    react_native_target('java/com/facebook/react/uimanager/annotations:annotations'),
  ],
  visibility = [
    'PUBLIC',
  ],
)


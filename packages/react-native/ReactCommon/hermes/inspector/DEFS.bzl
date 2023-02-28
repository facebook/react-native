load("@fbsource//xplat/hermes/defs:hermes.bzl", "hermes_is_debugger_enabled")

def hermes_inspector_dep_list():
    return [
        "//xplat/js/react-native-github/packages/react-native/ReactCommon/hermes/inspector:chrome",
        "//xplat/js/react-native-github/packages/react-native/ReactCommon/hermes/inspector:inspectorlib",
    ] if hermes_is_debugger_enabled() else []

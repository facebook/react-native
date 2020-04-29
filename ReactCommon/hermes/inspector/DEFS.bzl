load("@fbsource//xplat/hermes/defs:hermes.bzl", "hermes_is_debugger_enabled")

def hermes_inspector_dep_list():
    return [
<<<<<<< HEAD
        "fbsource//xplat/hermes-inspector:chrome",
        "fbsource//xplat/hermes-inspector:inspectorlib",
=======
        "fbsource//xplat/js/react-native-github/ReactCommon/hermes/inspector:chrome",
        "fbsource//xplat/js/react-native-github/ReactCommon/hermes/inspector:inspectorlib",
>>>>>>> fb/0.62-stable
    ] if hermes_is_debugger_enabled() else []

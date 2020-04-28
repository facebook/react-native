load("@fbsource//xplat/hermes/defs:hermes.bzl", "hermes_is_debugger_enabled")

def hermes_inspector_dep_list():
    return [
        "fbsource//xplat/hermes-inspector:chrome",
        "fbsource//xplat/hermes-inspector:inspectorlib",
    ] if hermes_is_debugger_enabled() else []

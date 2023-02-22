# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

def snap_get_script_phases_with_codegen_discovery_with_config_file_dir()
    return <<~EOS
    pushd "$PODS_ROOT/../" > /dev/null
    RCT_SCRIPT_POD_INSTALLATION_ROOT=$(pwd)
    popd >/dev/null

    export RCT_SCRIPT_RN_DIR=$RCT_SCRIPT_POD_INSTALLATION_ROOT/../..
    export RCT_SCRIPT_APP_PATH=$RCT_SCRIPT_POD_INSTALLATION_ROOT/
    export RCT_SCRIPT_CONFIG_FILE_DIR=$RCT_SCRIPT_POD_INSTALLATION_ROOT/node_modules
    export RCT_SCRIPT_OUTPUT_DIR=$RCT_SCRIPT_POD_INSTALLATION_ROOT
    export RCT_SCRIPT_FABRIC_ENABLED=true
    export RCT_SCRIPT_TYPE=withCodegenDiscovery

    SCRIPT_PHASES_SCRIPT="$RCT_SCRIPT_RN_DIR/scripts/react_native_pods_utils/script_phases.sh"
    WITH_ENVIRONMENT="$RCT_SCRIPT_RN_DIR/scripts/xcode/with-environment.sh"
    /bin/sh -c "$WITH_ENVIRONMENT $SCRIPT_PHASES_SCRIPT"
    EOS
end

def snap_get_script_phases_with_codegen_discovery_without_config_file_dir()
    return <<~EOS
    pushd "$PODS_ROOT/../" > /dev/null
    RCT_SCRIPT_POD_INSTALLATION_ROOT=$(pwd)
    popd >/dev/null

    export RCT_SCRIPT_RN_DIR=$RCT_SCRIPT_POD_INSTALLATION_ROOT/../..
    export RCT_SCRIPT_APP_PATH=$RCT_SCRIPT_POD_INSTALLATION_ROOT/
    export RCT_SCRIPT_CONFIG_FILE_DIR=
    export RCT_SCRIPT_OUTPUT_DIR=$RCT_SCRIPT_POD_INSTALLATION_ROOT
    export RCT_SCRIPT_FABRIC_ENABLED=true
    export RCT_SCRIPT_TYPE=withCodegenDiscovery

    SCRIPT_PHASES_SCRIPT="$RCT_SCRIPT_RN_DIR/scripts/react_native_pods_utils/script_phases.sh"
    WITH_ENVIRONMENT="$RCT_SCRIPT_RN_DIR/scripts/xcode/with-environment.sh"
    /bin/sh -c "$WITH_ENVIRONMENT $SCRIPT_PHASES_SCRIPT"
    EOS
end

def snap_get_script_phases_no_codegen_discovery()
    return <<~EOS
    pushd "$PODS_ROOT/../" > /dev/null
    RCT_SCRIPT_POD_INSTALLATION_ROOT=$(pwd)
    popd >/dev/null

    export RCT_SCRIPT_RN_DIR=${PODS_TARGET_SRCROOT}/../../..
    export RCT_SCRIPT_LIBRARY_NAME=ScreenshotmanagerSpec
    export RCT_SCRIPT_OUTPUT_DIR=$RCT_SCRIPT_POD_INSTALLATION_ROOT/build/generated/ios
    export RCT_SCRIPT_LIBRARY_TYPE=modules
    export RCT_SCRIPT_JS_SRCS_PATTERN=Native*.js
    export RCT_SCRIPT_JS_SRCS_DIR=./
    export RCT_SCRIPT_CODEGEN_MODULE_DIR=.
    export RCT_SCRIPT_CODEGEN_COMPONENT_DIR=react/renderer/components
    export RCT_SCRIPT_FILE_LIST=\"[\\\".//NativeScreenshotManager.js\\\"]\"

    SCRIPT_PHASES_SCRIPT="$RCT_SCRIPT_RN_DIR/scripts/react_native_pods_utils/script_phases.sh"
    WITH_ENVIRONMENT="$RCT_SCRIPT_RN_DIR/scripts/xcode/with-environment.sh"
    /bin/sh -c "$WITH_ENVIRONMENT $SCRIPT_PHASES_SCRIPT"
    EOS
end

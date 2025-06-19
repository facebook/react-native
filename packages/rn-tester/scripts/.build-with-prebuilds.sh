export RCT_USE_PREBUILT_RNCORE=1
export USE_FRAMEWORKS=static

export RCT_USE_LOCAL_RNCORE=~/Downloads/reactnative-core-debug.tar.gz
export RCT_USE_LOCAL_RN_DEP=~/Downloads/reactnative-dependencies-debug.tar.gz
export HERMES_ENGINE_TARBALL_PATH=~/Downloads/hermes-ios-debug.tar.gz
rm -rf ./Pods
pod cache clean --all
bundle exec pod install

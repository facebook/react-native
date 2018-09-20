# React Native Base Android Development Environment
#
# This image provides a base Android development environment for React Native,
# including, but not limited to, the Android SDK, Android NDK, Node, and BUCK.
# These are required in order to run React Native's Android unit and integration
# tests.
#
# This image is not currently built automatically as part of React Native's CI
# infrastructure. It should not be necessary to rebuild this image while the
# Android dependencies (Android SDK version, build tools version, etc) remain
# equal. The operations performed to build this image are those that tend to
# remain stable across commits in any given React Native release.

FROM library/ubuntu:16.04

LABEL Description="This image provides a base Android development environment for React Native, and may be used to run tests."
LABEL maintainer="Héctor Ramos <hector@fb.com>"

# set default build arguments
ARG SDK_VERSION=sdk-tools-linux-3859397.zip
ARG ANDROID_BUILD_VERSION=27
ARG ANDROID_TOOLS_VERSION=27.0.3
ARG BUCK_VERSION=v2018.07.23.01
ARG NDK_VERSION=17b
ARG NODE_VERSION=8.10.0
ARG WATCHMAN_VERSION=4.9.0

# set default environment variables
ENV ADB_INSTALL_TIMEOUT=10
ENV PATH=${PATH}:/opt/buck/bin/
ENV ANDROID_HOME=/opt/android
ENV ANDROID_SDK_HOME=${ANDROID_HOME}
ENV PATH=${PATH}:${ANDROID_HOME}/tools:${ANDROID_HOME}/tools/bin:${ANDROID_HOME}/platform-tools
ENV ANDROID_NDK=/opt/ndk/android-ndk-r$NDK_VERSION
ENV PATH=${PATH}:${ANDROID_NDK}

# install system dependencies
RUN apt-get update && apt-get install ant autoconf automake curl g++ gcc git libqt5widgets5 lib32z1 lib32stdc++6 make maven npm openjdk-8* python-dev python3-dev qml-module-qtquick-controls qtdeclarative5-dev unzip -y

# configure npm
RUN npm config set spin=false && \
    npm config set progress=false

# install node
RUN npm install n -g
RUN n $NODE_VERSION

# download buck
RUN git clone https://github.com/facebook/buck.git /opt/buck --branch $BUCK_VERSION --depth=1
WORKDIR /opt/buck

# build buck
RUN ant

# Full reference at https://dl.google.com/android/repository/repository2-1.xml
# download and unpack android
RUN mkdir /opt/android && \
 cd /opt/android && \
 curl --silent https://dl.google.com/android/repository/${SDK_VERSION} > android.zip && \
 unzip android.zip && \
 rm android.zip

# download and unpack NDK
RUN mkdir /opt/ndk && \
  cd /opt/ndk && \
  curl --silent https://dl.google.com/android/repository/android-ndk-r$NDK_VERSION-linux-x86_64.zip > ndk.zip && \
  unzip ndk.zip && \
  rm ndk.zip

# Add android SDK tools
RUN sdkmanager "system-images;android-19;google_apis;armeabi-v7a" \
    "platforms;android-$ANDROID_BUILD_VERSION" \
    "build-tools;$ANDROID_TOOLS_VERSION" \
    "add-ons;addon-google_apis-google-23" \
    "extras;android;m2repository"

# clean up unnecessary directories
RUN rm -rf /opt/android/system-images/android-19/default/x86

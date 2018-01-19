FROM library/ubuntu:16.04

# set default build arguments
ARG ANDROID_TOOLS_VERSION=25.2.5
ARG BUCK_VERSION=v2017.11.16.01
ARG NDK_VERSION=10e
ARG NODE_VERSION=6.2.0
ARG WATCHMAN_VERSION=4.7.0

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
RUN npm config set spin=false
RUN npm config set progress=false

# install node
RUN npm install n -g
RUN n $NODE_VERSION

# download buck
RUN git clone https://github.com/facebook/buck.git /opt/buck --branch $BUCK_VERSION --depth=1
WORKDIR /opt/buck

# build buck
RUN ant

# download watchman
RUN git clone https://github.com/facebook/watchman.git /opt/watchman
WORKDIR /opt/watchman
RUN git checkout v$WATCHMAN_VERSION

# build watchman
RUN ./autogen.sh
RUN ./configure
RUN make
RUN make install

# Full reference at https://dl.google.com/android/repository/repository2-1.xml
# download and unpack android
RUN mkdir /opt/android
WORKDIR /opt/android
RUN curl --silent https://dl.google.com/android/repository/tools_r$ANDROID_TOOLS_VERSION-linux.zip > android.zip
RUN unzip android.zip
RUN rm android.zip

# download and unpack NDK
RUN mkdir /opt/ndk
WORKDIR /opt/ndk
RUN curl --silent https://dl.google.com/android/repository/android-ndk-r$NDK_VERSION-linux-x86_64.zip > ndk.zip
RUN unzip ndk.zip

# cleanup NDK
RUN rm ndk.zip

# Add android SDK tools
RUN echo "y" | sdkmanager "system-images;android-19;google_apis;armeabi-v7a"
RUN echo "y" | sdkmanager "platforms;android-23"
RUN echo "y" | sdkmanager "platforms;android-19"
RUN echo "y" | sdkmanager "build-tools;23.0.1"
RUN echo "y" | sdkmanager "add-ons;addon-google_apis-google-23"
RUN echo "y" | sdkmanager "extras;android;m2repository"

# Link adb executable
RUN ln -s /opt/android/platform-tools/adb /usr/bin/adb

# clean up unnecessary directories
RUN rm -rf /opt/android/system-images/android-19/default/x86

FROM library/ubuntu:16.04

# set default build arguments
ARG ANDROID_VERSION=25.2.3
ARG BUCK_VERSION=f3452a6a7ab15a60e94c962e686293acbe677473
ARG NDK_VERSION=10e
ARG NODE_VERSION=6.2.0
ARG WATCHMAN_VERSION=4.7.0

# set default environment variables
ENV ADB_INSTALL_TIMEOUT=10
ENV PATH=${PATH}:/opt/buck/bin/
ENV ANDROID_HOME=/opt/android
ENV ANDROID_SDK_HOME=${ANDROID_HOME}
ENV PATH=${PATH}:${ANDROID_HOME}/tools:${ANDROID_HOME}/platform-tools
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
RUN git clone https://github.com/facebook/buck.git /opt/buck
WORKDIR /opt/buck
RUN git checkout $BUCK_VERSION

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

# download and unpack android
RUN mkdir /opt/android
WORKDIR /opt/android
RUN curl --silent https://dl.google.com/android/repository/tools_r$ANDROID_VERSION-linux.zip > android.zip
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

# Android SDK Platform-tools, revision 25.0.4
RUN echo "y" | android update sdk -u -a -t $(android list sdk -a | grep "Android SDK Platform-tools, revision 25.0.4" | awk '{ print $1 }' | sed 's/.$//')

# Android SDK Build-tools, revision 23.0.1
RUN echo "y" | android update sdk -u -a -t $(android list sdk -a | grep "Android SDK Build-tools, revision 23.0.1" | awk '{ print $1 }' | sed 's/.$//')

# SDK Platform Android 6.0, API 23, revision 3
RUN echo "y" | android update sdk -u -a -t $(android list sdk -a | grep "SDK Platform Android 6.0, API 23" | awk '{ print $1 }' | sed 's/.$//')

# SDK Platform Android 4.4.2, API 19, revision 4
RUN echo "y" | android update sdk -u -a -t $(android list sdk -a | grep "SDK Platform Android 4.4.2, API 19, revision 4" | awk '{ print $1 }' | sed 's/.$//')

# ARM EABI v7a System Image, Android API 19, revision 5
RUN echo "y" | android update sdk -u -a -t $(android list sdk -a | grep "ARM EABI v7a System Image, Android API 19, revision 5" | awk '{ print $1 }' | sed 's/.$//')

# Intel x86 Atom System Image, Android API 19, revision 5
RUN echo "y" | android update sdk -u -a -t $(android list sdk -a | grep "Intel x86 Atom System Image, Android API 19, revision 5" | awk '{ print $1 }' | sed 's/.$//')

# Google APIs, Android API 23, revision 1
RUN echo "y" | android update sdk -u -a -t $(android list sdk -a | grep "Google APIs, Android API 23, revision 1" | awk '{ print $1 }' | sed 's/.$//')

# Android Support Repository, revision 45
RUN echo "y" | android update sdk -u -a -t $(android list sdk -a | grep "Android Support Repository" | awk '{ print $1 }' | sed 's/.$//')

# Link adb executable
RUN ln -s /opt/android/platform-tools/adb /usr/bin/adb

# Install google-chrome
RUN curl -fsSL https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
     && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
     && apt-get update \
     && apt-get install -y google-chrome-stable

# clean up unnecessary directories
RUN rm -rf /opt/android/system-images/android-19/default/x86

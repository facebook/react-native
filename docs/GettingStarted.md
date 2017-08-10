---
id: quick-start-getting-started
title: Getting Started
layout: docs
category: The Basics
permalink: docs/getting-started.html
next: tutorial
---

<style>
  .toggler li {
    display: inline-block;
    position: relative;
    top: 1px;
    padding: 10px;
    margin: 0px 2px 0px 2px;
    border: 1px solid #05A5D1;
    border-bottom-color: transparent;
    border-radius: 3px 3px 0px 0px;
    color: #05A5D1;
    background-color: transparent;
    font-size: 0.99em;
    cursor: pointer;
  }
  .toggler li:first-child {
    margin-left: 0;
  }
  .toggler li:last-child {
    margin-right: 0;
  }
  .toggler ul {
    width: 100%;
    display: inline-block;
    list-style-type: none;
    margin: 0;
    border-bottom: 1px solid #05A5D1;
    cursor: default;
  }
  @media screen and (max-width: 960px) {
    .toggler li,
    .toggler li:first-child,
    .toggler li:last-child {
      display: block;
      border-bottom-color: #05A5D1;
      border-radius: 3px;
      margin: 2px 0px 2px 0px;
    }
    .toggler ul {
      border-bottom: 0;
    }
  }
  .toggler a {
    display: inline-block;
    padding: 10px 5px;
    margin: 2px;
    border: 1px solid #05A5D1;
    border-radius: 3px;
    text-decoration: none !important;
  }
  .display-guide-quickstart .toggler .button-quickstart,
  .display-guide-native .toggler .button-native,
  .display-os-mac .toggler .button-mac,
  .display-os-linux .toggler .button-linux,
  .display-os-windows .toggler .button-windows,
  .display-platform-ios .toggler .button-ios,
  .display-platform-android .toggler .button-android {
    background-color: #05A5D1;
    color: white;
  }
  block { display: none; }
  .display-guide-quickstart.display-platform-ios.display-os-mac .quickstart.ios.mac,
  .display-guide-quickstart.display-platform-ios.display-os-linux .quickstart.ios.linux,
  .display-guide-quickstart.display-platform-ios.display-os-windows .quickstart.ios.windows,
  .display-guide-quickstart.display-platform-android.display-os-mac .quickstart.android.mac,
  .display-guide-quickstart.display-platform-android.display-os-linux .quickstart.android.linux,
  .display-guide-quickstart.display-platform-android.display-os-windows .quickstart.android.windows,    .display-guide-native.display-platform-ios.display-os-mac .native.ios.mac,
  .display-guide-native.display-platform-ios.display-os-linux .native.ios.linux,
  .display-guide-native.display-platform-ios.display-os-windows .native.ios.windows,
  .display-guide-native.display-platform-android.display-os-mac .native.android.mac,
  .display-guide-native.display-platform-android.display-os-linux .native.android.linux,
  .display-guide-native.display-platform-android.display-os-windows .native.android.windows {
    display: block;
  }
</style>

이 페이지는 여러분이 첫 React Native 앱을 설치하고 빌드하는 데 도움을 드리기 위한 페이지입니다. React Native가 이미 설치되어 있으시다면, 바로 [Tutorial](docs/tutorial.html)로 넘어가셔도 좋습니다.

<div class="toggler">
  <ul role="tablist" >
    <li id="quickstart" class="button-quickstart" aria-selected="false" role="tab" tabindex="0" aria-controls="quickstarttab" onclick="displayTab('guide', 'quickstart')">
      Quick Start
    </li>
    <li id="native" class="button-native" aria-selected="false" role="tab" tabindex="-1" aria-controls="nativetab" onclick="displayTab('guide', 'native')">
      네이티브 환경에서 프로젝트 빌드하기
    </li>
  </ul>
</div>

<block class="quickstart mac windows linux ios android" />

새로운 React Native 애플리케이션을 만드는 가장 쉬운 방법은 React Community에 소개된 
[Create React Native App](https://github.com/react-community/create-react-native-app) 페이지를 참고하여 진행하는 것입니다. 어떠한 프로그램의 설치나 환경설정 없이도 새 프로젝트를 시작할 수 있습니다 - Xcode 혹은 Android Studio를 설치할 필요가 없습니다. (하지만 반드시 [주의사항](docs/getting-started.html#주의사항)을 숙지하세요)

컴퓨터에 [Node](https://nodejs.org/en/download/)가 설치되어 있다면, command line 유틸리티(터미널 등)에 다음과 같이 입력하세요:

```
npm install -g create-react-native-app
```

그런 다음 "AwesomeProject"라는 새로운 React Native 프로젝트 생성을 위해 다음과 같이 입력하세요:

```
create-react-native-app AwesomeProject

cd AwesomeProject
npm start
```

개발 서버가 시작되고, 터미널에 QR코드가 출력될 것입니다.

## React Native 어플리케이션 실행하기

iOS 또는 Android 스마트폰에 [Expo](https://expo.io) 클라이언트 앱을 설치하고 컴퓨터와 동일한 무선 네트워크에 연결합니다. [Expo](https://expo.io) 앱을 통해 터미널에서 QR코드를 스캔하여 프로젝트를 엽니다.

### 앱 수정하기

앱을 성공적으로 실행했으므로, 이제 원하는 대로 수정해봅시다. 텍스트 에디터를 통해 `App.js`를 열고 코드를 수정합니다. 변경 사항을 저장하면 앱이 자동으로 다시 로드됩니다.

### 끝났습니다!

축하합니다! 당신은 방금 첫 번째 React Native 앱을 성공적으로 실행하고 수정까지 하셨습니다!

<center><img src="img/react-native-congratulations.png" width="150"></img></center>

## 이제는 무엇을 해야할까요?

- Create React Native App은 특정 도구들에 대해 궁금한 점이 있을 때 참고할 수 있는 [user guide](https://github.com/react-community/create-react-native-app/blob/master/react-native-scripts/template/README.md)가 있습니다.

- [user guide](https://github.com/react-community/create-react-native-app/blob/master/react-native-scripts/template/README.md)에서도 해결되지 않는 문제라면, [Troubleshooting](https://github.com/react-community/create-react-native-app/blob/master/react-native-scripts/template/README.md#troubleshooting) 페이지에서 Create React Native App에 대한 README를 읽어보세요.

React Native에 대해 더 많이 배우고 싶다면, [Tutorial](docs/tutorial.html)에서 계속 진행하세요.

### 만든 앱을 시뮬레이터나 가상 장치에서 실행하기

Create React Native App은 별도의 개발 환경 없이 실제 장치에서 React Native 앱을 쉽게 실행해볼 수 있도록 도와줍니다. 앱을 iOS 시뮬레이터나 Android 가상 장치에서 실행하고 싶다면, 네이티브 코드로 프로젝트를 빌드하는 방법을 설명한 지침서를 참조하세요. Xcode를 설치하고 Android 개발 환경을 설정하는 과정이 필요하기 때문입니다.

위와 같은 과정을 한 번만 거치면 `npm run android`라는 명령어를 통해서 Android 가상 장치 위에 자신이 만든 앱을 실제로 올려볼 수 있습니다. iOS 시뮬레이터의 경우에는 `npm run ios` 명령어를 통해 실행 가능합니다. (단, iOS 시뮬레이터는 macOS에서만 실행이 가능합니다.)

### 주의사항

Create React Native App을 사용하면 네이티브 코드를 전혀 사용하지 않기 때문에 React Native API 및 Expo 클라이언트에서 사용하는 컴포넌트 이외에, 사용자들이 별도로 만든 custom 모듈은 사용할 수 없습니다.

Create React Native App을 통해 프로젝트를 시작하는 방법은 추후 네이티브 코드 작성이 필요하더라도 큰 문제가 없습니다. 대신 그런 경우에는 네이티브 코드 작성을 위해 "[eject](https://github.com/react-community/create-react-native-app/blob/master/react-native-scripts/template/README.md#ejecting-from-create-react-native-app)" 과정을 거쳐야합니다. Eject 과정 숙지를 위해서는 "네이티브 환경에서 프로젝트 빌드하기" 지침서를 참고하는 것이 좋습니다.

Create React Native App은 Expo 클라이언트 앱에서 지원되는 가장 최근 버전의 React Native를 사용하기 위해 프로젝트를 설정을 변경합니다. Expo 클라이언트 앱은 일반적으로 React Native 안정화 버전이 나오고 약 1주일 후부터 해당 버전에 대한 지원을 받습니다. [버전](https://github.com/react-community/create-react-native-app/blob/master/VERSIONS.md)문서에서 어떤 버전이 지원되는지 확인할 수 있습니다.

기존 프로젝트에 React Native를 통합하고 싶은 경우에, Create React Native App을 생략하고 바로 네이티브 빌드 환경을 구축하는 것이 가능합니다. React Native의 네이티브 빌드 환경 구성방법에 대한 자세한 내용은 "네이티브 환경에서 프로젝트 빌드하기" 지침서를 참고하세요.

<block class="native mac windows linux ios android" />

<p>프로젝트 내에서 네이티브 코드 작성이 필요하다면 이 지침서를 따르세요. 예를 들어 기존 어플리케이션에 React Native를 포함시키는 경우, 또는 Create React Native App에서 "eject"된 상태인 경우에 이 지침서가 필요합니다.</p>

개발 환경 및 운영체제에 따라서, iOS용 혹은 Android용으로 개발을 시작할 것인지에 따라서 과정에 약간의 차이가 있습니다. iOS와 Android를 동시에 개발하는 경우에는 먼저 어떤 것부터 시작할 것인지만 선택하세요.

<div class="toggler">
  <span>개발환경:</span>
  <a href="javascript:void(0);" class="button-mac" onclick="displayTab('os', 'mac')">macOS</a>
  <a href="javascript:void(0);" class="button-windows" onclick="displayTab('os', 'windows')">Windows</a>
  <a href="javascript:void(0);" class="button-linux" onclick="displayTab('os', 'linux')">Linux</a>
  <span>앱 OS:</span>
  <a href="javascript:void(0);" class="button-ios" onclick="displayTab('platform', 'ios')">iOS</a>
  <a href="javascript:void(0);" class="button-android" onclick="displayTab('platform', 'android')">Android</a>
</div>

<block class="native linux windows ios" />

## 미지원

<blockquote><p>네이티브 코드를 통하여 iOS용으로 작성된 프로젝트를 빌드하기 위해서는 반드시 Mac이 필요합니다. 네이티브 코드가 필요하지 않다면 <a href="docs/getting-started.html" onclick="displayTab('guide', 'quickstart')">Quick Start</a>에서 Create React Native App을 통해 어떻게 앱을 빌드할 수 있는지 배울 수 있습니다.</p></blockquote>


<block class="native mac ios" />

## 사전 설치

Node, Watchman, React Native command line interface, Xcode가 필요합니다.

자신이 원하는 에디터를 사용해 앱을 개발할 수도 있지만, iOS용 React Native 앱을 빌드할 때 꼭 필요한 도구들 사용하려면 결국 Xcode가 필요하게 됩니다.

<block class="native mac android" />

## 사전 설치

Node, Watchman, React Native command line interface, JDK, Android Studio가 필요합니다.

<block class="native linux android" />

## 사전 설치

Node, React Native command line interface, JDK, Android Studio가 필요합니다.

<block class="native windows android" />

## 사전 설치

Node, React Native command line interface, Python2, JDK, Android Studio가 필요합니다.

<block class="native mac windows linux android" />

자신이 원하는 에디터를 사용해 앱을 개발할 수도 있지만, Android용 React Native 앱을 빌드할 때 꼭 필요한 도구들 사용하려면 결국 Android Studio가 필요하게 됩니다.

<block class="native mac ios android" />

### Node, Watchman

Node와 Watchman은 [Homebrew](http://brew.sh/)를 통해 설치하는 방법을 권장합니다. Homebrew가 설치되었다면 Node와 Watchman을 설치하기 위해 다음과 같이 입력하세요:

```
brew install node
brew install watchman
```

이미 Node가 설치되어 있는 경우, Node의 버전이 4 이상인지 꼭 확인해보세요.

Facebook이 만든 [Watchman](https://facebook.github.io/watchman)은 파일 시스템의 변화를 모니터링하는 도구입니다. 더 나은 퍼포먼스를 위해 설치할 것을 강력히 권장합니다.

<block class="native linux android" />

### Node

Node 버전 6(혹은 더 최신버전)을 설치하기 위해 [installation instructions for your Linux distribution](https://nodejs.org/en/download/package-manager/)를 참고하세요.

<block class='native windows android' />

### Node, Python2, JDK

Node와 Python은 Windows의 package manager인 [Chocolatey](https://chocolatey.org)를 통해 설치하는 방법을 권장합니다.

최신 버전의 [Java SE Development Kit (JDK)](http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html)와 Python 2 설치 또한 필요합니다. 마찬가지로 Chocolatey를 통해 설치할 수 있습니다.

관리자 권한을 통해 명령 프롬프트를 열고(명령 프롬프트에 오른쪽 마우스 버튼을 눌러 "관리자 권한으로 실행"을 선택), 다음과 같이 입력하세요: 

```powershell
choco install -y nodejs.install python2 jdk8
```

이미 Node가 설치되어 있는 경우, Node의 버전이 4 이상인지 꼭 확인해보세요. JDK의 경우에는 8 이상의 버전이 필요합니다.

> Node의 추가적인 설치 옵션을 확인하려면 [Node's Downloads page](https://nodejs.org/en/download/)페이지를 참고하세요.

<block class="native mac ios android" />

### The React Native CLI

Node는 npm과 함께 제공되며, React Native command line interface(CLI) 설치가 가능해집니다.

React Native CLI 설치를 위해 터미널에서 다음과 같이 입력하세요:

```
npm install -g react-native-cli
```

> `Cannot find module 'npmlog'`라는 에러가 발생한다면, 다음 명령어를 통해 npm을 바로 설치하세요: `curl -0 -L https://npmjs.org/install.sh | sudo sh`.

<block class="native windows linux android" />

### The React Native CLI

Node는 npm과 함께 제공되며, React Native command line interface(CLI) 설치가 가능해집니다.

React Native CLI 설치를 위해 명령 프롬프트 또는 쉘에서 다음과 같이 입력하세요:

```powershell
npm install -g react-native-cli
```

> `Cannot find module 'npmlog'`라는 에러가 발생한다면, 다음 명령어를 통해 npm을 바로 설치하세요: `curl -0 -L https://npmjs.org/install.sh | sudo sh`.

<block class="native mac ios" />

### Xcode

Xcode는 [Mac App Store](https://itunes.apple.com/us/app/xcode/id497799835?mt=12)를 통해 설치하는 방법이 가장 쉽고 간단합니다. Xcode를 설치함으로써 iOS 시뮬레이터와 iOS용 앱을 빌드하기 위한 모든 필수 도구들을 설치할 수 있습니다.

이미 Xcode가 설치되어 있는 경우, Xcode의 버전이 8 이상인지 꼭 확인해보세요.

#### Command Line Tools

Xcode를 설치하고 나면, 추가적으로 Xcode Command Line Tools에 대한 설정이 필요합니다. Xcode를 열고, 메뉴의 "Preferences..."를 선택하세요. Locations 탭의 Command Line Tools 드롭다운에서 가장 최신 버전의 도구를 선택(필요한 경우 설치)하면 됩니다.

![Xcode Command Line Tools](img/XcodeCommandLineTools.png)

<block class="native mac linux android" />

### Java Development Kit

React Native는 최신 버전의 Java SE Development Kit (JDK)가 필요합니다. 설치되어 있지 않은 경우 [여기](http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html)에서 버전 8 혹은 더 최신 버전을 다운로드 받으세요.

<block class="native mac linux windows android" />

### Android 개발 환경

Android 개발 환경을 새로 구축해봅시다. 이미 Android 개발에 익숙하더라도, React Native 프로젝트를 위해 몇 가지 설정해야 할 것들이 있습니다. 초보자든 숙련자든, 다음의 몇 가지 과정을 차근차근 주의 깊게 따라오셔야 합니다.

<block class="native mac windows linux android" />

#### 1. Android Studio 설치하기

[Android Studio](https://developer.android.com/studio/index.html)를 다운로드 및 설치하시기 바랍니다. 설치 유형을 선택하라는 메시지가 표시되면, "custom"를 선택하세요. 그리고 체크박스에서 다음 항목들이 체크되어 있는지 확인하세요:

<block class="native mac windows android" />

- `Android SDK`
- `Android SDK Platform`
- `Performance (Intel ® HAXM)`
- `Android Virtual Device`

<block class="native linux android" />

- `Android SDK`
- `Android SDK Platform`
- `Android Virtual Device`

<block class="native mac windows linux android" />

그 다음, "Next"을 클릭하여 위 컴포넌트들을 모두 설치하세요.

> 현재 선택 불가능한 상태여도 괜찮습니다. 나중에 다시 설치할 수 있습니다.

일단 설치가 완료되고 Welcome 페이지가 등장하면, 다음 단계로 넘어가세요.

#### 2. Android SDK 설치하기

Android Studio는 기본적으로 가장 최신 버전의 Android SDK를 설치하게 되어 있습니다. 하지만 네이티브 코드로 React Native 앱을 빌드하는 경우, `Android 6.0 (Marshmallow)` SDK가 부분적으로 필요하게 됩니다. 추가적인 Android SDK 설치는 Android Studio의 SDK Manager를 통해 설치할 수 있습니다.

SDK Manager는 "Welcome to Android Studio" 스크린에서 접근이 가능합니다. "Configure"을 클릭하고 "SDK Manager"를 선택하세요.

<block class="native mac android" />

![Android Studio Welcome](img/AndroidStudioWelcomeMacOS.png)

<block class="native windows android" />

![Android Studio Welcome](img/AndroidStudioWelcomeWindows.png)

<block class="native mac windows linux android" />

> SDK Manager는 Android Studio "Preferences" 메뉴 안의 **Appearance & Behavior** → **System Settings** → **Android SDK** 에서도 설정이 가능합니다.

SDK Manager에서 "SDK Platforms" 탭을 선택하면 오른쪽 하단에 "Show Package Details"가 보입니다. 체크하면 `Android 6.0 (Marshmallow)`의 세부 항목들이 나타나게 되는데, 이 때 다음 항목들이 제대로 체크되어 있는지 확인하세요:

- `Google APIs`
- `Android SDK Platform 23`
- `Intel x86 Atom_64 System Image`
- `Google APIs Intel x86 Atom_64 System Image`

<block class="native mac android" />

![Android SDK Manager](img/AndroidSDKManagerMacOS.png)

<block class="native windows android" />

![Android SDK Manager](img/AndroidSDKManagerWindows.png)

<block class="native windows mac linux android" />

다음으로, "SDK Tools" 탭을 선택하고 마찬가지로 "Show Package Details"를 체크해줍니다. 이 때 "Android SDK Build-Tools"의 세부 항목들 중에서 `23.0.1`이 체크되어 있는지 확인하세요.

<block class="native mac android" />

![Android SDK Manager - 23.0.1 Build Tools](img/AndroidSDKManagerSDKToolsMacOS.png)

<block class="native windows android" />

![Android SDK Manager - 23.0.1 Build Tools](img/AndroidSDKManagerSDKToolsWindows.png)

<block class="native windows mac linux android" />

마지막으로, "Apply"를 클릭하면 Android SDK와 그와 관련된 빌드 도구들을 다운로드하고 설치하게 됩니다.

<block class="native mac android" />

![Android SDK Manager - Installs](img/AndroidSDKManagerInstallsMacOS.png)

<block class="native windows android" />

![Android SDK Manager - Installs](img/AndroidSDKManagerInstallsWindows.png)

<block class="native mac windows linux android" />

#### 3. ANDROID_HOME 환경변수 설정하기

React Native 도구들은 네이티브 코드로 앱을 빌드하기 위한 환경변수 설정이 필요합니다.

<block class="native mac linux android" />

`$HOME/.bash_profile`에 다음 행을 추가하세요:

<block class="native mac android" />

```
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

<block class="native linux android" />

```
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

<block class="native mac linux android" />

> `.bash_profile` 파일 수정은 `bash` shell을 사용하는 경우로 한정됩니다. 다른 종류의 shell을 사용하신다면, 그 shell에 맞는 설정 파일을 수정하셔야 합니다.

`source $HOME/.bash_profile`를 입력하여 설정 파일을 현재 shell에 로드하세요. `echo $PATH` 명령어를 실행하여 ANDROID_HOME이 정상적으로 출력이 되는지 확인하세요.

> 반드시 적절한 Android SDK 경로를 지정했는지 확인해야합니다. 실제 SDK의 설치 경로는 Android Studio "Preferences" 메뉴에서 **Appearance & Behavior** → **System Settings** → **Android SDK**를 차례로 따라가면 확인할 수 있습니다.

<block class="native windows android" />

제어판에서 시스템 및 보안 탭의 **시스템**을 열고, 왼쪽 메뉴에서 **고급 시스템 설정**을 클릭하세요. **고급** 탭을 선택하고 맨 아래에 **환경변수...**를 클릭합니다. 그런 다음 사용자 변수에 있는 **새로 만들기**를 눌러 변수 이름에는 `ANDROID_HOME` 을 입력하고, 변수 값에는 Android SDK의 경로를 입력해줍니다. 

![ANDROID_HOME Environment Variable](img/AndroidEnvironmentVariableANDROID_HOME.png)

SDK는 기본 설치 경로는 다음과 같습니다:

```powershell
c:\Users\YOUR_USERNAME\AppData\Local\Android\Sdk
```

실제 SDK의 설치 경로는 Android Studio "Preferences" 메뉴에서 **Appearance & Behavior** → **System Settings** → **Android SDK**를 차례로 따라가면 확인할 수 있습니다.

다음 단계로 넘어가기 전에, 새 명령 프롬프트 창을 열고 새 환경 변수가 로드되었는지 확인해주시기 바랍니다.


<block class="native linux android" />

### Watchman (선택사항)

[Watchman 설치 가이드](https://facebook.github.io/watchman/docs/install.html#build-install)를 참고하여 Watchman을 컴파일하고 설치하세요.

> [Watchman](https://facebook.github.io/watchman/docs/install.html)은 파일시스템의 변화를 체크하기 위해 페이스북에서 만든 도구입니다. 더 나은 퍼포먼스를 위해 Watchman 설치를 강력히 추천합니다.

<block class="native mac ios" />

## 새로운 어플리케이션 만들기

React Native CLI에 다음과 같이 입력하여 "AwesomeProject"라는 새 프로젝트를 만들어 보세요:

```
react-native init AwesomeProject
```

기존 어플리케이션에 React Native를 통합하려는 경우, Create React Native App에서 "eject"된 경우, React Native 프로젝트에 iOS 네이티브 기능을 추가하려는 경우([Platform Specific Code](docs/platform-specific-code.html)를 참고)에는 생략해도 됩니다.

<block class="native mac windows linux android" />

## 새로운 어플리케이션 만들기

React Native command line interface에 다음과 같이 입력하여 "AwesomeProject"라는 새 프로젝트를 만들어 보세요:

```
react-native init AwesomeProject
```

기존 어플리케이션에 React Native를 통합하려는 경우, Create React Native App에서 "eject"된 경우, React Native 프로젝트에 Android 네이티브 기능을 추가하려는 경우([Platform Specific Code](docs/platform-specific-code.html)를 참고)에는 생략해도 됩니다.

<block class="native mac windows linux android" />

## Android 장치 준비하기

React Native Android 앱을 실행하기 위해서는 Android 장치가 필요합니다. 실제 Android 장치를 사용할 수도 있지만, 컴퓨터에서 Android 가상 장치를 에뮬레이트하여 테스트 하기도 합니다.

어쨌거나, Android 앱 개발을 위해서는 어떠한 형태로든 Android 장치가 필요하다는 사실!

### 실제 Android 장치 사용하기

실제 Android 장치가 있으시다면, 장치를 USB 케이블을 통해 컴퓨터에 연결하고 [이 지침서](docs/running-on-device.html)를 참고하여 Android 앱 개발에 사용할 수 있습니다.

### 가상 Android 장치 사용하기

Android Studio에서 "AVD Manager"를 열면 사용 가능한 Android 가상 장치(AVD)의 목록을 확인할 수 있습니다. 아래와 같은 모양의 아이콘을 찾으세요:

![Android Studio AVD Manager](img/react-native-tools-avd.png)

방금 Android Studio를 설치하셨다면, [새 Android 가상 장치 만들기](https://developer.android.com/studio/run/managing-avds.html) 페이지를 참고하세요. "Create Virtual Device..."를 선택하고 원하시는 장치를 선택한 후 "Next"를 클릭하세요.

<block class="native windows android" />

![Android Studio AVD Manager](img/CreateAVDWindows.png)

<block class="native mac android" />

![Android Studio AVD Manager](img/CreateAVDMacOS.png)

<block class="native mac windows linux android" />

"x86 Images" 탭에서, **Marshmallow** API Level 23, x86_64, Android 6.0 (Google APIs)인 항목을 선택하면 됩니다. 필요한 경우에는 Release Name에서 Download를 클릭하여 다운로드 받아야합니다(창이 하나 뜨면, 간단한 동의 후 설치하시면 됩니다).

<block class="native linux android" />

> 퍼포먼스 향상을 위해 [VM acceleration](https://developer.android.com/studio/run/emulator-acceleration.html#vm-linux) 설정을 하시길 권장합니다. 위 과정을 따라하신 후, AVD Manager 설정 과정으로 다시 돌아오세요.

<block class="native windows android" />

![Install HAXM](img/CreateAVDx86Windows.png)

> HAXM이 설치되어 있지 않다면, "Install HAXM"을 눌러 설치하세요. [이 지침서](https://software.intel.com/en-us/android/articles/installation-instructions-for-intel-hardware-accelerated-execution-manager-windows)을 참고하면 설치 과정에서 도움을 받을 수 있습니다. 설정이 완료되면, AVD Manager 설정 과정으로 다시 돌아오세요.

![AVD List](img/AVDManagerWindows.png)

<block class="native mac android" />

![Install HAXM](img/CreateAVDx86MacOS.png)

> HAXM이 설치되어 있지 않다면, "Install HAXM"을 눌러 설치하세요. [이 지침서](https://software.intel.com/en-us/android/articles/installation-instructions-for-intel-hardware-accelerated-execution-manager-windows)을 참고하면 설치 과정에서 도움을 받을 수 있습니다. 설정이 완료되면, AVD Manager 설정 과정으로 다시 돌아오세요.

![AVD List](img/AVDManagerMacOS.png)

<block class="native mac windows linux android" />

"Next"를 클릭하고, "Finish"를 누르면 새 AVD 설정 과정이 마무리됩니다. 이제 녹색 삼각형(재생 모양) 버튼을 클릭하면 AVD를 실행할 수 있습니다.

<block class="native mac ios" />

## React Native 어플리케이션 실행하기

React Native 프로젝트 폴더로 이동 후 어플리케이션을 실행해보세요:

```
cd AwesomeProject
react-native run-ios
```

앱이 iOS 시뮬레이터에서 실행되는 것을 볼 수 있습니다.

![AwesomeProject on iOS](img/iOSSuccess.png)

`react-native run-ios` 명령어는 만든 앱을 실행하는 가장 일반적인 방법입니다. Xcode나 [Nuclide](https://nuclide.io/)에서도 직접 실행할 수 있습니다.

> 앱이 제대로 실행되지 않거나 문제가 발생한다면, [Troubleshooting](docs/troubleshooting.html#content) 페이지를 참고하세요.

### 실제 장치에서 구동하기

위 명령어를 이용하면 앱은 기본적으로 iOS 시뮬레이터에서 실행됩니다. 실제 장치에서 앱을 구동하고 싶다면 [이 문서](docs/running-on-device.html)의 과정을 따라하세요.

<block class="native mac windows linux android" />

## React Native 어플리케이션 실행하기

React Native 프로젝트 폴더로 이동 후 어플리케이션을 실행해보세요:

```
cd AwesomeProject
react-native run-android
```

앱이 Android 에뮬레이터에서 실행되는 것을 볼 수 있습니다.

<block class="native mac android" />

![AwesomeProject on Android](img/AndroidSuccessMacOS.png)

<block class="native windows android" />

![AwesomeProject on Android](img/AndroidSuccessWindows.png)

<block class="native mac windows linux android" />

`react-native run-android` 명령어는 만든 앱을 실행하는 가장 일반적인 방법입니다. Android Studio나 [Nuclide](https://nuclide.io/)에서도 직접 실행할 수 있습니다.

> 앱이 제대로 실행되지 않거나 문제가 발생한다면, [Troubleshooting](docs/troubleshooting.html#content) 페이지를 참고하세요.

<block class="native mac ios android" />

### 앱 수정하기

앱을 성공적으로 실행했으므로, 이제 원하는 대로 수정해봅시다.

<block class="native mac ios" />

- 텍스트 에디터에서 `index.ios.js`를 열고 코드를 수정합니다.
- `⌘R` 명령어를 통해 iOS 시뮬레이터가 새로고침 되면서 변경사항을 확인할 수 있습니다.

<block class="native mac android" />

- 텍스트 에디터에서 `index.android.js`를 열고 코드를 수정합니다.
- `R` 키를 두 번 누르거나 개발자 메뉴(`⌘M`)에서 `Reload`를 선택하면 변경사항을 확인할 수 있습니다.

<block class="native windows linux android" />

### 앱 수정하기

앱을 성공적으로 실행했으므로, 이제 원하는 대로 수정해봅시다.

- 텍스트 에디터에서 `index.android.js` 를 열고 코드를 수정합니다.
- `R` 키를 두 번 누르거나 개발자 메뉴(`⌘M`)에서 `Reload`를 선택하면 변경사항을 확인할 수 있습니다.

<block class="native mac ios android" />

### 끝났습니다!

축하합니다! 당신은 방금 첫 번째 React Native 앱을 성공적으로 실행하고 수정까지 하셨습니다!

<center><img src="img/react-native-congratulations.png" width="150"></img></center>

<block class="native windows linux android" />

### 끝났습니다!

축하합니다! 당신은 방금 첫 번째 React Native 앱을 성공적으로 실행하고 수정까지 하셨습니다!

<center><img src="img/react-native-congratulations.png" width="150"></img></center>

<block class="native mac ios" />

## 이제는 무엇을 해야할까요?

- 개발자 메뉴의 [Live Reload](docs/debugging.html#reloading-javascript) 옵션을 활성화하면 프로젝트 저장과 동시에 앱이 새로고침 되면서 변경사항을 바로 확인할 수 있습니다!

- 기존 어플리케이션에 React Native 코드를 추가하고 싶다면 [Integration guide](docs/integration-with-existing-apps.html)를 참고하세요.

React Native에 대해 좀 더 배우고 싶다면 [Tutorial](docs/tutorial.html)로 가서 진행하시면 됩니다.

<block class="native windows linux mac android" />

## 이제는 무엇을 해야할까요?

- 개발자 메뉴의 [Live Reload](docs/debugging.html#reloading-javascript) 옵션을 활성화하면 프로젝트 저장과 동시에 앱이 새로고침 되면서 변경사항을 바로 확인할 수 있습니다!

- 기존 어플리케이션에 React Native 코드를 추가하고 싶다면 [Integration guide](docs/integration-with-existing-apps.html)를 참고하세요.

React Native에 대해 좀 더 배우고 싶다면, [Tutorial](docs/tutorial.html)에서 계속 진행하세요.

<script>
function displayTab(type, value) {
  var container = document.getElementsByTagName('block')[0].parentNode;
  container.className = 'display-' + type + '-' + value + ' ' +
    container.className.replace(RegExp('display-' + type + '-[a-z]+ ?'), '');
  event && event.preventDefault();
}
</script>

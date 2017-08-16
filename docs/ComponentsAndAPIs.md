---
id: components
title: 컴포넌트와 API
layout: docs
category: Guides
permalink: docs/components-and-apis.html
next: platform-specific-code
previous: more-resources
---

React Native는 이미 많은 기본 컴포넌트를 자체적으로 포함하여 제공합니다.
제공되는 컴포넌트와 관련 API에 대한 상세정보는 왼쪽 메뉴의 각 항목에서 확인 할 수 있습니다.
어떤 컴포넌트부터 시작해야 할지 확실치 않다면 아래 항목부터 확인해 볼 것을 권합니다.  

- [기본 컴포넌트](docs/components-and-apis.html#basic-components)
- [사용자 인터페이스](docs/components-and-apis.html#user-interface)
- [리스트 뷰](docs/components-and-apis.html#lists-views)
- [iOS 전용 컴포넌트와 API](docs/components-and-apis.html#ios-components-and-apis)
- [Android 전용 컴포넌트와 API](docs/components-and-apis.html#android-components-and-apis)
- [기타 컴포넌트와 API](docs/components-and-apis.html#others)

React Native에 사전에 포함되어 제공하는 컴포넌트와 API만을 사용할 필요는 없습니다.
React Native는 전세계 개발자들에 의한 다양한 커뮤니티를 가지고 있어서 특정한 용도의 라이브러리를 추가로 사용하고자 한다면 NPM(Node 환경을 위한 Library Dependency 저장소) 목록에서 [React Native 관련 Package](https://www.npmjs.com/search?q=react-native&page=1&ranking=optimal)를 검색해 보거나 관련 범주별로 패키지 정보를 모아놓은 [Awesome React Native](http://www.awesome-react-native.com/) 에서 쓸만한 컴포넌트와 API를 찾아서 사용할 수 있습니다.

## 기본 컴포넌트

대부분의 앱은 아래의 기본 컴포넌트를 사용하게 됩니다. 따라서 React Native에 처음 입문한 사람이라면 아래 기본 컴포넌트의 사용법에 익숙해 지는 것이 좋습니다.

<div class="component-grid component-grid-border">
  <div class="component">
    <h3><a href="docs/view.html">View</a></h3>
    <p>UI 구성을 위한 가장 기초 단위의 컴포넌트</p>
  </div>
  <div class="component">
    <h3><a href="docs/text.html">Text</a></h3>
    <p>텍스트를 화면에 표시하기 위한 컴포넌트</p>
  </div>
  <div class="component">
    <h3><a href="docs/image.html">Image</a></h3>
    <p>이미지를 화면에 표시하기 위한 컴포넌트</p>
  </div>
  <div class="component">
    <h3><a href="docs/textinput.html">TextInput</a></h3>
    <p>사용자의 텍스트 입력을 처리하기 위한 컴포넌트</p>
  </div>
  <div class="component">
    <h3><a href="docs/scrollview.html">ScrollView</a></h3>
    <p>복수의 컴포넌트와 뷰의 묶음이 있을 경우 이를 스크롤하여 순차적으로 표시하기 위한 컴포넌트</p>
  </div>
  <div class="component">
    <h3><a href="docs/stylesheet.html">StyleSheet</a></h3>
    <p>CSS 스타일시트와 유사한 형태로 컴포넌트에 대한 스타일 지정을 관리하는 추상 레이어 컴포넌트</p>
  </div>
</div>

## 사용자 인터페이스

각 플랫폼마다 조금씩 다른 사용자 인터페이스를 추상화하여 공통적으로 관리하기 위한 사용자 인터페이스 컴포넌트를 제공합니다.
아래 컴포넌트를 통해 공통적으로 사용되는 사용자 인터페이스를 화면에 출력할 수 있습니다.

<div class="component-grid component-grid-border">
  <div class="component">
    <h3><a href="docs/button.html">Button</a></h3>
    <p>사용자 터치를 처리하기 위한 기본 Button UI 컴포넌트</p>
  </div>
  <div class="component">
    <h3><a href="docs/picker.html">Picker</a></h3>
    <p>iOS 와 Android 의 Native picker 를 출력하는 Picker UI 컴포넌트</p>
  </div>
  <div class="component">
    <h3><a href="docs/slider.html">Slider</a></h3>
    <p>일정 범위 안에 있는 특정 값을 지정하기 위한 Slider UI 컴포넌트</p>
  </div>
  <div class="component">
    <h3><a href="docs/switch.html">Switch</a></h3>
    <p>상태 토글을 지정하는 Switch UI 컴포넌트</p>
  </div>
</div>

## 리스트 뷰

`ScrollView`와 달리 아래의 리스트 뷰 컴포넌트는 현재 화면에 보여야 할 항목만을 출력합니다. 따라서 아주 긴 리스트 정보를 출력하는데에 적합합니다.

<div class="component-grid component-grid-border">
  <div class="component">
    <h3><a href="docs/flatlist.html">FlatList</a></h3>
    <p>리스트 정보를 스크롤 가능한 형태로 출력하기 위한 고성능 List UI 컴포넌트</p>
  </div>
  <div class="component">
    <h3><a href="docs/sectionlist.html">SectionList</a></h3>
    <p><code>FlatList</code>와 같으나 정보를 영역(Section) 단위로 구분하여 출력할 수 있도록 지원하는 List UI 컴포넌트</p>
  </div>
</div>

## iOS 전용 컴포넌트와 API

iOS에서 공통적으로 사용되는 UIKit의 클래스들을 감싼 많은 컴포넌트를 제공합니다.

<div class="component-grid component-grid-border">
  <div class="component">
    <h3><a href="docs/actionsheetios.html">ActionSheetIOS</a></h3>
    <p>iOS의 action sheet 나 share sheet 를 출력하기 위한 API 컴포넌트</p>
  </div>
  <div class="component">
    <h3><a href="docs/adsupportios.html">AdSupportIOS</a></h3>
    <p>iOS의 "advertising identifier" 에 접근하기 위한 API 컴포넌트</p>
  </div>
  <div class="component">
    <h3><a href="docs/alertios.html">AlertIOS</a></h3>
    <p>iOS 의 alert dialog 형태로 메세지를 출력하거나 사용자 입력을 받기 위한 컴포넌트</p>
  </div>
  <div class="component">
    <h3><a href="docs/datepickerios.html">DatePickerIOS</a></h3>
    <p>iOS 의 날짜/시간을 지정하는 date/time Picker UI 를 출력하는 컴포넌트</p>
  </div>
  <div class="component">
    <h3><a href="docs/imagepickerios.html">ImagePickerIOS</a></h3>
    <p>iOS 의 image picker 를 출력하는 컴포넌트</p>
  </div>
  <div class="component">
    <h3><a href="docs/navigatorios.html">NavigatorIOS</a></h3>
    <p>iOS의 <code>UINavigationController</code>를 감싼 컨포넌트(iOS에서 navigation stack을 구현)</p>
  </div>
  <div class="component">
    <h3><a href="docs/progressviewios.html">ProgressViewIOS</a></h3>
    <p>iOS의 <code>UIProgressView</code>를 출력하는 컴포넌트</p>
  </div>
  <div class="component">
    <h3><a href="docs/pushnotificationios.html">PushNotificationIOS</a></h3>
    <p>iOS의 push notifications 을 관리하는 컴포넌트(권한과 Badge Icon도 관리)</p>
  </div>
  <div class="component">
    <h3><a href="docs/segmentedcontrolios.html">SegmentedControlIOS</a></h3>
    <p>iOS의 <code>UISegmentedControl</code>을 출력하는 컴포넌트</p>
  </div>
  <div class="component">
    <h3><a href="docs/tabbarios.html">TabBarIOS</a></h3>
    <p>iOS의 <code>UITabViewController</code>를 출력하는 컴포넌트.(<a href="docs/tabbarios-item.html">TabBarIOS.Item</a>과 함께 사용)</p>
  </div>
</div>

## Android 전용 컴포넌트와 API

Android에서 공통적으로 사용되는 클래스들을 감싼 많은 컴포넌트를 제공합니다.

<div class="component-grid component-grid-border">
  <div class="component">
    <h3><a href="docs/backhandler.html">BackHandler</a></h3>
    <p>back navigation 물리 버튼이 눌렸음을 감지하기 위한 컴포넌트</p>
  </div>
  <div class="component">
    <h3><a href="docs/datepickerandroid.html">DatePickerAndroid</a></h3>
    <p>Android의 date picker를 출력하기 위한 컴포넌트</p>
  </div>
  <div class="component">
    <h3><a href="docs/drawerlayoutandroid.html">DrawerLayoutAndroid</a></h3>
    <p>Android의 <code>DrawerLayout</code>를 출력하기 위한 컴포넌트</p>
  </div>
  <div class="component">
    <h3><a href="docs/permissionsandroid.html">PermissionsAndroid</a></h3>
    <p>Android 6.0부터 지원되는 권한관리 모델에 접근하기 위한 API 컴포넌트</p>
  </div>
  <div class="component">
    <h3><a href="docs/progressbarandroid.html">ProgressBarAndroid</a></h3>
    <p>Android의 <code>ProgressBar</code>를 출력하기 위한 컴포넌트</p>
  </div>
  <div class="component">
    <h3><a href="docs/timepickerandroid.html">TimePickerAndroid</a></h3>
    <p>Android의 time picker를 출력하기 위한 컴포넌트</p>
  </div>
  <div class="component">
    <h3><a href="docs/toastandroid.html">ToastAndroid</a></h3>
    <p>Android의 Toast 메세지를 생성하기 위한 컴포넌트</p>    
  </div>
  <div class="component">
    <h3><a href="docs/toolbarandroid.html">ToolbarAndroid</a></h3>
    <p>Android의 <code>Toolbar</code>를 출력하기 위한 컴포넌트</p>        
  </div>
  <div class="component">
    <h3><a href="docs/viewpagerandroid.html">ViewPagerAndroid</a></h3>
    <p>화면 좌우로 child view를 서로 전환할 수 있도록 지원하는 컨테이너 컴포넌트</p>
  </div>
</div>


## 기타 컴포넌트와 API

아래는 어플리케이션에서 쉽게 사용할 수 있는 추가 컴포넌트 정보입니다. 전체 컴포넌트와 전체 API에 대한 정보는 왼쪽 Sidebar의 각 항목을 참조하기 바랍니다.

<div class="component-grid">
  <div class="component">
    <h3><a href="docs/activityindicator.html">ActivityIndicator</a></h3>
    <p>정보 로딩시에 대기중 상태를 원형 애니메이션 형태로 출력하는 컴포넌트</p>
  </div>
  <div class="component">
    <h3><a href="docs/alert.html">Alert</a></h3>
    <p>특정 제목과 메세지를 가진 경고창을 출력하는 컴포넌트</p>
  </div>
  <div class="component">
    <h3><a href="docs/animated.html">Animated</a></h3>
    <p>유연하고 강력한 애니메이션을 생성하기 위한 Library</p>
  </div>
  <div class="component">
    <h3><a href="docs/cameraroll.html">CameraRoll</a></h3>
    <p>장비상의 사진과 갤러리에 접근하기 위한 API</p>
  </div>
  <div class="component">
    <h3><a href="docs/clipboard.html">Clipboard</a></h3>
    <p>장비상의 클립보드에 저장 또는 읽기를 지원하기 위한 API</p>
  </div>
  <div class="component">
    <h3><a href="docs/dimensions.html">Dimensions</a></h3>
    <p>장비의 화면크기, 해상도 정보에 접근하기 위한 API</p>
  </div>
  <div class="component">
    <h3><a href="docs/keyboardavoidingview.html">KeyboardAvoidingView</a></h3>
    <p>입력창 선택시 OS 에서 자동으로 팝업시키는 가상 키보드를 제어하는 뷰 컴포넌트</p>
  </div>
  <div class="component">
    <h3><a href="docs/linking.html">Linking</a></h3>
    <p>app link에 대한 처리를 지원하기 위한 API</p>
  </div>
  <div class="component">
    <h3><a href="docs/modal.html">Modal</a></h3>
    <p>현재 뷰의 위에 Modal형태로 추가 View를 출력하기 위한 컴포넌트</p>
  </div>
  <div class="component">
    <h3><a href="docs/pixelratio.html">PixelRatio</a></h3>
    <p>장비의 픽셀 집적도, 비율 정보에 접근하기 위한 API</p>
  </div>
  <div class="component">
    <h3><a href="docs/refreshcontrol.html">RefreshControl</a></h3>
    <p><code>ScrollView</code>에서 사용되는 refresh 기능을 제공하기 위한 API</p>
  </div>
  <div class="component">
    <h3><a href="docs/statusbar.html">StatusBar</a></h3>
    <p>app status bar를 처리하는 컴포넌트</p>
  </div>
  <div class="component">
    <h3><a href="docs/webview.html">WebView</a></h3>
    <p>native view 에 웹 컨텐츠를 출력하기 위한 컴포넌트</p>
  </div>
</div>

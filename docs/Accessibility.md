---
id: accessibility
title: Accessibility
layout: docs
category: Guides
permalink: docs/accessibility.html
next: timers
previous: animations
---

## 네이티브 앱의 접근성 기능 (iOS와 Android)
몸이 불편한 사람들이 쉽게 사용할 수 있는 앱을 만들 수 있도록 iOS와 Android 모두 API를 제공합니다. 또한 두 플랫폼 모두 시각 장애인을 위한 '화면 읽어주기 기능'인 VoiceOver(iOS)와 TalkBack(Android)과 같은 보조 기능을 제공합니다. React Native에서도 개발자가 '접근성'이 높은 앱을 만들 수 있도록 API를 제공합니다. iOS와 Android가 가진 차이점 때문에 각각의 네이티브 구현 방법이 달라질 수 있습니다.

추가적으로, [이 포스팅](https://code.facebook.com/posts/435862739941212/making-react-native-apps-accessible/)에서 React Native의 접근성 기능에 관한 유용한 정보를 볼 수 있습니다.

## '접근성'  높은 앱 만들기

### 접근성 기능을 위한 몇 가지 속성들

#### accessible (iOS, Android)

이 속성이 `true`이면 해당 요소가 접근성 항목임을 알 수 있습니다. 만약 \<View>가 접근성 요소라면, 하위 요소들을 하나의 선택 가능한 컴포넌트로 그룹화합니다. 별도의 설정이 없었다면 터치 가능한 모든 요소들이 'accessible'입니다.

React Native에서의 ‘accessible={true}’ 속성은 Android에서 ‘focusable={true}’로 적용됩니다.

```javascript
<View accessible={true}>
  <Text>text one</Text>
  <Text>text two</Text>
</View>
```

위 예제에서는 'text one'과 'text two' 속성을 각각 따로 포커싱 할 수는 없으며, 대신 'accessible' 속성이 있는 \<View> 전체에만 포커싱이 가능합니다.


#### accessibilityLabel (iOS, Android)

'accessible' 속성이 적용되었을 때, VoiceOver를 사용 중인 사람들이 어떤 요소를 선택했는지 알기 쉽도록 accessibilityLabel 속성을 별도로 추가하는 것이 좋습니다. 그러면 사용자가 해당 요소를 선택했을 때 VoiceOver는 accessibilityLabel의 내용을 읽어주게 됩니다.

삽입하고자 하는 문구를 `accessibilityLabel` 속성에 정의하세요:

```javascript
<TouchableOpacity accessible={true} accessibilityLabel={'Tap me!'} onPress={this._onPress}>
  <View style={styles.button}>
    <Text style={styles.buttonText}>Press me!</Text>
  </View>
</TouchableOpacity>
```

위 예제에서는 \<TouchableOpacity>의 `accessibilityLabel`이 "Press me!"로 설정되었습니다. 레이블은 공백으로 구분된 모든 텍스트 노드를 하나로 연결하여 구성됩니다.

#### accessibilityTraits (iOS)

접근성 기능을 사용하면 VoiceOver를 통해 사용자에게 어떤 요소가 선택되었는지 알려줍니다. 지금 선택된 것이 레이블인지, 버튼인지, 혹은 헤더인지? 이를 `accessibilityTraits`을 설정함으로써 사용자에게 알릴 수 있습니다.

`accessibilityTraits` 속성을 다음과 같이 정의(여러 개는 배열로)하여 사용할 수 있습니다:

* **none** 별도의 접근성 trait가 없을 때 사용합니다.
* **button** 어떤 요소를 버튼으로 취급해야 할 때 사용합니다.
* **link** 어떤 요소를 링크로 취급해야 할 때 사용합니다.
* **header** 어떤 요소가 컨텐츠 섹션의 헤더 역할을 해야 할 때 사용합니다. (예를 들어 내비게이션 바의 제목)
* **search** 텍스트 필드가 검색 필드의 역할을 해야 할 때 사용합니다.
* **image** 어떤 요소를 이미지로 취급해야 할 때 사용합니다. 예를 들어, 버튼이나 링크 등에 사용할 수 있습니다.
* **selected** 어떤 요소를 미리 선택해 놓을 때 사용합니다. 예를 들어 표에서 선택된 행,  세그먼트화 된 컨트롤에서 선택된 버튼 등에 사용합니다.
* **plays** 어떤 요소가 활성화 되었을 때 소리가 재생되는 경우 사용합니다.
* **key** 어떤 요소가 키보드의 역할을 할 때 사용합니다.
* **text** 어떤 요소를 변하지 않는 static 텍스트로 취급할 때 사용합니다.
* **summary** 앱을 처음 실행할 때 어떤 요소가 앱의 현재 상태를 빠르게 요약, 제공하는 경우 사용합니다. 예를 들어 날씨 앱을 처음 실행할 때 '오늘의 날씨'라는 요소를 summary trait로 지정할 수 있습니다.
* **disabled** 어떤 요소가 사용 불가능한 요소이거나 사용자 입력에 반응하지 않는 경우에 사용합니다.
* **frequentUpdates** 어떤 요소의 레이블이나 값이 수시로 변하는데, 알림을 일일이 띄우기에는 그 빈도가 너무 높은 경우에 사용합니다. 이 기능을 사용하면 접근성 기능이 변경사항을 가져오도록 허용하게 됩니다. 스톱 워치가 이 trait를 사용하는 대표적인 예가 되겠습니다.
* **startsMedia** 어떤 요소가 활성화 되는 순간 미디어 세션(동영상 재생, 음성 녹음)이 시작되는 경우, 하지만 이 때 VoiceOver와 같은 보조 기술에 의해 중단되지 않아야 하는 경우에 사용합니다.
* **adjustable** 어떤 요소(slider 등)의 값이 변경 가능한 경우에 사용합니다.
* **allowsDirectInteraction** 어떤 요소가 VoiceOver 사용자의 터치 입력과 직접 상호작용하는 경우(피아노 키보드 화면 등)에 사용합니다. 
* **pageTurn** 어떤 요소의 내용이 마지막에 도달하여 스크롤을 통해 다음 페이지로 넘어가야 한다는 정보를 VoiceOver에게 알려주어야 할 때 사용합니다.

#### accessibilityViewIsModal (iOS)

A Boolean value indicating whether VoiceOver should ignore the elements within views that are siblings of the receiver.

Boolean 값은 \<View>의 형제요소를 VoiceOver가 무시해야 하는지 알려줍니다.

For example, in a window that contains sibling views `A` and `B`, setting `accessibilityViewIsModal` to `true` on view `B` causes VoiceOver to ignore the elements in the view `A`.
On the other hand, if view `B` contains a child view `C` and you set `accessibilityViewIsModal` to `true` on view `C`, VoiceOver does not ignore the elements in view `A`.

예를 들어 window의 하위 \<View> `A`와 `B`가 있다고 가정합시다. 이 때 B의 `accessibilityViewIsModal`를 `true`로 정의하면, VoiceOver는 `A`를 무시하게 됩니다. 반면 `B`의 하위 \<View>인  `C`가 있다고 가정하고 `accessibilityViewIsModal`를 `true`로 정의하면, VoiceOver가 `A`를 무시하지 않습니다.

#### onAccessibilityTap (iOS)

이 속성을 사용하여, 액세스 가능한 어떤 요소가 선택되어 있을 때 사용자가 더블 탭을 하면 다른 어떤 함수를 불러오도록 지정할 수 있습니다.


#### onMagicTap (iOS)

이 속성을 사용하여, "magic tap" 제스처를 사용했을 때 실행될 함수를 지정할 수 있습니다. "magic tap"기능은 두 손가락을 사용하여 더블 탭 하는 기능입니다. 이 때의 함수는 "magic tap" 동작을 통해 실행될 때 이질감이 없는, 직관적으로 이해할 수 있는 함수가 실행되도록 하는 것이 좋습니다. iPhone의 '전화' 앱에서는 전화를 받거나 현재 통화를 종료할 때 "magic tap"이 사용됩니다. 선택된 요소에 `onMagicTap` 속성이 정의되어 있지 않으면 시스템은 해당 \<View>를 찾을 때까지 계층 구조를 헤집고 돌아다니게 됩니다.

#### accessibilityComponentType (Android)

앱 사용자에게 어떤 컴포넌트가 무슨 타입인지 알려주고 싶을 때가 있습니다("이건 버튼입니다"라는 식으로요!). 각 플랫폼의 네이티브 버튼을 사용하면 알아서 처리가 되겠지만, 우리는 JavaScript를 사용하기 때문에 TalkBack에 약간의 설명이 필요합니다. 어떤 UI 컴포넌트든 반드시 'accessibilityComponentType'을 정의해주어야 합니다. 예를 들면 ‘button’이나 ‘radiobutton_checked’, ‘radiobutton_unchecked’ 등의 옵션이 필요합니다.

```javascript
<TouchableWithoutFeedback accessibilityComponentType=”button”
  onPress={this._onPress}>
  <View style={styles.button}>
    <Text style={styles.buttonText}>Press me!</Text>
  </View>
</TouchableWithoutFeedback>
```

In the above example, the TouchableWithoutFeedback is being announced by TalkBack as a native Button.
위의 예제에서 TalkBack은 \<TouchableWithoutFeedback>을 버튼이라고 사용자에게 알려줍니다(마치 네이티브 Button 처럼 말이죠).

#### accessibilityLiveRegion (Android)

컴포넌트의 동적인 변경사항을, TalkBack의 ‘accessibilityLiveRegion’ 속성을 통하여 사용자에게 알려줄 수 있습니다. ‘none’, ‘polite’, ‘assertive’ 세 가지로 정의할 수 있습니다:

* **none** 어떤 요소에 변경된 내용이 있더라도 알리지 않습니다.
* **polite** 어떤 요소의 변경사항을 알려줍니다.
* **assertive** 진행 중인 음성 안내를 즉시 중지시키고 변경사항을 알려줍니다.

```javascript
<TouchableWithoutFeedback onPress={this._addOne}>
  <View style={styles.embedded}>
    <Text>Click me</Text>
  </View>
</TouchableWithoutFeedback>
<Text accessibilityLiveRegion="polite">
  Clicked {this.state.count} times
</Text>
```

위의 예제에서, \_addOne 메소드는 변수 state.count의 값을 변화시킵니다. 사용자가 TouchableWithoutFeedback을 클릭하게 되면 Talkback은 \<Text>의 내용을 읽어줍니다. \<Text>의 'accessibilityLiveRegion'이 "polite"로 정의되어 있기 때문입니다.


#### importantForAccessibility (Android)

같은 부모를 가진 두 개의 UI 컴포넌트가 겹쳐지는 경우, 접근성 기능이 올바르게 작동하지 않을 수 있습니다. ‘importantForAccessibility’ 속성은 \<View>에서 접근성 이벤트를 발생시키고, 그것이 접근성 서비스에 실제로 보고되는지 여부를 제어하여 이를 해결합니다. ‘auto’, ‘yes’, ‘no’, ‘no-hide-descendants’ 등의 여러 옵션을 정의할 수 있으며, 특히 ‘no-hide-descendants’의 경우에는 접근성 서비스가 해당 컴포넌트를 포함한 모든 하위 요소들까지 무시하도록 합니다.

```javascript
<View style={styles.container}>
  <View style={{position: 'absolute', left: 10, top: 10, right: 10, height: 100,
    backgroundColor: 'green'}} importantForAccessibility=”yes”>
    <Text> First layout </Text>
  </View>
  <View style={{position: 'absolute', left: 10, top: 10, right: 10, height: 100,
    backgroundColor: 'yellow'}} importantForAccessibility=”no-hide-descendants”>
    <Text> Second layout </Text>
  </View>
</View>
```

위 예제에서 노란색 레이아웃과 그 모든 하위 요소들은 TalkBack 서비스에서 무시됩니다. 이 때문에 동일한 부모 아래에 여러 \<View>를 겹쳐 배치하는 등, 쉽게 사용할 수 있습니다.


### '화면 읽어주기' 기능 실행여부 확인하기

`AccessibilityInfo` API는 현재 '화면 읽어주기' 기능이 동작중인지 알려줍니다. [AccessibilityInfo 문서](docs/accessibilityinfo.html)에서 자세한 내용을 알아보세요.

### 접근성 이벤트 발생시키기 (Android)

Sometimes it is useful to trigger an accessibility event on a UI component (i.e. when a custom view appears on a screen or a custom radio button has been selected). Native UIManager module exposes a method ‘sendAccessibilityEvent’ for this purpose. It takes two arguments: view tag and a type of an event.
UI 컴포넌트를 접근성 이벤트의 트리거로 사용하는 것이 가끔 유용할 때가 있습니다. Native UIManager 모듈은 이러한 목적으로 ‘sendAccessibilityEvent’ 메소드를 노출시킵니다. \<View>와 이벤트 타입, 두 가지의 인수가 필요합니다.

```javascript
_onPress: function() {
  this.state.radioButton = this.state.radioButton === “radiobutton_checked” ?
  “radiobutton_unchecked” : “radiobutton_checked”;
  if (this.state.radioButton === “radiobutton_checked”) {
    RCTUIManager.sendAccessibilityEvent(
      ReactNative.findNodeHandle(this),
      RCTUIManager.AccessibilityEventTypes.typeViewClicked);
  }
}

<CustomRadioButton
  accessibleComponentType={this.state.radioButton}
  onPress={this._onPress}/>
```

위 예제에서 네이티브 기능과 비슷한 라디오 버튼을 만들었습니다. 이제 TalkBack은 이제 라디오 버튼의 선택 사항을 올바르게 알려줄 것입니다.


## VoiceOver 지원 테스트하기 (iOS)

VoiceOver를 사용하려면, '설정 - 일반 - 손쉬운 사용'으로 갑니다. '손쉬운 사용' 메뉴에서는 볼드체 텍스트, 대비 증가, VoiceOver 등 iOS 장치를 더 유용하게 사용할 수 있도록 돕는 여러 기능들을 설정할 수 있습니다.

'손쉬운 사용' 메뉴 맨 위에 VoiceOver가 있습니다. 탭하여 들어간 후 스위치를 ON으로 바꿔주면 VoiceOver가 활성화됩니다.

'손쉬운 사용' 메뉴 맨 아래에서 '손쉬운 사용 단축키'를 설정 가능합니다. 이 기능을 사용하면 '홈 버튼 삼중 클릭'을 통해 VoiceOver를 켜고 끌 수 있습니다.

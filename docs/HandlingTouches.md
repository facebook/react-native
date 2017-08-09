---
id: handling-touches
title: 터치 핸들링하기
layout: docs
category: The Basics
permalink: docs/handling-touches.html
next: using-a-scrollview
previous: handling-text-input
---

사용자와 모바일 앱은 터치 입력을 통해 상호 작용합니다. 사용자는 버튼을 누르고, 리스트를 스크롤하고 지도를 확대/축소하는 것과 같은 동작들을 조합하여 터치 입력을 합니다. React Native는 모든 종류의 일반적인 제스처뿐만 아니라 포괄적인 [제스처 응답 시스템](docs/gesture-responder-system.html)을 제공하기 때문에 더 발전된 제스처 인식이 가능합니다. 그중에서도 가장 흥미로운 컴포넌트는 기본 버튼입니다.

## 기본 버튼을 표시하는 방법

[Button](docs/button.html)은 모든 플랫폼에서 멋지게 표현되는 기본 버튼 컴포넌트를 제공합니다. 버튼을 표시하는 간단한 예제는 아래와 같습니다:

```javascript
<Button
  onPress={() => { Alert.alert('You tapped the button!')}}
  title="Press Me"
/>
```

위의 예제는 iOS의 경우 파란색 라벨 그리고 안드로이드에서는 모서리가 둥근 사각형 안에 하얀색 글자를 보여 줄 것입니다. 버튼을 누르면 "onPress" 함수가 호출되고 위의 경우에는 경고 팝업이 표시됩니다. 원할경우 "color" prop을 지정해서 버튼의 색깔을 바꿀 수 있습니다.

![](img/Button.png)

아래 예제를 통해 `Button` 컴포넌트를 다뤄보세요 오른쪽 아래에 있는 토글 버튼을 누르면 어떤 플랫폼에서 앱의 미리 보기를 할지 선택할 수 있습니다. 그런 후에 "Tap to Play"를 누르면 앱의 미리 보기를 할 수 있습니다

```SnackPlayer?name=Button%20Basics
import React, { Component } from 'react';
import { Alert, AppRegistry, Button, StyleSheet, View } from 'react-native';

export default class ButtonBasics extends Component {
  _onPressButton() {
    Alert.alert('You tapped the button!')
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.buttonContainer}>
          <Button
            onPress={this._onPressButton}
            title="Press Me"
          />
        </View>
        <View style={styles.buttonContainer}>
          <Button
            onPress={this._onPressButton}
            title="Press Me"
            color="#841584"
          />
        </View>
        <View style={styles.alternativeLayoutButtonContainer}>
          <Button
            onPress={this._onPressButton}
            title="This looks great!"
          />
          <Button
            onPress={this._onPressButton}
            title="OK!"
            color="#841584"
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
   flex: 1,
   justifyContent: 'center',
  },
  buttonContainer: {
    margin: 20
  },
  alternativeLayoutButtonContainer: {
    margin: 20,
    flexDirection: 'row',
    justifyContent: 'space-between'
  }
})

// Create React Native App을 사용한다면 아래 줄은 생략하세요.
AppRegistry.registerComponent('AwesomeProject', () => ButtonBasics);
```

## Touchables

만약 기본 버튼이 앱과 어울리지 않는다면 React Native에서 제공하는 "Touchable" 컴포넌트를 이용해서 자신만의 버튼을 만들 수 있습니다. "Touchable" 컴포넌트는 터치 입력을 캡처할 수 있는 기능을 제공하고 제스처가 인식될 때 피드백을 표시할 수 있습니다. 하지만 "Touchable"은 기본적으로 스타일링을 제공하지 않아서 여러분의 앱에 녹아들게 하려면 별도의 작업이 필요합니다.

어떤 "Touchable" 컴포넌트를 사용할 것인지는 어떤 종류의 피드백을 제공하느냐에 달려있습니다:

- 일반적으로, 버튼이나 웹링크의 용도로 [**TouchableHighlight**](docs/touchablehighlight.html)를 사용합니다.

- 안드로이드에서 사용자가 터치했을 떄 잉크가 퍼지는 듯한 물결을 표현하기 위해서는 [**TouchableNativeFeedback**](docs/touchablenativefeedback.html)을 사용하면 됩니다.

- [**TouchableOpacity**](docs/touchableopacity.html)는 버튼의 투명도를 줄이는 효과를 제공해서 사용자가 누르는 동안 배경이 보이도록 해 줍니다.

- 만약 탭 재스쳐를 처리하고 싶지만 피드백을 주고 싶지 않을 때는 [**TouchableWithoutFeedback**](docs/touchablewithoutfeedback.html)을 사용하세요.

때로는 사용자가 화면을 누르고, 누른 상태가 유지하고 있는지 알고 싶을 수 있습니다. 이렇게 길게 누르는 행위는 함수를 "Touchable" 컴포넌트의 `onLongPress` prop에 전달해서 처리할 수 있습니다.

자, 그럼 위에서 언급한 내용을 코드로 봅시다:

```SnackPlayer?platform=android&name=Touchables
import React, { Component } from 'react';
import { Alert, AppRegistry, Platform, StyleSheet, Text, TouchableHighlight, TouchableOpacity, TouchableNativeFeedback, TouchableWithoutFeedback, View } from 'react-native';

export default class Touchables extends Component {
  _onPressButton() {
    Alert.alert('You tapped the button!')
  }

  _onLongPressButton() {
    Alert.alert('You long-pressed the button!')
  }


  render() {
    return (
      <View style={styles.container}>
        <TouchableHighlight onPress={this._onPressButton} underlayColor="white">
          <View style={styles.button}>
            <Text style={styles.buttonText}>TouchableHighlight</Text>
          </View>
        </TouchableHighlight>
        <TouchableOpacity onPress={this._onPressButton}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>TouchableOpacity</Text>
          </View>
        </TouchableOpacity>
        <TouchableNativeFeedback
            onPress={this._onPressButton}
            background={Platform.OS === 'android' ? TouchableNativeFeedback.SelectableBackground() : ''}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>TouchableNativeFeedback</Text>
          </View>
        </TouchableNativeFeedback>
        <TouchableWithoutFeedback
            onPress={this._onPressButton}
            >
          <View style={styles.button}>
            <Text style={styles.buttonText}>TouchableWithoutFeedback</Text>
          </View>
        </TouchableWithoutFeedback>
        <TouchableHighlight onPress={this._onPressButton} onLongPress={this._onLongPressButton} underlayColor="white">
          <View style={styles.button}>
            <Text style={styles.buttonText}>Touchable with Long Press</Text>
          </View>
        </TouchableHighlight>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    alignItems: 'center'
  },
  button: {
    marginBottom: 30,
    width: 260,
    alignItems: 'center',
    backgroundColor: '#2196F3'
  },
  buttonText: {
    padding: 20,
    color: 'white'
  }
})

// Create React Native App을 사용한다면 아래 줄을 생략하세요
AppRegistry.registerComponent('AwesomeProject', () => Touchables);
```

## 리스트 스크롤, 페이지 스와이프, 확대/축소

모바일 앱에서 일반적으로 사용되는 또 다른 제스처는 스와이프(swipe)와 팬(pan)입니다. 이러한 제스처를 통해서 사용자는 아이템을 스크롤 하거나 콘텐츠의 페이지를 스와이프 할 수 있습니다. 앞에서 언급한 그리고 다른 종류의 제스처를 처리하기 위해, 다음 장에서 [ScrollView를 사용하는 방법](docs/using-a-scrollview.html)을 배우게 될 것입니다.

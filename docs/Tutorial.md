---
id: tutorial
title: 기본 배우기
layout: docs
category: The Basics
permalink: docs/tutorial.html
next: props
previous: getting-started
---

React Native는 React와 매우 유사하지만 구현 단위로 Web 컴포넌트가 아닌 Native 컴포넌트를 사용하는 차이가 있습니다. 
React Native 앱의 기본 구조를 이해하려면 React의 기본 개념인 JSX, 컴포넌트, `state`, `props` 등의 개념부터 이해하는 것이 좋지만 React를 이미 충분히 이해하고 있다고 해도 React Native에만 해당하는 추가 개념, 이를테면 native 전용 컴포넌트에 관한 내용 등은 추가로 배워야 합니다.

이 가이드는 React를 전혀 알지 못하더라도 React Native 의 기본을 배워볼 수 있도록 작성되었으니 아래 내용을 따라 해 보시기 바랍니다.

## Hello World

첫 번째 앱으로는 개발자들에게 너무나 익숙한 "Hello world"를 화면에 출력하는 앱을 만들어 보도록 하겠습니다.

```ReactNativeWebPlayer
import React, { Component } from 'react';
import { AppRegistry, Text } from 'react-native';

export default class HelloWorldApp extends Component {
  render() {
    return (
      <Text>Hello world!</Text>
    );
  }
}

// Create React Native App을 사용하는 경우에는 아래 라인은 생략해도 됩니다.
AppRegistry.registerComponent('AwesomeProject', () => HelloWorldApp);
```

위 소스 편집기에 내용을 수정해서 바로 변경된 결과를 오른쪽의 웹 시뮬레이터를 통해 확인할 수 있습니다. 또는 위 코드를 로컬 장비에 있는 `App.js`, `index.ios.js`, `index.android.js` 파일에 붙여 넣어서 직접 로컬에서 실행 및 결과를 확인해도 됩니다.

## 내부에서 무슨 일이 일어난 건지 알아볼까요?

위 코드 중에는 전혀 Java Script로 보이지 않는 것들이 있습니다. 하지만 안심하세요. _이것이 미래입니다_.

하나씩 살펴보자면, 우선 개정된 Java Script 표준인 ES2015 (ES6으로 불림) 의 문법이 사용되었습니다. 아직 모든 브라우저에서 지원되지는 않아 웹 개발 쪽에서는 널리 사용되지 않지만, 
React Native는 ES2015를 지원합니다. 따라서 React Native에서는 `import`, `from`, `class`, `extends`, `() =>` 문법을 모두 사용할 수 있으며 위의 코드도 해당 문법을 이용해서 작성되어 있습니다. 
이 가이드에 사용된 ES2015 문법이 낯설다면, 이 가이드의 코드에서 사용된 ES2015 의 문법 만이라도 찾아서 한번 읽어보기 바랍니다. [ES2015 주요 내용](https://babeljs.io/learn-es2015/) 페이지를 참고하세요.

위 코드에서 보이는 또 하나의 익숙하지 않은 문법은 `<Text>Hello world!</Text>`입니다. 이것은 JSX (Java Script 내에 XML 문서를 포함시키기 위한 문법)라고 합니다. 
다른 많은 framework는 마크업 태그(Markup Language) 내에 코드를 포함시키기 위한 다양한 템플릿 언어를 사용하는데, React에서는 반대로 코드 내에 마크업 태그를 포함하는 방식의 JSX를 사용합니다. 
JSX는 웹상의 HTML 과 유사하지만 `<div>` 또는 `<span>` 같은 태그와 달리 React 컴포넌트가 적용되는 차이가 있습니다. 위의 `<Text>`는 텍스트를 화면에 출력하기 위한 React Native 의 내장 컴포넌트가 적용이 됩니다.

## 컴포넌트(Component)

위 코드에서는 `HelloWorldApp`이라고 하는 새로운 `Component`를 정의하고 있는데, React Native로 앱을 개발하는 경우에는 이런 새로운 컴포넌트를 많이 만들게 됩니다. 
React Native에서는 화면상에 보이는 모든 것이 컴포넌트입니다. 컴포넌트는 간단하게 구성할 수 있는 데 화면에 그릴 JSX를 리턴하는 `render` 함수를 갖기만 하면 됩니다.

<div class="banner-crna-ejected">
  <h3>Native Code 프로젝트에만 해당되는 사항</h3>
  <p>
    위 샘플 코드 상에 있는, <code>HelloWorldApp</code> 은 <code>AppRegistry</code>를 통해 등록이 됩니다. 
    <code>AppRegistry</code>는 React Native에게 어떤 컴포넌트가 최상위(root) 컴포넌트인지를 알리는 역할을 수행합니다. 따라서 샘플 코드 내용 전체를 로컬 장비의 <code>index.ios.js</code>, <code>index.android.js</code> 파일에 붙여 넣고 실행해도 됩니다. 단, 로컬에 생성한 프로젝트가 Create React Native App으로 구성한 경우라면 이미 <code>AppRegistry</code> 코드가 작성되어 있을 것이기 때문에 해당 라인은 지우고 실행하기 바랍니다.
  </p>
</div>


## 위 예제는 너무 단순한 것 같은데요?

네 맞습니다. 컴포넌트를 좀 더 의미 있게 만들기 위해 다음 주제인 [Props 배우기](docs/props.html)로 이어가겠습니다.

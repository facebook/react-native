---
id: using-a-listview
title: Using List Views
layout: docs
category: The Basics
permalink: docs/using-a-listview.html
next: network
previous: 스크롤 뷰의 사용(using-a-scrollview)
---

리엑트 네이티브는 목록 데이터를 표현하기 위한 컴포넌트를 제공합니다. 일반적으로, 여러분은 [플랫리스트(FlatList)](docs/flatlist.html) 또는 [섹션리스트(SectionList)](docs/sectionlist.html) 중 하나를 사용할 것입니다.

`플랫리스트(FlatList)` 컴포넌트는 변경되지만 비슷하고 구조화된 스크롤링 가능한 목록 데이터를 표시합니다. 또한, `플랫리스트(FlatList)` 시간이 지나면 변하는 항목의 긴 목록 데이터에서 잘 동작합니다. 일반적으로 [`스크롤뷰(ScrollView)`](docs/using-a-scrollview.html)와는 달리, `플랫리스트(FlatList)`는  한번에 모든 요소가 아닌 오직 현재 보이는 부분만 렌더링 합니다.

`플랫리스트(FlatList)` 컴포넌트 2가지 속성(props): `데이터(data)` 그리고 `렌더아이템(renderItem)`. `데이터(data)` 목록을 위한 중요한 소스입니다. `렌더아이템(renderItem)`은 한가지 항목으로부터 형식화(format) 된 컴포넌트를 렌더링 합니다.

이 간단한 예제는 하드코딩 된 데이터의 `플랫리스트(FlatList)`를 생성합니다. `데이터(data)` 속성(props) 안의 각 항목은 `텍스트(Text)` 컴포넌트로 렌더링 합니다. 예제 `FlatListBasics` 컴포넌트는 `플랫리스트(FlatList)` 와 전체 `텍스트(Text)` 컴포넌트를 렌더링 합니다.

```SnackPlayer?name=FlatList%20Basics
import React, { Component } from 'react';
import { AppRegistry, FlatList, StyleSheet, Text, View } from 'react-native';

export default class FlatListBasics extends Component {
  render() {
    return (
      <View style={styles.container}>
        <FlatList
          data={[
            {key: 'Devin'},
            {key: 'Jackson'},
            {key: 'James'},
            {key: 'Joel'},
            {key: 'John'},
            {key: 'Jillian'},
            {key: 'Jimmy'},
            {key: 'Julie'},
          ]}
          renderItem={({item}) => <Text style={styles.item}>{item.key}</Text>}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
   flex: 1,
   paddingTop: 22
  },
  item: {
    padding: 10,
    fontSize: 18,
    height: 44,
  },
})

// 리엑트 네이티브 앱(App)을 생성하는 경우 이 라인(Line)을 생략 합니다.
AppRegistry.registerComponent('AwesomeProject', () => FlatListBasics);
```

여러분이 논리적 섹션으로 분할 된 데이터를 렌더링 하고 싶으면, iOS `유아이테이블뷰(UITableView)`와 비슷한 섹션 헤더를 사용하는 [섹션리스트(SectionList)](docs/sectionlist.html)를 선택하는 방법이 있습니다.

```SnackPlayer?name=SectionList%20Basics
import React, { Component } from 'react';
import { AppRegistry, SectionList, StyleSheet, Text, View } from 'react-native';

export default class SectionListBasics extends Component {
  render() {
    return (
      <View style={styles.container}>
        <SectionList
          sections={[
            {title: 'D', data: ['Devin']},
            {title: 'J', data: ['Jackson', 'James', 'Jillian', 'Jimmy', 'Joel', 'John', 'Julie']},
          ]}
          renderItem={({item}) => <Text style={styles.item}>{item}</Text>}
          renderSectionHeader={({section}) => <Text style={styles.sectionHeader}>{section.title}</Text>}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
   flex: 1,
   paddingTop: 22
  },
  sectionHeader: {
    paddingTop: 2,
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 2,
    fontSize: 14,
    fontWeight: 'bold',
    backgroundColor: 'rgba(247,247,247,1.0)',
  },
  item: {
    padding: 10,
    fontSize: 18,
    height: 44,
  },
})

// 리엑트 네이티브 앱(App)을 생성하는 경우 이 라인(Line)을 생략 합니다.
AppRegistry.registerComponent('AwesomeProject', () => SectionListBasics);
```

리스트 뷰(List View)에서 가장 일반적인 용도 중 하나는 서버로부터 가져온 데이터를 표시하는 것입니다. 여기에 여러분이 필요한 [리엑트 네이티브 네트워킹 배우기(learn about networking in React Native)](docs/network.html)가 있습니다.

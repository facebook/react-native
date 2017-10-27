---
id: version-0.45-components-and-apis
title: components-and-apis
original_id: components-and-apis
---
<a id="content"></a><h1><a class="anchor" name="components-and-apis"></a>Components and APIs <a class="hash-link" href="docs/components-and-apis.html#components-and-apis">#</a></h1><div><p>React Native provides a number of built-in components. You will find a full list of components and APIs on the sidebar to the left. If you're not sure where to get started, take a look at the following categories:</p><ul><li><a href="docs/components-and-apis.html#basic-components" target="_blank">Basic Components</a></li><li><a href="docs/components-and-apis.html#user-interface" target="_blank">User Interface</a></li><li><a href="docs/components-and-apis.html#lists-views" target="_blank">Lists Views</a></li><li><a href="docs/components-and-apis.html#ios-components-and-apis" target="_blank">iOS-specific</a></li><li><a href="docs/components-and-apis.html#android-components-and-apis" target="_blank">Android-specific</a></li><li><a href="docs/components-and-apis.html#others" target="_blank">Others</a></li></ul><p>You're not limited to the components and APIs bundled with React Native. React Native is a community of thousands of developers. If you're looking for a library that does something specific, search the npm registry for packages mentioning <a href="https://www.npmjs.com/search?q=react-native&amp;page=1&amp;ranking=optimal" target="_blank">react-native</a>, or check out <a href="http://www.awesome-react-native.com/" target="_blank">Awesome React Native</a> for a curated list.</p><h2><a class="anchor" name="basic-components"></a>Basic Components <a class="hash-link" href="docs/components-and-apis.html#basic-components">#</a></h2><p>Most apps will end up using one of these basic components. You'll want to get yourself familiarized with all of these if you're new to React Native.</p><span><div class="component-grid component-grid-border">
  <div class="component">
    <h3><a href="docs/view.html">View</a></h3>
    <p>The most fundamental component for building a UI.</p>
  </div>
  <div class="component">
    <h3><a href="docs/text.html">Text</a></h3>
    <p>A component for displaying text.</p>
  </div>
  <div class="component">
    <h3><a href="docs/image.html">Image</a></h3>
    <p>A component for displaying images.</p>
  </div>
  <div class="component">
    <h3><a href="docs/textinput.html">TextInput</a></h3>
    <p>A component for inputting text into the app via a keyboard.</p>
  </div>
  <div class="component">
    <h3><a href="docs/scrollview.html">ScrollView</a></h3>
    <p>Provides a scrolling container that can host multiple components and views.</p>
  </div>
  <div class="component">
    <h3><a href="docs/button.html">Button</a></h3>
    <p>A basic button component for handling touches that should render nicely on any platform.</p>
  </div>
</div>

</span><h2><a class="anchor" name="user-interface"></a>User Interface <a class="hash-link" href="docs/components-and-apis.html#user-interface">#</a></h2><p>Render common user interface controls on any platform using the following components. For platform specific components, keep reading.</p><span><div class="component-grid component-grid-border">
  <div class="component">
    <h3><a href="docs/picker.html">Picker</a></h3>
    <p>Renders the native picker component on iOS and Android.</p>
  </div>
  <div class="component">
    <h3><a href="docs/slider.html">Slider</a></h3>
    <p>A component used to select a single value from a range of values.</p>
  </div>
  <div class="component">
    <h3><a href="docs/switch.html">Switch</a></h3>
    <p>Renders a boolean input.</p>
  </div>
</div>

</span><h2><a class="anchor" name="list-views"></a>List Views <a class="hash-link" href="docs/components-and-apis.html#list-views">#</a></h2><p>Unlike the more generic <code>ScrollView</code>, the following list view components only render elements that are currently showing on the screen. This makes them a great choice for displaying long lists of data.</p><span><div class="component-grid component-grid-border">
  <div class="component">
    <h3><a href="docs/flatlist.html">FlatList</a></h3>
    <p>A component for rendering performant scrollable lists.</p>
  </div>
  <div class="component">
    <h3><a href="docs/sectionlist.html">SectionList</a></h3>
    <p>Like <code>FlatList</code>, but for sectioned lists.</p>
  </div>
</div>

</span><h2><a class="anchor" name="ios-components-and-apis"></a>iOS Components and APIs <a class="hash-link" href="docs/components-and-apis.html#ios-components-and-apis">#</a></h2><p>Many of the following components provide wrappers for commonly used UIKit classes.</p><span><div class="component-grid component-grid-border">
  <div class="component">
    <h3><a href="docs/actionsheetios.html">ActionSheetIOS</a></h3>
    <p>API to display an iOS action sheet or share sheet.</p>
  </div>
  <div class="component">
    <h3><a href="docs/adsupportios.html">AdSupportIOS</a></h3>
    <p>API to access the "advertising identifier" on iOS.</p>
  </div>
  <div class="component">
    <h3><a href="docs/alertios.html">AlertIOS</a></h3>
    <p>Create an iOS alert dialog with a message or create a prompt for user input.</p>
  </div>
  <div class="component">
    <h3><a href="docs/datepickerios.html">DatePickerIOS</a></h3>
    <p>Renders a date/time picker (selector) on iOS.</p>
  </div>
  <div class="component">
    <h3><a href="docs/imagepickerios.html">ImagePickerIOS</a></h3>
    <p>Renders a image picker on iOS.</p>
  </div>
  <div class="component">
    <h3><a href="docs/navigatorios.html">NavigatorIOS</a></h3>
    <p>A wrapper around <code>UINavigationController</code>, enabling you to implement a navigation stack.</p>
  </div>
  <div class="component">
    <h3><a href="docs/progressviewios.html">ProgressViewIOS</a></h3>
    <p>Renders a <code>UIProgressView</code> on iOS.</p>
  </div>
  <div class="component">
    <h3><a href="docs/pushnotificationios.html">PushNotificationIOS</a></h3>
    <p>Handle push notifications for your app, including permission handling and icon badge number.</p>
  </div>
  <div class="component">
    <h3><a href="docs/segmentedcontrolios.html">SegmentedControlIOS</a></h3>
    <p>Renders a <code>UISegmentedControl</code> on iOS.</p>
  </div>
  <div class="component">
    <h3><a href="docs/tabbarios.html">TabBarIOS</a></h3>
    <p>Renders a <code>UITabViewController</code> on iOS. Use with <a href="docs/tabbarios-item.html">TabBarIOS.Item</a>.</p>
  </div>
</div>

</span><h2><a class="anchor" name="android-components-and-apis"></a>Android Components and APIs <a class="hash-link" href="docs/components-and-apis.html#android-components-and-apis">#</a></h2><p>Many of the following components provide wrappers for commonly used Android classes.</p><span><div class="component-grid component-grid-border">
  <div class="component">
    <h3><a href="docs/backhandler.html">BackHandler</a></h3>
    <p>Detect hardware button presses for back navigation.</p>
  </div>
  <div class="component">
    <h3><a href="docs/datepickerandroid.html">DatePickerAndroid</a></h3>
    <p>Opens the standard Android date picker dialog.</p>
  </div>
  <div class="component">
    <h3><a href="docs/drawerlayoutandroid.html">DrawerLayoutAndroid</a></h3>
    <p>Renders a <code>DrawerLayout</code> on Android.</p>
  </div>
  <div class="component">
    <h3><a href="docs/permissionsandroid.html">PermissionsAndroid</a></h3>
    <p>Provides access to the permissions model introduced in Android M.</p>
  </div>
  <div class="component">
    <h3><a href="docs/progressbarandroid.html">ProgressBarAndroid</a></h3>
    <p>Renders a <code>ProgressBar</code> on Android.</p>
  </div>
  <div class="component">
    <h3><a href="docs/timepickerandroid.html">TimePickerAndroid</a></h3>
    <p>Opens the standard Android time picker dialog.</p>
  </div>
  <div class="component">
    <h3><a href="docs/toastandroid.html">ToastAndroid</a></h3>
    <p>Create an Android Toast alert.</p>
  </div>
  <div class="component">
    <h3><a href="docs/toolbarandroid.html">ToolbarAndroid</a></h3>
    <p>Renders a <code>Toolbar</code> on Android.</p>
  </div>
  <div class="component">
    <h3><a href="docs/viewpagerandroid.html">ViewPagerAndroid</a></h3>
    <p>Container that allows to flip left and right between child views.</p>
  </div>
</div>


</span><h2><a class="anchor" name="others"></a>Others <a class="hash-link" href="docs/components-and-apis.html#others">#</a></h2><p>These components may come in handy for certain applications. For an exhaustive list of components and APIs, check out the sidebar to the left.</p><span><div class="component-grid">
  <div class="component">
    <h3><a href="docs/activityindicator.html">ActivityIndicator</a></h3>
    <p>Displays a circular loading indicator.</p>
  </div>
  <div class="component">
    <h3><a href="docs/alert.html">Alert</a></h3>
    <p>Launches an alert dialog with the specified title and message.</p>
  </div>
  <div class="component">
    <h3><a href="docs/cameraroll.html">CameraRoll</a></h3>
    <p>Provides access to the local camera roll / gallery.</p>
  </div>
  <div class="component">
    <h3><a href="docs/clipboard.html">Clipboard</a></h3>
    <p>Provides an interface for setting and getting content from the clipboard on both iOS and Android.</p>
  </div>
  <div class="component">
    <h3><a href="docs/dimensions.html">Dimensions</a></h3>
    <p>Provides an interface for getting device dimensions.</p>
  </div>
  <div class="component">
    <h3><a href="docs/keyboardavoidingview.html">KeyboardAvoidingView</a></h3>
    <p>Provides a view that moves out of the way of the virtual keyboard automatically.</p>
  </div>
  <div class="component">
    <h3><a href="docs/linking.html">Linking</a></h3>
    <p>Provides a general interface to interact with both incoming and outgoing app links.</p>
  </div>
  <div class="component">
    <h3><a href="docs/modal.html">Modal</a></h3>
    <p>Provides a simple way to present content above an enclosing view.</p>
  </div>
  <div class="component">
    <h3><a href="docs/pixelratio.html">PixelRatio</a></h3>
    <p>Provides access to the device pixel density.</p>
  </div>
  <div class="component">
    <h3><a href="docs/refreshcontrol.html">RefreshControl</a></h3>
    <p>This component is used inside a <code>ScrollView</code> to add pull to refresh functionality.</p>
  </div>
  <div class="component">
    <h3><a href="docs/statusbar.html">StatusBar</a></h3>
    <p>Component to control the app status bar.</p>
  </div>
  <div class="component">
    <h3><a href="docs/stylesheet.html">StyleSheet</a></h3>
    <p>Provides an abstraction layer similar to CSS stylesheets.</p>
  </div>
  <div class="component">
    <h3><a href="docs/webview.html">WebView</a></h3>
    <p>A component that renders web content in a native view.</p>
  </div>
</div>
</span></div><div class="docs-prevnext"><a class="docs-prev" href="docs/more-resources.html#content">← Prev</a><a class="docs-next" href="docs/platform-specific-code.html#content">Next →</a></div><p class="edit-page-block">You can <a target="_blank" href="https://github.com/facebook/react-native/blob/master/docs/ComponentsAndAPIs.md">edit the content above on GitHub</a> and send us a pull request!</p>
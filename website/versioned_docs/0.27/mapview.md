---
id: version-0.27-mapview
title: mapview
original_id: mapview
---
<a id="content"></a><table width="100%"><tbody><tr><td><h1><a class="anchor" name="mapview"></a>MapView <a class="hash-link" href="docs/mapview.html#mapview">#</a></h1></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/0.27-stable/Libraries/Components/MapView/MapView.js">Edit on GitHub</a></td></tr></tbody></table><div><noscript></noscript><h3><a class="anchor" name="props"></a>Props <a class="hash-link" href="docs/mapview.html#props">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="view"></a><a href="docs/view.html#props">View props...</a> <a class="hash-link" href="docs/mapview.html#view">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onannotationpress"></a>onAnnotationPress <span class="propType">function</span> <a class="hash-link" href="docs/mapview.html#onannotationpress">#</a></h4><div><p>Deprecated. Use annotation onFocus and onBlur instead.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onregionchange"></a>onRegionChange <span class="propType">function</span> <a class="hash-link" href="docs/mapview.html#onregionchange">#</a></h4><div><p>Callback that is called continuously when the user is dragging the map.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onregionchangecomplete"></a>onRegionChangeComplete <span class="propType">function</span> <a class="hash-link" href="docs/mapview.html#onregionchangecomplete">#</a></h4><div><p>Callback that is called once, when the user is done moving the map.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="pitchenabled"></a>pitchEnabled <span class="propType">bool</span> <a class="hash-link" href="docs/mapview.html#pitchenabled">#</a></h4><div><p>When this property is set to <code>true</code> and a valid camera is associated
with the map, the camera’s pitch angle is used to tilt the plane
of the map. When this property is set to <code>false</code>, the camera’s pitch
angle is ignored and the map is always displayed as if the user
is looking straight down onto it.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="region"></a>region <span class="propType">{latitude: number, longitude: number, latitudeDelta: number, longitudeDelta: number}</span> <a class="hash-link" href="docs/mapview.html#region">#</a></h4><div><p>The region to be displayed by the map.</p><p>The region is defined by the center coordinates and the span of
coordinates to display.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="rotateenabled"></a>rotateEnabled <span class="propType">bool</span> <a class="hash-link" href="docs/mapview.html#rotateenabled">#</a></h4><div><p>When this property is set to <code>true</code> and a valid camera is associated with
the map, the camera’s heading angle is used to rotate the plane of the
map around its center point. When this property is set to <code>false</code>, the
camera’s heading angle is ignored and the map is always oriented so
that true north is situated at the top of the map view</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="scrollenabled"></a>scrollEnabled <span class="propType">bool</span> <a class="hash-link" href="docs/mapview.html#scrollenabled">#</a></h4><div><p>If <code>false</code> the user won't be able to change the map region being displayed.
Default value is <code>true</code>.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="showsuserlocation"></a>showsUserLocation <span class="propType">bool</span> <a class="hash-link" href="docs/mapview.html#showsuserlocation">#</a></h4><div><p>If <code>true</code> the app will ask for the user's location and display it on
the map. Default value is <code>false</code>.</p><p><strong>NOTE</strong>: on iOS, you need to add the <code>NSLocationWhenInUseUsageDescription</code>
key in Info.plist to enable geolocation, otherwise it will fail silently.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="style"></a>style <span class="propType"><a href="docs/view.html#style">View#style</a></span> <a class="hash-link" href="docs/mapview.html#style">#</a></h4><div><p>Used to style and layout the <code>MapView</code>.  See <code>StyleSheet.js</code> and
<code>ViewStylePropTypes.js</code> for more info.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="zoomenabled"></a>zoomEnabled <span class="propType">bool</span> <a class="hash-link" href="docs/mapview.html#zoomenabled">#</a></h4><div><p>If <code>false</code> the user won't be able to pinch/zoom the map.
Default value is <code>true</code>.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="active"></a><span class="platform">android</span>active <span class="propType">bool</span> <a class="hash-link" href="docs/mapview.html#active">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="annotations"></a><span class="platform">ios</span>annotations <span class="propType"><span>[{latitude: number, longitude: number, animateDrop: bool, draggable: bool, onDragStateChange: function, onFocus: function, onBlur: function, title: string, subtitle: string, leftCalloutView: element, rightCalloutView: element, detailCalloutView: element, tintColor: [object Object], image: Image.propTypes.source, view: element, id: string, hasLeftCallout: deprecatedPropType(
  React.PropTypes.bool,
  'Use `leftCalloutView` instead.'
), hasRightCallout: deprecatedPropType(
  React.PropTypes.bool,
  'Use `rightCalloutView` instead.'
), onLeftCalloutPress: deprecatedPropType(
  React.PropTypes.func,
  'Use `leftCalloutView` instead.'
), onRightCalloutPress: deprecatedPropType(
  React.PropTypes.func,
  'Use `rightCalloutView` instead.'
)}]</span></span> <a class="hash-link" href="docs/mapview.html#annotations">#</a></h4><div><p>Map annotations with title/subtitle.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="followuserlocation"></a><span class="platform">ios</span>followUserLocation <span class="propType">bool</span> <a class="hash-link" href="docs/mapview.html#followuserlocation">#</a></h4><div><p>If <code>true</code> the map will follow the user's location whenever it changes.
Note that this has no effect unless <code>showsUserLocation</code> is enabled.
Default value is <code>true</code>.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="legallabelinsets"></a><span class="platform">ios</span>legalLabelInsets <span class="propType">{top: number, left: number, bottom: number, right: number}</span> <a class="hash-link" href="docs/mapview.html#legallabelinsets">#</a></h4><div><p>Insets for the map's legal label, originally at bottom left of the map.
See <code>EdgeInsetsPropType.js</code> for more information.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="maptype"></a><span class="platform">ios</span>mapType <span class="propType">enum('standard', 'satellite', 'hybrid')</span> <a class="hash-link" href="docs/mapview.html#maptype">#</a></h4><div><p>The map type to be displayed.</p><ul><li>standard: standard road map (default)</li><li>satellite: satellite view</li><li>hybrid: satellite view with roads and points of interest overlaid</li></ul></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="maxdelta"></a><span class="platform">ios</span>maxDelta <span class="propType">number</span> <a class="hash-link" href="docs/mapview.html#maxdelta">#</a></h4><div><p>Maximum size of area that can be displayed.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="mindelta"></a><span class="platform">ios</span>minDelta <span class="propType">number</span> <a class="hash-link" href="docs/mapview.html#mindelta">#</a></h4><div><p>Minimum size of area that can be displayed.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="overlays"></a><span class="platform">ios</span>overlays <span class="propType"><span>[{coordinates: [object Object], lineWidth: number, strokeColor: [object Object], fillColor: [object Object], id: string}]</span></span> <a class="hash-link" href="docs/mapview.html#overlays">#</a></h4><div><p>Map overlays</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="showscompass"></a><span class="platform">ios</span>showsCompass <span class="propType">bool</span> <a class="hash-link" href="docs/mapview.html#showscompass">#</a></h4><div><p>If <code>false</code> compass won't be displayed on the map.
Default value is <code>true</code>.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="showspointsofinterest"></a><span class="platform">ios</span>showsPointsOfInterest <span class="propType">bool</span> <a class="hash-link" href="docs/mapview.html#showspointsofinterest">#</a></h4><div><p>If <code>false</code> points of interest won't be displayed on the map.
Default value is <code>true</code>.</p></div></div></div></div><div><div><table width="100%"><tbody><tr><td><h3><a class="anchor" name="examples"></a>Examples <a class="hash-link" href="docs/mapview.html#examples">#</a></h3></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/0.27-stable/Examples/UIExplorer/MapViewExample.js">Edit on GitHub</a></td></tr></tbody></table><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> ReactNative <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-native'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> <span class="token punctuation">{</span> PropTypes <span class="token punctuation">}</span> <span class="token operator">=</span> React<span class="token punctuation">;</span>
<span class="token keyword">var</span> <span class="token punctuation">{</span>
  Image<span class="token punctuation">,</span>
  MapView<span class="token punctuation">,</span>
  StyleSheet<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  TextInput<span class="token punctuation">,</span>
  TouchableOpacity<span class="token punctuation">,</span>
  View<span class="token punctuation">,</span>
<span class="token punctuation">}</span> <span class="token operator">=</span> ReactNative<span class="token punctuation">;</span>

<span class="token keyword">var</span> regionText <span class="token operator">=</span> <span class="token punctuation">{</span>
  latitude<span class="token punctuation">:</span> <span class="token string">'0'</span><span class="token punctuation">,</span>
  longitude<span class="token punctuation">:</span> <span class="token string">'0'</span><span class="token punctuation">,</span>
  latitudeDelta<span class="token punctuation">:</span> <span class="token string">'0'</span><span class="token punctuation">,</span>
  longitudeDelta<span class="token punctuation">:</span> <span class="token string">'0'</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> MapRegionInput <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>

  propTypes<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    region<span class="token punctuation">:</span> PropTypes<span class="token punctuation">.</span><span class="token function">shape<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
      latitude<span class="token punctuation">:</span> PropTypes<span class="token punctuation">.</span>number<span class="token punctuation">.</span>isRequired<span class="token punctuation">,</span>
      longitude<span class="token punctuation">:</span> PropTypes<span class="token punctuation">.</span>number<span class="token punctuation">.</span>isRequired<span class="token punctuation">,</span>
      latitudeDelta<span class="token punctuation">:</span> PropTypes<span class="token punctuation">.</span>number<span class="token punctuation">,</span>
      longitudeDelta<span class="token punctuation">:</span> PropTypes<span class="token punctuation">.</span>number<span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
    onChange<span class="token punctuation">:</span> PropTypes<span class="token punctuation">.</span>func<span class="token punctuation">.</span>isRequired<span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">getInitialState<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      region<span class="token punctuation">:</span> <span class="token punctuation">{</span>
        latitude<span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">,</span>
        longitude<span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">,</span>
      <span class="token punctuation">}</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  componentWillReceiveProps<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span>nextProps<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
      region<span class="token punctuation">:</span> nextProps<span class="token punctuation">.</span>region <span class="token operator">||</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">getInitialState<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">.</span>region
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">var</span> region <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>region <span class="token operator">||</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">getInitialState<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">.</span>region<span class="token punctuation">;</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>row<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;Text<span class="token operator">&gt;</span>
            <span class="token punctuation">{</span><span class="token string">'Latitude'</span><span class="token punctuation">}</span>
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;TextInput
            value<span class="token operator">=</span><span class="token punctuation">{</span><span class="token string">''</span> <span class="token operator">+</span> region<span class="token punctuation">.</span>latitude<span class="token punctuation">}</span>
            style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>textInput<span class="token punctuation">}</span>
            onChange<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_onChangeLatitude<span class="token punctuation">}</span>
            selectTextOnFocus<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>row<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;Text<span class="token operator">&gt;</span>
            <span class="token punctuation">{</span><span class="token string">'Longitude'</span><span class="token punctuation">}</span>
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;TextInput
            value<span class="token operator">=</span><span class="token punctuation">{</span><span class="token string">''</span> <span class="token operator">+</span> region<span class="token punctuation">.</span>longitude<span class="token punctuation">}</span>
            style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>textInput<span class="token punctuation">}</span>
            onChange<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_onChangeLongitude<span class="token punctuation">}</span>
            selectTextOnFocus<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>row<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;Text<span class="token operator">&gt;</span>
            <span class="token punctuation">{</span><span class="token string">'Latitude delta'</span><span class="token punctuation">}</span>
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;TextInput
            value<span class="token operator">=</span><span class="token punctuation">{</span>
              region<span class="token punctuation">.</span>latitudeDelta <span class="token operator">==</span> <span class="token keyword">null</span> <span class="token operator">?</span> <span class="token string">''</span> <span class="token punctuation">:</span> <span class="token function">String<span class="token punctuation">(</span></span>region<span class="token punctuation">.</span>latitudeDelta<span class="token punctuation">)</span>
            <span class="token punctuation">}</span>
            style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>textInput<span class="token punctuation">}</span>
            onChange<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_onChangeLatitudeDelta<span class="token punctuation">}</span>
            selectTextOnFocus<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>row<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;Text<span class="token operator">&gt;</span>
            <span class="token punctuation">{</span><span class="token string">'Longitude delta'</span><span class="token punctuation">}</span>
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;TextInput
            value<span class="token operator">=</span><span class="token punctuation">{</span>
              region<span class="token punctuation">.</span>longitudeDelta <span class="token operator">==</span> <span class="token keyword">null</span> <span class="token operator">?</span> <span class="token string">''</span> <span class="token punctuation">:</span> <span class="token function">String<span class="token punctuation">(</span></span>region<span class="token punctuation">.</span>longitudeDelta<span class="token punctuation">)</span>
            <span class="token punctuation">}</span>
            style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>textInput<span class="token punctuation">}</span>
            onChange<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_onChangeLongitudeDelta<span class="token punctuation">}</span>
            selectTextOnFocus<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>changeButton<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;Text onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_change<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            <span class="token punctuation">{</span><span class="token string">'Change'</span><span class="token punctuation">}</span>
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  _onChangeLatitude<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span>e<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    regionText<span class="token punctuation">.</span>latitude <span class="token operator">=</span> e<span class="token punctuation">.</span>nativeEvent<span class="token punctuation">.</span>text<span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  _onChangeLongitude<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span>e<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    regionText<span class="token punctuation">.</span>longitude <span class="token operator">=</span> e<span class="token punctuation">.</span>nativeEvent<span class="token punctuation">.</span>text<span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  _onChangeLatitudeDelta<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span>e<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    regionText<span class="token punctuation">.</span>latitudeDelta <span class="token operator">=</span> e<span class="token punctuation">.</span>nativeEvent<span class="token punctuation">.</span>text<span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  _onChangeLongitudeDelta<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span>e<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    regionText<span class="token punctuation">.</span>longitudeDelta <span class="token operator">=</span> e<span class="token punctuation">.</span>nativeEvent<span class="token punctuation">.</span>text<span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  _change<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
      region<span class="token punctuation">:</span> <span class="token punctuation">{</span>
        latitude<span class="token punctuation">:</span> <span class="token function">parseFloat<span class="token punctuation">(</span></span>regionText<span class="token punctuation">.</span>latitude<span class="token punctuation">)</span><span class="token punctuation">,</span>
        longitude<span class="token punctuation">:</span> <span class="token function">parseFloat<span class="token punctuation">(</span></span>regionText<span class="token punctuation">.</span>longitude<span class="token punctuation">)</span><span class="token punctuation">,</span>
        latitudeDelta<span class="token punctuation">:</span> <span class="token function">parseFloat<span class="token punctuation">(</span></span>regionText<span class="token punctuation">.</span>latitudeDelta<span class="token punctuation">)</span><span class="token punctuation">,</span>
        longitudeDelta<span class="token punctuation">:</span> <span class="token function">parseFloat<span class="token punctuation">(</span></span>regionText<span class="token punctuation">.</span>longitudeDelta<span class="token punctuation">)</span><span class="token punctuation">,</span>
      <span class="token punctuation">}</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span><span class="token function">onChange<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>region<span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> MapViewExample <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>

  <span class="token function">getInitialState<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      isFirstLoad<span class="token punctuation">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
      mapRegion<span class="token punctuation">:</span> undefined<span class="token punctuation">,</span>
      mapRegionInput<span class="token punctuation">:</span> undefined<span class="token punctuation">,</span>
      annotations<span class="token punctuation">:</span> <span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;MapView
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>map<span class="token punctuation">}</span>
          onRegionChange<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_onRegionChange<span class="token punctuation">}</span>
          onRegionChangeComplete<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_onRegionChangeComplete<span class="token punctuation">}</span>
          region<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>mapRegion<span class="token punctuation">}</span>
          annotations<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>annotations<span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;MapRegionInput
          onChange<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_onRegionInputChanged<span class="token punctuation">}</span>
          region<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>mapRegionInput<span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">_getAnnotations<span class="token punctuation">(</span></span>region<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">[</span><span class="token punctuation">{</span>
      longitude<span class="token punctuation">:</span> region<span class="token punctuation">.</span>longitude<span class="token punctuation">,</span>
      latitude<span class="token punctuation">:</span> region<span class="token punctuation">.</span>latitude<span class="token punctuation">,</span>
      title<span class="token punctuation">:</span> <span class="token string">'You Are Here'</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">_onRegionChange<span class="token punctuation">(</span></span>region<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
      mapRegionInput<span class="token punctuation">:</span> region<span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">_onRegionChangeComplete<span class="token punctuation">(</span></span>region<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>isFirstLoad<span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
        mapRegionInput<span class="token punctuation">:</span> region<span class="token punctuation">,</span>
        annotations<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_getAnnotations<span class="token punctuation">(</span></span>region<span class="token punctuation">)</span><span class="token punctuation">,</span>
        isFirstLoad<span class="token punctuation">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
      <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">_onRegionInputChanged<span class="token punctuation">(</span></span>region<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
      mapRegion<span class="token punctuation">:</span> region<span class="token punctuation">,</span>
      mapRegionInput<span class="token punctuation">:</span> region<span class="token punctuation">,</span>
      annotations<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_getAnnotations<span class="token punctuation">(</span></span>region<span class="token punctuation">)</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> AnnotationExample <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>

  <span class="token function">getInitialState<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      isFirstLoad<span class="token punctuation">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
      annotations<span class="token punctuation">:</span> <span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token punctuation">,</span>
      mapRegion<span class="token punctuation">:</span> undefined<span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>isFirstLoad<span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">var</span> onRegionChangeComplete <span class="token operator">=</span> <span class="token punctuation">(</span>region<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
        <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
          isFirstLoad<span class="token punctuation">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
          annotations<span class="token punctuation">:</span> <span class="token punctuation">[</span><span class="token punctuation">{</span>
            longitude<span class="token punctuation">:</span> region<span class="token punctuation">.</span>longitude<span class="token punctuation">,</span>
            latitude<span class="token punctuation">:</span> region<span class="token punctuation">.</span>latitude<span class="token punctuation">,</span>
            <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>annotation<span class="token punctuation">,</span>
          <span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">,</span>
        <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token punctuation">}</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;MapView
        style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>map<span class="token punctuation">}</span>
        onRegionChangeComplete<span class="token operator">=</span><span class="token punctuation">{</span>onRegionChangeComplete<span class="token punctuation">}</span>
        region<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>mapRegion<span class="token punctuation">}</span>
        annotations<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>annotations<span class="token punctuation">}</span>
      <span class="token operator">/</span><span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> styles <span class="token operator">=</span> StyleSheet<span class="token punctuation">.</span><span class="token function">create<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  map<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    height<span class="token punctuation">:</span> <span class="token number">150</span><span class="token punctuation">,</span>
    margin<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">,</span>
    borderWidth<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
    borderColor<span class="token punctuation">:</span> <span class="token string">'#000000'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  row<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    flexDirection<span class="token punctuation">:</span> <span class="token string">'row'</span><span class="token punctuation">,</span>
    justifyContent<span class="token punctuation">:</span> <span class="token string">'space-between'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  textInput<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    width<span class="token punctuation">:</span> <span class="token number">150</span><span class="token punctuation">,</span>
    height<span class="token punctuation">:</span> <span class="token number">20</span><span class="token punctuation">,</span>
    borderWidth<span class="token punctuation">:</span> <span class="token number">0.5</span><span class="token punctuation">,</span>
    borderColor<span class="token punctuation">:</span> <span class="token string">'#aaaaaa'</span><span class="token punctuation">,</span>
    fontSize<span class="token punctuation">:</span> <span class="token number">13</span><span class="token punctuation">,</span>
    padding<span class="token punctuation">:</span> <span class="token number">4</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  changeButton<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    alignSelf<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
    marginTop<span class="token punctuation">:</span> <span class="token number">5</span><span class="token punctuation">,</span>
    padding<span class="token punctuation">:</span> <span class="token number">3</span><span class="token punctuation">,</span>
    borderWidth<span class="token punctuation">:</span> <span class="token number">0.5</span><span class="token punctuation">,</span>
    borderColor<span class="token punctuation">:</span> <span class="token string">'#777777'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

exports<span class="token punctuation">.</span>displayName <span class="token operator">=</span> <span class="token punctuation">(</span>undefined<span class="token punctuation">:</span> <span class="token operator">?</span>string<span class="token punctuation">)</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>title <span class="token operator">=</span> <span class="token string">'&lt;MapView&gt;'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>description <span class="token operator">=</span> <span class="token string">'Base component to display maps'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>examples <span class="token operator">=</span> <span class="token punctuation">[</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Map'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> &lt;MapViewExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'showsUserLocation + followUserLocation'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;MapView
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>map<span class="token punctuation">}</span>
          showsUserLocation<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
          followUserLocation<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Callout example'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> &lt;AnnotationExample style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>map<span class="token punctuation">}</span> annotation<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>
        title<span class="token punctuation">:</span> <span class="token string">'More Info...'</span><span class="token punctuation">,</span>
        rightCalloutView<span class="token punctuation">:</span> <span class="token punctuation">(</span>
          &lt;TouchableOpacity
            onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
              <span class="token function">alert<span class="token punctuation">(</span></span><span class="token string">'You Are Here'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Image
              style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>width<span class="token punctuation">:</span><span class="token number">30</span><span class="token punctuation">,</span> height<span class="token punctuation">:</span><span class="token number">30</span><span class="token punctuation">}</span><span class="token punctuation">}</span>
              source<span class="token operator">=</span><span class="token punctuation">{</span><span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./uie_thumb_selected.png'</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
            <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>TouchableOpacity<span class="token operator">&gt;</span>
        <span class="token punctuation">)</span><span class="token punctuation">,</span>
      <span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Annotation focus example'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> &lt;AnnotationExample style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>map<span class="token punctuation">}</span> annotation<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>
        title<span class="token punctuation">:</span> <span class="token string">'More Info...'</span><span class="token punctuation">,</span>
        onFocus<span class="token punctuation">:</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
          <span class="token function">alert<span class="token punctuation">(</span></span><span class="token string">'Annotation gets focus'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span><span class="token punctuation">,</span>
        onBlur<span class="token punctuation">:</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
          <span class="token function">alert<span class="token punctuation">(</span></span><span class="token string">'Annotation lost focus'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span>
      <span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Draggable pin'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> &lt;AnnotationExample style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>map<span class="token punctuation">}</span> annotation<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>
        draggable<span class="token punctuation">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
        onDragStateChange<span class="token punctuation">:</span> <span class="token punctuation">(</span>event<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
          console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">'Drag state: '</span> <span class="token operator">+</span> event<span class="token punctuation">.</span>state<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span><span class="token punctuation">,</span>
      <span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Custom pin color'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> &lt;AnnotationExample style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>map<span class="token punctuation">}</span> annotation<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>
        title<span class="token punctuation">:</span> <span class="token string">'You Are Purple'</span><span class="token punctuation">,</span>
        tintColor<span class="token punctuation">:</span> MapView<span class="token punctuation">.</span>PinColors<span class="token punctuation">.</span>PURPLE<span class="token punctuation">,</span>
      <span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Custom pin image'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> &lt;AnnotationExample style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>map<span class="token punctuation">}</span> annotation<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>
        title<span class="token punctuation">:</span> <span class="token string">'Thumbs Up!'</span><span class="token punctuation">,</span>
        image<span class="token punctuation">:</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'image!uie_thumb_big'</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
      <span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Custom pin view'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> &lt;AnnotationExample style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>map<span class="token punctuation">}</span> annotation<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>
        title<span class="token punctuation">:</span> <span class="token string">'Thumbs Up!'</span><span class="token punctuation">,</span>
        view<span class="token punctuation">:</span> &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>
          alignItems<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
        <span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontWeight<span class="token punctuation">:</span> <span class="token string">'bold'</span><span class="token punctuation">,</span> color<span class="token punctuation">:</span> <span class="token string">'#f007'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            Thumbs Up<span class="token operator">!</span>
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;Image
            style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>width<span class="token punctuation">:</span> <span class="token number">90</span><span class="token punctuation">,</span> height<span class="token punctuation">:</span> <span class="token number">65</span><span class="token punctuation">,</span> resizeMode<span class="token punctuation">:</span> <span class="token string">'cover'</span><span class="token punctuation">}</span><span class="token punctuation">}</span>
            source<span class="token operator">=</span><span class="token punctuation">{</span><span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'image!uie_thumb_big'</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span><span class="token punctuation">,</span>
      <span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Custom overlay'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> &lt;MapView
        style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>map<span class="token punctuation">}</span>
        region<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>
          latitude<span class="token punctuation">:</span> <span class="token number">39.06</span><span class="token punctuation">,</span>
          longitude<span class="token punctuation">:</span> <span class="token operator">-</span><span class="token number">95.22</span><span class="token punctuation">,</span>
        <span class="token punctuation">}</span><span class="token punctuation">}</span>
        overlays<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span><span class="token punctuation">{</span>
          coordinates<span class="token punctuation">:</span><span class="token punctuation">[</span>
            <span class="token punctuation">{</span>latitude<span class="token punctuation">:</span> <span class="token number">32.47</span><span class="token punctuation">,</span> longitude<span class="token punctuation">:</span> <span class="token operator">-</span><span class="token number">107.85</span><span class="token punctuation">}</span><span class="token punctuation">,</span>
            <span class="token punctuation">{</span>latitude<span class="token punctuation">:</span> <span class="token number">45.13</span><span class="token punctuation">,</span> longitude<span class="token punctuation">:</span> <span class="token operator">-</span><span class="token number">94.48</span><span class="token punctuation">}</span><span class="token punctuation">,</span>
            <span class="token punctuation">{</span>latitude<span class="token punctuation">:</span> <span class="token number">39.27</span><span class="token punctuation">,</span> longitude<span class="token punctuation">:</span> <span class="token operator">-</span><span class="token number">83.25</span><span class="token punctuation">}</span><span class="token punctuation">,</span>
            <span class="token punctuation">{</span>latitude<span class="token punctuation">:</span> <span class="token number">32.47</span><span class="token punctuation">,</span> longitude<span class="token punctuation">:</span> <span class="token operator">-</span><span class="token number">107.85</span><span class="token punctuation">}</span><span class="token punctuation">,</span>
          <span class="token punctuation">]</span><span class="token punctuation">,</span>
          strokeColor<span class="token punctuation">:</span> <span class="token string">'#f007'</span><span class="token punctuation">,</span>
          lineWidth<span class="token punctuation">:</span> <span class="token number">3</span><span class="token punctuation">,</span>
        <span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span>
      <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">]</span><span class="token punctuation">;</span></div></div></div><div class="docs-prevnext"><a class="docs-next" href="docs/modal.html#content">Next →</a></div>
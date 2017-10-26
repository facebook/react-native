---
id: native-components-ios
title: native-components-ios
---
<a id="content"></a><h1><a class="anchor" name="native-ui-components"></a>Native UI Components <a class="hash-link" href="docs/native-components-ios.html#native-ui-components">#</a></h1><div class="banner-crna-ejected"><h3>Project with Native Code Required</h3><p>This page only applies to projects made with <code>react-native init</code> or to those made with Create React Native App which have since ejected. For more information about ejecting, please see the <a href="https://github.com/react-community/create-react-native-app/blob/master/EJECTING.md" target="_blank">guide</a> on the Create React Native App repository.</p></div><div><p>There are tons of native UI widgets out there ready to be used in the latest apps - some of them are part of the platform, others are available as third-party libraries, and still more might be in use in your very own portfolio.  React Native has several of the most critical platform components already wrapped, like <code>ScrollView</code> and <code>TextInput</code>, but not all of them, and certainly not ones you might have written yourself for a previous app.  Fortunately, it's quite easy to wrap up these existing components for seamless integration with your React Native application.</p><p>Like the native module guide, this too is a more advanced guide that assumes you are somewhat familiar with iOS programming.  This guide will show you how to build a native UI component, walking you through the implementation of a subset of the existing <code>MapView</code> component available in the core React Native library.</p><h2><a class="anchor" name="ios-mapview-example"></a>iOS MapView example <a class="hash-link" href="docs/native-components-ios.html#ios-mapview-example">#</a></h2><p>Let's say we want to add an interactive Map to our app - might as well use <a href="https://developer.apple.com/library/prerelease/mac/documentation/MapKit/Reference/MKMapView_Class/index.html" target="_blank"><code>MKMapView</code></a>, we just need to make it usable from JavaScript.</p><p>Native views are created and manipulated by subclasses of <code>RCTViewManager</code>.  These subclasses are similar in function to view controllers, but are essentially singletons - only one instance of each is created by the bridge.  They expose native views to the <code>RCTUIManager</code>, which delegates back to them to set and update the properties of the views as necessary.  The <code>RCTViewManager</code>s are also typically the delegates for the views, sending events back to JavaScript via the bridge.</p><p>Exposing a view is simple:</p><ul><li>Subclass <code>RCTViewManager</code> to create a manager for your component.</li><li>Add the <code>RCT_EXPORT_MODULE()</code> marker macro.</li><li>Implement the <code>-(UIView *)view</code> method.</li></ul><div class="prism language-objectivec"><span class="token comment" spellcheck="true">// RNTMapManager.m
</span><span class="token macro">#<span class="token directive">import</span> &lt;MapKit/MapKit.h&gt;</span>

<span class="token macro">#<span class="token directive">import</span> &lt;React/RCTViewManager.h&gt;</span>

<span class="token keyword">@interface</span> <span class="token class-name">RNTMapManager</span> <span class="token punctuation">:</span> RCTViewManager
<span class="token keyword">@end</span>

<span class="token keyword">@implementation</span> RNTMapManager

<span class="token function">RCT_EXPORT_MODULE<span class="token punctuation">(</span></span><span class="token punctuation">)</span>

<span class="token operator">-</span> <span class="token punctuation">(</span>UIView <span class="token operator">*</span><span class="token punctuation">)</span>view
<span class="token punctuation">{</span>
  <span class="token keyword">return</span> <span class="token punctuation">[</span><span class="token punctuation">[</span>MKMapView alloc<span class="token punctuation">]</span> init<span class="token punctuation">]</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>

<span class="token keyword">@end</span></div><p><strong>Note:</strong> Do not attempt to set the <code>frame</code> or <code>backgroundColor</code> properties on the <code>UIView</code> instance that you expose through the <code>-view</code> method. React Native will overwrite the values set by your custom class in order to match your JavaScript component's layout props. If you need this granularity of control it might be better to wrap the <code>UIView</code> instance you want to style in another <code>UIView</code> and return the wrapper <code>UIView</code> instead. See <a href="https://github.com/facebook/react-native/issues/2948" target="_blank">Issue 2948</a> for more context.</p><blockquote><p>In the example above, we prefixed our class name with <code>RNT</code>. Prefixes are used to avoid name collisions with other frameworks. Apple frameworks use two-letter prefixes, and React Native uses <code>RCT</code> as a prefix. In order to avoid name collisions, we recommend using a three-letter prefix other than <code>RCT</code> in your own classes.</p></blockquote><p>Then you just need a little bit of JavaScript to make this a usable React component:</p><div class="prism language-javascript"><span class="token comment" spellcheck="true">// MapView.js
</span>
<span class="token keyword">import</span> <span class="token punctuation">{</span> requireNativeComponent <span class="token punctuation">}</span> <span class="token keyword">from</span> <span class="token string">'react-native'</span><span class="token punctuation">;</span>
<span class="token comment" spellcheck="true">
// requireNativeComponent automatically resolves 'RNTMap' to 'RNTMapManager'
</span>module<span class="token punctuation">.</span>exports <span class="token operator">=</span> <span class="token function">requireNativeComponent</span><span class="token punctuation">(</span><span class="token string">'RNTMap'</span><span class="token punctuation">,</span> <span class="token keyword">null</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token comment" spellcheck="true">
// MyApp.js
</span>
<span class="token keyword">import</span> MapView <span class="token keyword">from</span> <span class="token string">'./MapView.js'</span><span class="token punctuation">;</span>

<span class="token operator">...</span>

<span class="token function">render</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token keyword">return</span> <span class="token operator">&lt;</span>MapView style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span> flex<span class="token punctuation">:</span> <span class="token number">1</span> <span class="token punctuation">}</span><span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span></div><p>Make sure to use <code>RNTMap</code> here. We want to require the manager here, which will expose the view of our manager for use in Javascript. </p><p><strong>Note:</strong> When rendering, don't forget to stretch the view, otherwise you'll be staring at a blank screen.</p><div class="prism language-javascript">  <span class="token function">render</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token operator">&lt;</span>MapView style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">}</span><span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span></div><p>This is now a fully-functioning native map view component in JavaScript, complete with pinch-zoom and other native gesture support.  We can't really control it from JavaScript yet, though :(</p><h2><a class="anchor" name="properties"></a>Properties <a class="hash-link" href="docs/native-components-ios.html#properties">#</a></h2><p>The first thing we can do to make this component more usable is to bridge over some native properties. Let's say we want to be able to disable zooming and specify the visible region. Disabling zoom is a simple boolean, so we add this one line:</p><div class="prism language-objectivec"><span class="token comment" spellcheck="true">// RNTMapManager.m
</span><span class="token function">RCT_EXPORT_VIEW_PROPERTY<span class="token punctuation">(</span></span>zoomEnabled<span class="token punctuation">,</span> BOOL<span class="token punctuation">)</span></div><p>Note that we explicitly specify the type as <code>BOOL</code> - React Native uses <code>RCTConvert</code> under the hood to convert all sorts of different data types when talking over the bridge, and bad values will show convenient "RedBox" errors to let you know there is an issue ASAP. When things are straightforward like this, the whole implementation is taken care of for you by this macro.</p><p>Now to actually disable zooming, we set the property in JS:</p><div class="prism language-javascript"><span class="token comment" spellcheck="true">// MyApp.js
</span><span class="token operator">&lt;</span>MapView 
  zoomEnabled<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">false</span><span class="token punctuation">}</span> 
  style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span> flex<span class="token punctuation">:</span> <span class="token number">1</span> <span class="token punctuation">}</span><span class="token punctuation">}</span>
<span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span></div><p>To document the properties (and which values they accept) of our MapView component we'll add a wrapper component and document the interface with React <code>PropTypes</code>:</p><div class="prism language-javascript"><span class="token comment" spellcheck="true">// MapView.js
</span><span class="token keyword">import</span> PropTypes <span class="token keyword">from</span> <span class="token string">'prop-types'</span><span class="token punctuation">;</span>
<span class="token keyword">import</span> React <span class="token keyword">from</span> <span class="token string">'react'</span><span class="token punctuation">;</span>
<span class="token keyword">import</span> <span class="token punctuation">{</span> requireNativeComponent <span class="token punctuation">}</span> <span class="token keyword">from</span> <span class="token string">'react-native'</span><span class="token punctuation">;</span>

<span class="token keyword">class</span> <span class="token class-name">MapView</span> <span class="token keyword">extends</span> <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  <span class="token function">render</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token operator">&lt;</span>RNTMap <span class="token punctuation">{</span><span class="token operator">...</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

MapView<span class="token punctuation">.</span>propTypes <span class="token operator">=</span> <span class="token punctuation">{</span>
  <span class="token comment" spellcheck="true">/**
   * A Boolean value that determines whether the user may use pinch 
   * gestures to zoom in and out of the map.
   */</span>
  zoomEnabled<span class="token punctuation">:</span> PropTypes<span class="token punctuation">.</span>bool<span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> RNTMap <span class="token operator">=</span> <span class="token function">requireNativeComponent</span><span class="token punctuation">(</span><span class="token string">'RNTMap'</span><span class="token punctuation">,</span> MapView<span class="token punctuation">)</span><span class="token punctuation">;</span>

module<span class="token punctuation">.</span>exports <span class="token operator">=</span> MapView<span class="token punctuation">;</span></div><p>Now we have a nicely documented wrapper component that is easy to work with.  Note that we changed the second argument to <code>requireNativeComponent</code> from <code>null</code> to the new <code>MapView</code> wrapper component.  This allows the infrastructure to verify that the propTypes match the native props to reduce the chances of mismatches between the ObjC and JS code.</p><p>Next, let's add the more complex <code>region</code> prop.  We start by adding the native code:</p><div class="prism language-objectivec"><span class="token comment" spellcheck="true">// RNTMapManager.m
</span><span class="token function">RCT_CUSTOM_VIEW_PROPERTY<span class="token punctuation">(</span></span>region<span class="token punctuation">,</span> MKCoordinateRegion<span class="token punctuation">,</span> MKMapView<span class="token punctuation">)</span>
<span class="token punctuation">{</span>
  <span class="token punctuation">[</span>view setRegion<span class="token punctuation">:</span>json <span class="token operator">?</span> <span class="token punctuation">[</span>RCTConvert MKCoordinateRegion<span class="token punctuation">:</span>json<span class="token punctuation">]</span> <span class="token punctuation">:</span> defaultView<span class="token punctuation">.</span>region animated<span class="token punctuation">:</span>YES<span class="token punctuation">]</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span></div><p>Ok, this is more complicated than the simple <code>BOOL</code> case we had before.  Now we have a <code>MKCoordinateRegion</code> type that needs a conversion function, and we have custom code so that the view will animate when we set the region from JS.  Within the function body that we provide, <code>json</code> refers to the raw value that has been passed from JS.  There is also a <code>view</code> variable which gives us access to the manager's view instance, and a <code>defaultView</code> that we use to reset the property back to the default value if JS sends us a null sentinel.</p><p>You could write any conversion function you want for your view - here is the implementation for <code>MKCoordinateRegion</code> via a category on <code>RCTConvert</code>. It uses an already existing category of ReactNative <code>RCTConvert+CoreLocation</code>:</p><div class="prism language-objectivec"><span class="token comment" spellcheck="true">// RNTMapManager.m
</span>
<span class="token macro">#<span class="token directive">import</span> "RCTConvert+Mapkit.m"</span>
<span class="token comment" spellcheck="true">
// RCTConvert+Mapkit.h
</span>
<span class="token macro">#<span class="token directive">import</span> &lt;MapKit/MapKit.h&gt;</span>
<span class="token macro">#<span class="token directive">import</span> &lt;React/RCTConvert.h&gt;</span>
<span class="token macro">#<span class="token directive">import</span> &lt;CoreLocation/CoreLocation.h&gt;</span>
<span class="token macro">#<span class="token directive">import</span> &lt;React/RCTConvert+CoreLocation.h&gt;</span>

<span class="token keyword">@interface</span> <span class="token class-name">RCTConvert</span> <span class="token punctuation">(</span>Mapkit<span class="token punctuation">)</span>

<span class="token operator">+</span> <span class="token punctuation">(</span>MKCoordinateSpan<span class="token punctuation">)</span>MKCoordinateSpan<span class="token punctuation">:</span><span class="token punctuation">(</span>id<span class="token punctuation">)</span>json<span class="token punctuation">;</span>
<span class="token operator">+</span> <span class="token punctuation">(</span>MKCoordinateRegion<span class="token punctuation">)</span>MKCoordinateRegion<span class="token punctuation">:</span><span class="token punctuation">(</span>id<span class="token punctuation">)</span>json<span class="token punctuation">;</span>

<span class="token keyword">@end</span>

<span class="token keyword">@implementation</span> <span class="token function">RCTConvert<span class="token punctuation">(</span></span>MapKit<span class="token punctuation">)</span>

<span class="token operator">+</span> <span class="token punctuation">(</span>MKCoordinateSpan<span class="token punctuation">)</span>MKCoordinateSpan<span class="token punctuation">:</span><span class="token punctuation">(</span>id<span class="token punctuation">)</span>json
<span class="token punctuation">{</span>
  json <span class="token operator">=</span> <span class="token punctuation">[</span><span class="token keyword">self</span> NSDictionary<span class="token punctuation">:</span>json<span class="token punctuation">]</span><span class="token punctuation">;</span>
  <span class="token keyword">return</span> <span class="token punctuation">(</span>MKCoordinateSpan<span class="token punctuation">)</span><span class="token punctuation">{</span>
    <span class="token punctuation">[</span><span class="token keyword">self</span> CLLocationDegrees<span class="token punctuation">:</span>json<span class="token punctuation">[</span><span class="token string">@"latitudeDelta"</span><span class="token punctuation">]</span><span class="token punctuation">]</span><span class="token punctuation">,</span>
    <span class="token punctuation">[</span><span class="token keyword">self</span> CLLocationDegrees<span class="token punctuation">:</span>json<span class="token punctuation">[</span><span class="token string">@"longitudeDelta"</span><span class="token punctuation">]</span><span class="token punctuation">]</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>

<span class="token operator">+</span> <span class="token punctuation">(</span>MKCoordinateRegion<span class="token punctuation">)</span>MKCoordinateRegion<span class="token punctuation">:</span><span class="token punctuation">(</span>id<span class="token punctuation">)</span>json
<span class="token punctuation">{</span>
  <span class="token keyword">return</span> <span class="token punctuation">(</span>MKCoordinateRegion<span class="token punctuation">)</span><span class="token punctuation">{</span>
    <span class="token punctuation">[</span><span class="token keyword">self</span> CLLocationCoordinate2D<span class="token punctuation">:</span>json<span class="token punctuation">]</span><span class="token punctuation">,</span>
    <span class="token punctuation">[</span><span class="token keyword">self</span> MKCoordinateSpan<span class="token punctuation">:</span>json<span class="token punctuation">]</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>

<span class="token keyword">@end</span></div><p>These conversion functions are designed to safely process any JSON that the JS might throw at them by displaying "RedBox" errors and returning standard initialization values when missing keys or other developer errors are encountered.</p><p>To finish up support for the <code>region</code> prop, we need to document it in <code>propTypes</code> (or we'll get an error that the native prop is undocumented), then we can set it just like any other prop:</p><div class="prism language-javascript"><span class="token comment" spellcheck="true">// MapView.js
</span>
MapView<span class="token punctuation">.</span>propTypes <span class="token operator">=</span> <span class="token punctuation">{</span>
  <span class="token comment" spellcheck="true">/**
   * A Boolean value that determines whether the user may use pinch 
   * gestures to zoom in and out of the map.
   */</span>
  zoomEnabled<span class="token punctuation">:</span> PropTypes<span class="token punctuation">.</span>bool<span class="token punctuation">,</span>

  <span class="token comment" spellcheck="true">/**
   * The region to be displayed by the map.
   *
   * The region is defined by the center coordinates and the span of
   * coordinates to display.
   */</span>
  region<span class="token punctuation">:</span> PropTypes<span class="token punctuation">.</span><span class="token function">shape</span><span class="token punctuation">(</span><span class="token punctuation">{</span>
    <span class="token comment" spellcheck="true">/**
     * Coordinates for the center of the map.
     */</span>
    latitude<span class="token punctuation">:</span> PropTypes<span class="token punctuation">.</span>number<span class="token punctuation">.</span>isRequired<span class="token punctuation">,</span>
    longitude<span class="token punctuation">:</span> PropTypes<span class="token punctuation">.</span>number<span class="token punctuation">.</span>isRequired<span class="token punctuation">,</span>

    <span class="token comment" spellcheck="true">/**
     * Distance between the minimum and the maximum latitude/longitude
     * to be displayed.
     */</span>
    latitudeDelta<span class="token punctuation">:</span> PropTypes<span class="token punctuation">.</span>number<span class="token punctuation">.</span>isRequired<span class="token punctuation">,</span>
    longitudeDelta<span class="token punctuation">:</span> PropTypes<span class="token punctuation">.</span>number<span class="token punctuation">.</span>isRequired<span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">;</span>
<span class="token comment" spellcheck="true">
// MyApp.js
</span>
<span class="token function">render</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token keyword">var</span> region <span class="token operator">=</span> <span class="token punctuation">{</span>
    latitude<span class="token punctuation">:</span> <span class="token number">37.48</span><span class="token punctuation">,</span>
    longitude<span class="token punctuation">:</span> <span class="token operator">-</span><span class="token number">122.16</span><span class="token punctuation">,</span>
    latitudeDelta<span class="token punctuation">:</span> <span class="token number">0.1</span><span class="token punctuation">,</span>
    longitudeDelta<span class="token punctuation">:</span> <span class="token number">0.1</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token keyword">return</span> <span class="token punctuation">(</span>
    <span class="token operator">&lt;</span>MapView 
      region<span class="token operator">=</span><span class="token punctuation">{</span>region<span class="token punctuation">}</span> 
      zoomEnabled<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">false</span><span class="token punctuation">}</span>
      style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span> flex<span class="token punctuation">:</span> <span class="token number">1</span> <span class="token punctuation">}</span><span class="token punctuation">}</span>
    <span class="token operator">/</span><span class="token operator">&gt;</span>
  <span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span></div><p>Here you can see that the shape of the region is explicit in the JS documentation - ideally we could codegen some of this stuff, but that's not happening yet.</p><p>Sometimes your native component will have some special properties that you don't want to them to be part of the API for the associated React component. For example, <code>Switch</code> has a custom <code>onChange</code> handler for the raw native event, and exposes an <code>onValueChange</code> handler property that is invoked with just the boolean value rather than the raw event. Since you don't want these native only properties to be part of the API, you don't want to put them in <code>propTypes</code>, but if you don't you'll get an error. The solution is simply to add them to the <code>nativeOnly</code> option, e.g.</p><div class="prism language-javascript"><span class="token keyword">var</span> RCTSwitch <span class="token operator">=</span> <span class="token function">requireNativeComponent</span><span class="token punctuation">(</span><span class="token string">'RCTSwitch'</span><span class="token punctuation">,</span> Switch<span class="token punctuation">,</span> <span class="token punctuation">{</span>
  nativeOnly<span class="token punctuation">:</span> <span class="token punctuation">{</span> onChange<span class="token punctuation">:</span> <span class="token boolean">true</span> <span class="token punctuation">}</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></div><h2><a class="anchor" name="events"></a>Events <a class="hash-link" href="docs/native-components-ios.html#events">#</a></h2><p>So now we have a native map component that we can control easily from JS, but how do we deal with events from the user, like pinch-zooms or panning to change the visible region?</p><p>Until now we've just returned a <code>MKMapView</code> instance from our manager's <code>-(UIView *)view</code> method. We can't add new properties to <code>MKMapView</code> so we have to create a new subclass from <code>MKMapView</code> which we use for our View. We can then add a <code>onRegionChange</code> callback on this subclass: </p><div class="prism language-objectivec"><span class="token comment" spellcheck="true">// RNTMapView.h
</span>
<span class="token macro">#<span class="token directive">import</span> &lt;MapKit/MapKit.h&gt;</span>

<span class="token macro">#<span class="token directive">import</span> &lt;React/RCTComponent.h&gt;</span>

<span class="token keyword">@interface</span> <span class="token class-name">RNTMapView</span><span class="token punctuation">:</span> MKMapView

<span class="token keyword">@property</span> <span class="token punctuation">(</span>nonatomic<span class="token punctuation">,</span> copy<span class="token punctuation">)</span> RCTBubblingEventBlock onRegionChange<span class="token punctuation">;</span>

<span class="token keyword">@end</span>
<span class="token comment" spellcheck="true">
// RNTMapView.m
</span>
<span class="token macro">#<span class="token directive">import</span> "RNTMapView.h"</span>

<span class="token keyword">@implementation</span> RNTMapView

<span class="token keyword">@end</span></div><p>Next, declare an event handler property on <code>RNTMapManager</code>, make it a delegate for all the views it exposes, and forward events to JS by calling the event handler block from the native view.</p><div class="prism language-objectivec{9,17,31-48}"><span class="token comment" spellcheck="true">// RNTMapManager.m
</span>
#<span class="token keyword">import</span> <span class="token operator">&lt;</span>MapKit<span class="token operator">/</span>MapKit<span class="token punctuation">.</span>h<span class="token operator">&gt;</span>
#<span class="token keyword">import</span> <span class="token operator">&lt;</span>React<span class="token operator">/</span>RCTViewManager<span class="token punctuation">.</span>h<span class="token operator">&gt;</span>

#<span class="token keyword">import</span> <span class="token string">"RNTMapView.h"</span>
#<span class="token keyword">import</span> <span class="token string">"RCTConvert+Mapkit.m"</span>

@<span class="token keyword">interface</span> <span class="token class-name">RNTMapManager</span> <span class="token punctuation">:</span> RCTViewManager <span class="token operator">&lt;</span>MKMapViewDelegate<span class="token operator">&gt;</span>
@end

@implementation RNTMapManager

<span class="token function">RCT_EXPORT_MODULE</span><span class="token punctuation">(</span><span class="token punctuation">)</span>

<span class="token function">RCT_EXPORT_VIEW_PROPERTY</span><span class="token punctuation">(</span>zoomEnabled<span class="token punctuation">,</span> BOOL<span class="token punctuation">)</span>
<span class="token function">RCT_EXPORT_VIEW_PROPERTY</span><span class="token punctuation">(</span>onRegionChange<span class="token punctuation">,</span> RCTBubblingEventBlock<span class="token punctuation">)</span>

<span class="token function">RCT_CUSTOM_VIEW_PROPERTY</span><span class="token punctuation">(</span>region<span class="token punctuation">,</span> MKCoordinateRegion<span class="token punctuation">,</span> MKMapView<span class="token punctuation">)</span>
<span class="token punctuation">{</span>
    <span class="token punctuation">[</span>view setRegion<span class="token punctuation">:</span>json <span class="token operator">?</span> <span class="token punctuation">[</span>RCTConvert MKCoordinateRegion<span class="token punctuation">:</span>json<span class="token punctuation">]</span> <span class="token punctuation">:</span> defaultView<span class="token punctuation">.</span>region animated<span class="token punctuation">:</span>YES<span class="token punctuation">]</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>

<span class="token operator">-</span> <span class="token punctuation">(</span>UIView <span class="token operator">*</span><span class="token punctuation">)</span>view
<span class="token punctuation">{</span>
  RNTMapView <span class="token operator">*</span>map <span class="token operator">=</span> <span class="token punctuation">[</span>RNTMapView <span class="token keyword">new</span><span class="token punctuation">]</span><span class="token punctuation">;</span>
  map<span class="token punctuation">.</span>delegate <span class="token operator">=</span> self<span class="token punctuation">;</span>
  <span class="token keyword">return</span> map<span class="token punctuation">;</span>
<span class="token punctuation">}</span>

#pragma mark MKMapViewDelegate

<span class="token operator">-</span> <span class="token punctuation">(</span><span class="token keyword">void</span><span class="token punctuation">)</span>mapView<span class="token punctuation">:</span><span class="token punctuation">(</span>RNTMapView <span class="token operator">*</span><span class="token punctuation">)</span>mapView regionDidChangeAnimated<span class="token punctuation">:</span><span class="token punctuation">(</span>BOOL<span class="token punctuation">)</span>animated
<span class="token punctuation">{</span>
  <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span>mapView<span class="token punctuation">.</span>onRegionChange<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  MKCoordinateRegion region <span class="token operator">=</span> mapView<span class="token punctuation">.</span>region<span class="token punctuation">;</span>
  mapView<span class="token punctuation">.</span><span class="token function">onRegionChange</span><span class="token punctuation">(</span>@<span class="token punctuation">{</span>
    @<span class="token string">"region"</span><span class="token punctuation">:</span> @<span class="token punctuation">{</span>
      @<span class="token string">"latitude"</span><span class="token punctuation">:</span> @<span class="token punctuation">(</span>region<span class="token punctuation">.</span>center<span class="token punctuation">.</span>latitude<span class="token punctuation">)</span><span class="token punctuation">,</span>
      @<span class="token string">"longitude"</span><span class="token punctuation">:</span> @<span class="token punctuation">(</span>region<span class="token punctuation">.</span>center<span class="token punctuation">.</span>longitude<span class="token punctuation">)</span><span class="token punctuation">,</span>
      @<span class="token string">"latitudeDelta"</span><span class="token punctuation">:</span> @<span class="token punctuation">(</span>region<span class="token punctuation">.</span>span<span class="token punctuation">.</span>latitudeDelta<span class="token punctuation">)</span><span class="token punctuation">,</span>
      @<span class="token string">"longitudeDelta"</span><span class="token punctuation">:</span> @<span class="token punctuation">(</span>region<span class="token punctuation">.</span>span<span class="token punctuation">.</span>longitudeDelta<span class="token punctuation">)</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
@end</div><p>In the delegate method <code>-mapView:regionDidChangeAnimated:</code> the event handler block is called on the corresponding view with the region data. Calling the <code>onRegionChange</code> event handler block results in calling the same callback prop in JavaScript. This callback is invoked with the raw event, which we typically process in the wrapper component to make a simpler API:</p><div class="prism language-javascript"><span class="token comment" spellcheck="true">// MapView.js
</span>
<span class="token keyword">class</span> <span class="token class-name">MapView</span> <span class="token keyword">extends</span> <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  _onRegionChange <span class="token operator">=</span> <span class="token punctuation">(</span>event<span class="token punctuation">)</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>onRegionChange<span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

   <span class="token comment" spellcheck="true"> // process raw event... 
</span>    <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span><span class="token function">onRegionChange</span><span class="token punctuation">(</span>event<span class="token punctuation">.</span>nativeEvent<span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
  <span class="token function">render</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      <span class="token operator">&lt;</span>RNTMap 
        <span class="token punctuation">{</span><span class="token operator">...</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">}</span> 
        onRegionChange<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_onRegionChange<span class="token punctuation">}</span> 
      <span class="token operator">/</span><span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
MapView<span class="token punctuation">.</span>propTypes <span class="token operator">=</span> <span class="token punctuation">{</span>
  <span class="token comment" spellcheck="true">/**
   * Callback that is called continuously when the user is dragging the map.
   */</span>
  onRegionChange<span class="token punctuation">:</span> PropTypes<span class="token punctuation">.</span>func<span class="token punctuation">,</span>
  <span class="token operator">...</span>
<span class="token punctuation">}</span><span class="token punctuation">;</span>
<span class="token comment" spellcheck="true">
// MyApp.js
</span>
<span class="token keyword">class</span> <span class="token class-name">MyApp</span> <span class="token keyword">extends</span> <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  <span class="token function">onRegionChange</span><span class="token punctuation">(</span>event<span class="token punctuation">)</span> <span class="token punctuation">{</span>
   <span class="token comment" spellcheck="true"> // Do stuff with event.region.latitude, etc.
</span>  <span class="token punctuation">}</span>

  <span class="token function">render</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">var</span> region <span class="token operator">=</span> <span class="token punctuation">{</span>
      latitude<span class="token punctuation">:</span> <span class="token number">37.48</span><span class="token punctuation">,</span>
      longitude<span class="token punctuation">:</span> <span class="token operator">-</span><span class="token number">122.16</span><span class="token punctuation">,</span>
      latitudeDelta<span class="token punctuation">:</span> <span class="token number">0.1</span><span class="token punctuation">,</span>
      longitudeDelta<span class="token punctuation">:</span> <span class="token number">0.1</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      <span class="token operator">&lt;</span>MapView
        region<span class="token operator">=</span><span class="token punctuation">{</span>region<span class="token punctuation">}</span> 
        zoomEnabled<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">false</span><span class="token punctuation">}</span> 
        onRegionChange<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>onRegionChange<span class="token punctuation">}</span>
      <span class="token operator">/</span><span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>  
<span class="token punctuation">}</span></div><h2><a class="anchor" name="styles"></a>Styles <a class="hash-link" href="docs/native-components-ios.html#styles">#</a></h2><p>Since all our native react views are subclasses of <code>UIView</code>, most style attributes will work like you would expect out of the box.  Some components will want a default style, however, for example <code>UIDatePicker</code> which is a fixed size.  This default style is important for the layout algorithm to work as expected, but we also want to be able to override the default style when using the component. <code>DatePickerIOS</code> does this by wrapping the native component in an extra view, which has flexible styling, and using a fixed style (which is generated with constants passed in from native) on the inner native component:</p><div class="prism language-javascript"><span class="token comment" spellcheck="true">// DatePickerIOS.ios.js
</span>
<span class="token keyword">import</span> <span class="token punctuation">{</span> UIManager <span class="token punctuation">}</span> <span class="token keyword">from</span> <span class="token string">'react-native'</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> RCTDatePickerIOSConsts <span class="token operator">=</span> UIManager<span class="token punctuation">.</span>RCTDatePicker<span class="token punctuation">.</span>Constants<span class="token punctuation">;</span>
<span class="token operator">...</span>
  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      <span class="token operator">&lt;</span>View style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>style<span class="token punctuation">}</span><span class="token operator">&gt;</span>
        <span class="token operator">&lt;</span>RCTDatePickerIOS
          ref<span class="token operator">=</span><span class="token punctuation">{</span>DATEPICKER<span class="token punctuation">}</span>
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>rkDatePickerIOS<span class="token punctuation">}</span>
          <span class="token operator">...</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
      <span class="token operator">&lt;</span><span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> styles <span class="token operator">=</span> StyleSheet<span class="token punctuation">.</span><span class="token function">create</span><span class="token punctuation">(</span><span class="token punctuation">{</span>
  rkDatePickerIOS<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    height<span class="token punctuation">:</span> RCTDatePickerIOSConsts<span class="token punctuation">.</span>ComponentHeight<span class="token punctuation">,</span>
    width<span class="token punctuation">:</span> RCTDatePickerIOSConsts<span class="token punctuation">.</span>ComponentWidth<span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></div><p>The <code>RCTDatePickerIOSConsts</code> constants are exported from native by grabbing the actual frame of the native component like so:</p><div class="prism language-objectivec"><span class="token comment" spellcheck="true">// RCTDatePickerManager.m
</span>
<span class="token operator">-</span> <span class="token punctuation">(</span>NSDictionary <span class="token operator">*</span><span class="token punctuation">)</span>constantsToExport
<span class="token punctuation">{</span>
  UIDatePicker <span class="token operator">*</span>dp <span class="token operator">=</span> <span class="token punctuation">[</span><span class="token punctuation">[</span>UIDatePicker alloc<span class="token punctuation">]</span> init<span class="token punctuation">]</span><span class="token punctuation">;</span>
  <span class="token punctuation">[</span>dp layoutIfNeeded<span class="token punctuation">]</span><span class="token punctuation">;</span>

  <span class="token keyword">return</span> <span class="token operator">@</span><span class="token punctuation">{</span>
    <span class="token string">@"ComponentHeight"</span><span class="token punctuation">:</span> <span class="token operator">@</span><span class="token punctuation">(</span><span class="token function">CGRectGetHeight<span class="token punctuation">(</span></span>dp<span class="token punctuation">.</span>frame<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
    <span class="token string">@"ComponentWidth"</span><span class="token punctuation">:</span> <span class="token operator">@</span><span class="token punctuation">(</span><span class="token function">CGRectGetWidth<span class="token punctuation">(</span></span>dp<span class="token punctuation">.</span>frame<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
    <span class="token string">@"DatePickerModes"</span><span class="token punctuation">:</span> <span class="token operator">@</span><span class="token punctuation">{</span>
      <span class="token string">@"time"</span><span class="token punctuation">:</span> <span class="token operator">@</span><span class="token punctuation">(</span>UIDatePickerModeTime<span class="token punctuation">)</span><span class="token punctuation">,</span>
      <span class="token string">@"date"</span><span class="token punctuation">:</span> <span class="token operator">@</span><span class="token punctuation">(</span>UIDatePickerModeDate<span class="token punctuation">)</span><span class="token punctuation">,</span>
      <span class="token string">@"datetime"</span><span class="token punctuation">:</span> <span class="token operator">@</span><span class="token punctuation">(</span>UIDatePickerModeDateAndTime<span class="token punctuation">)</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span></div><p>This guide covered many of the aspects of bridging over custom native components, but there is even more you might need to consider, such as custom hooks for inserting and laying out subviews. If you want to go even deeper, check out the <a href="https://github.com/facebook/react-native/blob/master/React/Views" target="_blank">source code</a> of some of the implemented components. </p></div><div class="docs-prevnext"><a class="docs-prev btn" href="docs/native-modules-ios.html#content">← Previous</a><a class="docs-next btn" href="docs/linking-libraries-ios.html#content">Continue Reading →</a></div><p class="edit-page-block"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/docs/NativeComponentsIOS.md">Improve this page</a> by sending a pull request!</p>
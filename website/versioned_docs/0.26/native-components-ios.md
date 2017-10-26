---
id: native-components-ios
title: native-components-ios
---
<a id="content"></a><table width="100%"><tbody><tr><td><h1><a class="anchor" name="native-ui-components"></a>Native UI Components <a class="hash-link" href="docs/native-components-ios.html#native-ui-components">#</a></h1></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/docs/NativeComponentsIOS.md">Edit on GitHub</a></td></tr></tbody></table><div><p>There are tons of native UI widgets out there ready to be used in the latest apps - some of them are part of the platform, others are available as third-party libraries, and still more might be in use in your very own portfolio.  React Native has several of the most critical platform components already wrapped, like <code>ScrollView</code> and <code>TextInput</code>, but not all of them, and certainly not ones you might have written yourself for a previous app.  Fortunately, it's quite easy to wrap up these existing components for seamless integration with your React Native application.</p><p>Like the native module guide, this too is a more advanced guide that assumes you are somewhat familiar with iOS programming.  This guide will show you how to build a native UI component, walking you through the implementation of a subset of the existing <code>MapView</code> component available in the core React Native library.</p><h2><a class="anchor" name="ios-mapview-example"></a>iOS MapView example <a class="hash-link" href="docs/native-components-ios.html#ios-mapview-example">#</a></h2><p>Let's say we want to add an interactive Map to our app - might as well use <a href="https://developer.apple.com/library/prerelease/mac/documentation/MapKit/Reference/MKMapView_Class/index.html" target="_blank"><code>MKMapView</code></a>, we just need to make it usable from JavaScript.</p><p>Native views are created and manipulated by subclasses of <code>RCTViewManager</code>.  These subclasses are similar in function to view controllers, but are essentially singletons - only one instance of each is created by the bridge.  They vend native views to the <code>RCTUIManager</code>, which delegates back to them to set and update the properties of the views as necessary.  The <code>RCTViewManager</code>s are also typically the delegates for the views, sending events back to JavaScript via the bridge.</p><p>Vending a view is simple:</p><ul><li>Create the basic subclass.</li><li>Add the <code>RCT_EXPORT_MODULE()</code> marker macro.</li><li>Implement the <code>-(UIView *)view</code> method.</li></ul><div class="prism language-javascript"><span class="token comment" spellcheck="true">// RCTMapManager.m
</span>#import &lt;MapKit<span class="token operator">/</span>MapKit<span class="token punctuation">.</span>h<span class="token operator">&gt;</span>

#import <span class="token string">"RCTViewManager.h"</span>

@interface <span class="token class-name">RCTMapManager</span> <span class="token punctuation">:</span> RCTViewManager
@end

@implementation RCTMapManager

<span class="token function">RCT_EXPORT_MODULE<span class="token punctuation">(</span></span><span class="token punctuation">)</span>

<span class="token operator">-</span> <span class="token punctuation">(</span>UIView <span class="token operator">*</span><span class="token punctuation">)</span>view
<span class="token punctuation">{</span>
  <span class="token keyword">return</span> <span class="token punctuation">[</span><span class="token punctuation">[</span>MKMapView alloc<span class="token punctuation">]</span> init<span class="token punctuation">]</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>

@end</div><p><strong>Note:</strong> Do not attempt to set the <code>frame</code> or <code>backgroundColor</code> properties on the <code>UIView</code> instance that you vend through the <code>-view</code> method. React Native will overwrite the values set by your custom class in order to match your JavaScript component's layout props. If you need this granularity of control it might be better to wrap the <code>UIView</code> instance you want to style in another <code>UIView</code> and return the wrapper <code>UIView</code> instead. See <a href="https://github.com/facebook/react-native/issues/2948" target="_blank">Issue 2948</a> for more context.</p><p>Then you just need a little bit of JavaScript to make this a usable React component:</p><div class="prism language-javascript"><span class="token comment" spellcheck="true">// MapView.js
</span>
import <span class="token punctuation">{</span> requireNativeComponent <span class="token punctuation">}</span> from <span class="token string">'react-native'</span><span class="token punctuation">;</span>
<span class="token comment" spellcheck="true">
// requireNativeComponent automatically resolves this to "RCTMapManager"
</span>module<span class="token punctuation">.</span>exports <span class="token operator">=</span> <span class="token function">requireNativeComponent<span class="token punctuation">(</span></span><span class="token string">'RCTMap'</span><span class="token punctuation">,</span> <span class="token keyword">null</span><span class="token punctuation">)</span><span class="token punctuation">;</span></div><p>This is now a fully-functioning native map view component in JavaScript, complete with pinch-zoom and other native gesture support.  We can't really control it from JavaScript yet, though :(</p><h2><a class="anchor" name="properties"></a>Properties <a class="hash-link" href="docs/native-components-ios.html#properties">#</a></h2><p>The first thing we can do to make this component more usable is to bridge over some native properties. Let's say we want to be able to disable pitch control and specify the visible region.  Disabling pitch is a simple boolean, so we add this one line:</p><div class="prism language-javascript"><span class="token comment" spellcheck="true">// RCTMapManager.m
</span><span class="token function">RCT_EXPORT_VIEW_PROPERTY<span class="token punctuation">(</span></span>pitchEnabled<span class="token punctuation">,</span> BOOL<span class="token punctuation">)</span></div><p>Note that we explicitly specify the type as <code>BOOL</code> - React Native uses <code>RCTConvert</code> under the hood to convert all sorts of different data types when talking over the bridge, and bad values will show convenient "RedBox" errors to let you know there is an issue ASAP.  When things are straightforward like this, the whole implementation is taken care of for you by this macro.</p><p>Now to actually disable pitch, we set the property in JS:</p><div class="prism language-javascript"><span class="token comment" spellcheck="true">// MyApp.js
</span>&lt;MapView pitchEnabled<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">false</span><span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span></div><p>This isn't very well documented though - in order to know what properties are available and what values they accept, the client of your new component needs to dig through the Objective-C code.  To make this better, let's make a wrapper component and document the interface with React <code>PropTypes</code>:</p><div class="prism language-javascript"><span class="token comment" spellcheck="true">// MapView.js
</span>import React from <span class="token string">'react'</span><span class="token punctuation">;</span>
import <span class="token punctuation">{</span> requireNativeComponent <span class="token punctuation">}</span> from <span class="token string">'react-native'</span><span class="token punctuation">;</span>

class <span class="token class-name">MapView</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> &lt;RCTMap <span class="token punctuation">{</span><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

MapView<span class="token punctuation">.</span>propTypes <span class="token operator">=</span> <span class="token punctuation">{</span>
  <span class="token comment" spellcheck="true">/**
   * When this property is set to `true` and a valid camera is associated
   * with the map, the camera’s pitch angle is used to tilt the plane
   * of the map. When this property is set to `false`, the camera’s pitch
   * angle is ignored and the map is always displayed as if the user
   * is looking straight down onto it.
   */</span>
  pitchEnabled<span class="token punctuation">:</span> React<span class="token punctuation">.</span>PropTypes<span class="token punctuation">.</span>bool<span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> RCTMap <span class="token operator">=</span> <span class="token function">requireNativeComponent<span class="token punctuation">(</span></span><span class="token string">'RCTMap'</span><span class="token punctuation">,</span> MapView<span class="token punctuation">)</span><span class="token punctuation">;</span>

module<span class="token punctuation">.</span>exports <span class="token operator">=</span> MapView<span class="token punctuation">;</span></div><p>Now we have a nicely documented wrapper component that is easy to work with.  Note that we changed the second argument to <code>requireNativeComponent</code> from <code>null</code> to the new <code>MapView</code> wrapper component.  This allows the infrastructure to verify that the propTypes match the native props to reduce the chances of mismatches between the ObjC and JS code.</p><p>Next, let's add the more complex <code>region</code> prop.  We start by adding the native code:</p><div class="prism language-javascript"><span class="token comment" spellcheck="true">// RCTMapManager.m
</span><span class="token function">RCT_CUSTOM_VIEW_PROPERTY<span class="token punctuation">(</span></span>region<span class="token punctuation">,</span> MKCoordinateRegion<span class="token punctuation">,</span> RCTMap<span class="token punctuation">)</span>
<span class="token punctuation">{</span>
  <span class="token punctuation">[</span>view setRegion<span class="token punctuation">:</span>json <span class="token operator">?</span> <span class="token punctuation">[</span>RCTConvert MKCoordinateRegion<span class="token punctuation">:</span>json<span class="token punctuation">]</span> <span class="token punctuation">:</span> defaultView<span class="token punctuation">.</span>region animated<span class="token punctuation">:</span>YES<span class="token punctuation">]</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span></div><p>Ok, this is more complicated than the simple <code>BOOL</code> case we had before.  Now we have a <code>MKCoordinateRegion</code> type that needs a conversion function, and we have custom code so that the view will animate when we set the region from JS.  Within the function body that we provide, <code>json</code> refers to the raw value that has been passed from JS.  There is also a <code>view</code> variable which gives us access to the manager's view instance, and a <code>defaultView</code> that we use to reset the property back to the default value if JS sends us a null sentinel.</p><p>You could write any conversion function you want for your view - here is the implementation for <code>MKCoordinateRegion</code> via two categories on <code>RCTConvert</code>:</p><div class="prism language-javascript">@implementation <span class="token function">RCTConvert<span class="token punctuation">(</span></span>CoreLocation<span class="token punctuation">)</span>

<span class="token function">RCT_CONVERTER<span class="token punctuation">(</span></span>CLLocationDegrees<span class="token punctuation">,</span> CLLocationDegrees<span class="token punctuation">,</span> doubleValue<span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token function">RCT_CONVERTER<span class="token punctuation">(</span></span>CLLocationDistance<span class="token punctuation">,</span> CLLocationDistance<span class="token punctuation">,</span> doubleValue<span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token operator">+</span> <span class="token punctuation">(</span>CLLocationCoordinate2D<span class="token punctuation">)</span>CLLocationCoordinate2D<span class="token punctuation">:</span><span class="token punctuation">(</span>id<span class="token punctuation">)</span>json
<span class="token punctuation">{</span>
  json <span class="token operator">=</span> <span class="token punctuation">[</span>self NSDictionary<span class="token punctuation">:</span>json<span class="token punctuation">]</span><span class="token punctuation">;</span>
  <span class="token keyword">return</span> <span class="token punctuation">(</span>CLLocationCoordinate2D<span class="token punctuation">)</span><span class="token punctuation">{</span>
    <span class="token punctuation">[</span>self CLLocationDegrees<span class="token punctuation">:</span>json<span class="token punctuation">[</span>@<span class="token string">"latitude"</span><span class="token punctuation">]</span><span class="token punctuation">]</span><span class="token punctuation">,</span>
    <span class="token punctuation">[</span>self CLLocationDegrees<span class="token punctuation">:</span>json<span class="token punctuation">[</span>@<span class="token string">"longitude"</span><span class="token punctuation">]</span><span class="token punctuation">]</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>

@end

@implementation <span class="token function">RCTConvert<span class="token punctuation">(</span></span>MapKit<span class="token punctuation">)</span>

<span class="token operator">+</span> <span class="token punctuation">(</span>MKCoordinateSpan<span class="token punctuation">)</span>MKCoordinateSpan<span class="token punctuation">:</span><span class="token punctuation">(</span>id<span class="token punctuation">)</span>json
<span class="token punctuation">{</span>
  json <span class="token operator">=</span> <span class="token punctuation">[</span>self NSDictionary<span class="token punctuation">:</span>json<span class="token punctuation">]</span><span class="token punctuation">;</span>
  <span class="token keyword">return</span> <span class="token punctuation">(</span>MKCoordinateSpan<span class="token punctuation">)</span><span class="token punctuation">{</span>
    <span class="token punctuation">[</span>self CLLocationDegrees<span class="token punctuation">:</span>json<span class="token punctuation">[</span>@<span class="token string">"latitudeDelta"</span><span class="token punctuation">]</span><span class="token punctuation">]</span><span class="token punctuation">,</span>
    <span class="token punctuation">[</span>self CLLocationDegrees<span class="token punctuation">:</span>json<span class="token punctuation">[</span>@<span class="token string">"longitudeDelta"</span><span class="token punctuation">]</span><span class="token punctuation">]</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>

<span class="token operator">+</span> <span class="token punctuation">(</span>MKCoordinateRegion<span class="token punctuation">)</span>MKCoordinateRegion<span class="token punctuation">:</span><span class="token punctuation">(</span>id<span class="token punctuation">)</span>json
<span class="token punctuation">{</span>
  <span class="token keyword">return</span> <span class="token punctuation">(</span>MKCoordinateRegion<span class="token punctuation">)</span><span class="token punctuation">{</span>
    <span class="token punctuation">[</span>self CLLocationCoordinate2D<span class="token punctuation">:</span>json<span class="token punctuation">]</span><span class="token punctuation">,</span>
    <span class="token punctuation">[</span>self MKCoordinateSpan<span class="token punctuation">:</span>json<span class="token punctuation">]</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span></div><p>These conversion functions are designed to safely process any JSON that the JS might throw at them by displaying "RedBox" errors and returning standard initialization values when missing keys or other developer errors are encountered.</p><p>To finish up support for the <code>region</code> prop, we need to document it in <code>propTypes</code> (or we'll get an error that the native prop is undocumented), then we can set it just like any other prop:</p><div class="prism language-javascript"><span class="token comment" spellcheck="true">// MapView.js
</span>
MapView<span class="token punctuation">.</span>propTypes <span class="token operator">=</span> <span class="token punctuation">{</span>
  <span class="token comment" spellcheck="true">/**
   * When this property is set to `true` and a valid camera is associated
   * with the map, the camera’s pitch angle is used to tilt the plane
   * of the map. When this property is set to `false`, the camera’s pitch
   * angle is ignored and the map is always displayed as if the user
   * is looking straight down onto it.
   */</span>
  pitchEnabled<span class="token punctuation">:</span> React<span class="token punctuation">.</span>PropTypes<span class="token punctuation">.</span>bool<span class="token punctuation">,</span>

  <span class="token comment" spellcheck="true">/**
   * The region to be displayed by the map.
   *
   * The region is defined by the center coordinates and the span of
   * coordinates to display.
   */</span>
  region<span class="token punctuation">:</span> React<span class="token punctuation">.</span>PropTypes<span class="token punctuation">.</span><span class="token function">shape<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
    <span class="token comment" spellcheck="true">/**
     * Coordinates for the center of the map.
     */</span>
    latitude<span class="token punctuation">:</span> React<span class="token punctuation">.</span>PropTypes<span class="token punctuation">.</span>number<span class="token punctuation">.</span>isRequired<span class="token punctuation">,</span>
    longitude<span class="token punctuation">:</span> React<span class="token punctuation">.</span>PropTypes<span class="token punctuation">.</span>number<span class="token punctuation">.</span>isRequired<span class="token punctuation">,</span>

    <span class="token comment" spellcheck="true">/**
     * Distance between the minimum and the maximum latitude/longitude
     * to be displayed.
     */</span>
    latitudeDelta<span class="token punctuation">:</span> React<span class="token punctuation">.</span>PropTypes<span class="token punctuation">.</span>number<span class="token punctuation">.</span>isRequired<span class="token punctuation">,</span>
    longitudeDelta<span class="token punctuation">:</span> React<span class="token punctuation">.</span>PropTypes<span class="token punctuation">.</span>number<span class="token punctuation">.</span>isRequired<span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">;</span>
<span class="token comment" spellcheck="true">
// MyApp.js
</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">var</span> region <span class="token operator">=</span> <span class="token punctuation">{</span>
      latitude<span class="token punctuation">:</span> <span class="token number">37.48</span><span class="token punctuation">,</span>
      longitude<span class="token punctuation">:</span> <span class="token operator">-</span><span class="token number">122.16</span><span class="token punctuation">,</span>
      latitudeDelta<span class="token punctuation">:</span> <span class="token number">0.1</span><span class="token punctuation">,</span>
      longitudeDelta<span class="token punctuation">:</span> <span class="token number">0.1</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
    <span class="token keyword">return</span> &lt;MapView region<span class="token operator">=</span><span class="token punctuation">{</span>region<span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span></div><p>Here you can see that the shape of the region is explicit in the JS documentation - ideally we could codegen some of this stuff, but that's not happening yet.</p><p>Sometimes you'll have some special properties that you need to expose for the native component, but don't actually want them as part of the API for the associated React component.  For example, <code>Switch</code> has a custom <code>onChange</code> handler for the raw native event, and exposes an <code>onValueChange</code> handler property that is invoked with just the boolean value rather than the raw event.  Since you don't want these native only properties to be part of the API, you don't want to put them in <code>propTypes</code>, but if you don't you'll get an error.  The solution is simply to call them out via the <code>nativeOnly</code> option, e.g.</p><div class="prism language-javascript"><span class="token keyword">var</span> RCTSwitch <span class="token operator">=</span> <span class="token function">requireNativeComponent<span class="token punctuation">(</span></span><span class="token string">'RCTSwitch'</span><span class="token punctuation">,</span> Switch<span class="token punctuation">,</span> <span class="token punctuation">{</span>
  nativeOnly<span class="token punctuation">:</span> <span class="token punctuation">{</span> onChange<span class="token punctuation">:</span> <span class="token boolean">true</span> <span class="token punctuation">}</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></div><h2><a class="anchor" name="events"></a>Events <a class="hash-link" href="docs/native-components-ios.html#events">#</a></h2><p>So now we have a native map component that we can control easily from JS, but how do we deal with events from the user, like pinch-zooms or panning to change the visible region?  The key is to declare an event handler property on <code>RCTMapManager</code>, make it a delegate for all the views it vends, and forward events to JS by calling the event handler block from the native view.  This looks like so (simplified from the full implementation):</p><div class="prism language-javascript"><span class="token comment" spellcheck="true">// RCTMap.h
</span>
#import &lt;MapKit<span class="token operator">/</span>MapKit<span class="token punctuation">.</span>h<span class="token operator">&gt;</span>

#import <span class="token string">"RCTComponent.h"</span>

@interface <span class="token class-name">RCTMap</span><span class="token punctuation">:</span> MKMapView

@property <span class="token punctuation">(</span>nonatomic<span class="token punctuation">,</span> copy<span class="token punctuation">)</span> RCTBubblingEventBlock onChange<span class="token punctuation">;</span>

@end</div><div class="prism language-javascript"><span class="token comment" spellcheck="true">// RCTMap.m
</span>
#import <span class="token string">"RCTMap.h"</span>

@implementation RCTMap

@end</div><div class="prism language-javascript"><span class="token comment" spellcheck="true">// RCTMapManager.m
</span>
#import <span class="token string">"RCTMapManager.h"</span>

#import &lt;MapKit<span class="token operator">/</span>MapKit<span class="token punctuation">.</span>h<span class="token operator">&gt;</span>

#import <span class="token string">"RCTMap.h"</span>
#import <span class="token string">"UIView+React.h"</span>

@interface <span class="token class-name">RCTMapManager</span><span class="token punctuation">(</span><span class="token punctuation">)</span> &lt;MKMapViewDelegate<span class="token operator">&gt;</span>
@end

@implementation RCTMapManager

<span class="token function">RCT_EXPORT_MODULE<span class="token punctuation">(</span></span><span class="token punctuation">)</span>

<span class="token function">RCT_EXPORT_VIEW_PROPERTY<span class="token punctuation">(</span></span>onChange<span class="token punctuation">,</span> RCTBubblingEventBlock<span class="token punctuation">)</span>

<span class="token operator">-</span> <span class="token punctuation">(</span>UIView <span class="token operator">*</span><span class="token punctuation">)</span>view
<span class="token punctuation">{</span>
  RCTMap <span class="token operator">*</span>map <span class="token operator">=</span> <span class="token punctuation">[</span>RCTMap <span class="token keyword">new</span><span class="token punctuation">]</span><span class="token punctuation">;</span>
  map<span class="token punctuation">.</span>delegate <span class="token operator">=</span> self<span class="token punctuation">;</span>
  <span class="token keyword">return</span> map<span class="token punctuation">;</span>
<span class="token punctuation">}</span>

#pragma mark MKMapViewDelegate

<span class="token operator">-</span> <span class="token punctuation">(</span>void<span class="token punctuation">)</span>mapView<span class="token punctuation">:</span><span class="token punctuation">(</span>RCTMap <span class="token operator">*</span><span class="token punctuation">)</span>mapView regionDidChangeAnimated<span class="token punctuation">:</span><span class="token punctuation">(</span>BOOL<span class="token punctuation">)</span>animated
<span class="token punctuation">{</span>
  <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span>mapView<span class="token punctuation">.</span>onChange<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  MKCoordinateRegion region <span class="token operator">=</span> mapView<span class="token punctuation">.</span>region<span class="token punctuation">;</span>
  mapView<span class="token punctuation">.</span><span class="token function">onChange<span class="token punctuation">(</span></span>@<span class="token punctuation">{</span>
    @<span class="token string">"region"</span><span class="token punctuation">:</span> @<span class="token punctuation">{</span>
      @<span class="token string">"latitude"</span><span class="token punctuation">:</span> @<span class="token punctuation">(</span>region<span class="token punctuation">.</span>center<span class="token punctuation">.</span>latitude<span class="token punctuation">)</span><span class="token punctuation">,</span>
      @<span class="token string">"longitude"</span><span class="token punctuation">:</span> @<span class="token punctuation">(</span>region<span class="token punctuation">.</span>center<span class="token punctuation">.</span>longitude<span class="token punctuation">)</span><span class="token punctuation">,</span>
      @<span class="token string">"latitudeDelta"</span><span class="token punctuation">:</span> @<span class="token punctuation">(</span>region<span class="token punctuation">.</span>span<span class="token punctuation">.</span>latitudeDelta<span class="token punctuation">)</span><span class="token punctuation">,</span>
      @<span class="token string">"longitudeDelta"</span><span class="token punctuation">:</span> @<span class="token punctuation">(</span>region<span class="token punctuation">.</span>span<span class="token punctuation">.</span>longitudeDelta<span class="token punctuation">)</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span></div><p>You can see we're adding an event handler property to the view by subclassing <code>MKMapView</code>.  Then we're exposing the <code>onChange</code> event handler property and setting the manager as the delegate for every view that it vends. Finally, in the delegate method <code>-mapView:regionDidChangeAnimated:</code> the event handler block is called on the corresponding view with the region data.  Calling the <code>onChange</code> event handler block results in calling the same callback prop in JavaScript.  This callback is invoked with the raw event, which we typically process in the wrapper component to make a simpler API:</p><div class="prism language-javascript"><span class="token comment" spellcheck="true">// MapView.js
</span>
class <span class="token class-name">MapView</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  <span class="token function">constructor<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>_onChange <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span>_onChange<span class="token punctuation">.</span><span class="token function">bind<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
  <span class="token function">_onChange<span class="token punctuation">(</span></span>event<span class="token punctuation">:</span> Event<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>onRegionChange<span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span><span class="token function">onRegionChange<span class="token punctuation">(</span></span>event<span class="token punctuation">.</span>nativeEvent<span class="token punctuation">.</span>region<span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> &lt;RCTMap <span class="token punctuation">{</span><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">}</span> onChange<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_onChange<span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
MapView<span class="token punctuation">.</span>propTypes <span class="token operator">=</span> <span class="token punctuation">{</span>
  <span class="token comment" spellcheck="true">/**
   * Callback that is called continuously when the user is dragging the map.
   */</span>
  onRegionChange<span class="token punctuation">:</span> React<span class="token punctuation">.</span>PropTypes<span class="token punctuation">.</span>func<span class="token punctuation">,</span>
  <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span>
<span class="token punctuation">}</span><span class="token punctuation">;</span></div><h2><a class="anchor" name="styles"></a>Styles <a class="hash-link" href="docs/native-components-ios.html#styles">#</a></h2><p>Since all our native react views are subclasses of <code>UIView</code>, most style attributes will work like you would expect out of the box.  Some components will want a default style, however, for example <code>UIDatePicker</code> which is a fixed size.  This default style is important for the layout algorithm to work as expected, but we also want to be able to override the default style when using the component.  <code>DatePickerIOS</code> does this by wrapping the native component in an extra view, which has flexible styling, and using a fixed style (which is generated with constants passed in from native) on the inner native component:</p><div class="prism language-javascript"><span class="token comment" spellcheck="true">// DatePickerIOS.ios.js
</span>
import <span class="token punctuation">{</span> UIManager <span class="token punctuation">}</span> from <span class="token string">'react-native'</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> RCTDatePickerIOSConsts <span class="token operator">=</span> UIManager<span class="token punctuation">.</span>RCTDatePicker<span class="token punctuation">.</span>Constants<span class="token punctuation">;</span>
<span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span>
  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>style<span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;RCTDatePickerIOS
          ref<span class="token operator">=</span><span class="token punctuation">{</span>DATEPICKER<span class="token punctuation">}</span>
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>rkDatePickerIOS<span class="token punctuation">}</span>
          <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> styles <span class="token operator">=</span> StyleSheet<span class="token punctuation">.</span><span class="token function">create<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  rkDatePickerIOS<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    height<span class="token punctuation">:</span> RCTDatePickerIOSConsts<span class="token punctuation">.</span>ComponentHeight<span class="token punctuation">,</span>
    width<span class="token punctuation">:</span> RCTDatePickerIOSConsts<span class="token punctuation">.</span>ComponentWidth<span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></div><p>The <code>RCTDatePickerIOSConsts</code> constants are exported from native by grabbing the actual frame of the native component like so:</p><div class="prism language-javascript"><span class="token comment" spellcheck="true">// RCTDatePickerManager.m
</span>
<span class="token operator">-</span> <span class="token punctuation">(</span>NSDictionary <span class="token operator">*</span><span class="token punctuation">)</span>constantsToExport
<span class="token punctuation">{</span>
  UIDatePicker <span class="token operator">*</span>dp <span class="token operator">=</span> <span class="token punctuation">[</span><span class="token punctuation">[</span>UIDatePicker alloc<span class="token punctuation">]</span> init<span class="token punctuation">]</span><span class="token punctuation">;</span>
  <span class="token punctuation">[</span>dp layoutIfNeeded<span class="token punctuation">]</span><span class="token punctuation">;</span>

  <span class="token keyword">return</span> @<span class="token punctuation">{</span>
    @<span class="token string">"ComponentHeight"</span><span class="token punctuation">:</span> @<span class="token punctuation">(</span><span class="token function">CGRectGetHeight<span class="token punctuation">(</span></span>dp<span class="token punctuation">.</span>frame<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
    @<span class="token string">"ComponentWidth"</span><span class="token punctuation">:</span> @<span class="token punctuation">(</span><span class="token function">CGRectGetWidth<span class="token punctuation">(</span></span>dp<span class="token punctuation">.</span>frame<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
    @<span class="token string">"DatePickerModes"</span><span class="token punctuation">:</span> @<span class="token punctuation">{</span>
      @<span class="token string">"time"</span><span class="token punctuation">:</span> @<span class="token punctuation">(</span>UIDatePickerModeTime<span class="token punctuation">)</span><span class="token punctuation">,</span>
      @<span class="token string">"date"</span><span class="token punctuation">:</span> @<span class="token punctuation">(</span>UIDatePickerModeDate<span class="token punctuation">)</span><span class="token punctuation">,</span>
      @<span class="token string">"datetime"</span><span class="token punctuation">:</span> @<span class="token punctuation">(</span>UIDatePickerModeDateAndTime<span class="token punctuation">)</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span></div><p>This guide covered many of the aspects of bridging over custom native components, but there is even more you might need to consider, such as custom hooks for inserting and laying out subviews.  If you want to go even deeper, check out the actual <code>RCTMapManager</code> and other components in the <a href="https://github.com/facebook/react-native/blob/master/React/Views" target="_blank">source code</a>.</p></div><div class="docs-prevnext"><a class="docs-next" href="docs/linking-libraries-ios.html#content">Next →</a></div><div class="survey"><div class="survey-image"></div><p>We are planning improvements to the React Native documentation. Your responses to this short survey will go a long way in helping us provide valuable content. Thank you!</p><center><a class="button" href="https://www.facebook.com/survey?oid=681969738611332">Take Survey</a></center></div>
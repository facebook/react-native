---
id: version-0.32-cameraroll
title: cameraroll
original_id: cameraroll
---
<a id="content"></a><h1><a class="anchor" name="cameraroll"></a>CameraRoll <a class="hash-link" href="docs/cameraroll.html#cameraroll">#</a></h1><div><div><p><code>CameraRoll</code> provides access to the local camera roll / gallery.</p></div><span><h3><a class="anchor" name="methods"></a>Methods <a class="hash-link" href="docs/cameraroll.html#methods">#</a></h3><div class="props"><div class="prop"><h4 class="methodTitle"><a class="anchor" name="saveimagewithtag"></a><span class="methodType">static </span>saveImageWithTag<span class="methodType">(tag)</span> <a class="hash-link" href="docs/cameraroll.html#saveimagewithtag">#</a></h4></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="savetocameraroll"></a><span class="methodType">static </span>saveToCameraRoll<span class="methodType">(tag, type?)</span> <a class="hash-link" href="docs/cameraroll.html#savetocameraroll">#</a></h4><div><p>Saves the photo or video to the camera roll / gallery.</p><p>On Android, the tag must be a local image or video URI, such as <code>"file:///sdcard/img.png"</code>.</p><p>On iOS, the tag can be any image URI (including local, remote asset-library and base64 data URIs)
or a local video file URI (remote or data URIs are not supported for saving video at this time).</p><p>If the tag has a file extension of .mov or .mp4, it will be inferred as a video. Otherwise
it will be treated as a photo. To override the automatic choice, you can pass an optional
<code>type</code> parameter that must be one of 'photo' or 'video'.</p><p>Returns a Promise which will resolve with the new URI.</p></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="getphotos"></a><span class="methodType">static </span>getPhotos<span class="methodType">(params)</span> <a class="hash-link" href="docs/cameraroll.html#getphotos">#</a></h4><div><p>Returns a Promise with photo identifier objects from the local camera
roll of the device matching shape defined by <code>getPhotosReturnChecker</code>.</p><p>@param {object} params See <code>getPhotosParamChecker</code>.</p><p>Returns a Promise which when resolved will be of shape <code>getPhotosReturnChecker</code>.</p></div></div></div></span></div><p class="edit-page-block">You can <a target="_blank" href="https://github.com/facebook/react-native/blob/master/Libraries/CameraRoll/CameraRoll.js">edit the content above on GitHub</a> and send us a pull request!</p><div><div><table width="100%"><tbody><tr><td><h3><a class="anchor" name="examples"></a>Examples <a class="hash-link" href="docs/cameraroll.html#examples">#</a></h3></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/js/CameraRollExample.js">Edit on GitHub</a></td></tr></tbody></table><div class="example-container"><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

const React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
const ReactNative <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-native'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
const <span class="token punctuation">{</span>
  CameraRoll<span class="token punctuation">,</span>
  Image<span class="token punctuation">,</span>
  Slider<span class="token punctuation">,</span>
  StyleSheet<span class="token punctuation">,</span>
  Switch<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  View<span class="token punctuation">,</span>
  TouchableOpacity
<span class="token punctuation">}</span> <span class="token operator">=</span> ReactNative<span class="token punctuation">;</span>

const CameraRollView <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./CameraRollView'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

const AssetScaledImageExampleView <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./AssetScaledImageExample'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

const CAMERA_ROLL_VIEW <span class="token operator">=</span> <span class="token string">'camera_roll_view'</span><span class="token punctuation">;</span>

class <span class="token class-name">CameraRollExample</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  state <span class="token operator">=</span> <span class="token punctuation">{</span>
    groupTypes<span class="token punctuation">:</span> <span class="token string">'SavedPhotos'</span><span class="token punctuation">,</span>
    sliderValue<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
    bigImages<span class="token punctuation">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;Switch
          onValueChange<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_onSwitchChange<span class="token punctuation">}</span>
          value<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>bigImages<span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;Text<span class="token operator">&gt;</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>bigImages <span class="token operator">?</span> <span class="token string">'Big'</span> <span class="token punctuation">:</span> <span class="token string">'Small'</span><span class="token punctuation">)</span> <span class="token operator">+</span> <span class="token string">' Images'</span><span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Slider
          value<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>sliderValue<span class="token punctuation">}</span>
          onValueChange<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_onSliderChange<span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;Text<span class="token operator">&gt;</span><span class="token punctuation">{</span><span class="token string">'Group Type: '</span> <span class="token operator">+</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>groupTypes<span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;CameraRollView
          ref<span class="token operator">=</span><span class="token punctuation">{</span>CAMERA_ROLL_VIEW<span class="token punctuation">}</span>
          batchSize<span class="token operator">=</span><span class="token punctuation">{</span><span class="token number">20</span><span class="token punctuation">}</span>
          groupTypes<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>groupTypes<span class="token punctuation">}</span>
          renderImage<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_renderImage<span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  loadAsset <span class="token operator">=</span> <span class="token punctuation">(</span>asset<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>navigator<span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>navigator<span class="token punctuation">.</span><span class="token function">push<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
        title<span class="token punctuation">:</span> <span class="token string">'Camera Roll Image'</span><span class="token punctuation">,</span>
        component<span class="token punctuation">:</span> AssetScaledImageExampleView<span class="token punctuation">,</span>
        backButtonTitle<span class="token punctuation">:</span> <span class="token string">'Back'</span><span class="token punctuation">,</span>
        passProps<span class="token punctuation">:</span> <span class="token punctuation">{</span> asset<span class="token punctuation">:</span> asset <span class="token punctuation">}</span><span class="token punctuation">,</span>
      <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  _renderImage <span class="token operator">=</span> <span class="token punctuation">(</span>asset<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    const imageSize <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>bigImages <span class="token operator">?</span> <span class="token number">150</span> <span class="token punctuation">:</span> <span class="token number">75</span><span class="token punctuation">;</span>
    const imageStyle <span class="token operator">=</span> <span class="token punctuation">[</span>styles<span class="token punctuation">.</span>image<span class="token punctuation">,</span> <span class="token punctuation">{</span>width<span class="token punctuation">:</span> imageSize<span class="token punctuation">,</span> height<span class="token punctuation">:</span> imageSize<span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">;</span>
    const location <span class="token operator">=</span> asset<span class="token punctuation">.</span>node<span class="token punctuation">.</span>location<span class="token punctuation">.</span>longitude <span class="token operator">?</span>
      JSON<span class="token punctuation">.</span><span class="token function">stringify<span class="token punctuation">(</span></span>asset<span class="token punctuation">.</span>node<span class="token punctuation">.</span>location<span class="token punctuation">)</span> <span class="token punctuation">:</span> <span class="token string">'Unknown location'</span><span class="token punctuation">;</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;TouchableOpacity key<span class="token operator">=</span><span class="token punctuation">{</span>asset<span class="token punctuation">}</span> onPress<span class="token operator">=</span><span class="token punctuation">{</span> <span class="token keyword">this</span><span class="token punctuation">.</span>loadAsset<span class="token punctuation">.</span><span class="token function">bind<span class="token punctuation">(</span></span> <span class="token keyword">this</span><span class="token punctuation">,</span> asset <span class="token punctuation">)</span> <span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>row<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;Image
            source<span class="token operator">=</span><span class="token punctuation">{</span>asset<span class="token punctuation">.</span>node<span class="token punctuation">.</span>image<span class="token punctuation">}</span>
            style<span class="token operator">=</span><span class="token punctuation">{</span>imageStyle<span class="token punctuation">}</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>info<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>url<span class="token punctuation">}</span><span class="token operator">&gt;</span><span class="token punctuation">{</span>asset<span class="token punctuation">.</span>node<span class="token punctuation">.</span>image<span class="token punctuation">.</span>uri<span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span><span class="token punctuation">{</span>location<span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span><span class="token punctuation">{</span>asset<span class="token punctuation">.</span>node<span class="token punctuation">.</span>group_name<span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span><span class="token punctuation">{</span><span class="token keyword">new</span> <span class="token class-name">Date</span><span class="token punctuation">(</span>asset<span class="token punctuation">.</span>node<span class="token punctuation">.</span>timestamp<span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">toString<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>TouchableOpacity<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  _onSliderChange <span class="token operator">=</span> <span class="token punctuation">(</span>value<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    const options <span class="token operator">=</span> CameraRoll<span class="token punctuation">.</span>GroupTypesOptions<span class="token punctuation">;</span>
    const index <span class="token operator">=</span> Math<span class="token punctuation">.</span><span class="token function">floor<span class="token punctuation">(</span></span>value <span class="token operator">*</span> options<span class="token punctuation">.</span>length <span class="token operator">*</span> <span class="token number">0.99</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    const groupTypes <span class="token operator">=</span> options<span class="token punctuation">[</span>index<span class="token punctuation">]</span><span class="token punctuation">;</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span>groupTypes <span class="token operator">!</span><span class="token operator">==</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>groupTypes<span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>groupTypes<span class="token punctuation">:</span> groupTypes<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  _onSwitchChange <span class="token operator">=</span> <span class="token punctuation">(</span>value<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>refs<span class="token punctuation">[</span>CAMERA_ROLL_VIEW<span class="token punctuation">]</span><span class="token punctuation">.</span><span class="token function">rendererChanged<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span> bigImages<span class="token punctuation">:</span> value <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>

const styles <span class="token operator">=</span> StyleSheet<span class="token punctuation">.</span><span class="token function">create<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  row<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    flexDirection<span class="token punctuation">:</span> <span class="token string">'row'</span><span class="token punctuation">,</span>
    flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  url<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    fontSize<span class="token punctuation">:</span> <span class="token number">9</span><span class="token punctuation">,</span>
    marginBottom<span class="token punctuation">:</span> <span class="token number">14</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  image<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    margin<span class="token punctuation">:</span> <span class="token number">4</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  info<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

exports<span class="token punctuation">.</span>title <span class="token operator">=</span> <span class="token string">'Camera Roll'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>description <span class="token operator">=</span> <span class="token string">'Example component that uses CameraRoll to list user\'s photos'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>examples <span class="token operator">=</span> <span class="token punctuation">[</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Photos'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement&lt;any<span class="token operator">&gt;</span> <span class="token punctuation">{</span> <span class="token keyword">return</span> &lt;CameraRollExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span> <span class="token punctuation">}</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">]</span><span class="token punctuation">;</span></div><div class="embedded-simulator"><p><a class="modal-button-open"><strong>Run this example</strong></a></p><div class="modal-button-open modal-button-open-img"><img alt="Run example in simulator" width="170" height="356" src="img/uiexplorer_main_ios.png"></div><div><div class="modal"><div class="modal-content"><button class="modal-button-close">×</button><div class="center"><iframe class="simulator" src="https://appetize.io/embed/7vdfm9h3e6vuf4gfdm7r5rgc48?device=iphone6s&amp;scale=60&amp;autoplay=false&amp;orientation=portrait&amp;deviceColor=white&amp;params=%7B%22route%22%3A%22CameraRoll%22%7D" width="256" height="550" scrolling="no"></iframe><p>Powered by <a target="_blank" href="https://appetize.io">appetize.io</a></p></div></div></div><div class="modal-backdrop"></div></div></div></div></div></div><div class="docs-prevnext"><a class="docs-prev" href="docs/backandroid.html#content">← Prev</a><a class="docs-next" href="docs/clipboard.html#content">Next →</a></div>
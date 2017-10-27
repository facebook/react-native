---
id: version-0.21-touchablenativefeedback
title: touchablenativefeedback
original_id: touchablenativefeedback
---
<a id="content"></a><table width="100%"><tbody><tr><td><h1><a class="anchor" name="touchablenativefeedback"></a>TouchableNativeFeedback <a class="hash-link" href="undefined#touchablenativefeedback">#</a></h1></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Libraries/Components/Touchable/TouchableNativeFeedback.android.js">Edit on GitHub</a></td></tr></tbody></table><div><div><p>A wrapper for making views respond properly to touches (Android only).
On Android this component uses native state drawable to display touch
feedback. At the moment it only supports having a single View instance as a
child node, as it's implemented by replacing that View with another instance
of RCTView node with some additional properties set.</p><p>Background drawable of native feedback touchable can be customized with
<code>background</code> property.</p><p>Example:</p><div class="prism language-javascript">renderButton<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token keyword">return</span> <span class="token punctuation">(</span>
    &lt;TouchableNativeFeedback
        onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_onPressButton<span class="token punctuation">}</span>
        background<span class="token operator">=</span><span class="token punctuation">{</span>TouchableNativeFeedback<span class="token punctuation">.</span><span class="token function">SelectableBackground<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
      &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>width<span class="token punctuation">:</span> <span class="token number">150</span><span class="token punctuation">,</span> height<span class="token punctuation">:</span> <span class="token number">100</span><span class="token punctuation">,</span> backgroundColor<span class="token punctuation">:</span> <span class="token string">'red'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>margin<span class="token punctuation">:</span> <span class="token number">30</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>Button&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    &lt;<span class="token operator">/</span>TouchableNativeFeedback<span class="token operator">&gt;</span>
  <span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span></div></div><h3><a class="anchor" name="props"></a>Props <a class="hash-link" href="undefined#props">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="touchablewithoutfeedback"></a><a href="touchablewithoutfeedback.html#props">TouchableWithoutFeedback props...</a> <a class="hash-link" href="undefined#touchablewithoutfeedback">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="background"></a>background <span class="propType">backgroundPropType</span> <a class="hash-link" href="undefined#background">#</a></h4><div><p>Determines the type of background drawable that's going to be used to
display feedback. It takes an object with <code>type</code> property and extra data
depending on the <code>type</code>. It's recommended to use one of the following
static methods to generate that dictionary:</p><p>1) TouchableNativeFeedback.SelectableBackground() - will create object
that represents android theme's default background for selectable
elements (?android:attr/selectableItemBackground)</p><p>2) TouchableNativeFeedback.SelectableBackgroundBorderless() - will create
object that represent android theme's default background for borderless
selectable elements (?android:attr/selectableItemBackgroundBorderless).
Available on android API level 21+</p><p>3) TouchableNativeFeedback.Ripple(color, borderless) - will create
object that represents ripple drawable with specified color (as a
string). If property <code>borderless</code> evaluates to true the ripple will
render outside of the view bounds (see native actionbar buttons as an
example of that behavior). This background type is available on Android
API level 21+</p></div></div></div></div><div class="docs-prevnext"><a class="docs-next" href="touchableopacity.html#content">Next →</a></div>
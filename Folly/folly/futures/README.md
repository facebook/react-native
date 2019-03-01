<!-- This file is generated from the Dex guide by fbcode/folly/facebook/futures-update-readme.sh. -->
<section class="dex_guide"><h1 class="dex_title">Futures</h1><section class="dex_document"><h1></h1><p class="dex_introduction">Futures is a framework for expressing asynchronous code in C++ using the Promise/Future pattern.</p><h2 id="overview">Overview <a href="#overview" class="headerLink">#</a></h2>

<p>Folly Futures is an async C++ framework inspired by <a href="https://twitter.github.io/finagle/guide/Futures.html" target="_blank">Twitter&#039;s Futures</a> implementation in Scala (see also <a href="https://github.com/twitter/util/blob/master/util-core/src/main/scala/com/twitter/util/Future.scala" target="_blank">Future.scala</a>, <a href="https://github.com/twitter/util/blob/master/util-core/src/main/scala/com/twitter/util/Promise.scala" target="_blank">Promise.scala</a>, and friends), and loosely builds upon the existing but anemic Futures code found in the C++11 standard (<a href="http://en.cppreference.com/w/cpp/thread/future" target="_blank">std::future</a>) and <a href="http://www.boost.org/doc/libs/1_53_0/doc/html/thread/synchronization.html#thread.synchronization.futures" target="_blank">boost::future</a> (especially &gt;= 1.53.0). 
Although inspired by the C++11 std::future interface, it is not a drop-in replacement because some ideas don&#039;t translate well enough to maintain API compatibility.</p>

<p>The primary difference from std::future is that you can attach callbacks to Futures (with <tt>then()</tt>), which enables sequential and parallel composition of Futures for cleaner asynchronous code.</p>

<h2 id="brief-synopsis">Brief Synopsis <a href="#brief-synopsis" class="headerLink">#</a></h2>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="cp">#</span><span class="cp">include</span><span class=""> </span><span class="cpf">&lt;folly/futures/Future.h&gt;</span><span class="cp">
</span><span class="k">using</span><span class=""> </span><span class="k">namespace</span><span class=""> </span><span class="n">folly</span><span class="p">;</span><span class="">
</span><span class="k">using</span><span class=""> </span><span class="k">namespace</span><span class=""> </span><span class="n">std</span><span class="p">;</span><span class="">
</span><span class="">
</span><span class="kt">void</span><span class=""> </span><span class="nf">foo</span><span class="p">(</span><span class="kt">int</span><span class=""> </span><span class="n">x</span><span class="p">)</span><span class=""> </span><span class="p">&#123;</span><span class="">
</span><span class="">  </span><span class="c1">// do something with x
</span><span class="">  </span><span class="n">cout</span><span class=""> </span><span class="o">&lt;</span><span class="o">&lt;</span><span class=""> </span><span class="s">&quot;</span><span class="s">foo(</span><span class="s">&quot;</span><span class=""> </span><span class="o">&lt;</span><span class="o">&lt;</span><span class=""> </span><span class="n">x</span><span class=""> </span><span class="o">&lt;</span><span class="o">&lt;</span><span class=""> </span><span class="s">&quot;</span><span class="s">)</span><span class="s">&quot;</span><span class=""> </span><span class="o">&lt;</span><span class="o">&lt;</span><span class=""> </span><span class="n">endl</span><span class="p">;</span><span class="">
</span><span class="p">&#125;</span><span class="">
</span><span class="">
</span><span class="c1">// ...
</span><span class="">
</span><span class="">  </span><span class="n">cout</span><span class=""> </span><span class="o">&lt;</span><span class="o">&lt;</span><span class=""> </span><span class="s">&quot;</span><span class="s">making Promise</span><span class="s">&quot;</span><span class=""> </span><span class="o">&lt;</span><span class="o">&lt;</span><span class=""> </span><span class="n">endl</span><span class="p">;</span><span class="">
</span><span class="">  </span><span class="n">Promise</span><span class="o">&lt;</span><span class="kt">int</span><span class="o">&gt;</span><span class=""> </span><span class="n">p</span><span class="p">;</span><span class="">
</span><span class="">  </span><span class="n">Future</span><span class="o">&lt;</span><span class="kt">int</span><span class="o">&gt;</span><span class=""> </span><span class="n">f</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">p</span><span class="p">.</span><span class="n">getFuture</span><span class="p">(</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">  </span><span class="n">f</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="n">foo</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">  </span><span class="n">cout</span><span class=""> </span><span class="o">&lt;</span><span class="o">&lt;</span><span class=""> </span><span class="s">&quot;</span><span class="s">Future chain made</span><span class="s">&quot;</span><span class=""> </span><span class="o">&lt;</span><span class="o">&lt;</span><span class=""> </span><span class="n">endl</span><span class="p">;</span><span class="">
</span><span class="">
</span><span class="c1">// ... now perhaps in another event callback
</span><span class="">
</span><span class="">  </span><span class="n">cout</span><span class=""> </span><span class="o">&lt;</span><span class="o">&lt;</span><span class=""> </span><span class="s">&quot;</span><span class="s">fulfilling Promise</span><span class="s">&quot;</span><span class=""> </span><span class="o">&lt;</span><span class="o">&lt;</span><span class=""> </span><span class="n">endl</span><span class="p">;</span><span class="">
</span><span class="">  </span><span class="n">p</span><span class="p">.</span><span class="n">setValue</span><span class="p">(</span><span class="mi">42</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">  </span><span class="n">cout</span><span class=""> </span><span class="o">&lt;</span><span class="o">&lt;</span><span class=""> </span><span class="s">&quot;</span><span class="s">Promise fulfilled</span><span class="s">&quot;</span><span class=""> </span><span class="o">&lt;</span><span class="o">&lt;</span><span class=""> </span><span class="n">endl</span><span class="p">;</span><span class="">
</span></pre></div>

<p>This would print:</p>

<div class="remarkup-code-block" data-code-lang="php"><pre class="remarkup-code"><span class="no">making</span> <span class="no">Promise</span>
<span class="no">Future</span> <span class="no">chain</span> <span class="no">made</span>
<span class="no">fulfilling</span> <span class="no">Promise</span>
<span class="nf" data-symbol-name="foo">foo</span><span class="o">(</span><span class="mi">42</span><span class="o">)</span>
<span class="no">Promise</span> <span class="no">fulfilled</span></pre></div>

<h3 id="blog-post">Blog Post <a href="#blog-post" class="headerLink">#</a></h3>

<p>In addition to this document, there is <a href="https://code.facebook.com/posts/1661982097368498/futures-for-c-11-at-facebook/" target="_blank">a blog post on code.facebook.com (June 2015)</a>.</p></section><section class="dex_document"><h1>Brief Guide</h1><p class="dex_introduction"></p><p>This brief guide covers the basics. For a more in-depth coverage skip to the appropriate section.</p>

<p>Let&#039;s begin with an example using an imaginary simplified Memcache client interface:</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="k">using</span><span class=""> </span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">string</span><span class="p">;</span><span class="">
</span><span class="k">class</span><span class=""> </span><span class="nc">MemcacheClient</span><span class=""> </span><span class="p">&#123;</span><span class="">
</span><span class=""> </span><span class="k">public</span><span class="o">:</span><span class="">
</span><span class="">  </span><span class="k">struct</span><span class=""> </span><span class="n">GetReply</span><span class=""> </span><span class="p">&#123;</span><span class="">
</span><span class="">    </span><span class="k">enum</span><span class=""> </span><span class="k">class</span><span class=""> </span><span class="nc">Result</span><span class=""> </span><span class="p">&#123;</span><span class="">
</span><span class="">      </span><span class="n">FOUND</span><span class="p">,</span><span class="">
</span><span class="">      </span><span class="n">NOT_FOUND</span><span class="p">,</span><span class="">
</span><span class="">      </span><span class="n">SERVER_ERROR</span><span class="p">,</span><span class="">
</span><span class="">    </span><span class="p">&#125;</span><span class="p">;</span><span class="">
</span><span class="">
</span><span class="">    </span><span class="n">Result</span><span class=""> </span><span class="n">result</span><span class="p">;</span><span class="">
</span><span class="">    </span><span class="c1">// The value when result is FOUND,
</span><span class="">    </span><span class="c1">// The error message when result is SERVER_ERROR or CLIENT_ERROR
</span><span class="">    </span><span class="c1">// undefined otherwise
</span><span class="">    </span><span class="n">string</span><span class=""> </span><span class="n">value</span><span class="p">;</span><span class="">
</span><span class="">  </span><span class="p">&#125;</span><span class="p">;</span><span class="">
</span><span class="">
</span><span class="">  </span><span class="n">GetReply</span><span class=""> </span><span class="nf">get</span><span class="p">(</span><span class="n">string</span><span class=""> </span><span class="n">key</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="p">&#125;</span><span class="p">;</span><span class="">
</span></pre></div>

<p>This API is synchronous, i.e. when you call <tt>get()</tt> you have to wait for the result. This is very simple, but unfortunately it is also very easy to write very slow code using synchronous APIs.</p>

<p>Now, consider this traditional asynchronous signature for <tt>get()</tt>:</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="kt">int</span><span class=""> </span><span class="nf">get</span><span class="p">(</span><span class="n">string</span><span class=""> </span><span class="n">key</span><span class="p">,</span><span class=""> </span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">function</span><span class="o">&lt;</span><span class="kt">void</span><span class="p">(</span><span class="n">GetReply</span><span class="p">)</span><span class="o">&gt;</span><span class=""> </span><span class="n">callback</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<p>When you call <tt>get()</tt>, your asynchronous operation begins and when it finishes your callback will be called with the result. Very performant code can be written with an API like this, but for nontrivial applications the code devolves into a special kind of spaghetti code affectionately referred to as &quot;callback hell&quot;.</p>

<p>The Future-based API looks like this:</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="n">Future</span><span class="o">&lt;</span><span class="n">GetReply</span><span class="o">&gt;</span><span class=""> </span><span class="n">get</span><span class="p">(</span><span class="n">string</span><span class=""> </span><span class="n">key</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<p>A <tt>Future&lt;GetReply&gt;</tt> is a placeholder for the <tt>GetReply</tt> that we will eventually get. A Future usually starts life out &quot;unfulfilled&quot;, or incomplete, i.e.:</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="n">fut</span><span class="p">.</span><span class="n">isReady</span><span class="p">(</span><span class="p">)</span><span class=""> </span><span class="o">=</span><span class="o">=</span><span class=""> </span><span class="nb">false</span><span class="">
</span><span class="n">fut</span><span class="p">.</span><span class="n">value</span><span class="p">(</span><span class="p">)</span><span class="">  </span><span class="c1">// will throw an exception because the Future is not ready
</span></pre></div>

<p>At some point in the future, the Future will have been fulfilled, and we can access its value.</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="n">fut</span><span class="p">.</span><span class="n">isReady</span><span class="p">(</span><span class="p">)</span><span class=""> </span><span class="o">=</span><span class="o">=</span><span class=""> </span><span class="nb">true</span><span class="">
</span><span class="n">GetReply</span><span class="o">&amp;</span><span class=""> </span><span class="n">reply</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">fut</span><span class="p">.</span><span class="n">value</span><span class="p">(</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<p>Futures support exceptions. If something exceptional happened, your Future may represent an exception instead of a value. In that case:</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="n">fut</span><span class="p">.</span><span class="n">isReady</span><span class="p">(</span><span class="p">)</span><span class=""> </span><span class="o">=</span><span class="o">=</span><span class=""> </span><span class="nb">true</span><span class="">
</span><span class="n">fut</span><span class="p">.</span><span class="n">value</span><span class="p">(</span><span class="p">)</span><span class=""> </span><span class="c1">// will rethrow the exception
</span></pre></div>

<p>Just what is exceptional depends on the API. In our example we have chosen not to raise exceptions for <tt>SERVER_ERROR</tt>, but represent this explicitly in the <tt>GetReply</tt> object. On the other hand, an astute Memcache veteran would notice that we left <tt>CLIENT_ERROR</tt> out of <tt>GetReply::Result</tt>, and perhaps a <tt>CLIENT_ERROR</tt> would have been raised as an exception, because <tt>CLIENT_ERROR</tt> means there&#039;s a bug in the library and this would be truly exceptional. These decisions are judgement calls by the API designer. The important thing is that exceptional conditions (including and especially spurious exceptions that nobody expects) get captured and can be handled higher up the &quot;stack&quot;.</p>

<p>So far we have described a way to initiate an asynchronous operation via an API that returns a Future, and then sometime later after it is fulfilled, we get its value. This is slightly more useful than a synchronous API, but it&#039;s not yet ideal. There are two more very important pieces to the puzzle.</p>

<p>First, we can aggregate Futures, to define a new Future that completes after some or all of the aggregated Futures complete. Consider two examples: fetching a batch of requests and waiting for all of them, and fetching a group of requests and waiting for only one of them.</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="n">vector</span><span class="o">&lt;</span><span class="n">Future</span><span class="o">&lt;</span><span class="n">GetReply</span><span class="o">&gt;</span><span class="o">&gt;</span><span class=""> </span><span class="n">futs</span><span class="p">;</span><span class="">
</span><span class="k">for</span><span class=""> </span><span class="p">(</span><span class="k">auto</span><span class="o">&amp;</span><span class=""> </span><span class="nl">key</span><span class=""> </span><span class="p">:</span><span class=""> </span><span class="n">keys</span><span class="p">)</span><span class=""> </span><span class="p">&#123;</span><span class="">
</span><span class="">  </span><span class="n">futs</span><span class="p">.</span><span class="n">push_back</span><span class="p">(</span><span class="n">mc</span><span class="p">.</span><span class="n">get</span><span class="p">(</span><span class="n">key</span><span class="p">)</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="p">&#125;</span><span class="">
</span><span class="k">auto</span><span class=""> </span><span class="n">all</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">collectAll</span><span class="p">(</span><span class="n">futs</span><span class="p">.</span><span class="n">begin</span><span class="p">(</span><span class="p">)</span><span class="p">,</span><span class=""> </span><span class="n">futs</span><span class="p">.</span><span class="n">end</span><span class="p">(</span><span class="p">)</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">
</span><span class="n">vector</span><span class="o">&lt;</span><span class="n">Future</span><span class="o">&lt;</span><span class="n">GetReply</span><span class="o">&gt;</span><span class="o">&gt;</span><span class=""> </span><span class="n">futs</span><span class="p">;</span><span class="">
</span><span class="k">for</span><span class=""> </span><span class="p">(</span><span class="k">auto</span><span class="o">&amp;</span><span class=""> </span><span class="nl">key</span><span class=""> </span><span class="p">:</span><span class=""> </span><span class="n">keys</span><span class="p">)</span><span class=""> </span><span class="p">&#123;</span><span class="">
</span><span class="">  </span><span class="n">futs</span><span class="p">.</span><span class="n">push_back</span><span class="p">(</span><span class="n">mc</span><span class="p">.</span><span class="n">get</span><span class="p">(</span><span class="n">key</span><span class="p">)</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="p">&#125;</span><span class="">
</span><span class="k">auto</span><span class=""> </span><span class="n">any</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">collectAny</span><span class="p">(</span><span class="n">futs</span><span class="p">.</span><span class="n">begin</span><span class="p">(</span><span class="p">)</span><span class="p">,</span><span class=""> </span><span class="n">futs</span><span class="p">.</span><span class="n">end</span><span class="p">(</span><span class="p">)</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<p><tt>all</tt> and <tt>any</tt> are Futures (for the exact type and usage see the header files). They will be complete when all/one of futs are complete, respectively. (There is also <tt>collectN()</tt> for when you need some.)</p>

<p>Second, we can attach callbacks to a Future, and chain them together monadically. An example will clarify:</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="n">Future</span><span class="o">&lt;</span><span class="n">GetReply</span><span class="o">&gt;</span><span class=""> </span><span class="n">fut1</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">mc</span><span class="p">.</span><span class="n">get</span><span class="p">(</span><span class="s">&quot;</span><span class="s">foo</span><span class="s">&quot;</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">
</span><span class="n">Future</span><span class="o">&lt;</span><span class="n">string</span><span class="o">&gt;</span><span class=""> </span><span class="n">fut2</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">fut1</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="">
</span><span class="">  </span><span class="p">[</span><span class="p">]</span><span class="p">(</span><span class="n">GetReply</span><span class=""> </span><span class="n">reply</span><span class="p">)</span><span class=""> </span><span class="p">&#123;</span><span class="">
</span><span class="">    </span><span class="k">if</span><span class=""> </span><span class="p">(</span><span class="n">reply</span><span class="p">.</span><span class="n">result</span><span class=""> </span><span class="o">=</span><span class="o">=</span><span class=""> </span><span class="n">MemcacheClient</span><span class="o">:</span><span class="o">:</span><span class="n">GetReply</span><span class="o">:</span><span class="o">:</span><span class="n">Result</span><span class="o">:</span><span class="o">:</span><span class="n">FOUND</span><span class="p">)</span><span class="">
</span><span class="">      </span><span class="k">return</span><span class=""> </span><span class="n">reply</span><span class="p">.</span><span class="n">value</span><span class="p">;</span><span class="">
</span><span class="">    </span><span class="k">throw</span><span class=""> </span><span class="nf">SomeException</span><span class="p">(</span><span class="s">&quot;</span><span class="s">No value</span><span class="s">&quot;</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">  </span><span class="p">&#125;</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">
</span><span class="n">Future</span><span class="o">&lt;</span><span class="n">Unit</span><span class="o">&gt;</span><span class=""> </span><span class="n">fut3</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">fut2</span><span class="">
</span><span class="">  </span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="p">[</span><span class="p">]</span><span class="p">(</span><span class="n">string</span><span class=""> </span><span class="n">str</span><span class="p">)</span><span class=""> </span><span class="p">&#123;</span><span class="">
</span><span class="">    </span><span class="n">cout</span><span class=""> </span><span class="o">&lt;</span><span class="o">&lt;</span><span class=""> </span><span class="n">str</span><span class=""> </span><span class="o">&lt;</span><span class="o">&lt;</span><span class=""> </span><span class="n">endl</span><span class="p">;</span><span class="">
</span><span class="">  </span><span class="p">&#125;</span><span class="p">)</span><span class="">
</span><span class="">  </span><span class="p">.</span><span class="n">onError</span><span class="p">(</span><span class="p">[</span><span class="p">]</span><span class="p">(</span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">exception</span><span class=""> </span><span class="k">const</span><span class="o">&amp;</span><span class=""> </span><span class="n">e</span><span class="p">)</span><span class=""> </span><span class="p">&#123;</span><span class="">
</span><span class="">    </span><span class="n">cerr</span><span class=""> </span><span class="o">&lt;</span><span class="o">&lt;</span><span class=""> </span><span class="n">e</span><span class="p">.</span><span class="n">what</span><span class="p">(</span><span class="p">)</span><span class=""> </span><span class="o">&lt;</span><span class="o">&lt;</span><span class=""> </span><span class="n">endl</span><span class="p">;</span><span class="">
</span><span class="">  </span><span class="p">&#125;</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<p>That example is a little contrived but the idea is that you can transform a result from one type to another, potentially in a chain, and unhandled errors propagate. Of course, the intermediate variables are optional.</p>

<p>Using then to add callbacks is idiomatic. It brings all the code into one place, which avoids callback hell.</p>

<p>Up to this point we have skirted around the matter of waiting for Futures. You may never need to wait for a Future, because your code is event-driven and all follow-up action happens in a then-block. But if want to have a batch workflow, where you initiate a batch of asynchronous operations and then wait for them all to finish at a synchronization point, then you will want to wait for a Future. Futures have a blocking method called <tt>wait()</tt> that does exactly that and optionally takes a timeout.</p>

<p>Futures are partially threadsafe. A Promise or Future can migrate between threads as long as there&#039;s a full memory barrier of some sort. <tt>Future::then</tt> and <tt>Promise::setValue</tt> (and all variants that boil down to those two calls) can be called from different threads. <strong>But</strong>, be warned that you might be surprised about which thread your callback executes on. Let&#039;s consider an example.</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="c1">// Thread A
</span><span class="n">Promise</span><span class="o">&lt;</span><span class="n">Unit</span><span class="o">&gt;</span><span class=""> </span><span class="n">p</span><span class="p">;</span><span class="">
</span><span class="k">auto</span><span class=""> </span><span class="n">f</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">p</span><span class="p">.</span><span class="n">getFuture</span><span class="p">(</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">
</span><span class="c1">// Thread B
</span><span class="n">f</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="n">x</span><span class="p">)</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="n">y</span><span class="p">)</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="n">z</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">
</span><span class="c1">// Thread A
</span><span class="n">p</span><span class="p">.</span><span class="n">setValue</span><span class="p">(</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<p>This is legal and technically threadsafe. However, it is important to realize that you do not know in which thread <tt>x</tt>, <tt>y</tt>, and/or <tt>z</tt> will execute. Maybe they will execute in Thread A when <tt>p.setValue()</tt> is called. Or, maybe they will execute in Thread B when <tt>f.then</tt> is called. Or, maybe <tt>x</tt> will execute in Thread A, but <tt>y</tt> and/or <tt>z</tt> will execute in Thread B. There&#039;s a race between <tt>setValue</tt> and <tt>then</tt>&#x2014;whichever runs last will execute the callback. The only guarantee is that one of them will run the callback.</p>

<p>Naturally, you will want some control over which thread executes callbacks. We have a few mechanisms to help.</p>

<p>The first and most useful is <tt>via</tt>, which passes execution through an <tt>Executor</tt>, which usually has the effect of running the callback in a new thread.</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="n">aFuture</span><span class="">
</span><span class="">  </span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="n">x</span><span class="p">)</span><span class="">
</span><span class="">  </span><span class="p">.</span><span class="n">via</span><span class="p">(</span><span class="n">e1</span><span class="p">)</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="n">y1</span><span class="p">)</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="n">y2</span><span class="p">)</span><span class="">
</span><span class="">  </span><span class="p">.</span><span class="n">via</span><span class="p">(</span><span class="n">e2</span><span class="p">)</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="n">z</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<p><tt>x</tt> will execute in the current thread. <tt>y1</tt> and <tt>y2</tt> will execute in the thread on the other side of <tt>e1</tt>, and <tt>z</tt> will execute in the thread on the other side of <tt>e2</tt>. If after <tt>z</tt> you want to get back to the current thread, you need to get there via an executor. Another way to express this is using an overload of <tt>then</tt> that takes an Executor:</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="n">aFuture</span><span class="">
</span><span class="">  </span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="n">x</span><span class="p">)</span><span class="">
</span><span class="">  </span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="n">e1</span><span class="p">,</span><span class=""> </span><span class="n">y1</span><span class="p">,</span><span class=""> </span><span class="n">y2</span><span class="p">)</span><span class="">
</span><span class="">  </span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="n">e2</span><span class="p">,</span><span class=""> </span><span class="n">z</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<p>Either way, there is no ambiguity about which thread will execute <tt>y1</tt>, <tt>y2</tt>, or <tt>z</tt>.</p>

<p>You can still have a race after <tt>via</tt> if you break it into multiple statements, e.g. in this counterexample:</p>

<div class="remarkup-code-block remarkup-counterexample" data-code-lang="cpp"><pre class="remarkup-code"><span class="n">f</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">f</span><span class="p">.</span><span class="n">via</span><span class="p">(</span><span class="n">e1</span><span class="p">)</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="n">y1</span><span class="p">)</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="n">y2</span><span class="p">)</span><span class="p">;</span><span class=""> </span><span class="c1">// nothing racy here
</span><span class="n">f2</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="n">y3</span><span class="p">)</span><span class="p">;</span><span class=""> </span><span class="c1">// racy
</span></pre></div>

<h2 id="you-make-me-promises-pro">You make me Promises, Promises <a href="#you-make-me-promises-pro" class="headerLink">#</a></h2>

<p>If you are wrapping an asynchronous operation, or providing an asynchronous API to users, then you will want to make <tt>Promise</tt>s. Every Future has a corresponding Promise (except Futures that spring into existence already completed, with <tt>makeFuture()</tt>). Promises are simple: you make one, you extract the Future, and you fulfill it with a value or an exception. Example:</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="n">Promise</span><span class="o">&lt;</span><span class="kt">int</span><span class="o">&gt;</span><span class=""> </span><span class="n">p</span><span class="p">;</span><span class="">
</span><span class="n">Future</span><span class="o">&lt;</span><span class="kt">int</span><span class="o">&gt;</span><span class=""> </span><span class="n">f</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">p</span><span class="p">.</span><span class="n">getFuture</span><span class="p">(</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">
</span><span class="n">f</span><span class="p">.</span><span class="n">isReady</span><span class="p">(</span><span class="p">)</span><span class=""> </span><span class="o">=</span><span class="o">=</span><span class=""> </span><span class="nb">false</span><span class="">
</span><span class="">
</span><span class="n">p</span><span class="p">.</span><span class="n">setValue</span><span class="p">(</span><span class="mi">42</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">
</span><span class="n">f</span><span class="p">.</span><span class="n">isReady</span><span class="p">(</span><span class="p">)</span><span class=""> </span><span class="o">=</span><span class="o">=</span><span class=""> </span><span class="nb">true</span><span class="">
</span><span class="n">f</span><span class="p">.</span><span class="n">value</span><span class="p">(</span><span class="p">)</span><span class=""> </span><span class="o">=</span><span class="o">=</span><span class=""> </span><span class="mi">42</span><span class="">
</span></pre></div>

<p>and an exception example:</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="n">Promise</span><span class="o">&lt;</span><span class="kt">int</span><span class="o">&gt;</span><span class=""> </span><span class="n">p</span><span class="p">;</span><span class="">
</span><span class="n">Future</span><span class="o">&lt;</span><span class="kt">int</span><span class="o">&gt;</span><span class=""> </span><span class="n">f</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">p</span><span class="p">.</span><span class="n">getFuture</span><span class="p">(</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">
</span><span class="n">f</span><span class="p">.</span><span class="n">isReady</span><span class="p">(</span><span class="p">)</span><span class=""> </span><span class="o">=</span><span class="o">=</span><span class=""> </span><span class="nb">false</span><span class="">
</span><span class="">
</span><span class="n">p</span><span class="p">.</span><span class="n">setException</span><span class="p">(</span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">runtime_error</span><span class="p">(</span><span class="s">&quot;</span><span class="s">Fail</span><span class="s">&quot;</span><span class="p">)</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">
</span><span class="n">f</span><span class="p">.</span><span class="n">isReady</span><span class="p">(</span><span class="p">)</span><span class=""> </span><span class="o">=</span><span class="o">=</span><span class=""> </span><span class="nb">true</span><span class="">
</span><span class="n">f</span><span class="p">.</span><span class="n">value</span><span class="p">(</span><span class="p">)</span><span class=""> </span><span class="c1">// throws the exception
</span></pre></div>

<p>It&#039;s good practice to use setWith which takes a function and automatically captures exceptions, e.g.</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="n">Promise</span><span class="o">&lt;</span><span class="kt">int</span><span class="o">&gt;</span><span class=""> </span><span class="n">p</span><span class="p">;</span><span class="">
</span><span class="n">p</span><span class="p">.</span><span class="n">setWith</span><span class="p">(</span><span class="p">[</span><span class="p">]</span><span class="p">&#123;</span><span class="">
</span><span class="">  </span><span class="k">try</span><span class=""> </span><span class="p">&#123;</span><span class="">
</span><span class="">    </span><span class="c1">// do stuff that may throw
</span><span class="">    </span><span class="k">return</span><span class=""> </span><span class="mi">42</span><span class="p">;</span><span class="">
</span><span class="">  </span><span class="p">&#125;</span><span class=""> </span><span class="k">catch</span><span class=""> </span><span class="p">(</span><span class="n">MySpecialException</span><span class=""> </span><span class="k">const</span><span class="o">&amp;</span><span class=""> </span><span class="n">e</span><span class="p">)</span><span class=""> </span><span class="p">&#123;</span><span class="">
</span><span class="">    </span><span class="c1">// handle it
</span><span class="">    </span><span class="k">return</span><span class=""> </span><span class="mi">7</span><span class="p">;</span><span class="">
</span><span class="">  </span><span class="p">&#125;</span><span class="">
</span><span class="">  </span><span class="c1">// Any exceptions that we didn&#039;t catch, will be caught for us
</span><span class="p">&#125;</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div></section><section class="dex_document"><h1>More Details</h1><p class="dex_introduction"></p><p>Let&#039;s look at a contrived and synchronous example of Futures.</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="n">Promise</span><span class="o">&lt;</span><span class="kt">int</span><span class="o">&gt;</span><span class=""> </span><span class="n">p</span><span class="p">;</span><span class="">
</span><span class="n">Future</span><span class="o">&lt;</span><span class="kt">int</span><span class="o">&gt;</span><span class=""> </span><span class="n">f</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">p</span><span class="p">.</span><span class="n">getFuture</span><span class="p">(</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="c1">// ...
</span><span class="n">p</span><span class="p">.</span><span class="n">setValue</span><span class="p">(</span><span class="mi">42</span><span class="p">)</span><span class="p">;</span><span class=""> </span><span class="c1">// or setException(...)
</span><span class="n">cout</span><span class=""> </span><span class="o">&lt;</span><span class="o">&lt;</span><span class=""> </span><span class="n">f</span><span class="p">.</span><span class="n">value</span><span class="p">(</span><span class="p">)</span><span class="p">;</span><span class=""> </span><span class="c1">// prints 42
</span></pre></div>

<p>First, we create a <a href="https://github.com/facebook/folly/blob/master/folly/futures/Promise.h" target="_blank">Promise</a> object of type <tt>int</tt>. This object is exactly what it sounds like&#x2014;a pledge to provide an <tt>int</tt> (or an exception) at some point in the future.</p>

<p>Next, we extract a <a href="https://github.com/facebook/folly/blob/master/folly/futures/Future.h" target="_blank">Future</a> object from that promise. You can think of futures as handles on promises - they provide a way to access that <tt>int</tt> when the promise is fulfilled.</p>

<p>Later, when the promise is fulfilled via <tt>setValue()</tt> or <tt>setException()</tt>, that <tt>int</tt> is accessible via the future&#039;s <tt>value()</tt> method. That method will throw if the future contains an exception.</p>

<h2 id="setting-callbacks-with-t">Setting callbacks with then() <a href="#setting-callbacks-with-t" class="headerLink">#</a></h2>

<p>Ok, great, so now you&#039;re wondering what these are actually useful for. Let&#039;s consider another way to follow up on the result of a <tt>Future</tt> once its corresponding <tt>Promise</tt> is fulfilled&#x2014;callbacks! Here&#039;s a snippet that is functionally equivalent to the one above:</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="n">Promise</span><span class="o">&lt;</span><span class="kt">int</span><span class="o">&gt;</span><span class=""> </span><span class="n">p</span><span class="p">;</span><span class="">
</span><span class="n">Future</span><span class="o">&lt;</span><span class="kt">int</span><span class="o">&gt;</span><span class=""> </span><span class="n">f</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">p</span><span class="p">.</span><span class="n">getFuture</span><span class="p">(</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">
</span><span class="n">f</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="p">[</span><span class="p">]</span><span class="p">(</span><span class="kt">int</span><span class=""> </span><span class="n">i</span><span class="p">)</span><span class="p">&#123;</span><span class="">
</span><span class="">  </span><span class="n">cout</span><span class=""> </span><span class="o">&lt;</span><span class="o">&lt;</span><span class=""> </span><span class="n">i</span><span class="p">;</span><span class="">
</span><span class="p">&#125;</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">
</span><span class="n">p</span><span class="p">.</span><span class="n">setValue</span><span class="p">(</span><span class="mi">42</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<p>That <tt>then()</tt> method on futures is the real bread and butter of Futures code. It allows you to provide a callback which will be executed when that <tt>Future</tt> is complete. Note that while we fulfill the promise after setting the callback here, those operations could be swapped. Setting a callback on an already completed future executes the callback immediately.</p>

<p>In this case, the callback takes a value directly. If the Future contained an exception, the callback will be passed over and the exception will be propagated to the resultant Future - more on that in a second. Your callback may also take a <a href="https://github.com/facebook/folly/blob/master/folly/Try.h" target="_blank">Try</a>, which encapsulates either an exception or a value of its templated type.</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="n">f</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="p">[</span><span class="p">]</span><span class="p">(</span><span class="n">Try</span><span class="o">&lt;</span><span class="kt">int</span><span class="o">&gt;</span><span class=""> </span><span class="k">const</span><span class="o">&amp;</span><span class=""> </span><span class="n">t</span><span class="p">)</span><span class="p">&#123;</span><span class="">
</span><span class="">  </span><span class="n">cout</span><span class=""> </span><span class="o">&lt;</span><span class="o">&lt;</span><span class=""> </span><span class="n">t</span><span class="p">.</span><span class="n">value</span><span class="p">(</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="p">&#125;</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<div class="remarkup-note"><span class="remarkup-note-word">NOTE:</span> Do not use Try unless you are actually going to do exception handling in your callback. It is much cleaner and often more performant to take the value directly when you can. If you want to do exception handling, there still might be better options than Try. See <a href="#error-handling">Error Handling</a>.</div>

<div class="remarkup-note"><span class="remarkup-note-word">NOTE:</span> When passing a callback to <tt>then</tt>, the future stores a copy of it until the callback has been executed. If, for example, you pass a lambda function that captures a shared pointer, the future will keep the referenced object alive only until the callback has been executed.</div>

<p>The real power of <tt>then()</tt> is that it <em>returns a <tt>Future</tt> of the type that the callback returns</em> and can therefore be chained and nested with ease. Let&#039;s consider another example:</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="n">Future</span><span class="o">&lt;</span><span class="n">string</span><span class="o">&gt;</span><span class=""> </span><span class="n">f2</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">f</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="p">[</span><span class="p">]</span><span class="p">(</span><span class="kt">int</span><span class=""> </span><span class="n">i</span><span class="p">)</span><span class="p">&#123;</span><span class="">
</span><span class="">  </span><span class="k">return</span><span class=""> </span><span class="n">folly</span><span class="o">:</span><span class="o">:</span><span class="n">to</span><span class="o">&lt;</span><span class="n">string</span><span class="o">&gt;</span><span class="p">(</span><span class="n">i</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="p">&#125;</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">
</span><span class="n">f2</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="p">[</span><span class="p">]</span><span class="p">(</span><span class="n">string</span><span class=""> </span><span class="n">s</span><span class="p">)</span><span class="p">&#123;</span><span class=""> </span><span class="cm">/* ... */</span><span class=""> </span><span class="p">&#125;</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<p>Here, we convert that <tt>int</tt> to a <tt>string</tt> in the callback and return the result, which results in a <tt>Future&lt;string&gt;</tt> that we can set further callbacks on. I&#039;ve created a named variable <tt>f2</tt> to demonstrate types but don&#039;t hesitate to chain futures directly:</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="k">auto</span><span class=""> </span><span class="n">finalFuture</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">getSomeFuture</span><span class="p">(</span><span class="p">)</span><span class="">
</span><span class="">  </span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="p">.</span><span class="p">.</span><span class="p">.</span><span class="p">)</span><span class="">
</span><span class="">  </span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="p">.</span><span class="p">.</span><span class="p">.</span><span class="p">)</span><span class="">
</span><span class="">  </span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="p">.</span><span class="p">.</span><span class="p">.</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<p>That&#039;s all great, but this code is still synchronous. These constructs truly become useful when you start to chain, nest, and compose asynchronous operations. Let&#039;s say you instead have some <em>remote</em> service that converts your integers to strings for you, and that you also have a client with Future interfaces (i.e. interfaces that return Futures). Now let&#039;s leverage the fact that <tt>then()</tt> also allows you to return <tt>Future&lt;T&gt;</tt> from inside your callbacks as well as just <tt>T</tt>:</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="n">Future</span><span class="o">&lt;</span><span class="n">string</span><span class="o">&gt;</span><span class=""> </span><span class="n">f2</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">f</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="p">[</span><span class="p">]</span><span class="p">(</span><span class="kt">int</span><span class=""> </span><span class="n">i</span><span class="p">)</span><span class="p">&#123;</span><span class="">
</span><span class="">  </span><span class="k">return</span><span class=""> </span><span class="n">getClient</span><span class="p">(</span><span class="p">)</span><span class="o">-</span><span class="o">&gt;</span><span class="n">future_intToString</span><span class="p">(</span><span class="n">i</span><span class="p">)</span><span class="p">;</span><span class=""> </span><span class="c1">// returns Future&lt;string&gt;
</span><span class="p">&#125;</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">
</span><span class="n">f2</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="p">[</span><span class="p">]</span><span class="p">(</span><span class="n">Try</span><span class="o">&lt;</span><span class="n">string</span><span class="o">&gt;</span><span class=""> </span><span class="k">const</span><span class="o">&amp;</span><span class=""> </span><span class="n">s</span><span class="p">)</span><span class="p">&#123;</span><span class=""> </span><span class="p">.</span><span class="p">.</span><span class="p">.</span><span class=""> </span><span class="p">&#125;</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<p>In general, your code will be cleaner if you return <tt>T</tt> from your callbacks and only switch to returning <tt>Future&lt;T&gt;</tt> when necessary (i.e. when there is a nested call to a future-returning function).</p>

<h2 id="futures-promises-and-mov">Futures, Promises, and move semantics <a href="#futures-promises-and-mov" class="headerLink">#</a></h2>

<p><tt>Futures</tt> and <tt>Promises</tt> are movable but non-copyable. This preserves the invariant of a one-to-one mapping between a Promise and a Future and as a side effect encourages performant code. There is a piece of heap-allocated shared state underlying each promise-future pair&#x2014;keep this in mind as a bare minimum performance cost.</p>

<h2 id="synchronously-creating-a">Synchronously creating and completing futures <a href="#synchronously-creating-a" class="headerLink">#</a></h2>

<p>Synchronously entering and exiting the futures paradigm can be useful, especially in tests, so the following utilities are available:</p>

<ul>
<li>Create already-completed futures with <tt>makeFuture&lt;T&gt;()</tt>, which takes a <tt>T&amp;&amp;</tt> (or an exception, more info <a href="#error-handling">here</a>). If you pass <tt>T&amp;&amp;</tt> the type is inferred and you don&#039;t have to specify it.</li>
<li>Extract a future&#039;s <tt>T</tt> value with <tt>Future&lt;T&gt;::get()</tt>. This method is blocking, so make sure that either your future is already completed or that another thread will complete the future while the calling thread blocks. <tt>get()</tt> can also take a timeout&#x2014;see <a href="#timeouts-and-related-features">Timeouts</a>.</li>
<li>Perform a blocking wait on a Future with <tt>Future&lt;T&gt;::wait()</tt>. This is just like <tt>get()</tt> but it instead of extracting the value or throwing the exception, <tt>wait()</tt> returns a new Future with the result of the input Future. Like <tt>get()</tt>, <tt>wait()</tt> can also take a timeout&#x2014;see <a href="#timeouts-and-related-features">Timeouts</a>.</li>
<li><tt>getVia()</tt> and <tt>waitVia()</tt>, which are like <tt>get()</tt> and <tt>wait()</tt> except that they drive some Executor (say, an <tt>EventBase</tt>) until the Future is complete. See <a href="#testing">Testing</a> for more.</li>
</ul>

<div class="remarkup-note"><span class="remarkup-note-word">NOTE:</span> <tt>makeFuture()</tt>, <tt>get()</tt>, <tt>wait()</tt>, and friends are especially handy in tests and are documented further in the <a href="#testing">Testing</a> article.</div>

<h2 id="overloads-of-then">Overloads of then() <a href="#overloads-of-then" class="headerLink">#</a></h2>

<p>Above are demonstrations of variants of <tt>then()</tt> whose callbacks</p>

<ul>
<li>return <tt>Future&lt;T&gt;</tt> or <tt>T</tt></li>
<li>take <tt>T const&amp;</tt> or <tt>Try&lt;T&gt; const&amp;</tt> (also possible are <tt>T</tt>, <tt>Try&lt;T&gt;</tt>, <tt>T&amp;&amp;</tt>, and <tt>Try&lt;T&gt;&amp;&amp;</tt>)</li>
</ul>

<div class="remarkup-note"><span class="remarkup-note-word">NOTE:</span> The preferred pattern is&#x2014;when possible&#x2014;to use value semantics (take a <tt>T</tt> or <tt>Try&lt;T&gt;</tt>). If your type is expensive to copy or can&#039;t be copied, take a reference. (e.g. <tt>T const&amp;</tt> or <tt>Try&lt;T&gt; const&amp;</tt>) If you need move semantics, an lvalue reference or rvalue reference is the same in this situation. Use whichever you stylistically prefer.</div>

<p>The flexibility doesn&#039;t end there. There are also overloads so that you can bind global functions, member functions, and static member functions to <tt>then()</tt>:</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="kt">void</span><span class=""> </span><span class="nf">globalFunction</span><span class="p">(</span><span class="n">Try</span><span class="o">&lt;</span><span class="kt">int</span><span class="o">&gt;</span><span class=""> </span><span class="k">const</span><span class="o">&amp;</span><span class=""> </span><span class="n">t</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">
</span><span class="k">struct</span><span class=""> </span><span class="n">Foo</span><span class=""> </span><span class="p">&#123;</span><span class="">
</span><span class="">  </span><span class="kt">void</span><span class=""> </span><span class="n">memberMethod</span><span class="p">(</span><span class="n">Try</span><span class="o">&lt;</span><span class="kt">int</span><span class="o">&gt;</span><span class=""> </span><span class="k">const</span><span class="o">&amp;</span><span class=""> </span><span class="n">t</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">  </span><span class="k">static</span><span class=""> </span><span class="kt">void</span><span class=""> </span><span class="nf">staticMemberMethod</span><span class="p">(</span><span class="n">Try</span><span class="o">&lt;</span><span class="kt">int</span><span class="o">&gt;</span><span class=""> </span><span class="k">const</span><span class="o">&amp;</span><span class=""> </span><span class="n">t</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="p">&#125;</span><span class="p">;</span><span class="">
</span><span class="n">Foo</span><span class=""> </span><span class="n">foo</span><span class="p">;</span><span class="">
</span><span class="">
</span><span class="c1">// bind global function
</span><span class="n">makeFuture</span><span class="o">&lt;</span><span class="kt">int</span><span class="o">&gt;</span><span class="p">(</span><span class="mi">1</span><span class="p">)</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="n">globalFunction</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="c1">// bind member method
</span><span class="n">makeFuture</span><span class="o">&lt;</span><span class="kt">int</span><span class="o">&gt;</span><span class="p">(</span><span class="mi">2</span><span class="p">)</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="o">&amp;</span><span class="n">Foo</span><span class="o">:</span><span class="o">:</span><span class="n">memberMethod</span><span class="p">,</span><span class=""> </span><span class="o">&amp;</span><span class="n">foo</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="c1">// bind static member method
</span><span class="n">makeFuture</span><span class="o">&lt;</span><span class="kt">int</span><span class="o">&gt;</span><span class="p">(</span><span class="mi">3</span><span class="p">)</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="o">&amp;</span><span class="n">Foo</span><span class="o">:</span><span class="o">:</span><span class="n">staticMemberMethod</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<h2 id="a-note-on-promises">A note on Promises <a href="#a-note-on-promises" class="headerLink">#</a></h2>

<p>Generally speaking, the majority of your futures-based code will deal with <tt>Futures</tt> alone and not <tt>Promises</tt>&#x2014;calling <tt>Future</tt>-returning interfaces, composing callbacks on them, and eventually returning another <tt>Future</tt>. <tt>Promises</tt> are most useful when you&#039;re wrapping some lower level asynchronous interface so that you can return a <tt>Future</tt>:</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="kt">void</span><span class=""> </span><span class="nf">fooOldFashioned</span><span class="p">(</span><span class="kt">int</span><span class=""> </span><span class="n">arg</span><span class="p">,</span><span class=""> </span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">function</span><span class="o">&lt;</span><span class="kt">int</span><span class="p">(</span><span class="kt">int</span><span class="p">)</span><span class="o">&gt;</span><span class=""> </span><span class="n">callback</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">
</span><span class="n">Future</span><span class="o">&lt;</span><span class="kt">int</span><span class="o">&gt;</span><span class=""> </span><span class="n">foo</span><span class="p">(</span><span class="kt">int</span><span class=""> </span><span class="n">arg</span><span class="p">)</span><span class=""> </span><span class="p">&#123;</span><span class="">
</span><span class="">  </span><span class="k">auto</span><span class=""> </span><span class="n">promise</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">make_shared</span><span class="o">&lt;</span><span class="n">Promise</span><span class="o">&lt;</span><span class="kt">int</span><span class="o">&gt;</span><span class="o">&gt;</span><span class="p">(</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">
</span><span class="">  </span><span class="n">fooOldFashioned</span><span class="p">(</span><span class="n">arg</span><span class="p">,</span><span class=""> </span><span class="p">[</span><span class="n">promise</span><span class="p">]</span><span class="p">(</span><span class="kt">int</span><span class=""> </span><span class="n">result</span><span class="p">)</span><span class=""> </span><span class="p">&#123;</span><span class="">
</span><span class="">    </span><span class="n">promise</span><span class="o">-</span><span class="o">&gt;</span><span class="n">setValue</span><span class="p">(</span><span class="n">result</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">  </span><span class="p">&#125;</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">
</span><span class="">  </span><span class="k">return</span><span class=""> </span><span class="n">promise</span><span class="o">-</span><span class="o">&gt;</span><span class="n">getFuture</span><span class="p">(</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="p">&#125;</span><span class="">
</span></pre></div>

<p>Though not a hard-and-fast rule, using promises heavily in your code might indicate</p>

<ul>
<li>an opportunity for a cleaner futures-based version</li>
<li>a missing abstraction in our library. See <a href="#compositional-building-blocks">Compositional Building Blocks</a>, <a href="#timeouts-and-related-features">Timeouts</a>, <a href="#interrupts-and-cancellations">Interrupts</a>, etc. Let us know if you think this is the case.</li>
</ul>

<h2 id="sharedpromise">SharedPromise <a href="#sharedpromise" class="headerLink">#</a></h2>

<p><a href="https://github.com/facebook/folly/blob/master/folly/futures/SharedPromise.h" target="_blank">SharedPromise</a> provides the same interface as Promise, but you can extract multiple Futures from it, i.e. you can call <tt>getFuture()</tt> as many times as you&#039;d like. When the SharedPromise is fulfilled, all of the Futures will be called back. Calls to getFuture() after the SharedPromise is fulfilled return a completed Future. If you find yourself constructing collections of Promises and fulfilling them simultaneously with the same value, consider this utility instead. Likewise, if you find yourself in need of setting multiple callbacks on the same Future (which is indefinitely unsupported), consider refactoring to use SharedPromise to &quot;split&quot; the Future.</p></section><section class="dex_document"><h1>Error Handling</h1><p class="dex_introduction">Asynchronous code can't employ try/catch exception handling universally, so Futures provides facilities to make error handling as easy and natural as possible. Here's an overview.</p><h2 id="throwing-exceptions">Throwing Exceptions <a href="#throwing-exceptions" class="headerLink">#</a></h2>

<p>There are several ways to introduce exceptions into your Futures flow. First, <tt>makeFuture&lt;T&gt;()</tt> and <tt>Promise&lt;T&gt;::setException()</tt> can create a failed future from any <tt>std::exception</tt>, from a <tt>folly::exception_wrapper</tt>, or from an <tt>std::exception_ptr</tt> (deprecated):</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="n">makeFuture</span><span class="o">&lt;</span><span class="kt">int</span><span class="o">&gt;</span><span class="p">(</span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">runtime_error</span><span class="p">(</span><span class="s">&quot;</span><span class="s">oh no!</span><span class="s">&quot;</span><span class="p">)</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="n">makeFuture</span><span class="o">&lt;</span><span class="kt">int</span><span class="o">&gt;</span><span class="p">(</span><span class="n">folly</span><span class="o">:</span><span class="o">:</span><span class="n">make_exception_wrapper</span><span class="o">&lt;</span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">runtime_error</span><span class="o">&gt;</span><span class="p">(</span><span class="s">&quot;</span><span class="s">oh no!</span><span class="s">&quot;</span><span class="p">)</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="n">makeFuture</span><span class="o">&lt;</span><span class="kt">int</span><span class="o">&gt;</span><span class="p">(</span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">current_exception</span><span class="p">(</span><span class="p">)</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">
</span><span class="n">Promise</span><span class="o">&lt;</span><span class="kt">int</span><span class="o">&gt;</span><span class=""> </span><span class="n">p1</span><span class="p">,</span><span class=""> </span><span class="n">p2</span><span class="p">,</span><span class=""> </span><span class="n">p3</span><span class="p">;</span><span class="">
</span><span class="n">p1</span><span class="p">.</span><span class="n">setException</span><span class="p">(</span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">runtime_error</span><span class="p">(</span><span class="s">&quot;</span><span class="s">oh no!</span><span class="s">&quot;</span><span class="p">)</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="n">p2</span><span class="p">.</span><span class="n">setException</span><span class="p">(</span><span class="n">folly</span><span class="o">:</span><span class="o">:</span><span class="n">make_exception_wrapper</span><span class="o">&lt;</span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">runtime_error</span><span class="o">&gt;</span><span class="p">(</span><span class="s">&quot;</span><span class="s">oh no!</span><span class="s">&quot;</span><span class="p">)</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="n">p3</span><span class="p">.</span><span class="n">setException</span><span class="p">(</span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">current_exception</span><span class="p">(</span><span class="p">)</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">
</span></pre></div>

<p>In general, any time you pass a function to a method that returns a <tt>Future</tt> or fulfills a <tt>Promise</tt>, you can rest assured that any thrown exceptions (including non-<tt>std::exceptions</tt>) will be caught and stored. For instance,</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="k">auto</span><span class=""> </span><span class="n">f</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">makeFuture</span><span class="p">(</span><span class="p">)</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="p">[</span><span class="p">]</span><span class="p">&#123;</span><span class="">
</span><span class="">  </span><span class="k">throw</span><span class=""> </span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">runtime_error</span><span class="p">(</span><span class="s">&quot;</span><span class="s">ugh</span><span class="s">&quot;</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="p">&#125;</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<p>is perfectly valid code. The exception will be caught and stored in the resultant <tt>Future</tt>.</p>

<p>Methods that behave this way include</p>

<ul>
<li><tt>Future&lt;T&gt;::then()</tt> and all its variants</li>
<li><tt>Future&lt;T&gt;::onError()</tt>: more on this below</li>
<li><tt>makeFutureTry()</tt>: takes a function, executes it, and creates a Future with the result or any thrown exception</li>
<li><tt>Promise&lt;T&gt;::setWith()</tt>: similar to <tt>makeFutureTry</tt> except it fulfills a Promise instead of creating a completed Future</li>
</ul>

<h2 id="catching-exceptions">Catching Exceptions <a href="#catching-exceptions" class="headerLink">#</a></h2>

<p>There are also several ways to handle exceptions in Futures code.</p>

<h3 id="using-try">Using Try <a href="#using-try" class="headerLink">#</a></h3>

<p>First, there&#039;s the <tt>Try</tt> abstraction which multiplexes values and exceptions so they can be handled simultaneously in a <tt>then()</tt> callback:</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="n">makeFuture</span><span class="o">&lt;</span><span class="kt">int</span><span class="o">&gt;</span><span class="p">(</span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">runtime_error</span><span class="p">(</span><span class="s">&quot;</span><span class="s">ugh</span><span class="s">&quot;</span><span class="p">)</span><span class="p">)</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="p">[</span><span class="p">]</span><span class="p">(</span><span class="n">Try</span><span class="o">&lt;</span><span class="kt">int</span><span class="o">&gt;</span><span class=""> </span><span class="n">t</span><span class="p">)</span><span class="p">&#123;</span><span class="">
</span><span class="">  </span><span class="k">try</span><span class=""> </span><span class="p">&#123;</span><span class="">
</span><span class="">    </span><span class="k">auto</span><span class=""> </span><span class="n">i</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">t</span><span class="p">.</span><span class="n">value</span><span class="p">(</span><span class="p">)</span><span class="p">;</span><span class=""> </span><span class="c1">// will rethrow
</span><span class="">    </span><span class="c1">// handle success
</span><span class="">  </span><span class="p">&#125;</span><span class=""> </span><span class="k">catch</span><span class=""> </span><span class="p">(</span><span class="k">const</span><span class=""> </span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">exception</span><span class="o">&amp;</span><span class=""> </span><span class="n">e</span><span class="p">)</span><span class=""> </span><span class="p">&#123;</span><span class="">
</span><span class="">    </span><span class="c1">// handle failure
</span><span class="">  </span><span class="p">&#125;</span><span class="">
</span><span class="p">&#125;</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">
</span><span class="c1">// Try is also integrated with exception_wrapper
</span><span class="n">makeFuture</span><span class="o">&lt;</span><span class="kt">int</span><span class="o">&gt;</span><span class="p">(</span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">runtime_error</span><span class="p">(</span><span class="s">&quot;</span><span class="s">ugh</span><span class="s">&quot;</span><span class="p">)</span><span class="p">)</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="p">[</span><span class="p">]</span><span class="p">(</span><span class="n">Try</span><span class="o">&lt;</span><span class="kt">int</span><span class="o">&gt;</span><span class=""> </span><span class="n">t</span><span class="p">)</span><span class="p">&#123;</span><span class="">
</span><span class="">  </span><span class="k">if</span><span class=""> </span><span class="p">(</span><span class="n">t</span><span class="p">.</span><span class="n">hasException</span><span class="o">&lt;</span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">exception</span><span class="o">&gt;</span><span class="p">(</span><span class="p">)</span><span class="p">)</span><span class=""> </span><span class="p">&#123;</span><span class="">
</span><span class="">    </span><span class="c1">// this is enough if we only care whether the given exception is present
</span><span class="">  </span><span class="p">&#125;</span><span class="">
</span><span class="p">&#125;</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">
</span><span class="n">makeFuture</span><span class="o">&lt;</span><span class="kt">int</span><span class="o">&gt;</span><span class="p">(</span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">runtime_error</span><span class="p">(</span><span class="s">&quot;</span><span class="s">ugh</span><span class="s">&quot;</span><span class="p">)</span><span class="p">)</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="p">[</span><span class="p">]</span><span class="p">(</span><span class="n">Try</span><span class="o">&lt;</span><span class="kt">int</span><span class="o">&gt;</span><span class=""> </span><span class="n">t</span><span class="p">)</span><span class="p">&#123;</span><span class="">
</span><span class="">  </span><span class="c1">// we can also extract and handle the exception object
</span><span class="">  </span><span class="c1">// TODO(jsedgwick) infer exception type from the type of the function
</span><span class="">  </span><span class="kt">bool</span><span class=""> </span><span class="n">caught</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">t</span><span class="p">.</span><span class="n">withException</span><span class="o">&lt;</span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">exception</span><span class="o">&gt;</span><span class="p">(</span><span class="p">[</span><span class="p">]</span><span class="p">(</span><span class="k">const</span><span class=""> </span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">exception</span><span class="o">&amp;</span><span class=""> </span><span class="n">e</span><span class="p">)</span><span class="p">&#123;</span><span class="">
</span><span class="">    </span><span class="c1">// do something with e
</span><span class="">  </span><span class="p">&#125;</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="p">&#125;</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">
</span></pre></div>

<p>Unfortunately, <tt>Try</tt> encourages both intertwining success and error logic as well as excessive rethrowing. Thankfully, there&#039;s another option.</p>

<h3 id="using-onerror">Using onError() <a href="#using-onerror" class="headerLink">#</a></h3>

<p><tt>Future&lt;T&gt;::onError()</tt> allows you to have individual exception handlers as separate callbacks. The parameter you specify for your callback is exactly what <tt>onError()</tt> will try to catch. The callback will be passed over if the future doesn&#039;t contain that exception, otherwise, it will be executed and the T or Future&lt;T&gt; that it returns will become the resultant Future instead.</p>

<div class="remarkup-warning"><span class="remarkup-note-word">WARNING:</span> Chaining together multiple calls to onError will NOT necessarily behave in the same way as multiple catch &#123;&#125; blocks after a try. Namely, if you throw an exception in one call to onError, the next onError will catch it.</div>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="n">intGenerator</span><span class="p">(</span><span class="p">)</span><span class=""> </span><span class="c1">// returns a Future&lt;int&gt;, which might contain an exception
</span><span class="">  </span><span class="c1">// This is a good opportunity to use the plain value (no Try)
</span><span class="">  </span><span class="c1">// variant of then()
</span><span class="">  </span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="p">[</span><span class="p">]</span><span class="p">(</span><span class="kt">int</span><span class=""> </span><span class="n">i</span><span class="p">)</span><span class=""> </span><span class="p">&#123;</span><span class=""> 
    </span><span class="k">return</span><span class=""> </span><span class="mi">10</span><span class=""> </span><span class="o">*</span><span class=""> </span><span class="n">i</span><span class="p">;</span><span class=""> </span><span class="c1">// maybe we throw here instead
</span><span class="">  </span><span class="p">&#125;</span><span class="p">)</span><span class="">
</span><span class="">  </span><span class="p">.</span><span class="n">onError</span><span class="p">(</span><span class="p">[</span><span class="p">]</span><span class="p">(</span><span class="k">const</span><span class=""> </span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">runtime_error</span><span class="o">&amp;</span><span class=""> </span><span class="n">e</span><span class="p">)</span><span class=""> </span><span class="p">&#123;</span><span class="">
</span><span class="">    </span><span class="c1">// ... runtime_error handling ...
</span><span class="">    </span><span class="k">return</span><span class=""> </span><span class="o">-</span><span class="mi">1</span><span class="p">;</span><span class="">
</span><span class="">  </span><span class="p">&#125;</span><span class="p">)</span><span class="">
</span><span class="">  </span><span class="p">.</span><span class="n">onError</span><span class="p">(</span><span class="p">[</span><span class="p">]</span><span class="p">(</span><span class="k">const</span><span class=""> </span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">exception</span><span class="o">&amp;</span><span class=""> </span><span class="n">e</span><span class="p">)</span><span class=""> </span><span class="p">&#123;</span><span class="">
</span><span class="">    </span><span class="c1">// ... all other exception handling ...
</span><span class="">    </span><span class="k">return</span><span class=""> </span><span class="o">-</span><span class="mi">2</span><span class="p">;</span><span class="">
</span><span class="">  </span><span class="p">&#125;</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<p>You can also use <tt>onError()</tt> directly with <tt>exception_wrapper</tt>. One use case for this variant is if you want to handle non-<tt>std::exception</tt> exceptions.</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="n">makeFuture</span><span class="p">(</span><span class="p">)</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="p">[</span><span class="p">]</span><span class="p">&#123;</span><span class="">
</span><span class="">  </span><span class="k">throw</span><span class=""> </span><span class="mi">42</span><span class="p">;</span><span class="">
</span><span class="p">&#125;</span><span class="p">)</span><span class="">
</span><span class="p">.</span><span class="n">onError</span><span class="p">(</span><span class="p">[</span><span class="p">]</span><span class="p">(</span><span class="n">exception_wrapper</span><span class=""> </span><span class="n">ew</span><span class="p">)</span><span class="p">&#123;</span><span class="">
</span><span class="">  </span><span class="c1">// ...
</span><span class="p">&#125;</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<h2 id="ensure">ensure() <a href="#ensure" class="headerLink">#</a></h2>

<p><tt>Future&lt;T&gt;::ensure(F func)</tt> is similar to the <tt>finally</tt> block in languages like Java. That is, it takes a void function and will execute regardless of whether the Future contains a value or an exception. The resultant Future will contain the exception/value of the original Future, unless the function provided to ensure throws, in which case that exception will be caught and propagated instead. For instance:</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="k">auto</span><span class=""> </span><span class="n">fd</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">open</span><span class="p">(</span><span class="p">.</span><span class="p">.</span><span class="p">.</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="k">auto</span><span class=""> </span><span class="n">f</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">makeFuture</span><span class="p">(</span><span class="p">)</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="p">[</span><span class="n">fd</span><span class="p">]</span><span class="p">&#123;</span><span class="">
</span><span class="">  </span><span class="c1">// do some stuff with the file descriptor
</span><span class="">  </span><span class="c1">// maybe we throw, maybe we don&#039;t
</span><span class="p">&#125;</span><span class="p">)</span><span class="">
</span><span class="p">.</span><span class="n">ensure</span><span class="p">(</span><span class="p">[</span><span class="n">fd</span><span class="p">]</span><span class="p">&#123;</span><span class="">
</span><span class="">  </span><span class="c1">// either way, let&#039;s release that fd
</span><span class="">  </span><span class="n">close</span><span class="p">(</span><span class="n">fd</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="p">&#125;</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">
</span><span class="c1">// f now contains the result of the then() callback, unless the ensure()
</span><span class="c1">// callback threw, in which case f will contain that exception
</span></pre></div>

<h2 id="performant-exception-han">Performant Exception Handling <a href="#performant-exception-han" class="headerLink">#</a></h2>

<p>Under the hood, the Futures use <tt>folly::exception_wrapper</tt> to store exceptions in a way that minimizes costly rethrows. However, the effectiveness of this mechanism depends on whether exceptions are supplied in a way that enables our library (and <tt>exception_wrapper</tt>) to maintain type information about your exception. Practically speaking, this means constructing exceptional futures directly instead of throwing. For instance:</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="c1">// This version will throw the exception twice
</span><span class="n">makeFuture</span><span class="p">(</span><span class="p">)</span><span class="">
</span><span class="">  </span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="p">[</span><span class="p">]</span><span class="p">&#123;</span><span class="">
</span><span class="">    </span><span class="k">throw</span><span class=""> </span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">runtime_error</span><span class="p">(</span><span class="s">&quot;</span><span class="s">ugh</span><span class="s">&quot;</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">  </span><span class="p">&#125;</span><span class="p">)</span><span class="">
</span><span class="">  </span><span class="p">.</span><span class="n">onError</span><span class="p">(</span><span class="p">[</span><span class="p">]</span><span class="p">(</span><span class="k">const</span><span class=""> </span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">runtime_error</span><span class="o">&amp;</span><span class=""> </span><span class="n">e</span><span class="p">)</span><span class="p">&#123;</span><span class="">
</span><span class="">    </span><span class="c1">// ...
</span><span class="">  </span><span class="p">&#125;</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="c1">// This version won&#039;t throw at all!
</span><span class="n">makeFuture</span><span class="p">(</span><span class="p">)</span><span class="">
</span><span class="">  </span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="p">[</span><span class="p">]</span><span class="p">&#123;</span><span class="">
</span><span class="">    </span><span class="c1">// This will properly wrap the exception
</span><span class="">    </span><span class="k">return</span><span class=""> </span><span class="n">makeFuture</span><span class="o">&lt;</span><span class="n">Unit</span><span class="o">&gt;</span><span class="p">(</span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">runtime_error</span><span class="p">(</span><span class="s">&quot;</span><span class="s">ugh</span><span class="s">&quot;</span><span class="p">)</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">  </span><span class="p">&#125;</span><span class="p">)</span><span class="">
</span><span class="">  </span><span class="p">.</span><span class="n">onError</span><span class="p">(</span><span class="p">[</span><span class="p">]</span><span class="p">(</span><span class="k">const</span><span class=""> </span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">runtime_error</span><span class="o">&amp;</span><span class=""> </span><span class="n">e</span><span class="p">)</span><span class="p">&#123;</span><span class="">
</span><span class="">    </span><span class="c1">// ...
</span><span class="">  </span><span class="p">&#125;</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<p>Likewise, using <tt>onError</tt> instead of throwing via <tt>Try</tt> will often reduce rethrows. If you want to use <tt>Try</tt>, look at <tt>Try&lt;T&gt;::hasException()</tt> and <tt>Try&lt;T&gt;::withException()</tt> for ways to inspect and handle exceptions without rethrows.</p>

<p>Be wary of premature optimization, and err towards clean code over minimizing rethrows unless you&#039;re sure you need the performance. That said, we will continue to strive to make the cleanest option the most performant one as well.</p></section><section class="dex_document"><h1>Compositional Building Blocks</h1><p class="dex_introduction">Sometimes chaining and nesting with then() is not enough. Here are some utilities for composing futures.</p><div class="remarkup-note"><span class="remarkup-note-word">NOTE:</span> For maximum flexibility, many of the helpers documented below take start and end iterators on a collection. All such functions have overloads that take just the collection by reference and automatically operate on the <tt>begin()</tt> and <tt>end()</tt> iterators. You will almost always want to take advantage of this sugar. For instance, <tt>collect(futures.begin(), futures.end())</tt> can be written as simply  <tt>collect(futures)</tt>.</div>

<h2 id="collectall">collectAll() <a href="#collectall" class="headerLink">#</a></h2>

<p><tt>collectAll()</tt> takes an iterable collection of <tt>Future&lt;T&gt;</tt>s (or start and end iterators on such a collection) and returns a <tt>Future&lt;std::vector&lt;Try&lt;T&gt;&gt;&gt;</tt> that will complete once all of the input futures complete. The resultant Future&#039;s vector will contain the results of each in the same order in which they were passed. Errors in any component Future will not cause early termination. Input Futures are moved in and are no longer valid. For example, we could fan out and fan in a bunch of RPCs like so:</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="n">Future</span><span class="o">&lt;</span><span class="n">T</span><span class="o">&gt;</span><span class=""> </span><span class="n">someRPC</span><span class="p">(</span><span class="kt">int</span><span class=""> </span><span class="n">i</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">
</span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">vector</span><span class="o">&lt;</span><span class="n">Future</span><span class="o">&lt;</span><span class="n">T</span><span class="o">&gt;</span><span class="o">&gt;</span><span class=""> </span><span class="n">fs</span><span class="p">;</span><span class="">
</span><span class="k">for</span><span class=""> </span><span class="p">(</span><span class="kt">int</span><span class=""> </span><span class="n">i</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="mi">0</span><span class="p">;</span><span class=""> </span><span class="n">i</span><span class=""> </span><span class="o">&lt;</span><span class=""> </span><span class="mi">10</span><span class="p">;</span><span class=""> </span><span class="n">i</span><span class="o">+</span><span class="o">+</span><span class="p">)</span><span class=""> </span><span class="p">&#123;</span><span class="">
</span><span class="">  </span><span class="n">fs</span><span class="p">.</span><span class="n">push_back</span><span class="p">(</span><span class="n">someRPC</span><span class="p">(</span><span class="n">i</span><span class="p">)</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="p">&#125;</span><span class="">
</span><span class="">
</span><span class="n">collectAll</span><span class="p">(</span><span class="n">fs</span><span class="p">)</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="p">[</span><span class="p">]</span><span class="p">(</span><span class="k">const</span><span class=""> </span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">vector</span><span class="o">&lt;</span><span class="n">Try</span><span class="o">&lt;</span><span class="n">T</span><span class="o">&gt;</span><span class="o">&gt;</span><span class="o">&amp;</span><span class=""> </span><span class="n">tries</span><span class="p">)</span><span class="p">&#123;</span><span class="">
</span><span class="">  </span><span class="k">for</span><span class=""> </span><span class="p">(</span><span class="k">const</span><span class=""> </span><span class="k">auto</span><span class="o">&amp;</span><span class=""> </span><span class="nl">t</span><span class=""> </span><span class="p">:</span><span class=""> </span><span class="n">tries</span><span class="p">)</span><span class=""> </span><span class="p">&#123;</span><span class="">
</span><span class="">    </span><span class="c1">// handle each response
</span><span class="">  </span><span class="p">&#125;</span><span class="">
</span><span class="p">&#125;</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<div class="remarkup-note"><span class="remarkup-note-word">NOTE:</span> Just as with any then() callback, you could take a Try instead and it would compile. But you shouldn&#039;t, because the only way the outer Future can fail is if there&#039;s a bug in our library. Save yourself some typing and skip the Try. This advice also applies to all of the compositional operations below whose Future types contain inner Trys (i.e. everything except for <tt>collect()</tt> and <tt>map()</tt>).</div>

<h2 id="collectall-variadic">collectAll() variadic <a href="#collectall-variadic" class="headerLink">#</a></h2>

<p>There is also a variadically templated flavor of <tt>collectAll()</tt> that allows you to mix and match different types of Futures. It returns a <tt>Future&lt;std::tuple&lt;Try&lt;T1&gt;, Try&lt;T2&gt;, ...&gt;&gt;</tt>. For example:</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="n">Future</span><span class="o">&lt;</span><span class="kt">int</span><span class="o">&gt;</span><span class=""> </span><span class="n">f1</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="p">.</span><span class="p">.</span><span class="p">.</span><span class="p">;</span><span class="">
</span><span class="n">Future</span><span class="o">&lt;</span><span class="n">string</span><span class="o">&gt;</span><span class=""> </span><span class="n">f2</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="p">.</span><span class="p">.</span><span class="p">.</span><span class="p">;</span><span class="">
</span><span class="n">collectAll</span><span class="p">(</span><span class="n">f1</span><span class="p">,</span><span class=""> </span><span class="n">f2</span><span class="p">)</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="p">[</span><span class="p">]</span><span class="p">(</span><span class="k">const</span><span class=""> </span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">tuple</span><span class="o">&lt;</span><span class="n">Try</span><span class="o">&lt;</span><span class="kt">int</span><span class="o">&gt;</span><span class="p">,</span><span class=""> </span><span class="n">Try</span><span class="o">&lt;</span><span class="n">string</span><span class="o">&gt;</span><span class="o">&gt;</span><span class="o">&amp;</span><span class=""> </span><span class="n">tup</span><span class="p">)</span><span class=""> </span><span class="p">&#123;</span><span class="">
</span><span class="">  </span><span class="kt">int</span><span class=""> </span><span class="n">i</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">get</span><span class="o">&lt;</span><span class="mi">0</span><span class="o">&gt;</span><span class="p">(</span><span class="n">tup</span><span class="p">)</span><span class="p">.</span><span class="n">value</span><span class="p">(</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">  </span><span class="n">string</span><span class=""> </span><span class="n">s</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">get</span><span class="o">&lt;</span><span class="mi">1</span><span class="o">&gt;</span><span class="p">(</span><span class="n">tup</span><span class="p">)</span><span class="p">.</span><span class="n">value</span><span class="p">(</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">  </span><span class="c1">// ...
</span><span class="p">&#125;</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<h2 id="collect">collect() <a href="#collect" class="headerLink">#</a></h2>

<p><tt>collect()</tt> is similar to <tt>collectAll()</tt>, but will terminate early if an exception is raised by any of the input Futures. Therefore, the returned Future is of type <tt>std::vector&lt;T&gt;</tt>. Like <tt>collectAll()</tt>, input Futures are moved in and are no longer valid, and the resulting Future&#039;s vector will contain the results of each input Future in the same order they were passed in (if all are successful). For instance:</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="n">collect</span><span class="p">(</span><span class="n">fs</span><span class="p">)</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="p">[</span><span class="p">]</span><span class="p">(</span><span class="k">const</span><span class=""> </span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">vector</span><span class="o">&lt;</span><span class="n">T</span><span class="o">&gt;</span><span class="o">&amp;</span><span class=""> </span><span class="n">vals</span><span class="p">)</span><span class=""> </span><span class="p">&#123;</span><span class="">
</span><span class="">  </span><span class="k">for</span><span class=""> </span><span class="p">(</span><span class="k">const</span><span class=""> </span><span class="k">auto</span><span class="o">&amp;</span><span class=""> </span><span class="nl">val</span><span class=""> </span><span class="p">:</span><span class=""> </span><span class="n">vals</span><span class="p">)</span><span class=""> </span><span class="p">&#123;</span><span class="">
</span><span class="">    </span><span class="c1">// handle each response
</span><span class="">  </span><span class="p">&#125;</span><span class="">
</span><span class="p">&#125;</span><span class="p">)</span><span class="">
</span><span class="p">.</span><span class="n">onError</span><span class="p">(</span><span class="p">[</span><span class="p">]</span><span class="p">(</span><span class="k">const</span><span class=""> </span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">exception</span><span class="o">&amp;</span><span class=""> </span><span class="n">e</span><span class="p">)</span><span class=""> </span><span class="p">&#123;</span><span class="">
</span><span class="">  </span><span class="c1">// drat, one of them failed
</span><span class="p">&#125;</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">
</span><span class="c1">// Or using a Try:
</span><span class="n">collect</span><span class="p">(</span><span class="n">fs</span><span class="p">)</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="p">[</span><span class="p">]</span><span class="p">(</span><span class="k">const</span><span class=""> </span><span class="n">Try</span><span class="o">&lt;</span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">vector</span><span class="o">&lt;</span><span class="n">T</span><span class="o">&gt;</span><span class="o">&gt;</span><span class="o">&amp;</span><span class=""> </span><span class="n">t</span><span class="p">)</span><span class=""> </span><span class="p">&#123;</span><span class="">
</span><span class=""> </span><span class="c1">// ...
</span><span class="p">&#125;</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<h2 id="collect-variadic">collect() variadic <a href="#collect-variadic" class="headerLink">#</a></h2>

<p>There is also a variadically templated flavor of <tt>collect()</tt> that allows you to mix and match different types of Futures. It returns a <tt>Future&lt;std::tuple&lt;T1, T2, ...&gt;&gt;</tt>.</p>

<h2 id="collectn">collectN() <a href="#collectn" class="headerLink">#</a></h2>

<p><tt>collectN</tt>, like <tt>collectAll()</tt>, takes a collection of Futures, or a pair of iterators thereof, but it also takes a <tt>size_t</tt> N and will complete once N of the input futures are complete. It returns a <tt>Future&lt;std::vector&lt;std::pair&lt;size_t, Try&lt;T&gt;&gt;&gt;&gt;</tt>. Each pair holds the index of the corresponding Future in the original collection as well as its result, though the pairs themselves will be in arbitrary order. Like <tt>collectAll()</tt>, <tt>collectN()</tt> moves in the input Futures, so your copies are no longer valid. If multiple input futures complete &quot;simultaneously&quot; or are already completed, winners are chosen but the choice is undefined.</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="c1">// Wait for 5 of the input futures to complete
</span><span class="n">collectN</span><span class="p">(</span><span class="n">fs</span><span class="p">,</span><span class=""> </span><span class="mi">5</span><span class="p">,</span><span class="">
</span><span class="">  </span><span class="p">[</span><span class="p">]</span><span class="p">(</span><span class="k">const</span><span class=""> </span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">vector</span><span class="o">&lt;</span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">pair</span><span class="o">&lt;</span><span class="kt">size_t</span><span class="p">,</span><span class=""> </span><span class="n">Try</span><span class="o">&lt;</span><span class="kt">int</span><span class="o">&gt;</span><span class="o">&gt;</span><span class="o">&gt;</span><span class="o">&amp;</span><span class=""> </span><span class="n">tries</span><span class="p">)</span><span class="p">&#123;</span><span class="">
</span><span class="">    </span><span class="c1">// there will be 5 pairs
</span><span class="">    </span><span class="k">for</span><span class=""> </span><span class="p">(</span><span class="k">const</span><span class=""> </span><span class="k">auto</span><span class="o">&amp;</span><span class=""> </span><span class="nl">pair</span><span class=""> </span><span class="p">:</span><span class=""> </span><span class="n">tries</span><span class="p">)</span><span class=""> </span><span class="p">&#123;</span><span class="">
</span><span class="">      </span><span class="kt">size_t</span><span class=""> </span><span class="n">index</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">pair</span><span class="p">.</span><span class="n">first</span><span class="p">;</span><span class="">
</span><span class="">      </span><span class="kt">int</span><span class=""> </span><span class="n">result</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">pair</span><span class="p">.</span><span class="n">second</span><span class="p">.</span><span class="n">value</span><span class="p">(</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">      </span><span class="c1">// ...
</span><span class="">    </span><span class="p">&#125;</span><span class="">
</span><span class="">  </span><span class="p">&#125;</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<h2 id="collectany">collectAny() <a href="#collectany" class="headerLink">#</a></h2>

<p><tt>collectAny()</tt> also takes a collection of Futures (or a pair of iterators thereof), but it completes as soon as any of the input Futures completes. It returns a <tt>Future&lt;std::pair&lt;size_t, Try&lt;T&gt;&gt;&gt;</tt> which holds the index of the first completed Future along with its result. The input futures are moved in, so your copies are no longer valid. If multiple input futures complete &quot;simultaneously&quot; or are already completed, a winner is chosen but the choice is undefined. For example:</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="n">collectAny</span><span class="p">(</span><span class="n">fs</span><span class="p">,</span><span class=""> </span><span class="p">[</span><span class="p">]</span><span class="p">(</span><span class="k">const</span><span class=""> </span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">pair</span><span class="o">&lt;</span><span class="kt">size_t</span><span class="p">,</span><span class=""> </span><span class="n">Try</span><span class="o">&lt;</span><span class="kt">int</span><span class="o">&gt;</span><span class="o">&gt;</span><span class="o">&amp;</span><span class=""> </span><span class="n">p</span><span class="p">)</span><span class="p">&#123;</span><span class="">
</span><span class="">  </span><span class="kt">size_t</span><span class=""> </span><span class="n">index</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">p</span><span class="p">.</span><span class="n">first</span><span class="p">;</span><span class="">
</span><span class="">  </span><span class="kt">int</span><span class=""> </span><span class="n">result</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">p</span><span class="p">.</span><span class="n">second</span><span class="p">.</span><span class="n">value</span><span class="p">(</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">  </span><span class="c1">// ...
</span><span class="p">&#125;</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<h2 id="map">map() <a href="#map" class="headerLink">#</a></h2>

<p><tt>map()</tt> is the Futures equivalent of the higher order function <a href="http://en.wikipedia.org/wiki/Map_%28higher-order_function%29" target="_blank">map</a>. It takes a collection of <tt>Future&lt;A&gt;</tt> (or a pair of iterators thereof) and a function that can be passed to Future&lt;A&gt;::then(), and in turn calls then() with the function on each input Future. It returns a vector of the resultant Futures in the order they were passed in. This is simple sugar for:</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">vector</span><span class="o">&lt;</span><span class="n">Future</span><span class="o">&lt;</span><span class="n">A</span><span class="o">&gt;</span><span class="o">&gt;</span><span class=""> </span><span class="n">fs</span><span class="p">;</span><span class="">
</span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">vector</span><span class="o">&lt;</span><span class="n">Future</span><span class="o">&lt;</span><span class="n">B</span><span class="o">&gt;</span><span class="o">&gt;</span><span class=""> </span><span class="n">fs2</span><span class="p">;</span><span class="">
</span><span class="k">for</span><span class=""> </span><span class="p">(</span><span class="k">auto</span><span class=""> </span><span class="n">it</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">fs</span><span class="p">.</span><span class="n">begin</span><span class="p">(</span><span class="p">)</span><span class="p">;</span><span class=""> </span><span class="n">it</span><span class=""> </span><span class="o">&lt;</span><span class=""> </span><span class="n">fs</span><span class="p">.</span><span class="n">end</span><span class="p">(</span><span class="p">)</span><span class="p">;</span><span class=""> </span><span class="n">it</span><span class="o">+</span><span class="o">+</span><span class="p">)</span><span class=""> </span><span class="p">&#123;</span><span class="">
</span><span class="">  </span><span class="n">fs2</span><span class="p">.</span><span class="n">push_back</span><span class="p">(</span><span class="n">it</span><span class="o">-</span><span class="o">&gt;</span><span class="n">then</span><span class="p">(</span><span class="n">func</span><span class="p">)</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="p">&#125;</span><span class="">
</span></pre></div>

<p>For instance, say you have some expensive RPC that fetches an <tt>int</tt> and you&#039;d like to do expensive processing on each of many calls to this RPC. <tt>collect()</tt> or <tt>collectAll()</tt> might not be wise since they wait for all the results to be ready, while you&#039;d rather process the integers as they arrive. You could use <tt>map()</tt> in this scenario:</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="k">auto</span><span class=""> </span><span class="n">fs2</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">map</span><span class="p">(</span><span class="n">fs</span><span class="p">,</span><span class=""> </span><span class="n">expensiveProcessingFunc</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="c1">// You probably now want to wait for all of these to complete. Call
</span><span class="c1">// collect() or collectAll() on fs2 to obtain such a Future.
</span></pre></div>

<h2 id="reduce">reduce() <a href="#reduce" class="headerLink">#</a></h2>

<p><tt>reduce()</tt> is the Futures equivalent of the higher order function <a href="http://en.wikipedia.org/wiki/Fold_%28higher-order_function%29" target="_blank">fold</a> (foldl, specifically). It takes a collection of <tt>Future&lt;A&gt;</tt> (or a pair of iterators thereof), an initial value of type <tt>B</tt>, and a function taking two arguments - the reduced value of type <tt>B</tt> and the next result from the collection of <tt>Future&lt;A&gt;</tt>. The function must return either <tt>B</tt> or <tt>Future&lt;B&gt;</tt>. <tt>reduce()</tt>, in turn, returns a <tt>Future&lt;B&gt;</tt>. The function will be applied to the initial value and the result of the first Future, and then to the result of that initial application and the result of the second Future, and so on until the whole collection of Futures has been reduced or an unhandled exception is hit.</p>

<p>The second argument to the reducing function can be either <tt>A</tt> or <tt>Try&lt;A&gt;</tt>, depending on whether you want to handle exceptions from the input Futures. If there is an exception in an input Future and you don&#039;t take a <tt>Try</tt>, the reduce operation will short circuit with that exception. Any exception thrown in the reducing function will similarly short circuit the whole operation.</p>

<p>For instance, if you have a collection of <tt>Future&lt;int&gt;</tt> and you want a <tt>Future&lt;bool&gt;</tt> that contains true if and only if all the input <tt>ints</tt> are equal to zero, you might write:</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="n">reduce</span><span class="p">(</span><span class="n">fs</span><span class="p">,</span><span class=""> </span><span class="nb">true</span><span class="p">,</span><span class=""> </span><span class="p">[</span><span class="p">]</span><span class="p">(</span><span class="kt">bool</span><span class=""> </span><span class="n">b</span><span class="p">,</span><span class=""> </span><span class="kt">int</span><span class=""> </span><span class="n">i</span><span class="p">)</span><span class="p">&#123;</span><span class="">
</span><span class="">  </span><span class="c1">// You could also return a Future&lt;bool&gt; if you needed to
</span><span class="">  </span><span class="k">return</span><span class=""> </span><span class="n">b</span><span class=""> </span><span class="o">&amp;</span><span class="o">&amp;</span><span class=""> </span><span class="p">(</span><span class="n">i</span><span class=""> </span><span class="o">=</span><span class="o">=</span><span class=""> </span><span class="mi">0</span><span class="p">)</span><span class="p">;</span><span class=""> 
</span><span class="p">&#125;</span><span class="p">)</span><span class="">
</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="p">[</span><span class="p">]</span><span class="p">(</span><span class="kt">bool</span><span class=""> </span><span class="n">result</span><span class="p">)</span><span class="p">&#123;</span><span class="">
</span><span class="">  </span><span class="c1">// result is true if all inputs were zero
</span><span class="p">&#125;</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="c1">// You could use onError or Try here in case one of your input Futures
</span><span class="c1">// contained an exception or if your reducing function threw an exception 
</span></pre></div>

<p>To demonstrate the exception handling case, suppose you have a collection of <tt>Future&lt;T&gt;</tt> and you want a <tt>Future&lt;bool&gt;</tt> that contains true if all the input Futures are non-exceptional:</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="n">reduce</span><span class="p">(</span><span class="n">fs</span><span class="p">,</span><span class=""> </span><span class="nb">true</span><span class="p">,</span><span class=""> </span><span class="p">[</span><span class="p">]</span><span class="p">(</span><span class="kt">bool</span><span class=""> </span><span class="n">b</span><span class="p">,</span><span class=""> </span><span class="n">Try</span><span class="o">&lt;</span><span class="n">T</span><span class="o">&gt;</span><span class=""> </span><span class="n">t</span><span class="p">)</span><span class="p">&#123;</span><span class="">
</span><span class="">  </span><span class="k">return</span><span class=""> </span><span class="n">b</span><span class=""> </span><span class="o">&amp;</span><span class="o">&amp;</span><span class=""> </span><span class="n">t</span><span class="p">.</span><span class="n">hasValue</span><span class="p">(</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="p">&#125;</span><span class="p">)</span><span class="">
</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="p">[</span><span class="p">]</span><span class="p">(</span><span class="kt">bool</span><span class=""> </span><span class="n">result</span><span class="p">)</span><span class="p">&#123;</span><span class="">
</span><span class="">  </span><span class="c1">// result is true if all inputs were non-exceptional
</span><span class="p">&#125;</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<p>And finally one example where we&#039;re not reducing to a <tt>bool</tt> - here&#039;s how you might calculate the sum of a collection of <tt>Future&lt;int&gt;</tt>:</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="n">reduce</span><span class="p">(</span><span class="n">fs</span><span class="p">,</span><span class=""> </span><span class="mi">0</span><span class="p">,</span><span class=""> </span><span class="p">[</span><span class="p">]</span><span class="p">(</span><span class="kt">int</span><span class=""> </span><span class="n">a</span><span class="p">,</span><span class=""> </span><span class="kt">int</span><span class=""> </span><span class="n">b</span><span class="p">)</span><span class="p">&#123;</span><span class="">
</span><span class="">  </span><span class="k">return</span><span class=""> </span><span class="n">a</span><span class=""> </span><span class="o">+</span><span class=""> </span><span class="n">b</span><span class="p">;</span><span class="">
</span><span class="p">&#125;</span><span class="p">)</span><span class="">
</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="p">[</span><span class="p">]</span><span class="p">(</span><span class="kt">int</span><span class=""> </span><span class="n">sum</span><span class="p">)</span><span class="p">&#123;</span><span class="">
</span><span class="">  </span><span class="c1">// ...
</span><span class="p">&#125;</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<p>See the <tt>reduce()</tt> tests in <a href="https://github.com/facebook/folly/blob/master/folly/futures/test/FutureTest.cpp" target="_blank">the Future tests</a> for a more complete catalog of possibilities.</p>

<h2 id="unorderedreduce">unorderedReduce() <a href="#unorderedreduce" class="headerLink">#</a></h2>

<p>Like <tt>reduce()</tt>, but consumes Futures in the collection as soon as they become ready. Use this if your function doesn&#039;t depend on the order of the Futures in the input collection. See the <a href="https://github.com/facebook/folly/blob/master/folly/futures/test/FutureTest.cpp#L1810" target="_blank">tests</a> for examples.</p>

<h2 id="window">window() <a href="#window" class="headerLink">#</a></h2>

<p><tt>window()</tt> is a sliding window implementation for Futures. It takes a collection of <tt>T</tt> (or a pair of iterators thereof), a function taking a <tt>T&amp;&amp;</tt> and returning a <tt>Future&lt;S&gt;</tt>, and a window size <tt>n</tt>. <tt>window()</tt> will create up to <tt>n</tt> Futures at a time using the function. As Futures complete, new Futures are created until the collection is exhausted.</p>

<p>It ensures that at any given time, no more than <tt>n</tt> Futures are being processed.</p>

<p>Combine with <tt>collectAll</tt>, <tt>reduce</tt> or <tt>unorderedReduce</tt>. See the <a href="https://github.com/facebook/folly/blob/master/folly/futures/test/FutureTest.cpp#L693" target="_blank">tests</a> for examples.</p>

<h2 id="other-possibilities">Other Possibilities <a href="#other-possibilities" class="headerLink">#</a></h2>

<p>There are a number of other possibilities for composing multiple Futures which we&#039;ll probably get around to at some point. If any of these seem like they would come in handy, let us know or better yet submit a diff:</p>

<ul>
<li><tt>filter()</tt></li>
<li>&lt;your suggestion here&gt;</li>
</ul></section><section class="dex_document"><h1>Multithreading and via()</h1><p class="dex_introduction">What to know and what to watch out for when using futures in a multithreaded environment, and how to control your threading model.</p><h2 id="futures-are-thread-safe">Futures are thread safe... with a catch. <a href="#futures-are-thread-safe" class="headerLink">#</a></h2>

<p>The core mutating operations on Futures and Promises are thread safe, insofar as they will throw exceptions if misused (usually, this means being called more than once, including simultaneous calls from different threads). For example, <tt>then()</tt>, <tt>onError()</tt> and other methods that set callbacks on Futures will throw exceptions if called twice. The same goes for fulfilling Promises via <tt>setValue()</tt> and <tt>setException()</tt>.</p>

<p>So what&#039;s the catch? Let&#039;s look at the following example of multithreaded Futures code:</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="c1">// Thread A
</span><span class="n">Promise</span><span class="o">&lt;</span><span class="n">Unit</span><span class="o">&gt;</span><span class=""> </span><span class="n">p</span><span class="p">;</span><span class="">
</span><span class="k">auto</span><span class=""> </span><span class="n">f</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">p</span><span class="p">.</span><span class="n">getFuture</span><span class="p">(</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">
</span><span class="c1">// Thread B
</span><span class="n">f</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="n">x</span><span class="p">)</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="n">y</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">
</span><span class="c1">// Thread A
</span><span class="n">p</span><span class="p">.</span><span class="n">setValue</span><span class="p">(</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<p>In which thread are x and y executed? Unfortunately, it depends. There is a race between setting the callbacks and fulfilling the promise. If setting the callbacks wins, they will be executed in thread A when the Promise is fulfilled. If setting the value wins, they will be executed in thread B as soon as they are set. If <tt>setValue()</tt> sneaks in at just the right time between the two <tt>then()</tt> calls, then x will be executed in thread A and y will be executed in thread B. You could imagine that this nondeterminism might become unwieldy or downright unacceptable. Thankfully, there&#039;s a mechanism to resolve this race and give you fine-grained control over your execution model.</p>

<h2 id="via-to-the-rescue">via() to the rescue <a href="#via-to-the-rescue" class="headerLink">#</a></h2>

<p>Futures have a method called <tt>via()</tt> which takes an <a href="https://github.com/facebook/folly/blob/master/folly/Executor.h#L27" target="_blank">Executor</a>. Executor is a simple interface that requires only the existence of an <tt>add(std::function&lt;void()&gt; func)</tt> method which must be thread safe and must execute the provided function somehow, though not necessarily immediately. <tt>via()</tt> guarantees that a callback set on the Future will be executed on the given Executor. For instance:</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="n">makeFutureWith</span><span class="p">(</span><span class="n">x</span><span class="p">)</span><span class="">
</span><span class="">  </span><span class="p">.</span><span class="n">via</span><span class="p">(</span><span class="n">exe1</span><span class="p">)</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="n">y</span><span class="p">)</span><span class="">
</span><span class="">  </span><span class="p">.</span><span class="n">via</span><span class="p">(</span><span class="n">exe2</span><span class="p">)</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="n">z</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<p>In this example, <tt>y</tt> will be executed on <tt>exe1</tt>, and <tt>z</tt> will be executed on <tt>exe2</tt>. This is a fairly powerful abstraction. It not only solves the above race, but gives you clear, concise, and self-documenting control over your execution model. One common pattern is having different executors for different types of work (e.g. an IO-bound pool spinning on event bases doing your network IO and a CPU-bound thread pool for expensive work) and switching between them with <tt>via()</tt>.</p>

<p>There is also a static function <tt>via()</tt> that creates a completed <tt>Future&lt;Unit&gt;</tt> that is already set up to call back on the provided Executor, and <tt>via(Executor&amp;,Func)</tt> returns a Future for executing a function via an executor.</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="n">via</span><span class="p">(</span><span class="n">exe</span><span class="p">)</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="n">a</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="n">via</span><span class="p">(</span><span class="n">exe</span><span class="p">,</span><span class=""> </span><span class="n">a</span><span class="p">)</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="n">b</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<h2 id="or-pass-an-executor-to-t">Or, pass an Executor to <tt>then()</tt> <a href="#or-pass-an-executor-to-t" class="headerLink">#</a></h2>

<p>An alternative to <tt>via()</tt> is to pass an Executor as the first parameter to <tt>then()</tt>, which causes the callback to be executed via that Executor. Unlike <tt>via()</tt> the Executor is not sticky, it only applies for this callback. See the docblock for more details and caveats.</p>

<h2 id="executor-implementations">Executor implementations <a href="#executor-implementations" class="headerLink">#</a></h2>

<p><tt>via()</tt> wouldn&#039;t be of much use without practical implementations around. We have a handful, and here&#039;s a (possibly incomplete) list.</p>

<ul>
<li><a href="https://github.com/facebook/wangle/blob/master/wangle/concurrent/ThreadPoolExecutor.h" target="_blank">ThreadPoolExecutor</a> is an abstract thread pool implementation that supports resizing, custom thread factories, pool and per-task stats, NUMA awareness, user-defined task expiration, and Codel task expiration. It and its subclasses are under active development. It currently has two implementations:<ul>
<li><a href="https://github.com/facebook/wangle/blob/master/wangle/concurrent/CPUThreadPoolExecutor.h" target="_blank">CPUThreadPoolExecutor</a> is a general purpose thread pool. In addition to the above features, it also supports task priorities.</li>
<li><a href="https://github.com/facebook/wangle/blob/master/wangle/concurrent/IOThreadPoolExecutor.h" target="_blank">IOThreadPoolExecutor</a> is similar to CPUThreadPoolExecutor, but each thread spins on an EventBase (accessible to callbacks via <a href="https://github.com/facebook/folly/blob/master/folly/io/async/EventBaseManager.h" target="_blank">EventBaseManager</a>)</li>
</ul></li>
<li>folly&#039;s <a href="https://github.com/facebook/folly/blob/master/folly/io/async/EventBase.h" target="_blank">EventBase</a> is an Executor and executes work as a callback in the event loop</li>
<li><a href="https://github.com/facebook/folly/blob/master/folly/futures/ManualExecutor.h" target="_blank">ManualExecutor</a> only executes work when manually cranked. This is useful for testing.</li>
<li><a href="https://github.com/facebook/folly/blob/master/folly/futures/InlineExecutor.h" target="_blank">InlineExecutor</a> executes work immediately inline</li>
<li><a href="https://github.com/facebook/folly/blob/master/folly/futures/QueuedImmediateExecutor.h" target="_blank">QueuedImmediateExecutor</a> is similar to InlineExecutor, but work added during callback execution will be queued instead of immediately executed</li>
<li><a href="https://github.com/facebook/folly/blob/master/folly/futures/ScheduledExecutor.h" target="_blank">ScheduledExecutor</a> is a subinterface of Executor that supports scheduled (i.e. delayed) execution. There aren&#039;t many implementations yet, see <a class="remarkup-task" href="#" target="_blank">T5924392</a></li>
<li>Thrift&#039;s <a href="https://github.com/facebook/fbthrift/blob/master/thrift/lib/cpp/concurrency/ThreadManager.h" target="_blank">ThreadManager</a> is an Executor but we aim to deprecate it in favor of the aforementioned CPUThreadPoolExecutor</li>
<li><a href="https://github.com/facebook/wangle/blob/master/wangle/concurrent/FutureExecutor.h" target="_blank">FutureExecutor</a> wraps another Executor and provides <tt>Future&lt;T&gt; addFuture(F func)</tt> which returns a Future representing the result of func. This is equivalent to <tt>futures::async(executor, func)</tt> and the latter should probably be preferred.</li>
</ul></section><section class="dex_document"><h1>Timeouts and related features</h1><p class="dex_introduction">Futures provide a number of timing-related features. Here's an overview.</p><h2 id="timing-implementation">Timing implementation <a href="#timing-implementation" class="headerLink">#</a></h2>

<h3 id="timing-resolution">Timing resolution <a href="#timing-resolution" class="headerLink">#</a></h3>

<p>The functions and methods documented below all take a <tt>Duration</tt>, <a href="https://github.com/facebook/folly/blob/master/folly/futures/detail/Types.h" target="_blank">which is an alias for <tt>std::chrono::milliseconds</tt></a>. Why not allow more granularity? Simply put, we can&#039;t guarantee sub-millisecond resolution and we don&#039;t want to lie to you.</p>

<p>Do not use the <tt>Duration</tt> type directly, that defeats the point of using a <tt>std::chrono::duration</tt> type. Rather, use the appropriate <tt>std::chrono::duration</tt>, e.g. <tt>std::chrono::seconds</tt> or <tt>std::chrono::milliseconds</tt>.</p>

<h3 id="the-timekeeper-interface">The TimeKeeper interface <a href="#the-timekeeper-interface" class="headerLink">#</a></h3>

<p>Most timing-related methods also optionally take a <a href="https://github.com/facebook/folly/blob/master/folly/futures/Timekeeper.h#L44" target="_blank"><tt>TimeKeeper</tt></a>. Implement that interface if you&#039;d like control over how Futures timing works under the hood. If you don&#039;t provide a <tt>TimeKeeper</tt>, a default singleton will be lazily created and employed. The <a href="https://github.com/facebook/folly/blob/master/folly/futures/detail/ThreadWheelTimekeeper.h" target="_blank">default implementation</a> uses a folly::HHWheelTimer in a dedicated EventBase thread to manage timeouts.</p>

<h2 id="within">within() <a href="#within" class="headerLink">#</a></h2>

<p><tt>Future&lt;T&gt;::within()</tt> returns a new Future that will complete with the provided exception (by default, a TimedOut exception) if it does not complete within the specified duration. For example:</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="k">using</span><span class=""> </span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">chrono</span><span class="o">:</span><span class="o">:</span><span class="n">milliseconds</span><span class="p">;</span><span class="">
</span><span class="n">Future</span><span class="o">&lt;</span><span class="kt">int</span><span class="o">&gt;</span><span class=""> </span><span class="n">foo</span><span class="p">(</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">
</span><span class="c1">// f will complete with a TimedOut exception if the Future returned by foo()
</span><span class="c1">// does not complete within 500 ms
</span><span class="n">f</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">foo</span><span class="p">(</span><span class="p">)</span><span class="p">.</span><span class="n">within</span><span class="p">(</span><span class="n">milliseconds</span><span class="p">(</span><span class="mi">500</span><span class="p">)</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">
</span><span class="c1">// Same deal, but a timeout will trigger the provided exception instead
</span><span class="n">f2</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">foo</span><span class="p">(</span><span class="p">)</span><span class="p">.</span><span class="n">within</span><span class="p">(</span><span class="n">milliseconds</span><span class="p">(</span><span class="mi">500</span><span class="p">)</span><span class="p">,</span><span class=""> </span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">runtime_error</span><span class="p">(</span><span class="s">&quot;</span><span class="s">you took too long!</span><span class="s">&quot;</span><span class="p">)</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<h2 id="ontimeout">onTimeout() <a href="#ontimeout" class="headerLink">#</a></h2>

<p><tt>Future&lt;T&gt;::onTimeout()</tt> lets you simultaneously set up a timeout and a timeout handler. For example:</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="n">Future</span><span class="o">&lt;</span><span class="kt">int</span><span class="o">&gt;</span><span class=""> </span><span class="n">foo</span><span class="p">(</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="n">foo</span><span class="p">(</span><span class="p">)</span><span class="">
</span><span class="">  </span><span class="p">.</span><span class="n">onTimeout</span><span class="p">(</span><span class="n">milliseconds</span><span class="p">(</span><span class="mi">500</span><span class="p">)</span><span class="p">,</span><span class=""> </span><span class="p">[</span><span class="p">]</span><span class="p">&#123;</span><span class="">
</span><span class="">    </span><span class="c1">// You must maintain the resultant future&#039;s type
</span><span class="">    </span><span class="c1">// ... handle timeout ...
</span><span class="">    </span><span class="k">return</span><span class=""> </span><span class="o">-</span><span class="mi">1</span><span class="p">;</span><span class="">
</span><span class="">  </span><span class="p">&#125;</span><span class="p">)</span><span class="">
</span><span class="">  </span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="p">.</span><span class="p">.</span><span class="p">.</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<p>The astute reader might notice that this is effectively syntactic sugar for</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="n">foo</span><span class="p">(</span><span class="p">)</span><span class="">
</span><span class="">  </span><span class="p">.</span><span class="n">within</span><span class="p">(</span><span class="n">milliseconds</span><span class="p">(</span><span class="mi">500</span><span class="p">)</span><span class="p">)</span><span class="">
</span><span class="">  </span><span class="p">.</span><span class="n">onError</span><span class="p">(</span><span class="p">[</span><span class="p">]</span><span class="p">(</span><span class="k">const</span><span class=""> </span><span class="n">TimedOut</span><span class="o">&amp;</span><span class=""> </span><span class="n">e</span><span class="p">)</span><span class=""> </span><span class="p">&#123;</span><span class="">
</span><span class="">    </span><span class="c1">// handle timeout
</span><span class="">    </span><span class="k">return</span><span class=""> </span><span class="o">-</span><span class="mi">1</span><span class="p">;</span><span class="">
</span><span class="">  </span><span class="p">&#125;</span><span class="p">)</span><span class="">
</span><span class="">  </span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="p">.</span><span class="p">.</span><span class="p">.</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<h2 id="get-and-wait-with-timeou">get() and wait() with timeouts <a href="#get-and-wait-with-timeou" class="headerLink">#</a></h2>

<p><tt>get()</tt> and <tt>wait()</tt>, which are detailed in the <a href="#testing">Testing</a> article, optionally take timeouts:</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="n">Future</span><span class="o">&lt;</span><span class="kt">int</span><span class="o">&gt;</span><span class=""> </span><span class="n">foo</span><span class="p">(</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="c1">// Will throw TimedOut if the Future doesn&#039;t complete within one second of
</span><span class="c1">// the get() call
</span><span class="kt">int</span><span class=""> </span><span class="n">result</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">foo</span><span class="p">(</span><span class="p">)</span><span class="p">.</span><span class="n">get</span><span class="p">(</span><span class="n">milliseconds</span><span class="p">(</span><span class="mi">1000</span><span class="p">)</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">
</span><span class="c1">// If the Future doesn&#039;t complete within one second, f will remain
</span><span class="c1">// incomplete. That is, if a timeout occurs, it&#039;s as if wait() was
</span><span class="c1">// never called.
</span><span class="n">Future</span><span class="o">&lt;</span><span class="kt">int</span><span class="o">&gt;</span><span class=""> </span><span class="n">f</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">foo</span><span class="p">(</span><span class="p">)</span><span class="p">.</span><span class="n">wait</span><span class="p">(</span><span class="n">milliseconds</span><span class="p">(</span><span class="mi">1000</span><span class="p">)</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<h2 id="delayed">delayed() <a href="#delayed" class="headerLink">#</a></h2>

<p><tt>Future&lt;T&gt;::delayed()</tt> returns a new Future whose completion is delayed for at least the specified duration. For example:</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="n">makeFuture</span><span class="p">(</span><span class="p">)</span><span class="">
</span><span class="">  </span><span class="p">.</span><span class="n">delayed</span><span class="p">(</span><span class="n">milliseconds</span><span class="p">(</span><span class="mi">1000</span><span class="p">)</span><span class="p">)</span><span class="">
</span><span class="">  </span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="p">[</span><span class="p">]</span><span class="p">&#123;</span><span class="">
</span><span class="">    </span><span class="c1">// This will be executed when the original Future has completed or when
</span><span class="">    </span><span class="c1">// 1000ms has elapsed, whichever comes last.
</span><span class="">  </span><span class="p">&#125;</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<h2 id="futures-sleep">futures::sleep() <a href="#futures-sleep" class="headerLink">#</a></h2>

<p><tt>sleep()</tt> returns a <tt>Future&lt;Unit&gt;</tt> that will complete after the specified duration. For example:</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="n">futures</span><span class="o">:</span><span class="o">:</span><span class="n">sleep</span><span class="p">(</span><span class="n">milliseconds</span><span class="p">(</span><span class="mi">1000</span><span class="p">)</span><span class="p">)</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="p">[</span><span class="p">]</span><span class="p">&#123;</span><span class="">
</span><span class="">  </span><span class="c1">// This will be executed after 1000ms
</span><span class="p">&#125;</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div></section><section class="dex_document"><h1>Interrupts and Cancellations</h1><p class="dex_introduction">Interrupts are a mechanism for Future holders to send a signal to Promise holders. Here's how to use them.</p><p>Let&#039;s say that your Futures code kicks off some long, expensive operation in another thread. A short while later, something comes up that obviates the need for the result of that operation. Are those resources gone forever? Not necessarily. Enter interrupts.</p>

<p>Interrupts allow Future holders to send signals in the form of exceptions to Promise holders, who are free to handle the interrupt as they please (or not at all). For example:</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="k">auto</span><span class=""> </span><span class="n">p</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">make_shared</span><span class="o">&lt;</span><span class="n">Promise</span><span class="o">&lt;</span><span class="kt">int</span><span class="o">&gt;</span><span class="o">&gt;</span><span class="p">(</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="n">p</span><span class="o">-</span><span class="o">&gt;</span><span class="n">setInterruptHandler</span><span class="p">(</span><span class="p">[</span><span class="n">weakPromise</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">folly</span><span class="o">:</span><span class="o">:</span><span class="n">to_weak_ptr</span><span class="p">(</span><span class="n">p</span><span class="p">)</span><span class="p">]</span><span class="p">(</span><span class="">
</span><span class="">    </span><span class="k">const</span><span class=""> </span><span class="n">exception_wrapper</span><span class="o">&amp;</span><span class=""> </span><span class="n">e</span><span class="p">)</span><span class=""> </span><span class="p">&#123;</span><span class="">
</span><span class="">  </span><span class="k">auto</span><span class=""> </span><span class="n">promise</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">weakPromise</span><span class="p">.</span><span class="n">lock</span><span class="p">(</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">  </span><span class="c1">// Handle the interrupt. For instance, we could just fulfill the Promise
</span><span class="">  </span><span class="c1">// with the given exception:
</span><span class="">  </span><span class="k">if</span><span class=""> </span><span class="p">(</span><span class="n">promise</span><span class="p">)</span><span class=""> </span><span class="p">&#123;</span><span class="">
</span><span class="">    </span><span class="n">promise</span><span class="o">-</span><span class="o">&gt;</span><span class="n">setException</span><span class="p">(</span><span class="n">e</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">  </span><span class="p">&#125;</span><span class="">
</span><span class="">
</span><span class="">  </span><span class="c1">// Or maybe we want the Future to complete with some special value
</span><span class="">  </span><span class="k">if</span><span class=""> </span><span class="p">(</span><span class="n">promise</span><span class="p">)</span><span class=""> </span><span class="p">&#123;</span><span class="">
</span><span class="">    </span><span class="n">promise</span><span class="o">-</span><span class="o">&gt;</span><span class="n">setValue</span><span class="p">(</span><span class="mi">42</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">  </span><span class="p">&#125;</span><span class="">
</span><span class="">
</span><span class="">  </span><span class="c1">// Or maybe we don&#039;t want to do anything at all! Including not setting
</span><span class="">  </span><span class="c1">// this handler in the first place.
</span><span class="p">&#125;</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">
</span><span class="k">auto</span><span class=""> </span><span class="n">f</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">p</span><span class="o">-</span><span class="o">&gt;</span><span class="n">getFuture</span><span class="p">(</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="c1">// The Future holder can now send an interrupt whenever it wants via raise().
</span><span class="c1">// If the interrupt beats out the fulfillment of the Promise *and* there is
</span><span class="c1">// an interrupt handler set on the Promise, that handler will be called with
</span><span class="c1">// the provided exception
</span><span class="n">f</span><span class="p">.</span><span class="n">raise</span><span class="p">(</span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">runtime_error</span><span class="p">(</span><span class="s">&quot;</span><span class="s">Something went awry! Abort!</span><span class="s">&quot;</span><span class="p">)</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">
</span><span class="c1">// cancel() is syntactic sugar for raise(FutureCancellation())
</span><span class="n">f</span><span class="p">.</span><span class="n">cancel</span><span class="p">(</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<p>Going forward, we&#039;d like to integrate interrupts with major Future interface provides as a way to cancel RPCs and the like, but that&#039;s not in place yet. This is a bleeding edge feature&#x2014;please let us know your use cases so that we can iterate!</p></section><section class="dex_document"><h1>Testing</h1><p class="dex_introduction">Testing futures-based code does not have to be a pain. Here are some tips and idiomatic approaches.</p><h2 id="extracting-values-synchr">Extracting values synchronously <a href="#extracting-values-synchr" class="headerLink">#</a></h2>

<div class="remarkup-note"><span class="remarkup-note-word">NOTE:</span> The tests in this article are written using the <a href="https://code.google.com/p/googletest/wiki/Primer" target="_blank">gtest</a> framework.</div>

<p>Let&#039;s say we want to test the following interface:</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="n">Future</span><span class="o">&lt;</span><span class="kt">bool</span><span class="o">&gt;</span><span class=""> </span><span class="n">isPrime</span><span class="p">(</span><span class="kt">int</span><span class=""> </span><span class="n">n</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<p>We could make a couple of calls and set expectations on the resultant futures via <tt>value()</tt>:</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="n">EXPECT_TRUE</span><span class="p">(</span><span class="n">isPrime</span><span class="p">(</span><span class="mi">7</span><span class="p">)</span><span class="p">.</span><span class="n">value</span><span class="p">(</span><span class="p">)</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="n">EXPECT_FALSE</span><span class="p">(</span><span class="n">isPrime</span><span class="p">(</span><span class="mi">8</span><span class="p">)</span><span class="p">.</span><span class="n">value</span><span class="p">(</span><span class="p">)</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<p>But what if <tt>isPrime()</tt> is asynchronous (e.g. makes an async call to another service that computes primeness)? It&#039;s now likely that you&#039;ll call <tt>value()</tt> before the Future is complete, which will throw a <a href="https://github.com/facebook/folly/blob/master/folly/futures/FutureException.h#L66" target="_blank"><tt>FutureNotReady</tt></a> exception.</p>

<p>A naive approach is to spin until the Future is complete:</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="c1">// Spin until ready. Gross. Don&#039;t do this.
</span><span class="k">auto</span><span class=""> </span><span class="n">f</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">isPrime</span><span class="p">(</span><span class="mi">7</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="k">while</span><span class=""> </span><span class="p">(</span><span class="o">!</span><span class="n">f</span><span class="p">.</span><span class="n">isReady</span><span class="p">(</span><span class="p">)</span><span class="p">)</span><span class=""> </span><span class="p">&#123;</span><span class="p">&#125;</span><span class="">
</span><span class="n">EXPECT_TRUE</span><span class="p">(</span><span class="n">f</span><span class="p">.</span><span class="n">value</span><span class="p">(</span><span class="p">)</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<p>Thankfully, we have some better options in the form of <tt>Future&lt;T&gt;::get()</tt> and <tt>Future&lt;T&gt;::wait()</tt>.</p>

<h3 id="get">get() <a href="#get" class="headerLink">#</a></h3>

<p><tt>T Future&lt;T&gt;::get()</tt> blocks until the Future is complete and either returns a moved out copy of the value or throws any contained exception. You can use it like so.</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="n">EXPECT_TRUE</span><span class="p">(</span><span class="n">isPrime</span><span class="p">(</span><span class="mi">7</span><span class="p">)</span><span class="p">.</span><span class="n">get</span><span class="p">(</span><span class="p">)</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<p>Keep in mind that some other thread had better complete the Future, because the thread that calls <tt>get()</tt> will block. Also, <tt>get()</tt> optionally takes a timeout after which its throws a TimedOut exception. See the <a href="#timeouts-and-related-features">Timeouts</a> article for more information.</p>

<h3 id="wait">wait() <a href="#wait" class="headerLink">#</a></h3>

<p><tt>Future&lt;T&gt; Future&lt;T&gt;::wait()</tt> is similar to <tt>get()</tt> in that it blocks until the Future is complete. However, instead of returning a value or throwing an exception, it returns a new completed Future with the result of the original Future. One use case is when you&#039;d rather not have the throwing behavior of <tt>get()</tt> so that you can check for exceptions separately without a try/catch. For example:</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="k">auto</span><span class=""> </span><span class="n">f</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">isPrime</span><span class="p">(</span><span class="mi">7</span><span class="p">)</span><span class="p">.</span><span class="n">wait</span><span class="p">(</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="n">EXPECT_FALSE</span><span class="p">(</span><span class="n">f</span><span class="p">.</span><span class="n">getTry</span><span class="p">(</span><span class="p">)</span><span class="p">.</span><span class="n">hasException</span><span class="p">(</span><span class="p">)</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="n">EXPECT_TRUE</span><span class="p">(</span><span class="n">f</span><span class="p">.</span><span class="n">value</span><span class="p">(</span><span class="p">)</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<p>Like <tt>get()</tt>, <tt>wait()</tt> optionally takes a timeout. Again, see the <a href="#timeouts-and-related-features">Timeouts</a> article.</p>

<h3 id="getvia-and-waitvia">getVia() and waitVia() <a href="#getvia-and-waitvia" class="headerLink">#</a></h3>

<p><tt>T Future&lt;T&gt;::getVia(DrivableExecutor*)</tt> and <tt>Future&lt;T&gt; Future&lt;T&gt;::waitVia(DrivableExecutor*)</tt> have the same semantics as <tt>get()</tt> and <tt>wait()</tt> except that they drive some Executor until the Future is complete. <a href="https://github.com/facebook/folly/blob/master/folly/futures/DrivableExecutor.h" target="_blank"><tt>DrivableExecutor</tt></a> is a simple subinterface of <tt>Executor</tt> that requires the presence of a method <tt>drive()</tt> which can somehow make progress on the Executor&#039;s work. Two commonly helpful implementations are <a href="https://github.com/facebook/folly/blob/master/folly/io/async/EventBase.h" target="_blank"><tt>EventBase</tt></a> (where <tt>drive()</tt> loops on the EventBase) and <a href="https://github.com/facebook/folly/blob/master/folly/futures/ManualExecutor.h" target="_blank"><tt>ManualExecutor</tt></a>. These are simple but useful sugar for the following common pattern:</p>

<p>Given this:</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="k">auto</span><span class=""> </span><span class="n">f</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">doAsyncWorkOnEventBase</span><span class="p">(</span><span class="o">&amp;</span><span class="n">eventBase</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<p>Don&#039;t do this:</p>

<div class="remarkup-code-block remarkup-counterexample" data-code-lang="cpp"><pre class="remarkup-code"><span class="k">while</span><span class=""> </span><span class="p">(</span><span class="o">!</span><span class="n">f</span><span class="p">.</span><span class="n">isReady</span><span class="p">(</span><span class="p">)</span><span class="p">)</span><span class=""> </span><span class="p">&#123;</span><span class="">
</span><span class="">  </span><span class="n">eb</span><span class="p">.</span><span class="n">loop</span><span class="p">(</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="p">&#125;</span><span class="">
</span></pre></div>

<p>Do one of these instead:</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="k">auto</span><span class=""> </span><span class="n">val</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">f</span><span class="p">.</span><span class="n">getVia</span><span class="p">(</span><span class="o">&amp;</span><span class="n">eventBase</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="c1">// or
</span><span class="n">f</span><span class="p">.</span><span class="n">waitVia</span><span class="p">(</span><span class="o">&amp;</span><span class="n">eb</span><span class="p">)</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="p">[</span><span class="p">]</span><span class="p">(</span><span class="n">Value</span><span class=""> </span><span class="n">val</span><span class="p">)</span><span class="p">&#123;</span><span class=""> </span><span class="p">.</span><span class="p">.</span><span class="p">.</span><span class=""> </span><span class="p">&#125;</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<h2 id="using-gmock">Using gmock <a href="#using-gmock" class="headerLink">#</a></h2>

<p><a href="https://code.google.com/p/googlemock/" target="_blank">Google Mock</a> is a powerful mocking framework for writing and using C++ mock classes. Unfortunately, Gmock requires that the parameters and return types of mocked functions and methods are copyable. You&#039;re likely to hit this issue when mocking Futures code because Futures (and, less importantly, Promises) are noncopyable, and many of your interfaces will return Futures and some will even be passed Futures.</p>

<p>The canonical approach to mocking interfaces that involve noncopyable objects is to override your interface with a dummy method that simply calls a mock method that has had the noncopyable components stripped or replaced. For Futures, this usually means returning/passing contained values directly and synchronously, which shouldn&#039;t be a problem since your mocks won&#039;t actually be asynchronous. Here is a very contrived but demonstrative example:</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="c1">// The async interface we want to mock
</span><span class="k">class</span><span class=""> </span><span class="nc">AsyncClient</span><span class=""> </span><span class="p">&#123;</span><span class="">
</span><span class=""> </span><span class="k">public</span><span class="o">:</span><span class="">
</span><span class="">  </span><span class="k">virtual</span><span class=""> </span><span class="n">Future</span><span class="o">&lt;</span><span class="kt">int</span><span class="o">&gt;</span><span class=""> </span><span class="n">foo</span><span class="p">(</span><span class="kt">int</span><span class=""> </span><span class="n">i</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="p">&#125;</span><span class="p">;</span><span class="">
</span><span class="">
</span><span class="c1">// The mock implementation
</span><span class="k">class</span><span class=""> </span><span class="nc">MockAsyncClient</span><span class=""> </span><span class="o">:</span><span class=""> </span><span class="k">public</span><span class=""> </span><span class="n">AsyncClient</span><span class=""> </span><span class="p">&#123;</span><span class="">
</span><span class=""> </span><span class="k">public</span><span class="o">:</span><span class="">
</span><span class="">  </span><span class="c1">// Declare a mock method foo_ that takes an int and returns an int
</span><span class="">  </span><span class="n">MOCK_METHOD1</span><span class="p">(</span><span class="n">foo_</span><span class="p">,</span><span class=""> </span><span class="kt">int</span><span class="p">(</span><span class="kt">int</span><span class="p">)</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">
</span><span class="">  </span><span class="c1">// Plug the mock into an override of the interface
</span><span class="">  </span><span class="n">Future</span><span class="o">&lt;</span><span class="kt">int</span><span class="o">&gt;</span><span class=""> </span><span class="n">foo</span><span class="p">(</span><span class="kt">int</span><span class=""> </span><span class="n">i</span><span class="p">)</span><span class=""> </span><span class="k">override</span><span class=""> </span><span class="p">&#123;</span><span class="">
</span><span class="">    </span><span class="c1">// Lift the result back into a Future before returning
</span><span class="">    </span><span class="k">return</span><span class=""> </span><span class="n">makeFuture</span><span class="o">&lt;</span><span class="kt">int</span><span class="o">&gt;</span><span class="p">(</span><span class="n">foo_</span><span class="p">(</span><span class="n">i</span><span class="p">)</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">  </span><span class="p">&#125;</span><span class="">
</span><span class="p">&#125;</span><span class="p">;</span><span class="">
</span><span class="">
</span><span class="c1">// Let&#039;s say that we&#039;re testing a class MyProxy that simply forwards foo()
</span><span class="c1">// calls to AsyncClient and returns the result
</span><span class="k">class</span><span class=""> </span><span class="nc">MyProxy</span><span class=""> </span><span class="p">&#123;</span><span class="">
</span><span class=""> </span><span class="k">public</span><span class="o">:</span><span class="">
</span><span class="">  </span><span class="n">Future</span><span class="o">&lt;</span><span class="kt">int</span><span class="o">&gt;</span><span class=""> </span><span class="n">foo</span><span class="p">(</span><span class="kt">int</span><span class=""> </span><span class="n">i</span><span class="p">)</span><span class=""> </span><span class="p">&#123;</span><span class="">
</span><span class="">    </span><span class="k">return</span><span class=""> </span><span class="n">client</span><span class="o">-</span><span class="o">&gt;</span><span class="n">foo</span><span class="p">(</span><span class="n">i</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">  </span><span class="p">&#125;</span><span class="">
</span><span class="">  </span><span class="kt">void</span><span class=""> </span><span class="n">setClient</span><span class="p">(</span><span class="n">AsyncClient</span><span class="o">*</span><span class=""> </span><span class="n">client</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class=""> </span><span class="k">private</span><span class="o">:</span><span class="">
</span><span class="">  </span><span class="n">AsyncClient</span><span class="o">*</span><span class=""> </span><span class="n">client</span><span class="p">;</span><span class="">
</span><span class="p">&#125;</span><span class="p">;</span><span class="">
</span><span class="">
</span><span class="c1">// Now, in our testing code
</span><span class="n">MyProxy</span><span class=""> </span><span class="n">proxy</span><span class="p">;</span><span class="">
</span><span class="n">MockAsyncClient</span><span class=""> </span><span class="n">mockClient</span><span class="p">;</span><span class="">
</span><span class="c1">// Inject the mock
</span><span class="n">proxy</span><span class="p">.</span><span class="n">setClient</span><span class="p">(</span><span class="o">&amp;</span><span class="n">mockClient</span><span class="p">)</span><span class="">
</span><span class="c1">// Set an expectation on the mock to be called with 42 and return 84
</span><span class="n">EXPECT_CALL</span><span class="p">(</span><span class="n">mockClient</span><span class="p">,</span><span class=""> </span><span class="n">foo_</span><span class="p">(</span><span class="mi">42</span><span class="p">)</span><span class="p">)</span><span class="p">.</span><span class="n">WillOnce</span><span class="p">(</span><span class="n">Return</span><span class="p">(</span><span class="mi">84</span><span class="p">)</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="c1">// Trigger the call
</span><span class="k">auto</span><span class=""> </span><span class="n">f</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">MyProxy</span><span class="p">.</span><span class="n">foo</span><span class="p">(</span><span class="mi">42</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="c1">// If everything has been mocked out synchronously, we can just check the
</span><span class="c1">// value of the future directly
</span><span class="n">EXPECT_EQ</span><span class="p">(</span><span class="mi">84</span><span class="p">,</span><span class=""> </span><span class="n">f</span><span class="p">.</span><span class="n">value</span><span class="p">(</span><span class="p">)</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div></section><section class="dex_document"><h1>Pitfalls</h1><p class="dex_introduction"></p><h2 id="eventbase-eventbasemanag">EventBase, EventBaseManager, Executor <a href="#eventbase-eventbasemanag" class="headerLink">#</a></h2>

<p>It&#039;s not uncommon to hit a snag (especially when using via()) where you&#039;re hanging for (a) being on the wrong thread (b) talking to an EventBase which is not actually spinning (loopForever).</p>

<p>Some tips:</p>

<ul>
<li>evb-&gt;isInRunningEventBase()</li>
<li>evb-&gt;isRunning()</li>
</ul>

<h2 id="lambda-arguments">Lambda Arguments <a href="#lambda-arguments" class="headerLink">#</a></h2>

<p>The danger with lambdas is you&#039;ll try to read a variable that&#039;s gone</p>

<div class="remarkup-code-block remarkup-counterexample" data-code-lang="cpp"><pre class="remarkup-code"><span class="n">Object</span><span class=""> </span><span class="n">obj</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="p">.</span><span class="p">.</span><span class="p">.</span><span class="p">;</span><span class="">
</span><span class="k">return</span><span class=""> </span><span class="n">future1</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="p">[</span><span class="o">&amp;</span><span class="p">]</span><span class=""> </span><span class="p">&#123;</span><span class="">
</span><span class="">    </span><span class="c1">// ..work..
</span><span class="">    </span><span class="n">obj</span><span class="p">.</span><span class="n">method</span><span class="p">(</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">      </span><span class="c1">// woops object is gone from the 
</span><span class="">      </span><span class="c1">// stack when this actually runs
</span><span class="p">&#125;</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<p>Sometimes it makes sense to copy inputs. Sometimes that&#039;s too expensive and a shared_ptr is best. Sometimes the nature of things lends itself to the contract &quot;this won&#039;t go away&quot; and you take a raw pointer, but this should only be used when it&#039;s a very natural fit. In particular, you don&#039;t want people wishing you took a shared pointer and having to do something like this to work around it:</p>

<div class="remarkup-code-block remarkup-counterexample" data-code-lang="cpp"><pre class="remarkup-code"><span class="k">auto</span><span class=""> </span><span class="n">foo</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">make_shared</span><span class="o">&lt;</span><span class="n">Foo</span><span class="o">&gt;</span><span class="p">(</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="n">yourFunction</span><span class="p">(</span><span class="n">foo</span><span class="p">.</span><span class="n">get</span><span class="p">(</span><span class="p">)</span><span class="p">,</span><span class="">
</span><span class="">  </span><span class="p">[</span><span class="n">foo</span><span class="p">]</span><span class="p">&#123;</span><span class=""> 
     </span><span class="cm">/* callback doesn&#039;t use foo, but captures the </span><span>
</span><span class="cm">      * shared pointer to keep it alive </span><span>
</span><span class="cm">      */</span><span class="">
</span><span class="p">&#125;</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<p>In general:
prefer taking inputs by value if they&#039;re small enough
if inputs are big (measurably expensive to copy), then keep them on the heap and prefer a shared_ptr
if you are really sure you need to get more fancy, put on your wizard hat and go to it ;)</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="n">Object</span><span class=""> </span><span class="n">obj</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="p">.</span><span class="p">.</span><span class="p">.</span><span class="p">;</span><span class="">
</span><span class="k">return</span><span class=""> </span><span class="n">future1</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="p">[</span><span class="n">obj</span><span class="p">]</span><span class=""> </span><span class="p">&#123;</span><span class="">  </span><span class="c1">// capture by value
</span><span class="">    </span><span class="c1">// ..work..
</span><span class="">    </span><span class="n">obj</span><span class="p">.</span><span class="n">method</span><span class="p">(</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">      </span><span class="c1">// works on copy of obj
</span><span class="p">&#125;</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<p>If Object is large:</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="k">auto</span><span class=""> </span><span class="n">optr</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">makeShared</span><span class="o">&lt;</span><span class="n">Object</span><span class="o">&gt;</span><span class="p">(</span><span class="p">.</span><span class="p">.</span><span class="p">.</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="k">return</span><span class=""> </span><span class="n">future1</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="p">[</span><span class="n">optr</span><span class="p">]</span><span class=""> </span><span class="p">&#123;</span><span class="">  </span><span class="c1">// copy ptr, use count = 2
</span><span class="">    </span><span class="c1">// ..work..
</span><span class="">    </span><span class="n">optr</span><span class="o">-</span><span class="o">&gt;</span><span class="n">method</span><span class="p">(</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">      </span><span class="c1">// works on original object
</span><span class="">    </span><span class="c1">// use-count for optr goes to 0 and object destructs
</span><span class="p">&#125;</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<h2 id="using-std-move-with-lamb">Using std::move with lambda capture <a href="#using-std-move-with-lamb" class="headerLink">#</a></h2>

<p>If you have move-only objects, like unique_ptr, then you can use generalized lambda capture (C++14) syntax:</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="k">auto</span><span class=""> </span><span class="n">moveOnly</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">folly</span><span class="o">:</span><span class="o">:</span><span class="n">make_unique</span><span class="o">&lt;</span><span class="n">Object</span><span class="o">&gt;</span><span class="p">(</span><span class="p">.</span><span class="p">.</span><span class="p">.</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="k">return</span><span class=""> </span><span class="n">future1</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="p">[</span><span class="n">lambdaObj</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">move</span><span class="p">(</span><span class="n">moveOnly</span><span class="p">)</span><span class="p">]</span><span class=""> </span><span class="p">&#123;</span><span class="">  
    </span><span class="c1">// ...
</span><span class="p">&#125;</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<p>Since you can only std::move() out of an object once, you can&#039;t have:</p>

<div class="remarkup-code-block remarkup-counterexample" data-code-lang="cpp"><pre class="remarkup-code"><span class="k">auto</span><span class=""> </span><span class="n">moveOnly</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">folly</span><span class="o">:</span><span class="o">:</span><span class="n">make_unique</span><span class="o">&lt;</span><span class="n">Object</span><span class="o">&gt;</span><span class="p">(</span><span class="p">.</span><span class="p">.</span><span class="p">.</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="k">return</span><span class=""> </span><span class="n">future1</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="p">[</span><span class="n">lambdaObj</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">move</span><span class="p">(</span><span class="n">moveOnly</span><span class="p">)</span><span class="p">]</span><span class=""> </span><span class="p">&#123;</span><span class="">  
    </span><span class="c1">// Do work:
</span><span class="p">&#125;</span><span class="p">)</span><span class="">
</span><span class="p">.</span><span class="n">onError</span><span class="p">(</span><span class="p">[</span><span class="n">lambdaObj</span><span class=""> </span><span class="o">=</span><span class=""> </span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">move</span><span class="p">(</span><span class="n">moveOnly</span><span class="p">)</span><span class="p">]</span><span class=""> </span><span class="p">&#123;</span><span class=""> 
    </span><span class="c1">// Error handling:
</span><span class="p">&#125;</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<p>And note, the construction order of the lambdas in GCC is somewhat counter-intuitive when you have several declared in one statement.   The lambda instance for the .onError() case will be constructed first (the legal std::move), and then the &#039;.then()&#039; clause lambda.   See <a href="https://godbolt.org/g/B51b77" target="_blank">https://godbolt.org/g/B51b77</a>.</p></section><section class="dex_document"><h1>Future as a Monad</h1><p class="dex_introduction">A semi-formal and totally optional analysis of Future as a monad.</p><p>Future is a monad. You don&#039;t need to know this or what it means to use Futures, but if you are curious, want to understand monads better, or eat functional flakes for breakfast, then keep reading this extremely extracurricular document.</p>

<p>Let&#039;s review the definition of a monad. Formal definitions are mathematical and/or in Haskellese and therefore opaque to imperative mortals. But here&#039;s a simplified description using a subset of Haskell type notation that is useful but not confusing:</p>

<div class="remarkup-code-block" data-code-lang="hs"><pre class="remarkup-code"><span class="c1">-- &quot;unit&quot; is a function that takes a value and wraps it in the monad type.</span><span class="">
</span><span class="c1">-- Haskellers call this &quot;return&quot; as some kind of sick inside joke.</span><span class="">
</span><span class="nf">unit</span><span class=""> </span><span class="ow">::</span><span class=""> </span><span class="n">a</span><span class=""> </span><span class="ow">-&gt;</span><span class=""> </span><span class="n">m</span><span class=""> </span><span class="n">a</span><span class="">

</span><span class="c1">-- &quot;bind&quot; is a function that takes a monad, and a function that takes a value</span><span class="">
</span><span class="c1">-- and returns another monad. Haskellers call this &quot;&gt;&gt;=&quot; because they are</span><span class="">
</span><span class="c1">-- vying to unseat perl from the throne of illegibility.</span><span class="">
</span><span class="nf">bind</span><span class=""> </span><span class="ow">::</span><span class=""> </span><span class="n">m</span><span class=""> </span><span class="n">a</span><span class=""> </span><span class="ow">-&gt;</span><span class=""> </span><span class="p">(</span><span class="n">a</span><span class=""> </span><span class="ow">-&gt;</span><span class=""> </span><span class="n">m</span><span class=""> </span><span class="n">b</span><span class="p">)</span><span class=""> </span><span class="ow">-&gt;</span><span class=""> </span><span class="n">m</span><span class=""> </span><span class="n">b</span><span class="">
</span></pre></div>

<p>Monads must also satisfy these three axioms:</p>

<div class="remarkup-code-block" data-code-lang="hs"><pre class="remarkup-code"><span class="c1">-- Left Identity</span><span class="">
</span><span class="nf">unit</span><span class=""> </span><span class="n">a</span><span class=""> </span><span class="p">`</span><span class="n">bind</span><span class="p">`</span><span class=""> </span><span class="n">f</span><span class=""> </span><span class="err">≡</span><span class=""> </span><span class="n">f</span><span class=""> </span><span class="n">a</span><span class="">
</span><span class="c1">-- Right Identity</span><span class="">
</span><span class="nf">m</span><span class=""> </span><span class="p">`</span><span class="n">bind</span><span class="p">`</span><span class=""> </span><span class="n">unit</span><span class=""> </span><span class="err">≡</span><span class=""> </span><span class="n">m</span><span class="">
</span><span class="c1">-- Associativity</span><span class="">
</span><span class="p">(</span><span class="n">m</span><span class=""> </span><span class="p">`</span><span class="n">bind</span><span class="p">`</span><span class=""> </span><span class="n">f</span><span class="p">)</span><span class=""> </span><span class="p">`</span><span class="n">bind</span><span class="p">`</span><span class=""> </span><span class="n">g</span><span class=""> </span><span class="err">≡</span><span class=""> </span><span class="n">m</span><span class=""> </span><span class="p">`</span><span class="n">bind</span><span class="p">`</span><span class=""> </span><span class="p">(</span><span class="nf">\</span><span class="n">x</span><span class=""> </span><span class="ow">-&gt;</span><span class=""> </span><span class="n">f</span><span class=""> </span><span class="n">x</span><span class=""> </span><span class="p">`</span><span class="n">bind</span><span class="p">`</span><span class=""> </span><span class="n">g</span><span class="p">)</span><span class="">
</span></pre></div>

<p>I won&#039;t try to explain that, there are <a href="http://lmgtfy.com/?q=what+the+hell+is+a+monad%3F" target="_blank">many blog posts and wiki pages that try to do that</a>. Instead, I&#039;ll substitute the equivalent Future monad expressions, and the whole thing will (probably) start to make sense. First, a simplified Future type:</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="k">template</span><span class=""> </span><span class="o">&lt;</span><span class="k">class</span><span class=""> </span><span class="nc">A</span><span class="o">&gt;</span><span class="">
</span><span class="k">struct</span><span class=""> </span><span class="n">Future</span><span class=""> </span><span class="p">&#123;</span><span class="">
</span><span class="">  </span><span class="c1">// The constructor that takes a value is &quot;unit&quot;
</span><span class="">  </span><span class="n">Future</span><span class="p">(</span><span class="n">A</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">
</span><span class="">  </span><span class="c1">// &quot;then&quot; is &quot;bind&quot;
</span><span class="">  </span><span class="k">template</span><span class=""> </span><span class="o">&lt;</span><span class="k">class</span><span class=""> </span><span class="nc">B</span><span class="o">&gt;</span><span class="">
</span><span class="">  </span><span class="n">Future</span><span class="o">&lt;</span><span class="n">B</span><span class="o">&gt;</span><span class=""> </span><span class="n">then</span><span class="p">(</span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">function</span><span class="o">&lt;</span><span class="n">Future</span><span class="o">&lt;</span><span class="n">B</span><span class="o">&gt;</span><span class="p">(</span><span class="n">A</span><span class="p">)</span><span class="p">)</span><span class="p">;</span><span class="">
</span><span class="">
</span><span class="">  </span><span class="p">.</span><span class="p">.</span><span class="p">.</span><span class="">
</span><span class="p">&#125;</span><span class="p">;</span><span class="">
</span><span class="">
</span><span class="c1">// &quot;makeFuture&quot; is also &quot;unit&quot;, and we will need it because constructors can&#039;t
</span><span class="c1">// really be converted to std::function (AFAIK)
</span><span class="k">template</span><span class=""> </span><span class="o">&lt;</span><span class="k">class</span><span class=""> </span><span class="nc">A</span><span class="o">&gt;</span><span class="">
</span><span class="n">Future</span><span class="o">&lt;</span><span class="n">A</span><span class="o">&gt;</span><span class=""> </span><span class="n">makeFuture</span><span class="p">(</span><span class="n">A</span><span class="p">)</span><span class="p">;</span><span class="">
</span></pre></div>

<p>Now, the three axioms (Futures don&#039;t define <tt>operator==</tt> but you get the idea):</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="c1">// Left Identity
</span><span class="n">A</span><span class=""> </span><span class="n">a</span><span class="p">;</span><span class="">
</span><span class="n">Future</span><span class="o">&lt;</span><span class="n">A</span><span class="o">&gt;</span><span class="p">(</span><span class="n">a</span><span class="p">)</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="n">f</span><span class="p">)</span><span class=""> </span><span class="o">=</span><span class="o">=</span><span class=""> </span><span class="n">f</span><span class="p">(</span><span class="n">a</span><span class="p">)</span><span class="">
</span><span class="">
</span><span class="c1">// Right Identity
</span><span class="n">Future</span><span class="o">&lt;</span><span class="n">A</span><span class="o">&gt;</span><span class=""> </span><span class="n">m</span><span class="p">;</span><span class="">
</span><span class="n">m</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="n">makeFuture</span><span class="o">&lt;</span><span class="n">A</span><span class="o">&gt;</span><span class="p">)</span><span class=""> </span><span class="o">=</span><span class="o">=</span><span class=""> </span><span class="n">m</span><span class="">
</span><span class="">
</span><span class="c1">// Associativity
</span><span class="n">Future</span><span class="o">&lt;</span><span class="n">A</span><span class="o">&gt;</span><span class=""> </span><span class="n">m</span><span class="p">;</span><span class="">
</span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">function</span><span class="o">&lt;</span><span class="n">Future</span><span class="o">&lt;</span><span class="n">B</span><span class="o">&gt;</span><span class="p">(</span><span class="n">A</span><span class="p">)</span><span class="o">&gt;</span><span class=""> </span><span class="n">f</span><span class="p">;</span><span class="">
</span><span class="n">std</span><span class="o">:</span><span class="o">:</span><span class="n">function</span><span class="o">&lt;</span><span class="n">Future</span><span class="o">&lt;</span><span class="n">C</span><span class="o">&gt;</span><span class="p">(</span><span class="n">B</span><span class="p">)</span><span class="o">&gt;</span><span class=""> </span><span class="n">g</span><span class="p">;</span><span class="">
</span><span class="n">m</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="n">f</span><span class="p">)</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="n">g</span><span class="p">)</span><span class=""> </span><span class="o">=</span><span class="o">=</span><span class=""> </span><span class="n">m</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="p">[</span><span class="p">]</span><span class="p">(</span><span class="n">A</span><span class=""> </span><span class="n">x</span><span class="p">)</span><span class=""> </span><span class="p">&#123;</span><span class=""> </span><span class="k">return</span><span class=""> </span><span class="n">f</span><span class="p">(</span><span class="n">x</span><span class="p">)</span><span class="p">.</span><span class="n">then</span><span class="p">(</span><span class="n">g</span><span class="p">)</span><span class="p">;</span><span class=""> </span><span class="p">&#125;</span><span class="p">)</span><span class="">
</span></pre></div>

<p>So, in plain english this says a monad like Future has a way to get stuff in the monad (unit/makeFuture), and a way to chain things together (bind/then). unit semantics are unsurprising, and chaining is the same as nesting. Something that behaves this way is a monad, and Future is a monad.</p>

<div class="remarkup-note">Remember how Futures do more than just hold values? The nature of the underlying asynchronous operations (usually I/O) generally includes side effects, and this breaks our pure formalism. You may or may not be able to make your async operations (observable) side-effect free, but you can make your intermediate Future callbacks functionally pure (aka value semantics), and if you do you will be happier than if you mutate state. But I won&#039;t beat that dead horse here&#x2014;I know you will probably mutate state anyway because you&#039;re a perf-conscious C++ developer and speed trumps safety. But do try to minimize it.</div>

<p>Ok, so now we know Future is a monad. What can we do with this newfound power? Knowledge is power, right? Well, you can brag to your friends, for one thing. C++ doesn&#039;t really provide any concrete reusable tools for things that are monads. There&#039;s no do-blocks, or some generic monad-aware functional toolkit that includes map, filter, fold, etc. But what you do get is a way of thinking about and reasoning about your Futures that transcends our own little implementation, and doesn&#039;t require that you grok all the opaque internals of the implementation to do it.</p>

<p>But mostly it makes you cool.</p>

<h3 id="kleisli-composition-extr">Kleisli Composition (extra extra credit) <a href="#kleisli-composition-extr" class="headerLink">#</a></h3>

<p>If &quot;associative&quot; doesn&#039;t look associative to you, then you are very astute. Congratulations! You win a maths unicorn.
The three laws refer to a different formulation of the axioms, in terms of the Kleisli Composition operator (<tt>&gt;=&gt;</tt>), which basically says compose two monad-making functions in the obvious way.</p>

<div class="remarkup-code-block" data-code-lang="hs"><pre class="remarkup-code"><span class="p">(</span><span class="o">&gt;=&gt;</span><span class="p">)</span><span class=""> </span><span class="ow">::</span><span class=""> </span><span class="kt">Monad</span><span class=""> </span><span class="n">m</span><span class=""> </span><span class="ow">=&gt;</span><span class=""> </span><span class="p">(</span><span class="n">a</span><span class=""> </span><span class="ow">-&gt;</span><span class=""> </span><span class="n">m</span><span class=""> </span><span class="n">b</span><span class="p">)</span><span class=""> </span><span class="ow">-&gt;</span><span class=""> </span><span class="p">(</span><span class="n">b</span><span class=""> </span><span class="ow">-&gt;</span><span class=""> </span><span class="n">m</span><span class=""> </span><span class="n">c</span><span class="p">)</span><span class=""> </span><span class="ow">-&gt;</span><span class=""> </span><span class="n">a</span><span class=""> </span><span class="ow">-&gt;</span><span class=""> </span><span class="n">m</span><span class=""> </span><span class="n">c</span><span class="">

</span><span class="c1">-- Left Identity</span><span class="">
</span><span class="nf">unit</span><span class=""> </span><span class="o">&gt;=&gt;</span><span class=""> </span><span class="n">g</span><span class=""> </span><span class="err">≡</span><span class=""> </span><span class="n">g</span><span class="">
</span><span class="c1">-- Right Identity</span><span class="">
</span><span class="nf">f</span><span class=""> </span><span class="o">&gt;=&gt;</span><span class=""> </span><span class="n">unit</span><span class=""> </span><span class="err">≡</span><span class=""> </span><span class="n">f</span><span class="">
</span><span class="c1">-- Associativity</span><span class="">
</span><span class="p">(</span><span class="n">f</span><span class=""> </span><span class="o">&gt;=&gt;</span><span class=""> </span><span class="n">g</span><span class="p">)</span><span class=""> </span><span class="o">&gt;=&gt;</span><span class=""> </span><span class="n">h</span><span class=""> </span><span class="err">≡</span><span class=""> </span><span class="n">f</span><span class=""> </span><span class="o">&gt;=&gt;</span><span class=""> </span><span class="p">(</span><span class="n">g</span><span class=""> </span><span class="o">&gt;=&gt;</span><span class=""> </span><span class="n">h</span><span class="p">)</span><span class="">
</span></pre></div>

<p>We accidentally implemented this operator, and called it <tt>chain</tt>. Then we removed it in favor of <tt>Future::thenMulti</tt>. But it totally existed, so use your imagination:</p>

<div class="remarkup-code-block" data-code-lang="cpp"><pre class="remarkup-code"><span class="c1">// Left Identity
</span><span class="n">chain</span><span class="p">(</span><span class="n">makeFuture</span><span class="p">,</span><span class=""> </span><span class="n">g</span><span class="p">)</span><span class=""> </span><span class="err">≡</span><span class=""> </span><span class="n">g</span><span class="">
</span><span class="c1">// Right Identity
</span><span class="n">chain</span><span class="p">(</span><span class="n">f</span><span class="p">,</span><span class=""> </span><span class="n">makeFuture</span><span class="p">)</span><span class=""> </span><span class="err">≡</span><span class=""> </span><span class="n">f</span><span class="">
</span><span class="c1">// Associativity
</span><span class="n">chain</span><span class="p">(</span><span class="n">chain</span><span class="p">(</span><span class="n">f</span><span class="p">,</span><span class=""> </span><span class="n">g</span><span class="p">)</span><span class="p">,</span><span class=""> </span><span class="n">h</span><span class="p">)</span><span class=""> </span><span class="err">≡</span><span class=""> </span><span class="n">chain</span><span class="p">(</span><span class="n">f</span><span class="p">,</span><span class=""> </span><span class="n">chain</span><span class="p">(</span><span class="n">g</span><span class="p">,</span><span class=""> </span><span class="n">h</span><span class="p">)</span><span class="p">)</span><span class=""> </span><span class="c1">// and chain(f, g, h)
</span></pre></div>

<h3 id="further-reading">Further reading <a href="#further-reading" class="headerLink">#</a></h3>

<ul>
<li><a href="https://wiki.haskell.org/Monad_laws" target="_blank">https://wiki.haskell.org/Monad_laws</a></li>
<li><a href="http://learnyouahaskell.com/a-fistful-of-monads" target="_blank">http://learnyouahaskell.com/a-fistful-of-monads</a></li>
</ul></section><section class="dex_document"><h1>FAQ</h1><p class="dex_introduction"></p><h2 id="what-s-this-unit-thing-i">What&#039;s this <tt>Unit</tt> thing? I&#039;m confused. <a href="#what-s-this-unit-thing-i" class="headerLink">#</a></h2>

<p>If your callback returns <tt>void</tt>, it will result in a <tt>Future&lt;Unit&gt;</tt>. <tt>Future&lt;void&gt;</tt> is illegal. All you need to know is, if you would expect a <tt>Future&lt;void&gt;</tt> or <tt>Promise&lt;void&gt;</tt> or <tt>Try&lt;void&gt;</tt>, type <tt>Unit</tt> instead of <tt>void</tt>.</p>

<h2 id="why-not-use-std-future">Why not use <tt>std::future</tt>? <a href="#why-not-use-std-future" class="headerLink">#</a></h2>

<p>No callback support. See also <a href="http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2012/n3428.pdf" target="_blank">http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2012/n3428.pdf</a></p>

<h2 id="why-not-use-boost-future">Why not use boost::future? <a href="#why-not-use-boost-future" class="headerLink">#</a></h2>

<ul>
<li>At the time of writing, 1.53 (the first version with the requisite features) was brand new, not well-tested, and not available to Facebook developers.</li>
<li>It is still a bit buggy/bleeding-edge</li>
<li>They haven&#039;t fleshed out the threading model very well yet, e.g. every single then currently spawns a new thread unless you explicitly ask it to work on this thread only, and executor support was nonexistent (and now, is still experimental).</li>
</ul>

<h2 id="why-use-heap-allocated-s">Why use heap-allocated shared state? Why is Promise not a subclass of Future (like Twitter&#039;s)? <a href="#why-use-heap-allocated-s" class="headerLink">#</a></h2>

<p>C++. It boils down to wanting to return a Future by value for performance (move semantics and compiler optimizations), and programmer sanity, and needing a reference to the shared state by both the user (which holds the Future) and the asynchronous operation (which holds the Promise), and allowing either to go out of scope.</p>

<h2 id="what-about-proper-contin">What about proper continuations (fibers)? Futures suck. <a href="#what-about-proper-contin" class="headerLink">#</a></h2>

<p>People mean two things here, they either mean using continuations (as in CSP) or they mean using generators which require continuations. It&#039;s important to know those are two distinct questions, but in our context the answer is the same because continuations are a prerequisite for generators.</p>

<p>C++ doesn&#039;t directly support continuations very well. But there are some ways to do them in C/C++ that rely on some rather low-level facilities like <tt>setjmp</tt> and <tt>longjmp</tt> (among others). So yes, they are possible (cf. <a href="https://github.com/ccutrer/mordor" target="_blank">Mordor</a> and <a href="https://github.com/facebook/folly/tree/master/folly/experimental/fibers" target="_blank">folly/experimental/fibers</a>).</p>

<p>The tradeoff is memory. Each continuation has a stack, and that stack is usually fixed-size and has to be big enough to support whatever ordinary computation you might want to do on it. So each living continuation requires a relatively large amount of memory. If you know the number of continuations will be small, this might be a good fit. In particular, it might be faster, the code might read cleaner, and debugging stack traces might be much easier.</p>

<p>Futures takes the middle road between callback hell and continuations, one which has been trodden and proved useful in other languages. It doesn&#039;t claim to be the best model for all situations. Use your tools wisely.</p></section></section>
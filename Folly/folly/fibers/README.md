<!-- This file is generated from internal wiki guide by folly/facebook/fibers-update-readme.sh. -->
<section class="dex_guide"><h1 class="dex_title">folly::fibers</h1><section class="dex_document"><h1></h1><p class="dex_introduction">folly::fibers is an async C++ framework, which uses fibers for parallelism.</p><h2 id="overview">Overview <a href="#overview" class="headerLink">#</a></h2>

<p>Fibers (or coroutines) are lightweight application threads. Multiple fibers can be running on top of a single system thread. Unlike system threads, all the context switching between fibers is happening explicitly. Because of this every such context switch is very fast (~200 million of fiber context switches can be made per second on a single CPU core).</p>

<p>folly::fibers implements a task manager (FiberManager), which executes scheduled tasks on fibers. It also provides some fiber-compatible synchronization primitives.</p>

<h2 id="basic-example">Basic example <a href="#basic-example" class="headerLink">#</a></h2>

<div class="remarkup-code-block" data-code-lang="php"><pre class="remarkup-code"><span class="o">...</span>
<span class="nc" data-symbol-name="folly">folly</span><span class="o">::</span><span class="na" data-symbol-context="folly" data-symbol-name="EventBase">EventBase</span> <span class="no">evb</span><span class="o">;</span>
<span class="no">auto</span><span class="o">&amp;</span> <span class="no">fiberManager</span> <span class="o">=</span> <span class="nc" data-symbol-name="folly">folly</span><span class="o">::</span><span class="na" data-symbol-context="folly" data-symbol-name="fibers">fibers</span><span class="o">::</span><span class="na" data-symbol-name="getFiberManager">getFiberManager</span><span class="o">(</span><span class="no">evb</span><span class="o">);</span>
<span class="nc" data-symbol-name="folly">folly</span><span class="o">::</span><span class="na" data-symbol-context="folly" data-symbol-name="fibers">fibers</span><span class="o">::</span><span class="na" data-symbol-name="Baton">Baton</span> <span class="no">baton</span><span class="o">;</span>

<span class="no">fiberManager</span><span class="o">.</span><span class="nf" data-symbol-name="addTask">addTask</span><span class="o">([&amp;]()</span> <span class="o">&#123;</span>
  <span class="nc" data-symbol-name="std">std</span><span class="o">::</span><span class="na" data-symbol-context="std" data-symbol-name="cout">cout</span> <span class="o">&lt;&lt;</span> <span class="s2">&quot;Task 1: start&quot;</span> <span class="o">&lt;&lt;</span> <span class="nc" data-symbol-name="std">std</span><span class="o">::</span><span class="na" data-symbol-context="std" data-symbol-name="endl">endl</span><span class="o">;</span>
  <span class="no">baton</span><span class="o">.</span><span class="nf" data-symbol-name="wait">wait</span><span class="o">();</span>
  <span class="nc" data-symbol-name="std">std</span><span class="o">::</span><span class="na" data-symbol-context="std" data-symbol-name="cout">cout</span> <span class="o">&lt;&lt;</span> <span class="s2">&quot;Task 1: after baton.wait()&quot;</span> <span class="o">&lt;&lt;</span> <span class="nc" data-symbol-name="std">std</span><span class="o">::</span><span class="na" data-symbol-context="std" data-symbol-name="endl">endl</span><span class="o">;</span> 
<span class="o">&#125;);</span>

<span class="no">fiberManager</span><span class="o">.</span><span class="nf" data-symbol-name="addTask">addTask</span><span class="o">([&amp;]()</span> <span class="o">&#123;</span>
  <span class="nc" data-symbol-name="std">std</span><span class="o">::</span><span class="na" data-symbol-context="std" data-symbol-name="cout">cout</span> <span class="o">&lt;&lt;</span> <span class="s2">&quot;Task 2: start&quot;</span> <span class="o">&lt;&lt;</span> <span class="nc" data-symbol-name="std">std</span><span class="o">::</span><span class="na" data-symbol-context="std" data-symbol-name="endl">endl</span><span class="o">;</span>
  <span class="no">baton</span><span class="o">.</span><span class="nf" data-symbol-name="post">post</span><span class="o">();</span>
  <span class="nc" data-symbol-name="std">std</span><span class="o">::</span><span class="na" data-symbol-context="std" data-symbol-name="cout">cout</span> <span class="o">&lt;&lt;</span> <span class="s2">&quot;Task 2: after baton.post()&quot;</span> <span class="o">&lt;&lt;</span> <span class="nc" data-symbol-name="std">std</span><span class="o">::</span><span class="na" data-symbol-context="std" data-symbol-name="endl">endl</span><span class="o">;</span> 
<span class="o">&#125;);</span>

<span class="no">evb</span><span class="o">.</span><span class="nf" data-symbol-name="loop">loop</span><span class="o">();</span>
<span class="o">...</span></pre></div>

<p>This would print:</p>

<div class="remarkup-code-block" data-code-lang="php"><pre class="remarkup-code"><span class="no">Task</span> <span class="mi">1</span><span class="o">:</span> <span class="no">start</span>
<span class="no">Task</span> <span class="mi">2</span><span class="o">:</span> <span class="no">start</span>
<span class="no">Task</span> <span class="mi">2</span><span class="o">:</span> <span class="no">after</span> <span class="no">baton</span><span class="o">.</span><span class="nf" data-symbol-name="post">post</span><span class="o">()</span>
<span class="no">Task</span> <span class="mi">1</span><span class="o">:</span> <span class="no">after</span> <span class="no">baton</span><span class="o">.</span><span class="nf" data-symbol-name="wait">wait</span><span class="o">()</span></pre></div>

<p>It&#039;s very important to note that both tasks in this example were executed on the same system thread. Task 1 was suspended by <tt>baton.wait()</tt> call. Task 2 then started and called <tt>baton.post()</tt>, resuming Task 1.</p>

<h2 id="features">Features <a href="#features" class="headerLink">#</a></h2>

<ul>
<li>Fibers creation and scheduling is performed by FiberManager</li>
<li>Integration with any event-management system (e.g. EventBase)</li>
<li>Low-level synchronization primitives (Baton) as well as higher-level primitives built on top of them (await, collectN, mutexes, ... )</li>
<li>Synchronization primitives have timeout support</li>
<li>Built-in mechanisms for fiber stack-overflow detection</li>
<li>Optional fiber-local data (i.e. equivalent of thread locals)</li>
</ul>

<h2 id="non-features">Non-features <a href="#non-features" class="headerLink">#</a></h2>

<ul>
<li>Individual fibers scheduling can&#039;t be directly controlled by application</li>
<li>FiberManager is not thread-safe (we recommend to keep one FiberManager per thread). Application is responsible for managing its own threads and distributing load between them</li>
<li>We don&#039;t support automatic stack size adjustments. Each fiber has a stack of fixed size.</li>
</ul>

<h2 id="why-would-i-not-want-to">Why would I not want to use fibers ? <a href="#why-would-i-not-want-to" class="headerLink">#</a></h2>

<p>The only real downside to using fibers is the need to keep a pre-allocated stack for every fiber being run. That either makes you application use a lot of memory (if you have many concurrent tasks and each of them uses large stacks) or creates a risk of stack overflow bugs (if you try to reduce the stack size).</p>

<p>We believe these problems can be addressed (and we provide some tooling for that), as fibers library is used in many critical applications at Facebook (mcrouter, TAO, Service Router). However, it&#039;s important to be aware of the risks and be ready to deal with stack issues if you decide to use fibers library in your application.</p>

<h2 id="what-are-the-alternative">What are the alternatives ? <a href="#what-are-the-alternative" class="headerLink">#</a></h2>

<ul>
<li><a href="https://github.com/facebook/folly/blob/master/folly/futures/" target="_blank">Futures</a> library works great for asynchronous high-level application code. Yet code written using fibers library is generally much simpler and much more efficient (you are not paying the penalty of heap allocation).</li>
<li>You can always keep writing your asynchronous code using traditional callback approach. Such code quickly becomes hard to manage and is error-prone. Even though callback approach seems to allow you writing the most efficient code, inefficiency still comes from heap allocations (<tt>std::function</tt>s used for callbacks, context objects to be passed between callbacks etc.)</li>
</ul></section><section class="dex_document"><h1>Quick guide</h1><p class="dex_introduction"></p><p>Let&#039;s take a look at this basic example:</p>

<div class="remarkup-code-block" data-code-lang="php"><pre class="remarkup-code"><span class="o">...</span>
<span class="nc" data-symbol-name="folly">folly</span><span class="o">::</span><span class="na" data-symbol-context="folly" data-symbol-name="EventBase">EventBase</span> <span class="no">evb</span><span class="o">;</span>
<span class="no">auto</span><span class="o">&amp;</span> <span class="no">fiberManager</span> <span class="o">=</span> <span class="nc" data-symbol-name="folly">folly</span><span class="o">::</span><span class="na" data-symbol-context="folly" data-symbol-name="fibers">fibers</span><span class="o">::</span><span class="na" data-symbol-name="getFiberManager">getFiberManager</span><span class="o">(</span><span class="no">evb</span><span class="o">);</span>
<span class="nc" data-symbol-name="folly">folly</span><span class="o">::</span><span class="na" data-symbol-context="folly" data-symbol-name="fibers">fibers</span><span class="o">::</span><span class="na" data-symbol-name="Baton">Baton</span> <span class="no">baton</span><span class="o">;</span>

<span class="no">fiberManager</span><span class="o">.</span><span class="nf" data-symbol-name="addTask">addTask</span><span class="o">([&amp;]()</span> <span class="o">&#123;</span>
  <span class="nc" data-symbol-name="std">std</span><span class="o">::</span><span class="na" data-symbol-context="std" data-symbol-name="cout">cout</span> <span class="o">&lt;&lt;</span> <span class="s2">&quot;Task: start&quot;</span> <span class="o">&lt;&lt;</span> <span class="nc" data-symbol-name="std">std</span><span class="o">::</span><span class="na" data-symbol-context="std" data-symbol-name="endl">endl</span><span class="o">;</span>
  <span class="no">baton</span><span class="o">.</span><span class="nf" data-symbol-name="wait">wait</span><span class="o">();</span>
  <span class="nc" data-symbol-name="std">std</span><span class="o">::</span><span class="na" data-symbol-context="std" data-symbol-name="cout">cout</span> <span class="o">&lt;&lt;</span> <span class="s2">&quot;Task: after baton.wait()&quot;</span> <span class="o">&lt;&lt;</span> <span class="nc" data-symbol-name="std">std</span><span class="o">::</span><span class="na" data-symbol-context="std" data-symbol-name="endl">endl</span><span class="o">;</span> 
<span class="o">&#125;);</span>

<span class="no">evb</span><span class="o">.</span><span class="nf" data-symbol-name="loop">loop</span><span class="o">();</span>

<span class="no">baton</span><span class="o">.</span><span class="nf" data-symbol-name="post">post</span><span class="o">();</span>
<span class="nc" data-symbol-name="std">std</span><span class="o">::</span><span class="na" data-symbol-context="std" data-symbol-name="cout">cout</span> <span class="o">&lt;&lt;</span> <span class="s2">&quot;Baton posted&quot;</span> <span class="o">&lt;&lt;</span> <span class="nc" data-symbol-name="std">std</span><span class="o">::</span><span class="na" data-symbol-context="std" data-symbol-name="endl">endl</span><span class="o">;</span>

<span class="no">evb</span><span class="o">.</span><span class="nf" data-symbol-name="loop">loop</span><span class="o">();</span>

<span class="o">...</span></pre></div>

<p>This would print:</p>

<div class="remarkup-code-block" data-code-lang="php"><pre class="remarkup-code"><span class="no">Task</span><span class="o">:</span> <span class="no">start</span>
<span class="no">Baton</span> <span class="no">posted</span>
<span class="no">Task</span><span class="o">:</span> <span class="no">after</span> <span class="no">baton</span><span class="o">.</span><span class="nf" data-symbol-name="wait">wait</span><span class="o">()</span></pre></div>

<p>What makes fiber-task different from any other task run on e.g. an <tt>folly::EventBase</tt> is the ability to suspend such task, without blocking the system thread. So how do you suspend a fiber-task ?</p>

<h3 id="fibers-baton">fibers::Baton <a href="#fibers-baton" class="headerLink">#</a></h3>

<p><tt>fibers::Baton</tt> is the core synchronization primitive which is used to suspend a fiber-task and notify when the task may be resumed. <tt>fibers::Baton</tt> supports two basic operations: <tt>wait()</tt> and <tt>post()</tt>. Calling <tt>wait()</tt> on a Baton will suspend current fiber-task until <tt>post()</tt> is called on the same Baton.</p>

<p>Please refer to <a href="https://github.com/facebook/folly/blob/master/folly/fibers/Baton.h" target="_blank">Baton</a> for more detailed documentation.</p>

<div class="remarkup-note"><span class="remarkup-note-word">NOTE:</span> <tt>fibers::Baton</tt> is the only native synchronization primitive of folly::fibers library. All other synchronization primitives provided by folly::fibers are built on top of <tt>fibers::Baton</tt>.</div>

<h3 id="integrating-with-other-a">Integrating with other asynchronous APIs (callbacks) <a href="#integrating-with-other-a" class="headerLink">#</a></h3>

<p>Let&#039;s say we have some existing library which provides a classic callback-style asynchronous API.</p>

<div class="remarkup-code-block" data-code-lang="php"><pre class="remarkup-code"><span class="no">void</span> <span class="nf" data-symbol-name="asyncCall">asyncCall</span><span class="o">(</span><span class="no">Request</span> <span class="no">request</span><span class="o">,</span> <span class="nc" data-symbol-name="folly">folly</span><span class="o">::</span><span class="na" data-symbol-context="folly" data-symbol-name="Function">Function</span><span class="o">&lt;</span><span class="nf" data-symbol-name="void">void</span><span class="o">(</span><span class="no">Response</span><span class="o">)&gt;</span> <span class="no">cb</span><span class="o">);</span></pre></div>

<p>If we use folly::fibers we can just make an async call from a fiber-task and wait until callback is run:</p>

<div class="remarkup-code-block" data-code-lang="php"><pre class="remarkup-code"><span class="no">fiberManager</span><span class="o">.</span><span class="nf" data-symbol-name="addTask">addTask</span><span class="o">([]()</span> <span class="o">&#123;</span>
  <span class="o">...</span>
  <span class="no">Response</span> <span class="no">response</span><span class="o">;</span>
  <span class="nc" data-symbol-name="fibers">fibers</span><span class="o">::</span><span class="na" data-symbol-context="fibers" data-symbol-name="Baton">Baton</span> <span class="no">baton</span><span class="o">;</span>
  
  <span class="nf" data-symbol-name="asyncCall">asyncCall</span><span class="o">(</span><span class="no">request</span><span class="o">,</span> <span class="o">[&amp;](</span><span class="no">Response</span> <span class="no">r</span><span class="o">)</span> <span class="no">mutable</span> <span class="o">&#123;</span>
     <span class="no">response</span> <span class="o">=</span> <span class="nc" data-symbol-name="std">std</span><span class="o">::</span><span class="nf" data-symbol-context="std" data-symbol-name="move">move</span><span class="o">(</span><span class="no">r</span><span class="o">);</span>
     <span class="no">baton</span><span class="o">.</span><span class="nf" data-symbol-name="post">post</span><span class="o">();</span>
  <span class="o">&#125;);</span>
  <span class="no">baton</span><span class="o">.</span><span class="nf" data-symbol-name="wait">wait</span><span class="o">();</span>

  <span class="c">// Now response holds response returned by the async call</span>
  <span class="o">...</span>
<span class="o">&#125;</span></pre></div>

<p>Using <tt>fibers::Baton</tt> directly is generally error-prone. To make the task above simpler, folly::fibers provide <tt>fibers::await</tt> function.</p>

<p>With <tt>fibers::await</tt>, the code above transforms into:</p>

<div class="remarkup-code-block" data-code-lang="php"><pre class="remarkup-code"><span class="no">fiberManager</span><span class="o">.</span><span class="nf" data-symbol-name="addTask">addTask</span><span class="o">([]()</span> <span class="o">&#123;</span>
  <span class="o">...</span>
  <span class="no">auto</span> <span class="no">response</span> <span class="o">=</span> <span class="nc" data-symbol-name="fibers">fibers</span><span class="o">::</span><span class="nf" data-symbol-context="fibers" data-symbol-name="await">await</span><span class="o">([&amp;](</span><span class="nc" data-symbol-name="fibers">fibers</span><span class="o">::</span><span class="na" data-symbol-context="fibers" data-symbol-name="Promise">Promise</span><span class="o">&lt;</span><span class="no">Response</span><span class="o">&gt;</span> <span class="no">promise</span><span class="o">)</span> <span class="o">&#123;</span>
    <span class="nf" data-symbol-name="asyncCall">asyncCall</span><span class="o">(</span><span class="no">request</span><span class="o">,</span> <span class="o">[</span><span class="no">promise</span> <span class="o">=</span> <span class="nc" data-symbol-name="std">std</span><span class="o">::</span><span class="nf" data-symbol-context="std" data-symbol-name="move">move</span><span class="o">(</span><span class="no">promise</span><span class="o">)](</span><span class="no">Response</span> <span class="no">r</span><span class="o">)</span> <span class="no">mutable</span> <span class="o">&#123;</span>
      <span class="no">promise</span><span class="o">.</span><span class="nf" data-symbol-name="setValue">setValue</span><span class="o">(</span><span class="nc" data-symbol-name="std">std</span><span class="o">::</span><span class="nf" data-symbol-context="std" data-symbol-name="move">move</span><span class="o">(</span><span class="no">r</span><span class="o">));</span>
    <span class="o">&#125;);</span>
  <span class="o">&#125;);</span>

  <span class="c">// Now response holds response returned by the async call</span>
  <span class="o">...</span>
<span class="o">&#125;</span></pre></div>

<p>Callback passed to <tt>fibers::await</tt> is executed immediately and then fiber-task is suspended until <tt>fibers::Promise</tt> is fulfilled. When <tt>fibers::Promise</tt> is fulfilled with a value or exception, fiber-task will be resumed and &#039;fibers::await&#039; returns that value (or throws an exception, if exception was used to fulfill the <tt>Promise</tt>).</p>

<div class="remarkup-code-block" data-code-lang="php"><pre class="remarkup-code"><span class="no">fiberManager</span><span class="o">.</span><span class="nf" data-symbol-name="addTask">addTask</span><span class="o">([]()</span> <span class="o">&#123;</span>
  <span class="o">...</span>
  <span class="k">try</span> <span class="o">&#123;</span>
    <span class="no">auto</span> <span class="no">response</span> <span class="o">=</span> <span class="nc" data-symbol-name="fibers">fibers</span><span class="o">::</span><span class="nf" data-symbol-context="fibers" data-symbol-name="await">await</span><span class="o">([&amp;](</span><span class="nc" data-symbol-name="fibers">fibers</span><span class="o">::</span><span class="na" data-symbol-context="fibers" data-symbol-name="Promise">Promise</span><span class="o">&lt;</span><span class="no">Response</span><span class="o">&gt;</span> <span class="no">promise</span><span class="o">)</span> <span class="o">&#123;</span>
      <span class="nf" data-symbol-name="asyncCall">asyncCall</span><span class="o">(</span><span class="no">request</span><span class="o">,</span> <span class="o">[</span><span class="no">promise</span> <span class="o">=</span> <span class="nc" data-symbol-name="std">std</span><span class="o">::</span><span class="nf" data-symbol-context="std" data-symbol-name="move">move</span><span class="o">(</span><span class="no">promise</span><span class="o">)](</span><span class="no">Response</span> <span class="no">r</span><span class="o">)</span> <span class="no">mutable</span> <span class="o">&#123;</span>
        <span class="no">promise</span><span class="o">.</span><span class="nf" data-symbol-name="setException">setException</span><span class="o">(</span><span class="nc" data-symbol-name="std">std</span><span class="o">::</span><span class="nf" data-symbol-context="std" data-symbol-name="runtime_error">runtime_error</span><span class="o">(</span><span class="s2">&quot;Await will re-throw me&quot;</span><span class="o">));</span>
      <span class="o">&#125;);</span>
    <span class="o">&#125;);</span>
    <span class="nf" data-symbol-name="assert">assert</span><span class="o">(</span><span class="kc">false</span><span class="o">);</span> <span class="c">// We should never get here</span>
  <span class="o">&#125;</span> <span class="k">catch</span> <span class="o">(</span><span class="nc" data-symbol-name="const">const</span> <span class="nc" data-symbol-name="std">std</span><span class="o">::</span><span class="na" data-symbol-name="exception">exception</span><span class="o">&amp;</span> <span class="no">e</span><span class="o">)</span> <span class="o">&#123;</span>
    <span class="nf" data-symbol-name="assert">assert</span><span class="o">(</span><span class="no">e</span><span class="o">.</span><span class="nf" data-symbol-name="what">what</span><span class="o">()</span> <span class="o">==</span> <span class="s2">&quot;Await will re-throw me&quot;</span><span class="o">);</span>
  <span class="o">&#125;</span>
  <span class="o">...</span>
<span class="o">&#125;</span></pre></div>

<p>If <tt>fibers::Promise</tt> is not fulfilled, <tt>fibers::await</tt> will throw a <tt>std::logic_error</tt>.</p>

<div class="remarkup-code-block" data-code-lang="php"><pre class="remarkup-code"><span class="no">fiberManager</span><span class="o">.</span><span class="nf" data-symbol-name="addTask">addTask</span><span class="o">([]()</span> <span class="o">&#123;</span>
  <span class="o">...</span>
  <span class="k">try</span> <span class="o">&#123;</span>
    <span class="no">auto</span> <span class="no">response</span> <span class="o">=</span> <span class="nc" data-symbol-name="fibers">fibers</span><span class="o">::</span><span class="nf" data-symbol-context="fibers" data-symbol-name="await">await</span><span class="o">([&amp;](</span><span class="nc" data-symbol-name="fibers">fibers</span><span class="o">::</span><span class="na" data-symbol-context="fibers" data-symbol-name="Promise">Promise</span><span class="o">&lt;</span><span class="no">Response</span><span class="o">&gt;</span> <span class="no">promise</span><span class="o">)</span> <span class="o">&#123;</span>
      <span class="c">// We forget about the promise</span>
    <span class="o">&#125;);</span>
    <span class="nf" data-symbol-name="assert">assert</span><span class="o">(</span><span class="kc">false</span><span class="o">);</span> <span class="c">// We should never get here</span>
  <span class="o">&#125;</span> <span class="k">catch</span> <span class="o">(</span><span class="nc" data-symbol-name="const">const</span> <span class="nc" data-symbol-name="std">std</span><span class="o">::</span><span class="na" data-symbol-name="logic_error">logic_error</span><span class="o">&amp;</span> <span class="no">e</span><span class="o">)</span> <span class="o">&#123;</span>
    <span class="o">...</span>
  <span class="o">&#125;</span>
  <span class="o">...</span>
<span class="o">&#125;</span></pre></div>

<p>Please refer to <a href="https://github.com/facebook/folly/blob/master/folly/fibers/Promise.h" target="_blank">await</a> for more detailed documentation.</p>

<div class="remarkup-note"><span class="remarkup-note-word">NOTE:</span> most of your code written with folly::fibers, won&#039;t be using <tt>fibers::Baton</tt> or <tt>fibers::await</tt>. These primitives should only be used to integrate with other asynchronous API which are not fibers-compatible.</div>

<h3 id="integrating-with-other-a-1">Integrating with other asynchronous APIs (folly::Future) <a href="#integrating-with-other-a-1" class="headerLink">#</a></h3>

<p>Let&#039;s say we have some existing library which provides a Future-based asynchronous API.</p>

<div class="remarkup-code-block" data-code-lang="php"><pre class="remarkup-code"><span class="nc" data-symbol-name="folly">folly</span><span class="o">::</span><span class="na" data-symbol-context="folly" data-symbol-name="Future">Future</span><span class="o">&lt;</span><span class="no">Response</span><span class="o">&gt;</span> <span class="nf" data-symbol-name="asyncCallFuture">asyncCallFuture</span><span class="o">(</span><span class="no">Request</span> <span class="no">request</span><span class="o">);</span></pre></div>

<p>The good news are, <tt>folly::Future</tt> is already fibers-compatible. You can simply write:</p>

<div class="remarkup-code-block" data-code-lang="php"><pre class="remarkup-code"><span class="no">fiberManager</span><span class="o">.</span><span class="nf" data-symbol-name="addTask">addTask</span><span class="o">([]()</span> <span class="o">&#123;</span>
  <span class="o">...</span>
  <span class="no">auto</span> <span class="no">response</span> <span class="o">=</span> <span class="nf" data-symbol-name="asyncCallFuture">asyncCallFuture</span><span class="o">(</span><span class="no">request</span><span class="o">).</span><span class="nf" data-symbol-name="get">get</span><span class="o">();</span>
  
  <span class="c">// Now response holds response returned by the async call</span>
  <span class="o">...</span>
<span class="o">&#125;</span></pre></div>

<p>Calling <tt>get()</tt> on a <tt>folly::Future</tt> object will only suspend the calling fiber-task. It won&#039;t block the system thread, letting it process other tasks.</p>

<h2 id="writing-code-with-folly">Writing code with folly::fibers <a href="#writing-code-with-folly" class="headerLink">#</a></h2>

<h3 id="building-fibers-compatib">Building fibers-compatible API <a href="#building-fibers-compatib" class="headerLink">#</a></h3>

<p>Following the explanations above we may wrap an existing asynchronous API in a function:</p>

<div class="remarkup-code-block" data-code-lang="php"><pre class="remarkup-code"><span class="no">Response</span> <span class="nf" data-symbol-name="fiberCall">fiberCall</span><span class="o">(</span><span class="no">Request</span> <span class="no">request</span><span class="o">)</span> <span class="o">&#123;</span>
  <span class="k">return</span> <span class="nc" data-symbol-name="fibers">fibers</span><span class="o">::</span><span class="nf" data-symbol-context="fibers" data-symbol-name="await">await</span><span class="o">([&amp;](</span><span class="nc" data-symbol-name="fibers">fibers</span><span class="o">::</span><span class="na" data-symbol-context="fibers" data-symbol-name="Promise">Promise</span><span class="o">&lt;</span><span class="no">Response</span><span class="o">&gt;</span> <span class="no">promise</span><span class="o">)</span> <span class="o">&#123;</span>
    <span class="nf" data-symbol-name="asyncCall">asyncCall</span><span class="o">(</span><span class="no">request</span><span class="o">,</span> <span class="o">[</span><span class="no">promise</span> <span class="o">=</span> <span class="nc" data-symbol-name="std">std</span><span class="o">::</span><span class="nf" data-symbol-context="std" data-symbol-name="move">move</span><span class="o">(</span><span class="no">promise</span><span class="o">)](</span><span class="no">Response</span> <span class="no">r</span><span class="o">)</span> <span class="no">mutable</span> <span class="o">&#123;</span>
      <span class="no">promise</span><span class="o">.</span><span class="nf" data-symbol-name="setValue">setValue</span><span class="o">(</span><span class="nc" data-symbol-name="std">std</span><span class="o">::</span><span class="nf" data-symbol-context="std" data-symbol-name="move">move</span><span class="o">(</span><span class="no">r</span><span class="o">));</span>
    <span class="o">&#125;);</span>
  <span class="o">&#125;);</span>
<span class="o">&#125;</span></pre></div>

<p>We can then call it from a fiber-task:</p>

<div class="remarkup-code-block" data-code-lang="php"><pre class="remarkup-code"><span class="no">fiberManager</span><span class="o">.</span><span class="nf" data-symbol-name="addTask">addTask</span><span class="o">([]()</span> <span class="o">&#123;</span>
  <span class="o">...</span>
  <span class="no">auto</span> <span class="no">response</span> <span class="o">=</span> <span class="nf" data-symbol-name="fiberCall">fiberCall</span><span class="o">(</span><span class="no">request</span><span class="o">);</span>
  <span class="o">...</span>
<span class="o">&#125;);</span></pre></div>

<p>But what happens if we just call <tt>fiberCall</tt> not from within a fiber-task, but directly from a system thread ? Here another important feature of <tt>fibers::Baton</tt> (and thus all other folly::fibers synchronization primitives built on top of it) comes into play. Calling <tt>wait()</tt> on a <tt>fibers::Baton</tt> within a system thread context just blocks the thread until <tt>post()</tt> is called on the same <tt>folly::Baton</tt>.</p>

<p>What this means is that you no longer need to write separate code for synchronous and asynchronous APIs. If you use only folly::fibers synchronization primitives for all blocking calls inside of your synchronous function, it automatically becomes asynchronous when run inside a fiber-task.</p>

<h3 id="passing-by-reference">Passing by reference <a href="#passing-by-reference" class="headerLink">#</a></h3>

<p>Classic asynchronous APIs (same applies to folly::Future-based APIs) generally rely on copying/moving-in input arguments and often require you to copy/move in some context variables into the callback. E.g.:</p>

<div class="remarkup-code-block" data-code-lang="php"><pre class="remarkup-code"><span class="o">...</span>
<span class="no">Context</span> <span class="no">context</span><span class="o">;</span>
 
<span class="nf" data-symbol-name="asyncCall">asyncCall</span><span class="o">(</span><span class="no">request</span><span class="o">,</span> <span class="o">[</span><span class="no">request</span><span class="o">,</span> <span class="no">context</span><span class="o">](</span><span class="no">Response</span> <span class="no">response</span><span class="o">)</span> <span class="no">mutable</span> <span class="o">&#123;</span>
  <span class="nf" data-symbol-name="doSomething">doSomething</span><span class="o">(</span><span class="no">request</span><span class="o">,</span> <span class="no">response</span><span class="o">,</span> <span class="no">context</span><span class="o">);</span>
<span class="o">&#125;);</span>
<span class="o">...</span></pre></div>

<p>Fibers-compatible APIs look more like synchronous APIs, so you can actually pass input arguments by reference and you don&#039;t have to think about passing context at all. E.g.</p>

<div class="remarkup-code-block" data-code-lang="php"><pre class="remarkup-code"><span class="no">fiberManager</span><span class="o">.</span><span class="nf" data-symbol-name="addTask">addTask</span><span class="o">([]()</span> <span class="o">&#123;</span>
  <span class="o">...</span>
  <span class="no">Context</span> <span class="no">context</span><span class="o">;</span>

  <span class="no">auto</span> <span class="no">response</span> <span class="o">=</span> <span class="nf" data-symbol-name="fiberCall">fiberCall</span><span class="o">(</span><span class="no">request</span><span class="o">);</span>
 
  <span class="nf" data-symbol-name="doSomething">doSomething</span><span class="o">(</span><span class="no">request</span><span class="o">,</span> <span class="no">response</span><span class="o">,</span> <span class="no">context</span><span class="o">);</span>
  <span class="o">...</span>
<span class="o">&#125;);</span></pre></div>

<p>Same logic applies to <tt>fibers::await</tt>. Since <tt>fibers::await</tt> call blocks until promise is fulfilled, it&#039;s safe to pass everything by reference.</p>

<h3 id="limited-stack-space">Limited stack space <a href="#limited-stack-space" class="headerLink">#</a></h3>

<p>So should you just run all the code inside a fiber-task ? No exactly.</p>

<p>Similarly to system threads, every fiber-task has some stack space assigned to it. Stack usage goes up with the number of nested function calls and objects allocated on the stack. folly::fibers implementation only supports fiber-tasks with fixed stack size. If you want to have many fiber-tasks running concurrently - you need to reduce the amount of stack assigned to each fiber-task, otherwise you may run out of memory.</p>

<div class="remarkup-important"><span class="remarkup-note-word">IMPORTANT:</span> If a fiber-task runs out of stack space (e.g. calls a function which does a lot of stack allocations) you program will fail.</div>

<p>However if you know that some function never suspends a fiber-task, you can use <tt>fibers::runInMainContext</tt> to safely call it from a fiber-task, without any risk of running out of stack space of the fiber-task.</p>

<div class="remarkup-code-block" data-code-lang="php"><pre class="remarkup-code"><span class="no">Result</span> <span class="nf" data-symbol-name="useALotOfStack">useALotOfStack</span><span class="o">()</span> <span class="o">&#123;</span>
  <span class="no">char</span> <span class="no">buffer</span><span class="o">[</span><span class="mi">1024</span><span class="o">*</span><span class="mi">1024</span><span class="o">];</span>
  <span class="o">...</span>
<span class="o">&#125;</span>

<span class="o">...</span>
<span class="no">fiberManager</span><span class="o">.</span><span class="nf" data-symbol-name="addTask">addTask</span><span class="o">([]()</span> <span class="o">&#123;</span>
  <span class="o">...</span>
  <span class="no">auto</span> <span class="no">result</span> <span class="o">=</span> <span class="nc" data-symbol-name="fibers">fibers</span><span class="o">::</span><span class="nf" data-symbol-context="fibers" data-symbol-name="runInMainContext">runInMainContext</span><span class="o">([&amp;]()</span> <span class="o">&#123;</span>
    <span class="k">return</span> <span class="nf" data-symbol-name="useALotOfStack">useALotOfStack</span><span class="o">();</span>
  <span class="o">&#125;);</span>
  <span class="o">...</span>
<span class="o">&#125;);</span>
<span class="o">...</span></pre></div>

<p><tt>fibers::runInMainContext</tt> will switch to the stack of the system thread (main context), run the functor passed to it and then switch back to the fiber-task stack.</p>

<div class="remarkup-important"><span class="remarkup-note-word">IMPORTANT:</span> Make sure you don&#039;t do any blocking calls on main context though. It will suspend the whole system thread, not just the fiber-task which was running.</div>

<p>Remember that it&#039;s fine to use <tt>fibers::runInMainContext</tt> in general purpose functions (those which may be called both from fiber-task and non from fiber-task). When called in non-fiber-task context <tt>fibers::runInMainContext</tt> would simply execute passed functor right away.</p>

<div class="remarkup-note"><span class="remarkup-note-word">NOTE:</span> Besides <tt>fibers::runInMainContext</tt> some other functions in folly::fibers are also executing some of the passed functors on the main context. E.g. functor passes to <tt>fibers::await</tt> is executed on main context, finally-functor passed to <tt>FiberManager::addTaskFinally</tt> is also executed on main context etc. Relying on this can help you avoid extra <tt>fibers::runInMainContext</tt> calls (and avoid extra context switches).</div>

<h3 id="using-locks">Using locks <a href="#using-locks" class="headerLink">#</a></h3>

<p>Consider the following example:</p>

<div class="remarkup-code-block" data-code-lang="php"><pre class="remarkup-code"><span class="o">...</span>
<span class="nc" data-symbol-name="folly">folly</span><span class="o">::</span><span class="na" data-symbol-context="folly" data-symbol-name="EventBase">EventBase</span> <span class="no">evb</span><span class="o">;</span>
<span class="no">auto</span><span class="o">&amp;</span> <span class="no">fiberManager</span> <span class="o">=</span> <span class="nc" data-symbol-name="folly">folly</span><span class="o">::</span><span class="na" data-symbol-context="folly" data-symbol-name="fibers">fibers</span><span class="o">::</span><span class="na" data-symbol-name="getFiberManager">getFiberManager</span><span class="o">(</span><span class="no">evb</span><span class="o">);</span>
<span class="nc" data-symbol-name="std">std</span><span class="o">::</span><span class="na" data-symbol-context="std" data-symbol-name="mutex">mutex</span> <span class="no">lock</span><span class="o">;</span>
<span class="nc" data-symbol-name="folly">folly</span><span class="o">::</span><span class="na" data-symbol-context="folly" data-symbol-name="fibers">fibers</span><span class="o">::</span><span class="na" data-symbol-name="Baton">Baton</span> <span class="no">baton</span><span class="o">;</span>

<span class="no">fiberManager</span><span class="o">.</span><span class="nf" data-symbol-name="addTask">addTask</span><span class="o">([&amp;]()</span> <span class="o">&#123;</span>
  <span class="nc" data-symbol-name="std">std</span><span class="o">::</span><span class="na" data-symbol-context="std" data-symbol-name="lock_guard">lock_guard</span><span class="o">&lt;</span><span class="nc" data-symbol-name="std">std</span><span class="o">::</span><span class="na" data-symbol-context="std" data-symbol-name="mutex">mutex</span><span class="o">&gt;</span> <span class="nf" data-symbol-name="lg">lg</span><span class="o">(</span><span class="no">lock</span><span class="o">);</span>
  <span class="no">baton</span><span class="o">.</span><span class="nf" data-symbol-name="wait">wait</span><span class="o">();</span>
<span class="o">&#125;);</span>

<span class="no">fiberManager</span><span class="o">.</span><span class="nf" data-symbol-name="addTask">addTask</span><span class="o">([&amp;]()</span> <span class="o">&#123;</span>
  <span class="nc" data-symbol-name="std">std</span><span class="o">::</span><span class="na" data-symbol-context="std" data-symbol-name="lock_guard">lock_guard</span><span class="o">&lt;</span><span class="nc" data-symbol-name="std">std</span><span class="o">::</span><span class="na" data-symbol-context="std" data-symbol-name="mutex">mutex</span><span class="o">&gt;</span> <span class="nf" data-symbol-name="lg">lg</span><span class="o">(</span><span class="no">lock</span><span class="o">);</span>
<span class="o">&#125;);</span>

<span class="no">evb</span><span class="o">.</span><span class="nf" data-symbol-name="loop">loop</span><span class="o">();</span>
<span class="c">// We won&#039;t get here :(</span>
<span class="no">baton</span><span class="o">.</span><span class="nf" data-symbol-name="post">post</span><span class="o">();</span>
<span class="o">...</span></pre></div>

<p>First fiber-task will grab a lock and then suspend waiting on a <tt>fibers::Baton</tt>. Then second fiber-task will be run and it will try to grab a lock. Unlike system threads, fiber-task can be only suspended explicitly, so the whole system thread will be blocked waiting on the lock, and we end up with a dead-lock.</p>

<p>There&#039;re generally two ways we can solve this problem. Ideally we would re-design the program to never not hold any locks when fiber-task is suspended. However if we are absolutely sure we need that lock - folly::fibers library provides some fiber-task-aware lock implementations (e.g. 
<a href="https://github.com/facebook/folly/blob/master/folly/fibers/TimedMutex.h" target="_blank">TimedMutex</a>).</p></section><section class="dex_document"><h1>APIs</h1><p class="dex_introduction"></p><h2 id="fibers-baton">fibers::Baton <a href="#fibers-baton" class="headerLink">#</a></h2>

<p>All of the features of folly::fibers library are actually built on top a single synchronization primitive called Baton. <tt>fibers::Baton</tt> is a fiber-specific version of <tt>folly::Baton</tt>. It only  supports two basic operations: <tt>wait()</tt> and <tt>post()</tt>. Whenever <tt>wait()</tt> is called on the Baton, the current thread or fiber-task is suspended, until <tt>post()</tt> is called on the same Baton. <tt>wait()</tt> does not suspend the thread or fiber-task if <tt>post()</tt> was already called on the Baton. Please refer to <a href="https://github.com/facebook/folly/blob/master/folly/fibers/Baton.h" target="_blank">Baton</a> for more detailed documentation.</p>

<p>Baton is thread-safe, so <tt>wait()</tt> and <tt>post()</tt> can be (and should be :) ) called from different threads or fiber-tasks.</p>

<div class="remarkup-note"><span class="remarkup-note-word">NOTE:</span> Because Baton transparently works both on threads and fiber-tasks, any synchronization primitive built using it would have the same property. This means that any library with a synchronous API, which uses only <tt>fibers::Baton</tt> for synchronization, becomes asynchronous when used in fiber context.</div>

<h3 id="timed-wait">timed_wait() <a href="#timed-wait" class="headerLink">#</a></h3>

<p><tt>fibers::Baton</tt> also supports wait with timeout.</p>

<div class="remarkup-code-block" data-code-lang="php"><pre class="remarkup-code"><span class="no">fiberManager</span><span class="o">.</span><span class="nf" data-symbol-name="addTask">addTask</span><span class="o">([=]()</span> <span class="o">&#123;</span>
  <span class="no">auto</span> <span class="no">baton</span> <span class="o">=</span> <span class="nc" data-symbol-name="std">std</span><span class="o">::</span><span class="na" data-symbol-context="std" data-symbol-name="make_shared">make_shared</span><span class="o">&lt;</span><span class="nc" data-symbol-name="folly">folly</span><span class="o">::</span><span class="na" data-symbol-context="folly" data-symbol-name="fibers">fibers</span><span class="o">::</span><span class="na" data-symbol-name="Baton">Baton</span><span class="o">&gt;();</span>
  <span class="no">auto</span> <span class="no">result</span> <span class="o">=</span> <span class="nc" data-symbol-name="std">std</span><span class="o">::</span><span class="na" data-symbol-context="std" data-symbol-name="make_shared">make_shared</span><span class="o">&lt;</span><span class="no">Result</span><span class="o">&gt;();</span>

  <span class="no">fiberManager</span><span class="o">.</span><span class="nf" data-symbol-name="addTask">addTask</span><span class="o">([=]()</span> <span class="o">&#123;</span>
    <span class="o">*</span><span class="no">result</span> <span class="o">=</span> <span class="nf" data-symbol-name="sendRequest">sendRequest</span><span class="o">(...);</span>
    <span class="no">baton</span><span class="o">-&gt;</span><span class="na" data-symbol-name="post">post</span><span class="o">();</span>
  <span class="o">&#125;);</span>

  <span class="no">bool</span> <span class="no">success</span> <span class="o">=</span> <span class="no">baton</span><span class="o">.</span><span class="nf" data-symbol-name="timed_wait">timed_wait</span><span class="o">(</span><span class="nc" data-symbol-name="std">std</span><span class="o">::</span><span class="na" data-symbol-context="std" data-symbol-name="chrono">chrono</span><span class="o">::</span><span class="na" data-symbol-name="milliseconds">milliseconds</span><span class="o">&#123;</span><span class="mi">10</span><span class="o">&#125;);</span>
  <span class="k">if</span> <span class="o">(</span><span class="no">success</span><span class="o">)</span> <span class="o">&#123;</span>
    <span class="c">// request successful</span>
    <span class="o">...</span>
  <span class="o">&#125;</span> <span class="k">else</span> <span class="o">&#123;</span>
    <span class="c">// handle timeout</span>
    <span class="o">...</span>
  <span class="o">&#125;</span>
<span class="o">&#125;);</span></pre></div>

<div class="remarkup-important"><span class="remarkup-note-word">IMPORTANT:</span> unlike <tt>wait()</tt> when using <tt>timed_wait()</tt> API it&#039;s generally not safe to pass <tt>fibers::Baton</tt> by reference. You have to make sure that task, which fulfills the Baton is either cancelled in case of timeout, or have shared ownership for the Baton.</div>

<h2 id="task-creation">Task creation <a href="#task-creation" class="headerLink">#</a></h2>

<h3 id="addtask-addtaskremote">addTask() / addTaskRemote() <a href="#addtask-addtaskremote" class="headerLink">#</a></h3>

<p>As you could see from previous examples, the easiest way to create a new fiber-task is to call <tt>addTask()</tt>:</p>

<div class="remarkup-code-block" data-code-lang="php"><pre class="remarkup-code"><span class="no">fiberManager</span><span class="o">.</span><span class="nf" data-symbol-name="addTask">addTask</span><span class="o">([]()</span> <span class="o">&#123;</span>
  <span class="o">...</span>
<span class="o">&#125;);</span></pre></div>

<p>It is important to remember that <tt>addTask()</tt> is not thread-safe. I.e. it can only be safely called from the the thread, which is running the <tt>folly::FiberManager</tt> loop.</p>

<p>If you need to create a fiber-task from a different thread, you have to use <tt>addTaskRemote()</tt>:</p>

<div class="remarkup-code-block" data-code-lang="php"><pre class="remarkup-code"><span class="nc" data-symbol-name="folly">folly</span><span class="o">::</span><span class="na" data-symbol-context="folly" data-symbol-name="EventBase">EventBase</span> <span class="no">evb</span><span class="o">;</span>
<span class="no">auto</span><span class="o">&amp;</span> <span class="no">fiberManager</span> <span class="o">=</span> <span class="nc" data-symbol-name="folly">folly</span><span class="o">::</span><span class="na" data-symbol-context="folly" data-symbol-name="fibers">fibers</span><span class="o">::</span><span class="na" data-symbol-name="getFiberManager">getFiberManager</span><span class="o">(</span><span class="no">evb</span><span class="o">);</span>

<span class="nc" data-symbol-name="std">std</span><span class="o">::</span><span class="na" data-symbol-context="std" data-symbol-name="thread">thread</span> <span class="nf" data-symbol-name="t">t</span><span class="o">([&amp;]()</span> <span class="o">&#123;</span>
  <span class="no">fiberManager</span><span class="o">.</span><span class="nf" data-symbol-name="addTaskRemote">addTaskRemote</span><span class="o">([]()</span> <span class="o">&#123;</span>
    <span class="o">...</span>
  <span class="o">&#125;);</span>
<span class="o">&#125;);</span>

<span class="no">evb</span><span class="o">.</span><span class="nf" data-symbol-name="loopForever">loopForever</span><span class="o">();</span></pre></div>

<h3 id="addtaskfinally">addTaskFinally() <a href="#addtaskfinally" class="headerLink">#</a></h3>

<p><tt>addTaskFinally()</tt> is useful when you need to run some code on the main context in the end of a fiber-task.</p>

<div class="remarkup-code-block" data-code-lang="php"><pre class="remarkup-code"><span class="no">fiberManager</span><span class="o">.</span><span class="nf" data-symbol-name="addTaskFinally">addTaskFinally</span><span class="o">(</span>
  <span class="o">[=]()</span> <span class="o">&#123;</span>
    <span class="o">...</span>
    <span class="k">return</span> <span class="no">result</span><span class="o">;</span>
  <span class="o">&#125;,</span>
  <span class="o">[=](</span><span class="no">Result</span><span class="o">&amp;&amp;</span> <span class="no">result</span><span class="o">)</span> <span class="o">&#123;</span>
    <span class="nf" data-symbol-name="callUserCallbacks">callUserCallbacks</span><span class="o">(</span><span class="nc" data-symbol-name="std">std</span><span class="o">::</span><span class="nf" data-symbol-context="std" data-symbol-name="move">move</span><span class="o">(</span><span class="no">result</span><span class="o">),</span> <span class="o">...)</span>
  <span class="o">&#125;</span>
<span class="o">);</span></pre></div>

<p>Of course you could achieve the same by calling <tt>fibers::runInMainContext()</tt>, but <tt>addTaskFinally()</tt> reduces the number of fiber context switches:</p>

<div class="remarkup-code-block" data-code-lang="php"><pre class="remarkup-code"><span class="no">fiberManager</span><span class="o">.</span><span class="nf" data-symbol-name="addTask">addTask</span><span class="o">([=]()</span> <span class="o">&#123;</span>
  <span class="o">...</span>
  <span class="nc" data-symbol-name="folly">folly</span><span class="o">::</span><span class="na" data-symbol-context="folly" data-symbol-name="fibers">fibers</span><span class="o">::</span><span class="na" data-symbol-name="runInMainContext">runInMainContext</span><span class="o">([&amp;]()</span> <span class="o">&#123;</span>
    <span class="c">// Switched to main context</span>
    <span class="nf" data-symbol-name="callUserCallbacks">callUserCallbacks</span><span class="o">(</span><span class="nc" data-symbol-name="std">std</span><span class="o">::</span><span class="nf" data-symbol-context="std" data-symbol-name="move">move</span><span class="o">(</span><span class="no">result</span><span class="o">),</span> <span class="o">...)</span>
  <span class="o">&#125;</span>
  <span class="c">// Switched back to fiber context</span>

  <span class="c">// On fiber context we realize there&#039;s no more work to be done.</span>
  <span class="c">// Fiber-task is complete, switching back to main context.</span>
<span class="o">&#125;);</span></pre></div>

<p></p>

<h3 id="addtaskfuture-addtaskrem">addTaskFuture() / addTaskRemoteFuture() <a href="#addtaskfuture-addtaskrem" class="headerLink">#</a></h3>

<p><tt>addTask()</tt> and <tt>addTaskRemote()</tt> are creating detached fiber-tasks. If you need to know when fiber-task is complete and/or have some return value for it -  <tt>addTaskFuture()</tt> / <tt>addTaskRemoteFuture()</tt> can be used.</p>

<div class="remarkup-code-block" data-code-lang="php"><pre class="remarkup-code"><span class="nc" data-symbol-name="folly">folly</span><span class="o">::</span><span class="na" data-symbol-context="folly" data-symbol-name="EventBase">EventBase</span> <span class="no">evb</span><span class="o">;</span>
<span class="no">auto</span><span class="o">&amp;</span> <span class="no">fiberManager</span> <span class="o">=</span> <span class="nc" data-symbol-name="folly">folly</span><span class="o">::</span><span class="na" data-symbol-context="folly" data-symbol-name="fibers">fibers</span><span class="o">::</span><span class="na" data-symbol-name="getFiberManager">getFiberManager</span><span class="o">(</span><span class="no">evb</span><span class="o">);</span>

<span class="nc" data-symbol-name="std">std</span><span class="o">::</span><span class="na" data-symbol-context="std" data-symbol-name="thread">thread</span> <span class="nf" data-symbol-name="t">t</span><span class="o">([&amp;]()</span> <span class="o">&#123;</span>
  <span class="no">auto</span> <span class="no">future1</span> <span class="o">=</span> <span class="no">fiberManager</span><span class="o">.</span><span class="nf" data-symbol-name="addTaskRemoteFuture">addTaskRemoteFuture</span><span class="o">([]()</span> <span class="o">&#123;</span>
    <span class="o">...</span>
  <span class="o">&#125;);</span>
  <span class="no">auto</span> <span class="no">future2</span> <span class="o">=</span> <span class="no">fiberManager</span><span class="o">.</span><span class="nf" data-symbol-name="addTaskRemoteFuture">addTaskRemoteFuture</span><span class="o">([]()</span> <span class="o">&#123;</span>
    <span class="o">...</span>
  <span class="o">&#125;);</span> 

  <span class="no">auto</span> <span class="no">result1</span> <span class="o">=</span> <span class="no">future1</span><span class="o">.</span><span class="nf" data-symbol-name="get">get</span><span class="o">();</span>
  <span class="no">auto</span> <span class="no">result2</span> <span class="o">=</span> <span class="no">future2</span><span class="o">.</span><span class="nf" data-symbol-name="get">get</span><span class="o">();</span>
  <span class="o">...</span>
<span class="o">&#125;);</span>

<span class="no">evb</span><span class="o">.</span><span class="nf" data-symbol-name="loopForever">loopForever</span><span class="o">();</span></pre></div>

<h2 id="other-synchronization-pr">Other synchronization primitives <a href="#other-synchronization-pr" class="headerLink">#</a></h2>

<p>All the listed synchronization primitives are built using <tt>fiber::Baton</tt>. Please check their source code for detailed documentation.</p>

<p><a href="https://github.com/facebook/folly/blob/master/folly/fibers/Promise.h" target="_blank">await</a></p>

<p><a href="https://github.com/facebook/folly/blob/master/folly/fibers/WhenN.h" target="_blank">collectN</a></p>

<p><a href="https://github.com/facebook/folly/blob/master/folly/fibers/WhenN.h" target="_blank">collectAll</a></p>

<p><a href="https://github.com/facebook/folly/blob/master/folly/fibers/WhenN.h" target="_blank">collectAny</a></p>

<p><a href="https://github.com/facebook/folly/blob/master/folly/fibers/ForEach.h" target="_blank">forEach</a></p>

<p><a href="https://github.com/facebook/folly/blob/master/folly/fibers/AddTasks.h" target="_blank">addTasks</a></p>

<p><a href="https://github.com/facebook/folly/blob/master/folly/fibers/TimedMutex.h" target="_blank">TimedMutex</a></p>

<p><a href="https://github.com/facebook/folly/blob/master/folly/fibers/TimedMutex.h" target="_blank">TimedRWMutex</a></p></section><section class="dex_document"><h1>Fiber stacks</h1><p class="dex_introduction"></p><p>Similarly to system threads, every fiber-task has some stack space assigned to it. Stack usage goes up with the number of nested function calls and objects allocated on the stack. folly::fibers implementation only supports fiber-tasks with fixed stack size. If you want to have many fiber-tasks running concurrently - you need to reduce the amount of stack assigned to each fiber-task, otherwise you may run out of memory.</p>

<h3 id="selecting-stack-size">Selecting stack size <a href="#selecting-stack-size" class="headerLink">#</a></h3>

<p>Stack size used for every fiber-task is part of FiberManager configuration. But how do you pick the right stack size ?</p>

<p>First of all you need to figure out the maximum number of concurrent fiber-tasks your application may have. E.g. if you are writing a Thrift-service you will probably have a single fiber-task for every request in-fly (but remember that e.g. <tt>fibers::collectAll</tt> and some other synchronization primitives may create extra fiber-tasks). It&#039;s very important to get that number first, because if you will at most need 100 concurrent fiber-tasks, even 1MB stacks will result in at most 100MB used for fiber stacks. On the other hand if you need to have 100,000 concurrent fiber-tasks, even 16KB stacks will result in 1.6GB peak memory usage just for fiber stacks.</p>

<p>folly::fibers also supports recording stack usage (it can be enabled via <tt>recordStackEvery</tt> option of <tt>FiberManager</tt>). When enabled, the stack of each fiber-task will be filled with magic values. Later linear search can be performed to find the boundary of unused stack space.</p>

<h3 id="stack-overflow-detection">Stack overflow detection <a href="#stack-overflow-detection" class="headerLink">#</a></h3>

<p>By default every fiber-task stack is allocated with a special guard page next to it (this can be controlled via <tt>useGuardPages</tt> option of <tt>FiberManager</tt>). If a stack overflow happens - this guard page will be accessed, which will result in immediate segmentation fault.</p>

<div class="remarkup-important"><span class="remarkup-note-word">IMPORTANT:</span> disabling guard page protection may result in unnoticed stack overflows. Those will inevitably cause memory corruptions, which are usually very hard to debug.</div></section><section class="dex_document"><h1>Event Loops</h1><p class="dex_introduction"></p><p>folly::fibers library doesn&#039;t implement it&#039;s own event system. Instead it allows <tt>fibers::FiberManager</tt> to work with any other event system by implementing <tt>fibers::LoopController</tt> interface.</p>

<h2 id="folly-eventbase-integrat">folly::EventBase integration <a href="#folly-eventbase-integrat" class="headerLink">#</a></h2>

<p>The easiest way to create a <tt>fibers::FiberManager</tt> attached to a <tt>folly::EventBase</tt> is by using <tt>fibers::getFiberManager</tt> function:</p>

<div class="remarkup-code-block" data-code-lang="php"><pre class="remarkup-code"><span class="nc" data-symbol-name="folly">folly</span><span class="o">::</span><span class="na" data-symbol-context="folly" data-symbol-name="EventBase">EventBase</span> <span class="no">evb</span><span class="o">;</span>
<span class="no">auto</span><span class="o">&amp;</span> <span class="no">fiberManager</span> <span class="o">=</span> <span class="nc" data-symbol-name="folly">folly</span><span class="o">::</span><span class="na" data-symbol-context="folly" data-symbol-name="fibers">fibers</span><span class="o">::</span><span class="na" data-symbol-name="getFiberManager">getFiberManager</span><span class="o">(</span><span class="no">evb</span><span class="o">);</span>

<span class="no">fiberManager</span><span class="o">.</span><span class="nf" data-symbol-name="addTask">addTask</span><span class="o">([]()</span> <span class="o">&#123;</span>
  <span class="o">...</span>
<span class="o">&#125;);</span>

<span class="no">evb</span><span class="o">.</span><span class="nf" data-symbol-name="loop">loop</span><span class="o">();</span></pre></div>

<p>Such <tt>fibers::FiberManager</tt> will be automatically destroyed, when <tt>folly::EventBase</tt> is destroyed.</p>

<div class="remarkup-note"><span class="remarkup-note-word">NOTE:</span> folly::fibers doesn&#039;t support killing fiber-tasks in-flight (for similar reasons you can&#039;t kill a thread). If <tt>fibers::FiberManager</tt> has any outstanding fiber-tasks, when <tt>folly::EventBase</tt> is being destroyed, it will keep running the event loop until all those tasks are finished.</div></section><section class="dex_document"><h1>GDB integration</h1><p class="dex_introduction"></p><p>folly::fibers provides some GDB extensions which can be very useful for debugging. To load them simply run the following in GDB console:</p>

<div class="remarkup-code-block" data-code-lang="php"><pre class="remarkup-code"><span class="no">fbload</span> <span class="no">folly_fibers</span></pre></div>

<h3 id="find-all-fibermanagers">Find all FiberManagers <a href="#find-all-fibermanagers" class="headerLink">#</a></h3>

<p>You can use <tt>$get_fiber_manager_map_evb()</tt> and <tt>$get_fiber_manager_map_vevb()</tt> to get <tt>folly::EventBase</tt> =&gt; <tt>fibers::FiberManager</tt> and <tt>folly::VirtualEventBase</tt> =&gt; <tt>fibers::FiberManager</tt> mappings respectively:</p>

<div class="remarkup-code-block" data-code-lang="php"><pre class="remarkup-code"><span class="o">(</span><span class="no">gdb</span><span class="o">)</span> <span class="no">fbload</span> <span class="nf" data-symbol-name="stl">stl</span>
<span class="o">(</span><span class="no">gdb</span><span class="o">)</span> <span class="no">p</span> <span class="nv">$get_fiber_manager_map_evb</span><span class="o">()</span>
$<span class="mi">2</span> <span class="o">=</span> <span class="nc" data-symbol-name="std">std</span><span class="o">::</span><span class="na" data-symbol-context="std" data-symbol-name="unordered_map">unordered_map</span> <span class="no">with</span> <span class="mi">2</span> <span class="no">elements</span> <span class="o">=</span> <span class="o">&#123;</span>
  <span class="o">[</span><span class="mh">0x7fffffffda80</span><span class="o">]</span> <span class="o">=</span> <span class="nc" data-symbol-name="std">std</span><span class="o">::</span><span class="na" data-symbol-context="std" data-symbol-name="unique_ptr">unique_ptr</span><span class="o">&lt;</span><span class="nc" data-symbol-name="folly">folly</span><span class="o">::</span><span class="na" data-symbol-context="folly" data-symbol-name="fibers">fibers</span><span class="o">::</span><span class="na" data-symbol-name="FiberManager">FiberManager</span><span class="o">&gt;</span> <span class="no">containing</span> <span class="mh">0x7ffff5c22a00</span><span class="o">,</span>
  <span class="o">[</span><span class="mh">0x7fffffffd850</span><span class="o">]</span> <span class="o">=</span> <span class="nc" data-symbol-name="std">std</span><span class="o">::</span><span class="na" data-symbol-context="std" data-symbol-name="unique_ptr">unique_ptr</span><span class="o">&lt;</span><span class="nc" data-symbol-name="folly">folly</span><span class="o">::</span><span class="na" data-symbol-context="folly" data-symbol-name="fibers">fibers</span><span class="o">::</span><span class="na" data-symbol-name="FiberManager">FiberManager</span><span class="o">&gt;</span> <span class="no">containing</span> <span class="mh">0x7ffff5c22800</span>
<span class="o">&#125;</span></pre></div>

<p>This will only list <tt>fibers::FiberManager</tt>s created using <tt>fibers::getFiberManager()</tt> function.</p>

<h3 id="printing-a-fibermanager">Printing a FiberManager <a href="#printing-a-fibermanager" class="headerLink">#</a></h3>

<p>Given a pointer to a <tt>fibers::FiberManager</tt> you can get a list of all its active fibers:</p>

<div class="remarkup-code-block" data-code-lang="php"><pre class="remarkup-code"><span class="o">(</span><span class="no">gdb</span><span class="o">)</span> <span class="no">p</span> <span class="o">*((</span><span class="nc" data-symbol-name="folly">folly</span><span class="o">::</span><span class="na" data-symbol-context="folly" data-symbol-name="fibers">fibers</span><span class="o">::</span><span class="na" data-symbol-name="FiberManager">FiberManager</span><span class="o">*)</span><span class="mh">0x7ffff5c22800</span><span class="o">)</span>
$<span class="mi">4</span> <span class="o">=</span> <span class="nc" data-symbol-name="folly">folly</span><span class="o">::</span><span class="na" data-symbol-context="folly" data-symbol-name="fibers">fibers</span><span class="o">::</span><span class="na" data-symbol-name="FiberManager">FiberManager</span> <span class="o">=</span> <span class="o">&#123;</span>
  <span class="mh">0x7ffff5d23380</span> <span class="o">=</span> <span class="nc" data-symbol-name="folly">folly</span><span class="o">::</span><span class="na" data-symbol-context="folly" data-symbol-name="fibers">fibers</span><span class="o">::</span><span class="na" data-symbol-name="Fiber">Fiber</span> <span class="o">=</span> <span class="o">&#123;</span>
    <span class="no">state</span> <span class="o">=</span> <span class="no">Awaiting</span> <span class="no">immediate</span><span class="o">,</span>
    <span class="no">backtrace</span> <span class="no">available</span> <span class="o">=</span> <span class="kc">true</span>
  <span class="o">&#125;</span>
<span class="o">&#125;</span></pre></div>

<p><tt>fiber-print-limit</tt> command can be used to change the maximum number of fibers printed for a <tt>fibers::FiberManager</tt> (default value is 100).</p>

<div class="remarkup-code-block" data-code-lang="php"><pre class="remarkup-code"><span class="o">(</span><span class="no">gdb</span><span class="o">)</span> <span class="no">fiber</span><span class="o">-</span><span class="no">print</span><span class="o">-</span><span class="no">limit</span> <span class="mi">10</span>
<span class="k">New</span> <span class="nc" data-symbol-name="fiber">fiber</span> <span class="no">limit</span> <span class="k">for</span> <span class="no">FiberManager</span> <span class="no">printer</span> <span class="no">set</span> <span class="no">to</span> <span class="mi">10</span></pre></div>

<h3 id="printing-a-fiber-task">Printing a fiber-task <a href="#printing-a-fiber-task" class="headerLink">#</a></h3>

<p>Given a pointer to a <tt>fibers::Fiber</tt>, which is running some fiber-task, you can get its current state:</p>

<div class="remarkup-code-block" data-code-lang="php"><pre class="remarkup-code"><span class="o">(</span><span class="no">gdb</span><span class="o">)</span> <span class="no">p</span> <span class="o">*((</span><span class="nc" data-symbol-name="folly">folly</span><span class="o">::</span><span class="na" data-symbol-context="folly" data-symbol-name="fibers">fibers</span><span class="o">::</span><span class="na" data-symbol-name="Fiber">Fiber</span><span class="o">*)</span><span class="mh">0x7ffff5d23380</span><span class="o">)</span>
$<span class="mi">5</span> <span class="o">=</span> <span class="nc" data-symbol-name="folly">folly</span><span class="o">::</span><span class="na" data-symbol-context="folly" data-symbol-name="fibers">fibers</span><span class="o">::</span><span class="na" data-symbol-name="Fiber">Fiber</span> <span class="o">=</span> <span class="o">&#123;</span>
  <span class="no">state</span> <span class="o">=</span> <span class="no">Awaiting</span> <span class="no">immediate</span><span class="o">,</span>
  <span class="no">backtrace</span> <span class="no">available</span> <span class="o">=</span> <span class="kc">true</span>
<span class="o">&#125;</span></pre></div>

<h3 id="activating-a-fiber-task">Activating a fiber-task <a href="#activating-a-fiber-task" class="headerLink">#</a></h3>

<p>Every <tt>fibers::Fiber</tt>, which is suspended (and so has its backtrace available), can be activated. To activate a fiber-task you can either use <tt>fiber</tt> GDB command, passing a <tt>fibers::Fiber</tt> pointer to it:</p>

<div class="remarkup-code-block" data-code-lang="php"><pre class="remarkup-code"><span class="o">(</span><span class="no">gdb</span><span class="o">)</span> <span class="no">fiber</span> <span class="mh">0x7ffff5d23380</span>
<span class="no">Fiber</span> <span class="mi">140737317581696</span> <span class="no">activated</span><span class="o">.</span> <span class="no">You</span> <span class="no">can</span> <span class="no">call</span> <span class="s1">&#039;bt&#039;</span> <span class="no">now</span><span class="o">.</span></pre></div>

<p>or simply call <tt>activate()</tt> on a <tt>fibers::Fiber</tt> object:</p>

<div class="remarkup-code-block" data-code-lang="php"><pre class="remarkup-code"><span class="o">(</span><span class="no">gdb</span><span class="o">)</span> <span class="nf" data-symbol-name="p">p</span> <span class="o">((</span><span class="nc" data-symbol-name="folly">folly</span><span class="o">::</span><span class="na" data-symbol-context="folly" data-symbol-name="fibers">fibers</span><span class="o">::</span><span class="na" data-symbol-name="Fiber">Fiber</span><span class="o">*)</span><span class="mh">0x7ffff5d23380</span><span class="o">)-&gt;</span><span class="na" data-symbol-name="activate">activate</span><span class="o">()</span>
$<span class="mi">6</span> <span class="o">=</span> <span class="s2">&quot;Fiber 0x7ffff5d23380 activated. You can call &#039;bt&#039; now.&quot;</span></pre></div>

<p>Once fiber-task is activated you can explore its stack using <tt>bt</tt> and <tt>frame</tt> commands, just like a regular thread.</p>

<div class="remarkup-code-block" data-code-lang="php"><pre class="remarkup-code"><span class="o">(</span><span class="no">gdb</span><span class="o">)</span> <span class="no">bt</span>
<span class="c">#1  0x00000000005497e9 in folly::fibers::FiberImpl::deactivate() (this=0x7ffff5d233a0)</span>
    <span class="no">at</span> <span class="no">buck</span><span class="o">-</span><span class="no">out</span><span class="o">/</span><span class="no">dbg</span><span class="o">/</span><span class="no">gen</span><span class="o">/</span><span class="no">folly</span><span class="o">/</span><span class="no">fibers</span><span class="o">/</span><span class="no">fibers_core</span><span class="c">#default,headers/folly/fibers/BoostContextCompatibility.h:105</span>
<span class="c">#2  0x000000000054996d in folly::fibers::FiberManager::deactivateFiber(folly::fibers::Fiber*) (this=0x7ffff5c22800, fiber=0x7ffff5d23380)</span>
    <span class="no">at</span> <span class="no">buck</span><span class="o">-</span><span class="no">out</span><span class="o">/</span><span class="no">dbg</span><span class="o">/</span><span class="no">gen</span><span class="o">/</span><span class="no">folly</span><span class="o">/</span><span class="no">fibers</span><span class="o">/</span><span class="no">fibers_core</span><span class="c">#default,headers/folly/fibers/FiberManagerInternal-inl.h:103</span>
<span class="c">#3  0x0000000000548b91 in folly::fibers::Fiber::&lt;lambda()&gt;::operator()(void) (__closure=0x7ffff59ffb20) at folly/fibers/Fiber.cpp:175</span>
<span class="c">#4  0x0000000000548d78 in folly::fibers::Fiber::preempt(folly::fibers::Fiber::State) (this=0x7ffff5d23380, state=folly::fibers::Fiber::AWAITING_IMMEDIATE)</span>
    <span class="no">at</span> <span class="no">folly</span><span class="o">/</span><span class="no">fibers</span><span class="o">/</span><span class="no">Fiber</span><span class="o">.</span><span class="no">cpp</span><span class="o">:</span><span class="mi">185</span>
<span class="c">#5  0x000000000043bcc6 in folly::fibers::FiberManager::runInMainContext&lt;FiberManager_nestedFiberManagers_Test::TestBody()::&lt;lambda()&gt;::&lt;lambda()&gt; &gt;(&lt;unknown type in /mnt/fio0/andrii/fbsource/fbcode/buck-out/dbg/gen/folly/fibers/test/fibers_test, CU 0x31b, DIE 0x111bdb&gt;) (this=0x7ffff5c22800, func=&lt;unknown type in   /mnt/fio0/andrii/fbsource/fbcode/buck-out/dbg/gen/folly/fibers/test/fibers_test, CU 0x31b, DIE 0x111bdb&gt;)</span>
    <span class="no">at</span> <span class="no">buck</span><span class="o">-</span><span class="no">out</span><span class="o">/</span><span class="no">dbg</span><span class="o">/</span><span class="no">gen</span><span class="o">/</span><span class="no">folly</span><span class="o">/</span><span class="no">fibers</span><span class="o">/</span><span class="no">fibers_core</span><span class="c">#default,headers/folly/fibers/FiberManagerInternal-inl.h:459</span>
<span class="c">#6  0x00000000004300f3 in folly::fibers::runInMainContext&lt;FiberManager_nestedFiberManagers_Test::TestBody()::&lt;lambda()&gt;::&lt;lambda()&gt; &gt;(&lt;unknown type in /mnt/fio0/andrii/fbsource/fbcode/buck-out/dbg/gen/folly/fibers/test/fibers_test, CU 0x31b, DIE 0xf7caa&gt;) (func=&lt;unknown type in   /mnt/fio0/andrii/fbsource/fbcode/buck-out/dbg/gen/folly/fibers/test/fibers_test, CU 0x31b, DIE 0xf7caa&gt;)</span>
    <span class="no">at</span> <span class="no">buck</span><span class="o">-</span><span class="no">out</span><span class="o">/</span><span class="no">dbg</span><span class="o">/</span><span class="no">gen</span><span class="o">/</span><span class="no">folly</span><span class="o">/</span><span class="no">fibers</span><span class="o">/</span><span class="no">fibers_core</span><span class="c">#default,headers/folly/fibers/FiberManagerInternal.h:551</span>
<span class="c">#7  0x0000000000422101 in FiberManager_nestedFiberManagers_Test::&lt;lambda()&gt;::operator()(void) const (__closure=0x7ffff5d23450)</span>
    <span class="no">at</span> <span class="no">folly</span><span class="o">/</span><span class="no">fibers</span><span class="o">/</span><span class="no">test</span><span class="o">/</span><span class="no">FibersTest</span><span class="o">.</span><span class="no">cpp</span><span class="o">:</span><span class="mi">1537</span>
<span class="o">...</span></pre></div>

<p>To deactivate previously activated fiber-task and switch back to the stack of current thread simply use <tt>fiber-deactivate</tt> GDB command:</p>

<div class="remarkup-code-block" data-code-lang="php"><pre class="remarkup-code"><span class="o">(</span><span class="no">gdb</span><span class="o">)</span> <span class="no">fiber</span><span class="o">-</span><span class="no">deactivate</span>
<span class="no">Fiber</span> <span class="no">de</span><span class="o">-</span><span class="no">activated</span><span class="o">.</span></pre></div>

<div class="remarkup-note"><span class="remarkup-note-word">NOTE:</span> For running (i.e. not suspended) fiber-task, you can simply switch to the system thread which owns it and use regular GDB commands for debugging.</div></section></section>
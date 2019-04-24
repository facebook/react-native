<section class="dex_document"><h1>Thread pools &amp; Executors</h1><p class="dex_introduction">Run your concurrent code in a performant way</p><h2 id="all-about-thread-pools">All about thread pools <a href="#all-about-thread-pools" class="headerLink">#</a></h2>

<h3 id="how-do-i-use-the-thread">How do I use the thread pools? <a href="#how-do-i-use-the-thread" class="headerLink">#</a></h3>

<p>Wangle provides two concrete thread pools (IOThreadPoolExecutor, CPUThreadPoolExecutor) as well as building them in as part of a complete async framework.  Generally you might want to grab the global executor, and use it with a future, like this:</p>

<div class="remarkup-code-block" data-code-lang="php"><pre class="remarkup-code"><span class="no">auto</span> <span class="no">f</span> <span class="o">=</span> <span class="nf" data-symbol-name="someFutureFunction">someFutureFunction</span><span class="o">().</span><span class="nf" data-symbol-name="via">via</span><span class="o">(</span><span class="nf" data-symbol-name="getCPUExecutor">getCPUExecutor</span><span class="o">()).</span><span class="nf" data-symbol-name="then">then</span><span class="o">(...)</span></pre></div>

<p>Or maybe you need to construct a thrift/memcache client, and need an event base:</p>

<div class="remarkup-code-block" data-code-lang="php"><pre class="remarkup-code"><span class="no">auto</span> <span class="no">f</span> <span class="o">=</span> <span class="nf" data-symbol-name="getClient">getClient</span><span class="o">(</span><span class="nf" data-symbol-name="getIOExecutor">getIOExecutor</span><span class="o">()-&gt;</span><span class="na" data-symbol-name="getEventBase">getEventBase</span><span class="o">())-&gt;</span><span class="na" data-symbol-name="callSomeFunction">callSomeFunction</span><span class="o">(</span><span class="no">args</span><span class="o">...)</span>
         <span class="o">.</span><span class="nf" data-symbol-name="via">via</span><span class="o">(</span><span class="nf" data-symbol-name="getCPUExecutor">getCPUExecutor</span><span class="o">())</span>
         <span class="o">.</span><span class="nf" data-symbol-name="then">then</span><span class="o">([](</span><span class="no">Result</span> <span class="no">r</span><span class="o">)&#123;</span> <span class="o">....</span> <span class="k">do</span> <span class="no">something</span> <span class="no">with</span> <span class="no">result</span><span class="o">&#125;);</span></pre></div>

<h3 id="vs-c-11-s-std-launch">vs. C++11&#039;s std::launch <a href="#vs-c-11-s-std-launch" class="headerLink">#</a></h3>

<p>The current C++11 std::launch only has two modes: async or deferred.  In a production system, neither is what you want:  async will launch a new thread for every launch without limit, while deferred will defer the work until it is needed lazily, but then do the work <strong>in the current thread synchronously</strong> when it is needed.</p>

<p>Wangle&#039;s thread pools always launch work as soon as possible, have limits to the maximum number of tasks / threads allowed, so we will never use more threads than absolutely needed.  See implementation details below about each type of executor.</p>

<h3 id="why-do-we-need-yet-anoth">Why do we need yet another set of thread pools? <a href="#why-do-we-need-yet-anoth" class="headerLink">#</a></h3>

<p>Unfortunately none of the existing thread pools had every feature needed - things based on pipes are too slow.   Several older ones didn&#039;t support std::function.</p>

<h3 id="why-do-we-need-several-d">Why do we need several different types of thread pools? <a href="#why-do-we-need-several-d" class="headerLink">#</a></h3>

<p>If you want epoll support, you need an fd - event_fd is the latest notification hotness.   Unfortunately, an active fd triggers all the epoll loops it is in, leading to thundering herd - so if you want a fair queue (one queue total vs. one queue per worker thread), you need to use some kind of semaphore.  Unfortunately semaphores can&#039;t be put in epoll loops, so they are incompatible with IO.   Fortunately, you usually want to separate the IO and CPU bound work anyway to give stronger tail latency guarantees on IO.</p>

<h3 id="iothreadpoolexecutor">IOThreadPoolExecutor <a href="#iothreadpoolexecutor" class="headerLink">#</a></h3>

<ul>
<li>Uses event_fd for notification, and waking an epoll loop.</li>
<li>There is one queue (NotificationQueue specifically) per thread/epoll.</li>
<li>If the thread is already running and not waiting on epoll, we don&#039;t make any additional syscalls to wake up the loop, just put the new task in the queue.</li>
<li>If any thread has been waiting for more than a few seconds, its stack is madvised away.   Currently however tasks are scheduled round robin on the queues, so unless there is <strong>no</strong> work going on, this isn&#039;t very effective.</li>
<li>::getEventBase() will return an EventBase you can schedule IO work on directly, chosen round-robin.</li>
<li>Since there is one queue per thread, there is hardly any contention on the queues - so a simple spinlock around an std::deque is used for the tasks.  There is no max queue size.</li>
<li>By default, there is one thread per core - it usually doesn&#039;t make sense to have more IO threads than this, assuming they don&#039;t block.</li>
</ul>

<h3 id="cputhreadpoolexecutor">CPUThreadPoolExecutor <a href="#cputhreadpoolexecutor" class="headerLink">#</a></h3>

<ul>
<li>A single queue backed by folly/LifoSem and folly/MPMC queue.  Since there is only a single queue, contention can be quite high, since all the worker threads and all the producer threads hit the same queue.  MPMC queue excels in this situation.  MPMC queue dictates a max queue size.</li>
<li>LifoSem wakes up threads in Lifo order - i.e. there are only few threads as necessary running, and we always try to reuse the same few threads for better cache locality.</li>
<li>Inactive threads have their stack madvised away.  This works quite well in combination with Lifosem - it almost doesn&#039;t matter if more threads than are necessary are specified at startup.</li>
<li>stop() will finish all outstanding tasks at exit</li>
<li>Supports priorities - priorities are implemented as multiple queues - each worker thread checks the highest priority queue first.  Threads themselves don&#039;t have priorities set, so a series of long running low priority tasks could still hog all the threads.  (at last check pthreads thread priorities didn&#039;t work very well)</li>
</ul>

<h3 id="threadpoolexecutor">ThreadPoolExecutor <a href="#threadpoolexecutor" class="headerLink">#</a></h3>

<p>Base class that contains the thread startup/shutdown/stats logic, since this is pretty disjoint from how tasks are actually run</p>

<h3 id="observers">Observers <a href="#observers" class="headerLink">#</a></h3>

<p>An observer interface is provided to listen for thread start/stop events.  This is useful to create objects that should be one-per-thread, but also have them work correctly if threads are added/removed from the thread pool.</p>

<h3 id="stats">Stats <a href="#stats" class="headerLink">#</a></h3>

<p>PoolStats are provided to get task count, running time, waiting time, etc.</p>
</section>


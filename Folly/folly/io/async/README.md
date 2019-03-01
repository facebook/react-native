# folly/io/async: An object-oriented wrapper around libevent
----------------------------------------------------------

[libevent](https://github.com/libevent/libevent) is an excellent
cross-platform eventing library.  Folly's async provides C++ object
wrappers for fd callbacks and event_base, as well as providing
implementations for many common types of fd uses.

## EventBase

The main libevent / epoll loop.  Generally there is a single EventBase
per thread, and once started, nothing else happens on the thread
except fd callbacks.  For example:

```
EventBase base;
auto thread = std::thread([&](){
  base.loopForever();
});

```

EventBase has built-in support for message passing between threads.
To send a function to be run in the EventBase thread, use
runInEventBaseThread().

```
EventBase base;
auto thread1 = std::thread([&](){
  base.loopForever();
});
base.runInEventBaseThread([&](){
  printf("This will be printed in thread1\n");
});
```

There are various ways to run the loop.  EventBase::loop() will return
when there are no more registered events.  EventBase::loopForever()
will loop until EventBase::terminateLoopSoon() is called.
EventBase::loopOnce() will only call epoll() a single time.

Other useful methods include EventBase::runAfterDelay() to run events
after some delay, and EventBase::setMaxLatency(latency, callback) to
run some callback if the loop is running very slowly, i.e., there are
too many events in this loop, and some code should probably be running
in different threads.

EventBase always calls all callbacks inline - that is, there is no
explicit or implicit queuing.  The specific implications of this are:

* Tail-latency times (P99) are vastly better than any queueing
  implementation
* The EventHandler implementation is responsible for not taking too
  long in any individual callback.  All of the EventHandlers in this
  implementation already do a good job of this, but if you are
  subclassing EventHandler directly, something to keep in mind.
* The callback cannot delete the EventBase or EventHandler directly,
  since it is still on the call stack.  See DelayedDestruction class
  description below, and use shared_ptrs appropriately.

## EventHandler

EventHandler is the object wrapper for fd's.  Any class you wish to
receive callbacks on will inherit from
EventHandler. `registerHandler(EventType)` will register to receive
events of a specific type.

Currently supported event types:

* READ - read and EOF events
* WRITE - write events, when kernel write buffer is empty
* READ_WRITE - both
* PERSIST - The event will remain registered even after the handlerReady() fires

Unsupported libevent event types, and why-

* TIMEOUT - this library has specific timeout support, instead of
  being attached to read/write fds.
* SIGNAL - similarly, signals are handled separately, see
  AsyncSignalHandler
* EV_ET - Currently all the implementations of EventHandler are set up
  for level triggered.  Benchmarking hasn't shown that edge triggered
  provides much improvement.

  Edge-triggered in this context means that libevent will provide only
  a single callback when an event becomes active, as opposed to
  level-triggered where as long as there is still data to read/write,
  the event will continually fire each time event_wait is called.
  Edge-triggered adds extra code complexity, since the library would
  need to maintain a similar list of active FDs that libevent
  currently does between edge triggering events.  The only advantage
  of edge-triggered is that you can use EPOLLONESHOT to ensure the
  event only gets called on a single event_base - but in this library,
  we assume each event is only registered on a single thread anyway.

* EV_FINALIZE - EventBase can only be used in a single thread,
  excepting a few methods.  To safely unregister an event from a
  different thread, it would have to be done through
  EventBase::runInEventBaseThread().  Most APIs already make this
  thread transition for you, or at least CHECK() that you've done it
  in the correct thread.
* EV_CLOSED - This is an optimization - instead of having to READ all
  the data and then get an EOF, EV_CLOSED would fire before all the
  data is read.  TODO: implement this.  Probably only useful in
  request/response servers.

## Implementations of EventHandler

### AsyncSocket

A nonblocking socket implementation.  Writes are queued and written
asynchronously, even before connect() is successful.  The read api
consists of two methods: getReadBuffer() and readDataAvailable().
When the READ event is signaled, libevent has no way of knowing how
much data is available to read.   In some systems (linux), we *could*
make another syscall to get the data size in the kernel read buffer,
but syscalls are slow.  Instead, most users will just want to provide
a fixed size buffer in getReadBuffer(), probably using the IOBufQueue
in folly/io.   readDataAvailable() will then describe exactly how much
data was read.

AsyncSocket provides send timeouts, but not read timeouts - generally
read timeouts are application specific, and should use an AsyncTimer
implementation below.

Various notes:

* Using a chain of IOBuf objects, and calling writeChain(), is a very
  syscall-efficient way to add/modify data to be sent, without
  unnecessary copies.
* setMaxReadsPerEvent() - this prevents an AsyncSocket from blocking
  the event loop for too long.
* Don't use the fd for syscalls yourself while it is being used in
  AsyncSocket, instead use the provided wrappers, like
  AsyncSocket::close(), shutdown(), etc.

#### AsyncSSLSocket

Similar to AsyncSocket, but uses openssl.  Provides an additional
HandshakeCallback to check the server's certificates.

#### TAsyncUDPSocket

TODO: Currently in fbthrift.

A socket that reads/writes UDP packets.  Since there is little state
to maintain, this is much simpler than AsyncSocket.

### AsyncServerSocket

A listen()ing socket that accept()s fds, and passes them to other
event bases.

The general pattern is:

```
EventBase base;
auto socket = AsyncServerSocket::newSocket(&base);
socket->bind(port); // 0 to choose any free port
socket->addAcceptCallback(object, &base); // where object is the object that implements the accept callback, and base is the object's eventbase.  base::runInEventBaseThread() will be called to send it a message.
socket->listen(backlog);
socket->startAccepting();
```

Generally there is a single accept() thread, and multiple
AcceptCallback objects.  The Acceptee objects then will manage the
individual AsyncSockets.  While AsyncSockets *can* be moved between
event bases, most users just tie them to a single event base to get
better cache locallity, and to avoid locking.

Multiple ServerSockets can be made, but currently the linux kernel has
a lock on accept()ing from a port, preventing more than ~20k accepts /
sec.  There are various workarounds (SO_REUSEPORT), but generally
clients should be using connection pooling instead when possible.

Since AsyncServerSocket provides an fd, an AsyncSSLSocket or
AsyncSocket can be made using the same codepath

#### TAsyncUDPServerSocket

Similar to AsyncServerSocket, but for UDP messages - messages are
read() on a single thread, and then fanned out to multiple worker
threads.

### NotificationQueue (EventFD or pipe notifications)

NotificationQueue is used to send messages between threads in the
*same process*.  It is what backs EventBase::runInEventBaseThread(),
so it is unlikely you'd want to use it directly instead of using
runInEventBaseThread().

An eventFD (for kernels > 2.6.30) or pipe (older kernels) are added to
the EventBase loop to wake up threads receiving messages.   The queue
itself is a spinlock-guarded list.   Since we are almost always
talking about a single sender thread and a single receiver (although
the code works just fine for multiple producers and multiple
consumers), the spinlock is almost always uncontended, and we haven't
seen any perf issues with it in practice.

The eventfd or pipe is only notified if the thread isn't already
awake, to avoid syscalls.  A naive implementaiton that does one write
per message in the queue, or worse, writes the whole message to the
queue, would be significantly slower.

If you need to send messages *between processes*, you would have to
write the whole message to the pipe, and manage the pipe size.  See
AsyncPipe.

### AsyncTimeout

An individual timeout callback that can be installed in the event
loop.   For code cleanliness and clarity, timeouts are separated from
sockets.   There is one fd used per AsyncTimeout.  This is a pretty
serious restriction, so the two below subclasses were made to support
multiple timeouts using a single fd.

#### HHWheelTimer

Implementation of a [hashed hierarcical wheel
timer](http://www.cs.columbia.edu/~nahum/w6998/papers/sosp87-timing-wheels.pdf).
Any timeout time can be used, with O(1) insertion, deletion, and
callback time.  The wheel itself takes up some amount of space, and
wheel timers have to have a constant tick, consuming a constant amount
of CPU.

An alternative to a wheel timer would be a heap of callbacks sorted by
timeout time, but would change the big-O to O(log n).  In our
experience, the average server has thousands to hundreds of thousands
of open sockets, and the common case is to add and remove timeouts
without them ever firing, assuming the server is able to keep up with
the load.  Therefore O(log n) insertion time overshadows the extra CPU
consumed by a wheel timer tick.

#### TAsyncTimeoutSet

NOTE: currently in proxygen codebase.

If we assume that all timeouts scheduled use the same timeout time, we
can keep O(1) insertion time: just schedule the new timeout at the
tail of the list, along with the time it was actually added.  When the
current timeout fires, we look at the new head of the list, and
schedule AsyncTimeout to fire at the difference between the current
time and the scheduled time (which probably isn't the same as the
timeout time.)

This requires all AsyncTimeoutSets timeouts to have the same timeout
time though, which in practice means many AsyncTimeoutSets are needed
per application.   Using HHWheelTimer instead can clean up the code quite
a bit, because only a single HHWheelTimer is needed per thread, as
opposed to one AsyncTimeoutSet per timeout time per thread.

### AsyncSignalHandler

Used to handle AsyncSignals.  Similar to AsyncTimeout, for code
clarity, we don't reuse the same fd as a socket to receive signals.

### AsyncPipe

Async reads/writes to a unix pipe, to send data between processes.

## Helper Classes

### RequestContext (in Request.h)

Since messages are frequently passed between threads with
runInEventBaseThread(), ThreadLocals don't work for messages.
Instead, RequestContext can be used, which is saved/restored between
threads.  Major uses for this include:

* NUMA: saving the numa node the code was running on, and explicitly
  running it on the same node in other threadpools / eventbases
* Tracing: tracing requests dapper-style intra machine, as well as
  between threads themselves.

In this library only runInEventBaseThread save/restores the request
context, although other Facebook libraries that pass requests between
threads do also: folly::future, and fbthrift::ThreadManager, etc

### DelayedDestruction

Since EventBase callbacks already have the EventHandler and EventBase
on the stack, calling `delete` on either of these objects would most
likely result in a segfault.  Instead, these objects inherit from
DelayedDestruction, which provides reference counting in the
callbacks.  Instead of delete, `destroy()` is called, which notifies
that is ready to be destroyed.  In each of the callbacks there is a
DestructorGuard, which prevents destruction until all the Guards are
gone from the stack, when the actual delete method is called.

DelayedDestruction can be a painful to use, since shared_ptrs and
unique_ptrs need to have a special DelayedDestruction destructor
type.  It's also pretty easy to forget to add a DestructorGuard in
code that calls callbacks.  But it is well worth it to avoid queuing
callbacks, and the improved P99 times as a result.

### EventBaseManager

DANGEROUS.

Since there is ususally only a single EventBase per thread, why not
make EventBase managed by a threadlocal?  Sounds easy!  But there are
several catches:

* The EventBase returned by `EventBaseManager::get()->getEventBase()`
  may not actually be running.
* There may be more than one event base in the thread (unusual), or
  the EventBase in the code may not be registerd in EventBaseManager.
* The event bases in EventBaseManager may be used for different
  purposes, i.e. some are AsyncSocket threads, and some are
  AsyncServerSocket threads:  So you can't just grab the list of
  EventBases and call runInEventBaseThread() on all of them and expect
  it to do the right thing.

A much safer option is to explicitly pass around an EventBase, or use
an explicit pool of EventBases.

### SSLContext

SSL helper routines to load / verify certs.  Used with
AsyncSSL[Server]Socket.

## Generic Multithreading Advice

Facebook has a lot of experience running services.  For background
reading, see [The C10k problem](http://www.kegel.com/c10k.html) and
[Fast UNIX
servers](http://nick-black.com/dankwiki/index.php/Fast_UNIX_Servers)

Some best practices we've found:

1. It's much easier to maintain latency expectations when each
   EventBase thread is used for only a single purpose:
   AsyncServerSocket, or inbound AsyncSocket, or in proxies, outbound
   AsyncSocket calls.   In a perfect world, one EventBase per thread
   per core would be enough, but the implementor needs to be extremely
   diligent to make sure all CPU work is moved off of the IO threads to
   prevent slow read/write/closes of fds.
2. **ANY** work that is CPU intensive should be offloaded to a pool of
   CPU-bound threads, instead of being done in the EventBase threads.
   runInEventBaseThread() is fast:  It can be called millions of times
   per second before the spinlock becomes an issue - so passing the
   request off to a different thread is probably fine perf wise.
3. In contrast to the first two recommendations, if there are more
   total threads than cores, context switching overhead can become an
   issue.  In particular we have seen this be an issue when a
   CPU-intensive thread blocks the scheduling of an IO thread, using
   the linux `perf sched` tool.
4. For async programming, in contrast to synchronous systems, managing
   load is extremely hard - it is better to use out-of-band methods to
   notify of overload, such as timeouts, or CPU usage.  For sync
   systems, you are almost always limited by the number of threads.
   For more details see [No Time for
   Asynchrony](https://www.usenix.org/legacy/event/hotos09/tech/full_papers/aguilera/aguilera.pdf)

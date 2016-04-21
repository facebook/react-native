using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using ReactNative.Bridge;
using ReactNative.Modules.Core;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Windows.System.Threading;

namespace ReactNative.Tests.Modules.Core
{
    [TestClass]
    public class TimingTests
    {
        [TestMethod]
        public async Task Timing_Create()
        {
            var ids = new List<int>();
            var waitHandle = new AutoResetEvent(false);
            var context = CreateReactContext(new MockInvocationHandler((name, args) =>
            {
                Assert.AreEqual(name, nameof(JSTimersExecution.callTimers));
                ids.AddRange((IList<int>)args[0]);
                waitHandle.Set();
            }));

            var timing = new Timing(context);
            timing.Initialize();
            await DispatcherHelpers.RunOnDispatcherAsync(context.OnResume);

            timing.createTimer(42, 100, DateTimeOffset.Now.ToUnixTimeMilliseconds(), false);

            Assert.IsTrue(waitHandle.WaitOne(1000));
            Assert.IsTrue(new[] { 42 }.SequenceEqual(ids));

            await DispatcherHelpers.RunOnDispatcherAsync(context.Dispose);
        }

        [TestMethod]
        public async Task Timing_ManyTimers()
        {
            var count = 1000;
            var ids = new List<int>(count);
            var countdown = new CountdownEvent(count);
            var context = CreateReactContext(new MockInvocationHandler((name, args) =>
            {
                Assert.AreEqual(name, nameof(JSTimersExecution.callTimers));
                var currentIds = (IList<int>)args[0];
                ids.AddRange(currentIds);
                for (var i = 0; i < currentIds.Count; ++i)
                {
                    countdown.Signal();
                }
            }));

            var timing = new Timing(context);
            timing.Initialize();
            await DispatcherHelpers.RunOnDispatcherAsync(context.OnResume);

            var now = DateTimeOffset.Now.ToUnixTimeMilliseconds();
            for (var i = 0; i < count; ++i)
            {
                timing.createTimer(i, i, now, false);
            }

            Assert.IsTrue(countdown.Wait(count * 2));

            await DispatcherHelpers.RunOnDispatcherAsync(context.Dispose);
        }

        [TestMethod]
        public async Task Timing_Create_Delete()
        {
            var ids = new List<int>();
            var waitHandle = new AutoResetEvent(false);
            var context = CreateReactContext(new MockInvocationHandler((name, args) =>
            {
                Assert.AreEqual(name, nameof(JSTimersExecution.callTimers));
                ids.AddRange((IList<int>)args[0]);
                waitHandle.Set();
            }));

            var timing = new Timing(context);
            timing.Initialize();
            await DispatcherHelpers.RunOnDispatcherAsync(context.OnResume);

            var id = 42;
            var now = DateTimeOffset.Now.ToUnixTimeMilliseconds();
            timing.createTimer(id, 500, now, false);
            timing.deleteTimer(id);
            Assert.IsFalse(waitHandle.WaitOne(1000));

            await DispatcherHelpers.RunOnDispatcherAsync(context.Dispose);
        }

        [TestMethod]
        public async Task Timing_Suspend_Resume()
        {
            var ids = new List<int>();
            var waitHandle = new AutoResetEvent(false);
            var context = CreateReactContext(new MockInvocationHandler((name, args) =>
            {
                Assert.AreEqual(name, nameof(JSTimersExecution.callTimers));
                ids.AddRange((IList<int>)args[0]);
                waitHandle.Set();
            }));

            var timing = new Timing(context);
            timing.Initialize();
            await DispatcherHelpers.RunOnDispatcherAsync(context.OnResume);

            var id = 42;
            var now = DateTimeOffset.Now.ToUnixTimeMilliseconds();
            timing.createTimer(id, 500, now, false);
            await DispatcherHelpers.RunOnDispatcherAsync(context.OnSuspend);
            Assert.IsFalse(waitHandle.WaitOne(1000));
            await DispatcherHelpers.RunOnDispatcherAsync(context.OnResume);
            Assert.IsTrue(waitHandle.WaitOne(1000));
            await DispatcherHelpers.RunOnDispatcherAsync(context.Dispose);
        }

        [TestMethod]
        public async Task Timing_Repeat()
        {
            var ids = new List<int>();
            var repeat = 10;
            var interval = 200;
            var countdown = new CountdownEvent(repeat);
            var context = CreateReactContext(new MockInvocationHandler((name, args) =>
            {
                Assert.AreEqual(name, nameof(JSTimersExecution.callTimers));
                ids.AddRange((IList<int>)args[0]);
                if (countdown.CurrentCount > 0)
                {
                    var t = ThreadPool.RunAsync(_ => countdown.Signal());
                }
            }));

            var timing = new Timing(context);
            timing.Initialize();
            await DispatcherHelpers.RunOnDispatcherAsync(context.OnResume);

            var id = 42;
            var now = DateTimeOffset.Now.ToUnixTimeMilliseconds();
            timing.createTimer(id, interval, now, true);

            Assert.IsTrue(countdown.Wait(interval * repeat * 2));

            timing.deleteTimer(id);

            Assert.AreEqual(42, ids.Distinct().SingleOrDefault());
            Assert.IsTrue(ids.Count >= repeat);

            await DispatcherHelpers.RunOnDispatcherAsync(context.Dispose);
        }

        [TestMethod]
        public async Task Timing_ManOrBoy()
        {
            var r = new Random();
            var batchCount = 15;
            var maxDuration = 500;
            var maxBatch = 10000;
            var id = 0;

            var ids = new List<int>();
            var countdown = new CountdownEvent(1);
            var context = CreateReactContext(new MockInvocationHandler((name, args) =>
            {
                Assert.AreEqual(name, nameof(JSTimersExecution.callTimers));
                var firedTimers = (IList<int>)args[0];
                ids.AddRange((IList<int>)args[0]);
                countdown.Signal(firedTimers.Count);
            }));

            var timing = new Timing(context);
            timing.Initialize();
            await DispatcherHelpers.RunOnDispatcherAsync(context.OnResume);

            for (var i = 0; i < batchCount; ++i)
            {
                var batchSize = r.Next(maxBatch);
                countdown.AddCount(batchSize);
                for (var j = 0; j < batchSize; ++j)
                {
                    var now = DateTimeOffset.Now.ToUnixTimeMilliseconds();
                    var duration = r.Next(maxDuration);
                    timing.createTimer(id++, duration, now, false);
                }

                await Task.Delay(maxDuration / 4);
            }

            countdown.Signal();
            Assert.IsTrue(countdown.Wait(batchCount * maxDuration / 4 * 2));

            await DispatcherHelpers.RunOnDispatcherAsync(context.Dispose);
        }

        [TestMethod]
        public async Task Timing_AnimationBehavior()
        {
            var id = 0;

            var seconds = 3;
            var fps = 60;
            var interval = 1000 / fps;

            var canceled = false;
            var fired = new List<int>();

            var timing = default(Timing);
            var now = default(long);

            var waitHandle = new AutoResetEvent(false);

            var context = CreateReactContext(new MockInvocationHandler((name, args) =>
            {
                if (!canceled)
                {
                    fired.Add(((IList<int>)args[0]).First());
                    now += interval;
                    timing.createTimer(++id, interval, now, false);
                }
                else
                {
                    waitHandle.Set();
                }
            }));

            timing = new Timing(context);
            timing.Initialize();
            await DispatcherHelpers.RunOnDispatcherAsync(context.OnResume);

            now = DateTimeOffset.Now.ToUnixTimeMilliseconds();
            timing.createTimer(id, interval, now, false);

            await Task.Delay(TimeSpan.FromSeconds(seconds));
            canceled = true;

            var margin = 0.05;

            Assert.IsTrue(fired.Count > (seconds * fps * (1.0 - margin)));

            Assert.IsTrue(waitHandle.WaitOne());

            await DispatcherHelpers.RunOnDispatcherAsync(context.Dispose);
        }

        [TestMethod]
        public async Task Timing_Zero_NoRepeat()
        {
            var ids = new List<int>();
            var waitHandle = new AutoResetEvent(false);
            var context = CreateReactContext(new MockInvocationHandler((name, args) =>
            {
                Assert.AreEqual(name, nameof(JSTimersExecution.callTimers));
                ids.AddRange((IList<int>)args[0]);
                waitHandle.Set();
            }));

            var timing = new Timing(context);
            timing.Initialize();
            await DispatcherHelpers.RunOnDispatcherAsync(context.OnResume);

            // Callback is called directly
            timing.createTimer(42, 0, DateTimeOffset.Now.ToUnixTimeMilliseconds(), false);

            Assert.IsTrue(new[] { 42 }.SequenceEqual(ids));

            await DispatcherHelpers.RunOnDispatcherAsync(context.Dispose);
        }

        [TestMethod]
        public async Task Timing_Zero_Repeat()
        {
            var ids = new List<int>();
            var countdown = new CountdownEvent(60);
            var context = CreateReactContext(new MockInvocationHandler((name, args) =>
            {
                Assert.AreEqual(name, nameof(JSTimersExecution.callTimers));
                ids.AddRange((IList<int>)args[0]);
                countdown.Signal();
            }));

            var timing = new Timing(context);
            timing.Initialize();
            await DispatcherHelpers.RunOnDispatcherAsync(context.OnResume);

            // Callback is called directly
            timing.createTimer(42, 0, DateTimeOffset.Now.ToUnixTimeMilliseconds(), true);
            countdown.Wait();
            timing.deleteTimer(42);

            await DispatcherHelpers.RunOnDispatcherAsync(context.Dispose);
        }

        private static ReactContext CreateReactContext(IInvocationHandler handler)
        {
            var context = new ReactContext();
            var jsTimers = new JSTimersExecution
            {
                InvocationHandler = handler,
            };

            var reactInstance = new TestReactInstance(jsTimers);
            context.InitializeWithInstance(reactInstance);
            return context;
        }

        class TestReactInstance : MockReactInstance
        {
            private readonly object _jsTimers;

            public TestReactInstance(JSTimersExecution jsTimers)
                : base()
            {
                _jsTimers = jsTimers;
            }

            public override T GetJavaScriptModule<T>()
            {
                if (typeof(JSTimersExecution) == typeof(T))
                {
                    return (T)_jsTimers;
                }

                return base.GetJavaScriptModule<T>();
            }
        }
    }
}

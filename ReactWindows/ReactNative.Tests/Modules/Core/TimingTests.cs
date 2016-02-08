using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using ReactNative.Bridge;
using ReactNative.Modules.Core;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ReactNative.Tests.Modules.Core
{
    [TestClass]
    public class TimingTests
    {
        [TestMethod]
        public void Timing_Create()
        {
            var ids = new List<int>();
            var waitHandle = new AutoResetEvent(false);
            var timing = CreateModule(new MockInvocationHandler((name, args) =>
            {
                Assert.AreEqual(name, nameof(JSTimersExecution.callTimers));
                ids.AddRange((IList<int>)args[0]);
                waitHandle.Set();
            }));

            timing.createTimer(42, 100, DateTimeOffset.Now.ToUnixTimeMilliseconds(), false);

            Assert.IsTrue(waitHandle.WaitOne(1000));
            Assert.IsTrue(new[] { 42 }.SequenceEqual(ids));

            timing.OnDestroy();
        }

        [TestMethod]
        public void Timing_ManyTimers()
        {
            var ids = new List<int>();
            var waitHandle = new AutoResetEvent(false);
            var timing = CreateModule(new MockInvocationHandler((name, args) =>
            {
                Assert.AreEqual(name, nameof(JSTimersExecution.callTimers));
                ids.AddRange((IList<int>)args[0]);
                waitHandle.Set();
            }));

            var now = DateTimeOffset.Now.ToUnixTimeMilliseconds();
            var count = 1000;
            for (var i = 0; i < count; ++i)
            {
                timing.createTimer(i, i, now, false);
            }

            while (true)
            {
                Assert.IsTrue(waitHandle.WaitOne(2000));
                if (ids.Count == count)
                {
                    break;
                }
            }

            timing.OnDestroy();
        }

        [TestMethod]
        public void Timing_Create_Delete()
        {
            var ids = new List<int>();
            var waitHandle = new AutoResetEvent(false);
            var timing = CreateModule(new MockInvocationHandler((name, args) =>
            {
                Assert.AreEqual(name, nameof(JSTimersExecution.callTimers));
                ids.AddRange((IList<int>)args[0]);
                waitHandle.Set();
            }));

            var id = 42;
            var now = DateTimeOffset.Now.ToUnixTimeMilliseconds();
            timing.createTimer(id, 500, now, false);
            timing.deleteTimer(id);
            Assert.IsFalse(waitHandle.WaitOne(1000));

            timing.OnDestroy();
        }

        [TestMethod]
        public void Timing_Suspend_Resume()
        {
            var ids = new List<int>();
            var waitHandle = new AutoResetEvent(false);
            var timing = CreateModule(new MockInvocationHandler((name, args) =>
            {
                Assert.AreEqual(name, nameof(JSTimersExecution.callTimers));
                ids.AddRange((IList<int>)args[0]);
                waitHandle.Set();
            }));

            var id = 42;
            var now = DateTimeOffset.Now.ToUnixTimeMilliseconds();
            timing.createTimer(id, 500, now, false);
            timing.OnSuspend();
            Assert.IsFalse(waitHandle.WaitOne(1000));
            timing.OnResume();
            Assert.IsTrue(waitHandle.WaitOne(1000));
            timing.OnDestroy();
        }

        [TestMethod]
        public void Timing_Repeat()
        {
            var ids = new List<int>();
            var waitHandle = new AutoResetEvent(false);
            var timing = CreateModule(new MockInvocationHandler((name, args) =>
            {
                Assert.AreEqual(name, nameof(JSTimersExecution.callTimers));
                ids.AddRange((IList<int>)args[0]);
                waitHandle.Set();
            }));

            var id = 42;
            var repeat = 3;
            var now = DateTimeOffset.Now.ToUnixTimeMilliseconds();
            timing.createTimer(id, 500, now, true);
            for (var i = 0; i < repeat; ++i)
            {
                Assert.IsTrue(waitHandle.WaitOne(1000));
            }

            timing.deleteTimer(id);
            Assert.IsFalse(waitHandle.WaitOne(1000));

            timing.OnDestroy();
        }

        [TestMethod]
        public async Task Timing_ManOrBoy()
        {
            var r = new Random();
            var batchCount = 10;
            var maxDuration = 1000;
            var maxBatch = 5000;
            var id = 0;

            var ids = new List<int>();
            var waitHandle = new AutoResetEvent(false);
            var timing = CreateModule(new MockInvocationHandler((name, args) =>
            {
                Assert.AreEqual(name, nameof(JSTimersExecution.callTimers));
                ids.AddRange((IList<int>)args[0]);
                waitHandle.Set();
            }));

            for (var i = 0; i < batchCount; ++i)
            {
                var batchSize = r.Next(maxBatch);
                for (var j = 0; j < batchSize; ++j)
                {
                    var now = DateTimeOffset.Now.ToUnixTimeMilliseconds();
                    var duration = r.Next(maxDuration);
                    timing.createTimer(id++, duration, now, false);
                }

                await Task.Delay(maxDuration / 4);
            }

            while (true)
            {
                Assert.IsTrue(waitHandle.WaitOne(maxDuration * 2));
                ids.Sort();
                if (ids.Count == id)
                {
                    break;
                }
            }

            timing.OnDestroy();
        }

        private static Timing CreateModule(IInvocationHandler handler)
        {
            var context = new ReactContext();
            var jsTimers = new JSTimersExecution();

            var waitHandle = new AutoResetEvent(false);
            var ids = new List<int>();
            jsTimers.InvocationHandler = handler;

            var catalystInstance = new TestCatalystInstance(jsTimers);
            context.InitializeWithInstance(catalystInstance);
            var timing = new Timing(context);
            timing.Initialize();
            return timing;
        }

        class TestCatalystInstance : MockReactInstance
        {
            private readonly object _jsTimers;

            public TestCatalystInstance(JSTimersExecution jsTimers)
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

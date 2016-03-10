using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using ReactNative.Modules.Storage;
using System;
using System.Threading;

namespace ReactNative.Tests.Modules.Storage
{
    [TestClass]
    public class AsyncStorageModuleTests
    {
        [TestMethod]
        public void AsyncStorageModuleTests_ArgumentChecks()
        {
            var module = new AsyncStorageModule(new ReactContext());
            var array = new JArray();

            AssertEx.Throws<ArgumentNullException>(
                () => module.multiGet(null, null),
                ex => Assert.AreEqual("keys", ex.ParamName));

            AssertEx.Throws<ArgumentNullException>(
                () => module.multiGet(array, null),
                ex => Assert.AreEqual("callback", ex.ParamName));

            AssertEx.Throws<ArgumentNullException>(
                () => module.multiSet(null, null),
                ex => Assert.AreEqual("keyValueArray", ex.ParamName));

            AssertEx.Throws<ArgumentNullException>(
                () => module.multiRemove(null, null),
                ex => Assert.AreEqual("keys", ex.ParamName));

            AssertEx.Throws<ArgumentNullException>(
                () => module.multiMerge(null, null),
                ex => Assert.AreEqual("keyValueArray", ex.ParamName));

            AssertEx.Throws<ArgumentNullException>(
                () => module.getAllKeys(null),
                ex => Assert.AreEqual("callback", ex.ParamName));
        }

        [TestMethod]
        public void AsyncStorageModule_InvalidKeyValue_Method()
        {
            var module = new AsyncStorageModule(new ReactContext());
            var waitHandle = new AutoResetEvent(false);

            var result = new JArray();

            var callback = new MockCallback( res => { result = (JArray)res[0]; waitHandle.Set(); });

            var array = new JArray { new JArray { 5, 5 } };

            module.multiSet(array, callback);
            waitHandle.WaitOne();

            Assert.AreEqual((result[0]).First.ToObject<string>(), "Invalid key");

            array = new JArray { new JArray { 5 } };

            module.multiSet(array, callback);
            waitHandle.WaitOne();

            Assert.AreEqual((result[0]).First.ToObject<string>(), "Invalid key value pair");

            array = new JArray { new JArray { 5, 5, 5 } };

            module.multiSet(array, callback);
            waitHandle.WaitOne();

            Assert.AreEqual((result[0]).First.ToObject<string>(), "Invalid key value pair");
        }

        [TestMethod]
        public void AsyncStorageModule_multiGet_Method()
        {
            var module = new AsyncStorageModule(new ReactContext());
            var waitHandle = new AutoResetEvent(false);

            var result = new JArray();

            var emptyCallback = new MockCallback(_ => waitHandle.Set());
            var callback = new MockCallback(res => { result = (JArray)res[0]; waitHandle.Set(); });

            var array = new JArray { new JArray { "test1", 5 } };

            module.multiSet(array, callback);
            waitHandle.WaitOne();

            module.multiGet(new JArray { "test1" }, callback);
            waitHandle.WaitOne();

            Assert.AreEqual(result.Count, 1);
            Assert.AreEqual((result[0]).Last.ToObject<int>(), 5);
        }

        [TestMethod]
        public void AsyncStorageModule_multiMerge_Method()
        {
            var module = new AsyncStorageModule(new ReactContext());
            var waitHandle = new AutoResetEvent(false);

            var result = new JArray();

            var emptyCallback = new MockCallback(_ => waitHandle.Set());
            var callback = new MockCallback(res => { result = (JArray)res[0]; waitHandle.Set(); });

            var array1 = new JArray { new JArray { "test1", 5 }, new JArray { "test2", 10 } };
            var array2 = new JArray { new JArray { "test2", 15 }, new JArray { "test3", 20 } };

            module.clear(emptyCallback);
            waitHandle.WaitOne();

            module.multiSet(array1, callback);
            waitHandle.WaitOne();

            module.multiMerge(array2, callback);
            waitHandle.WaitOne();

            module.getAllKeys(callback);
            waitHandle.WaitOne();

            Assert.AreEqual(result.Count, 3);
        }

        [TestMethod]
        public void AsyncStorageModule_multiRemove_Method()
        {
            var module = new AsyncStorageModule(new ReactContext());
            var waitHandle = new AutoResetEvent(false);

            var result = new JArray();

            var emptyCallback = new MockCallback(_ => waitHandle.Set());
            var callback = new MockCallback(res => { result = (JArray)res[0]; waitHandle.Set(); });

            var array = new JArray { new JArray { "test1", 5 }, new JArray { "test2", 10.5 }, new JArray { "test3", new JArray { 20, 30, 40 } }, new JArray { "test4", true }, new JArray { "test5", "ABCDEF" }, new JArray { "test6", JValue.CreateNull() } };

            module.clear(emptyCallback);
            waitHandle.WaitOne();

            module.multiSet(array, callback);
            waitHandle.WaitOne();

            module.getAllKeys(callback);
            waitHandle.WaitOne();

            Assert.AreEqual(result.Count, 6);

            module.multiGet(result, callback);
            waitHandle.WaitOne();

            // testing that result contains all values from array
            foreach (var item in array)
            {
                string key = item.First.ToObject<string>();
                object value = item.Last.ToObject<object>();

                var found = false;
                var item_ = result.First;
                
                while (!found && item_ != null)
                {
                    if ((item_.First).ToObject<string>().CompareTo(key) == 0)
                    {
                        object o = item_.Last.ToObject<object>();
                        if (value == null) Assert.IsNull(o);
                        else if (o.GetType() != value.GetType()) Assert.Fail();
                        else
                        {
                            if (value.GetType() == typeof(bool)) Assert.AreEqual((bool)value, (bool)o);
                            else if (value.GetType() == typeof(long)) Assert.AreEqual((long)value, (long)o);
                            else if (value.GetType() == typeof(double)) Assert.AreEqual((double)value, (double)o);
                            else if (value.GetType() == typeof(string)) Assert.IsTrue(((string)value).CompareTo((string)o) == 0);
                        }
                        found = true;
                    }
                    item_ = item_.Next;
                }
                Assert.IsTrue(found);
            }
               
            var keys = new JArray { "test1", "test2" };
            module.multiRemove(keys, callback);
            waitHandle.WaitOne();

            module.getAllKeys(callback);
            waitHandle.WaitOne();

            Assert.AreEqual(result.Count, 4);
        }
    }
}

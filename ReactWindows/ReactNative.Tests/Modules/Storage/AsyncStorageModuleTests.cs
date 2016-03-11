using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using Newtonsoft.Json.Linq;
using ReactNative.Modules.Storage;
using System.Threading;

namespace ReactNative.Tests.Modules.Storage
{
    [TestClass]
    public class AsyncStorageModuleTests
    {
        [TestMethod]
        public void AsyncStorageModule_InvalidKeyValue_Method()
        {
            var module = new AsyncStorageModule();
            var waitHandle = new AutoResetEvent(false);

            var result = new JArray();

            var callback = new MockCallback( res => { result = (JArray)res[0]; waitHandle.Set(); });

            var array = new JArray
            {
                new JArray
                {
                    5,
                    5,
                },
            };

            module.multiSet(array, callback);
            waitHandle.WaitOne();

            Assert.AreEqual((result[0]).First.Value<string>(), "Invalid key");

            array = new JArray
            {
                new JArray
                {
                    5,
                }
            };

            module.multiSet(array, callback);
            waitHandle.WaitOne();

            Assert.AreEqual((result[0]).First.Value<string>(), "Invalid key value pair");

            array = new JArray
            {
                new JArray
                {
                    5,
                    5,
                    5,
                }
            };

            module.multiSet(array, callback);
            waitHandle.WaitOne();

            Assert.AreEqual((result[0]).First.Value<string>(), "Invalid key value pair");
        }

        [TestMethod]
        public void AsyncStorageModule_multiGet_Method()
        {
            var module = new AsyncStorageModule();
            var waitHandle = new AutoResetEvent(false);

            var result = new JArray();

            var emptyCallback = new MockCallback(_ => waitHandle.Set());
            var callback = new MockCallback(res => { result = (JArray)res[0]; waitHandle.Set(); });

            var array = new JArray
            {
                new JArray
                {
                    "test1",
                    5,
                }
            };

            module.multiSet(array, callback);
            waitHandle.WaitOne();

            module.multiGet(new string[] { "test1", }, callback);
            waitHandle.WaitOne();

            Assert.AreEqual(result.Count, 1);
            Assert.AreEqual((result[0]).Last.Value<int>(), 5);
        }

        [TestMethod]
        public void AsyncStorageModule_multiMerge_Method()
        {
            var module = new AsyncStorageModule();
            var waitHandle = new AutoResetEvent(false);

            var result = new JArray();

            var emptyCallback = new MockCallback(_ => waitHandle.Set());
            var callback = new MockCallback(res => { result = (JArray)res[0]; waitHandle.Set(); });

            var array1 = new JArray
            {
                new JArray
                {
                    "test1",
                    5,
                },
                new JArray
                {
                    "test2",
                    10,
                }
            };

            var array2 = new JArray
            {
                new JArray
                {
                    "test2",
                    15,
                },
                new JArray
                {
                    "test3",
                    20,
                }
            };

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
            var module = new AsyncStorageModule();
            var waitHandle = new AutoResetEvent(false);

            var result = new JArray();

            var emptyCallback = new MockCallback(_ => waitHandle.Set());
            var callback = new MockCallback(res => { result = (JArray)res[0]; waitHandle.Set(); });

            var array = new JArray
            {
                new JArray
                {
                    "test1",
                    5,
                },
                new JArray
                {
                    "test2",
                    10.5,
                },
                new JArray
                {
                    "test3",
                    new JArray
                    {
                        new JArray
                        {
                            1,
                            false,
                            "ABCDEF",
                        },
                        30,
                        40,
                    },
                },
                new JArray
                {
                    "test4",
                    true,
                },
                new JArray
                {
                    "test5",
                    "ABCDEF",
                },
                new JArray
                {
                    "test6",
                    JValue.CreateNull(),
                }
            };

            module.clear(emptyCallback);
            waitHandle.WaitOne();

            module.multiSet(array, callback);
            waitHandle.WaitOne();

            module.getAllKeys(callback);
            waitHandle.WaitOne();

            Assert.AreEqual(result.Count, 6);

            var strArray = new string[result.Count];
            int idx = 0;
            foreach (var item in result)
            {
                strArray[idx++] = item.Value<string>();
            }

            module.multiGet(strArray, callback);
            waitHandle.WaitOne();

            AssertJArraysAreEqual(result, array);
          
            var keys = new string[] 
            {
                "test1",
                "test2",
            };
            module.multiRemove(keys, callback);
            waitHandle.WaitOne();

            module.getAllKeys(callback);
            waitHandle.WaitOne();

            Assert.AreEqual(result.Count, 4);
        }

        private void AssertJArraysAreEqual(JArray a, JArray b)
        {
            foreach (var item in a)
            {
                string key = item.First.Value<string>();
                object value = item.Last.Value<object>();

                var found = false;
                var item_ = b.First;

                while (!found && item_ != null)
                {
                    if ((item_.First).Value<string>().CompareTo(key) == 0)
                    {
                        object o = item_.Last.Value<object>();
                        if (value == null) Assert.IsNull(o);
                        else if (o.GetType() != value.GetType()) Assert.Fail();
                        else
                        {
                            var t = value.GetType();
                            if (t == typeof(bool) || t == typeof(long) || t == typeof(double))
                            {
                                Assert.AreEqual(value, o);
                            }
                            else if (t == typeof(string))
                            {
                                Assert.IsTrue(((string)value).CompareTo((string)o) == 0);
                            }
                            else if (t == typeof(JArray))
                            {
                                Assert.IsTrue(value.ToString().CompareTo(o.ToString()) == 0);
                            }
                        }
                        found = true;
                    }
                    item_ = item_.Next;
                }
                Assert.IsTrue(found);
            }
        }
    }
}

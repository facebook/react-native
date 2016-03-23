using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using ReactNative.Modules.Storage;
using System.Collections.Generic;
using System.Linq;
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

            var error = default(JObject);
            var result = default(JArray);
            var callback = new MockCallback(res =>
            {
                error = res.Length > 0 ? (JObject)res[0] : null;
                result = res.Length > 1 ? (JArray)res[1] : null;
                waitHandle.Set();
            });

            var array = new[]
            {
                new[] { "5", "5", "5" },
            };

            module.clear(callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);
            Assert.IsNull(result);

            module.multiSet(array, callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.AreEqual(error["message"], "Invalid Value");
            Assert.IsNull(result);
        }

        [TestMethod]
        public void AsyncStorageModule_multiGet_Method()
        {
            var module = new AsyncStorageModule();
            var waitHandle = new AutoResetEvent(false);

            var error = default(JObject);
            var result = default(JArray);
            var callback = new MockCallback(res =>
            {
                error = res.Length > 0 ? (JObject)res[0] : null;
                result = res.Length > 1 ? (JArray)res[1] : null;
                waitHandle.Set();
            });

            var array = new[]
            {
                new[] { "test1", "5" },
            };

            module.clear(callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);
            Assert.IsNull(result);

            module.multiSet(array, callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);
            Assert.IsNull(result);

            module.multiGet(new string[] { "test1", }, callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);
            Assert.AreEqual(result.Count, 1);
            Assert.AreEqual((result[0]).Last.Value<string>(), "5");
        }

        [TestMethod]
        public void AsyncStorageModule_multiRemove_Method()
        {
            var module = new AsyncStorageModule();
            var waitHandle = new AutoResetEvent(false);

            var error = default(JObject);
            var result = default(JArray);
            var callback = new MockCallback(res =>
            {
                error = res.Length > 0 ? (JObject)res[0] : null;
                result = res.Length > 1 ? (JArray)res[1] : null;
                waitHandle.Set();
            });

            var array = new[]
            {
                new[] { "test1", "1" },
                new[] { "test2", "2" },
                new[] { "test3", "3" },
                new[] { "test4", "4" },
                new[] { "test5", "5" },
                new[] { "test6", "6" },
            };

            module.clear(callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);
            Assert.IsNull(result);

            module.multiSet(array, callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);
            Assert.IsNull(result);

            module.getAllKeys(callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);
            Assert.AreEqual(result.Count, 6);

            var strArray = new string[result.Count];
            int idx = 0;
            foreach (var item in result)
            {
                strArray[idx++] = item.Value<string>();
            }

            module.multiGet(strArray, callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);
            var expected = array.OrderBy(p => p[0]).Aggregate("", (acc, p) => $"{p[0]},{p[1]};");
            var actual = result.OrderBy(p => p[0]).Aggregate("", (acc, p) => $"{p[0]},{p[1]};");
            Assert.AreEqual(expected, actual);
          
            var keys = new string[] 
            {
                "test1",
                "test2",
            };

            module.multiRemove(keys, callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);
            Assert.IsNull(result);

            module.getAllKeys(callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);
            Assert.AreEqual(result.Count, 4);
        }

        [TestMethod]
        public void AsyncStorageModule_multiSet_LargeValue()
        {
            var module = new AsyncStorageModule();
            var waitHandle = new AutoResetEvent(false);

            var error = default(JObject);
            var result = default(JArray);
            var callback = new MockCallback(res =>
            {
                error = res.Length > 0 ? (JObject)res[0] : null;
                result = res.Length > 1 ? (JArray)res[1] : null;
                waitHandle.Set();
            });

            module.clear(callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);
            Assert.IsNull(result);

            var array = new[]
            {
                new[] { "testKey", string.Join("", Enumerable.Repeat("a", 1024 * 16)) },
            };
            
            module.multiSet(array, callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);
            Assert.IsNull(result);

            module.multiGet(new[] { "testKey" }, callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);
            Assert.AreEqual(
                JArray.FromObject(array).ToString(Formatting.None),
                result.ToString(Formatting.None));
        }

        [TestMethod]
        public void AsyncStorageModule_multiMerge_NullValue()
        {
            var module = new AsyncStorageModule();
            var waitHandle = new AutoResetEvent(false);

            var error = default(JObject);
            var result = default(JArray);
            var callback = new MockCallback(res =>
            {
                error = res.Length > 0 ? (JObject)res[0] : null;
                result = res.Length > 1 ? (JArray)res[1] : null;
                waitHandle.Set();
            });

            module.clear(callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);
            Assert.IsNull(result);

            var array = new[]
            {
                new[] { "testKey", string.Join("", Enumerable.Repeat("a", 1024 * 16)) },
            };

            module.multiMerge(array, callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);
            Assert.IsNull(result);
        }

        [TestMethod]
        public void AsyncStorageModule_testMultiSetMultiGet()
        {
            var mStorage = new AsyncStorageModule();
            var waitHandle = new AutoResetEvent(false);

            var error = default(JObject);
            var result = default(JArray);
            var callback = new MockCallback(res =>
            {
                error = res.Length > 0 ? (JObject)res[0] : null;
                result = res.Length > 1 ? (JArray)res[1] : null;
                waitHandle.Set();
            });

            mStorage.clear(callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);
            Assert.IsNull(result);

            var key1 = "foo1";
            var key2 = "foo2";
            var fakeKey = "fakeKey";
            var value1 = "bar1";
            var value2 = "bar2";

            var keyValues = new List<string[]>();
            keyValues.Add(new[] { key1, value1 });
            keyValues.Add(new[] { key2, value2 });
            
            mStorage.multiSet(keyValues.ToArray(), callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);
            Assert.IsNull(result);

            var keys = new List<string>();
            keys.Add(key1);
            keys.Add(key2);

            mStorage.multiGet(keys.ToArray(), callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);
            var expected = JArray.FromObject(keyValues);
            Assert.IsTrue(JToken.DeepEquals(result, expected));

            keys.Add(fakeKey);
            keyValues.Add(new[] { fakeKey, null });

            mStorage.multiGet(keys.ToArray(), callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);
            expected = JArray.FromObject(keyValues);
            Assert.IsTrue(JToken.DeepEquals(result, expected));
        }

        [TestMethod]
        public void AsyncStorageModule_testMultiRemove()
        {
            var mStorage = new AsyncStorageModule();
            var waitHandle = new AutoResetEvent(false);

            var error = default(JObject);
            var result = default(JArray);
            var callback = new MockCallback(res =>
            {
                error = res.Length > 0 ? (JObject)res[0] : null;
                result = res.Length > 1 ? (JArray)res[1] : null;
                waitHandle.Set();
            });

            mStorage.clear(callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);
            Assert.IsNull(result);

            var key1 = "foo1";
            var key2 = "foo2";
            var value1 = "bar1";
            var value2 = "bar2";

            var keyValues = new List<string[]>();
            keyValues.Add(new[] { key1, value1 });
            keyValues.Add(new[] { key2, value2 });

            mStorage.multiSet(keyValues.ToArray(), callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);
            Assert.IsNull(result);

            var keys = new List<string>();
            keys.Add(key1);
            keys.Add(key2);

            mStorage.multiRemove(keys.ToArray(), callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);
            Assert.IsNull(result);

            mStorage.getAllKeys(callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);
            Assert.AreEqual(result.Count, 0);

            mStorage.multiSet(keyValues.ToArray(), callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);
            Assert.IsNull(result);

            keys.Add("fakeKey");
            mStorage.multiRemove(keys.ToArray(), callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);
            Assert.IsNull(result);

            mStorage.getAllKeys(callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);
            Assert.AreEqual(result.Count, 0);
        }

        [TestMethod]
        public void AsyncStorageModule_testMultiMerge()
        {
            var mStorage = new AsyncStorageModule();
            var waitHandle = new AutoResetEvent(false);

            var error = default(JObject);
            var result = default(JArray);
            var callback = new MockCallback(res =>
            {
                error = res.Length > 0 ? (JObject)res[0] : null;
                result = res.Length > 1 ? (JArray)res[1] : null;
                waitHandle.Set();
            });

            mStorage.clear(callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);
            Assert.IsNull(result);

            var mergeKey = "mergeTest";

            var value = new JObject();
            value.Add("foo1", "bar1");

            value.Add("foo2", new JArray
            {
                "val1",
                "val2",
                3,
            });

            value.Add("foo3", 1001);

            var val = new JObject();
            val.Add("key1", "randomValueThatWillNeverBeUsed");
            value.Add("foo4", val);

            var array = new[]
            {
                new[] 
                {
                    mergeKey,
                    value.ToString(Formatting.None)
                },
            };

            mStorage.multiSet(array, callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);
            Assert.IsNull(result);

            var str = new string[] { mergeKey };

            mStorage.multiGet(str, callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);
            var expected = JToken.FromObject(array);
            Assert.IsTrue(JToken.DeepEquals(result, expected));

            value.Remove("foo1");
            value.Remove("foo2");
            value.Remove("foo3");
            value.Remove("foo4");

            value.Add("foo1", 1001);

            var val2 = new JObject();
            val2.Add("key1", "val1");
            value.Add("foo2", val2);

            value.Add("foo3", "bar1");

            value.Add("foo4", new JArray
            {
                "val1",
                "val2",
                3
            });

            var newValue = new JObject();
            var val3 = new JObject();
            val3.Add("key2", "val2");
            newValue.Add("foo2", val3);

            var newValue2 = new JObject();
            var val4 = new JObject();
            val4.Add("key1", "val3");
            newValue2.Add("foo2", val4);

            var array2 = new[]
            {
                new[]
                {
                    mergeKey,
                    value.ToString(Formatting.None)
                },
            };

            mStorage.multiMerge(array2, callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);
            Assert.IsNull(result);

            var array3 = new[]
            {
                new[]
                {
                    mergeKey,
                    newValue.ToString(Formatting.None),
                },
            };

            mStorage.multiMerge(array3, callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);
            Assert.IsNull(result);

            var array4 = new[]
            {
                new[]
                {
                    mergeKey,
                    newValue2.ToString(Formatting.None),
                },
            };

            mStorage.multiMerge(array4, callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);
            Assert.IsNull(result);

            value.Remove("foo2");
            var val5 = new JObject();
            val5.Add("key1", "val3");
            val5.Add("key2", "val2");
            value.Add("foo2", val5);

            mStorage.multiGet(str, callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);
            expected = JToken.FromObject(array);
            Assert.IsTrue(JToken.DeepEquals(value, JObject.Parse(result.Last.Value<JArray>().Last.Value<string>())));
        }

        [TestMethod]
        public void AsyncStorageModule_testGetAllKeys()
        {
            var mStorage = new AsyncStorageModule();
            var waitHandle = new AutoResetEvent(false);

            var error = default(JObject);
            var result = default(JArray);
            var callback = new MockCallback(res =>
            {
                error = res.Length > 0 ? (JObject)res[0] : null;
                result = res.Length > 1 ? (JArray)res[1] : null;
                waitHandle.Set();
            });

            mStorage.clear(callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);
            Assert.IsNull(result);

            var keys = new[] { "foo", "foo2" };
            var values = new[] { "bar", "bar2" };

            var keyValues = new[]
            {
                new[]
                {
                    keys[0],
                    values[0],
                },
                new[]
                {
                    keys[1],
                    values[1],
                },
            };

            mStorage.multiSet(keyValues, callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);
            Assert.IsNull(result);

            mStorage.getAllKeys(callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);

            var storedKeys = new JArray
            {
                keys[0],
                keys[1],
            };

            var set = new SortedSet<string>();
            IEnumerable<string> enumerator = storedKeys.Values<string>();

            foreach (var value in enumerator)
            {
                set.Add(value);
            }

            set.SymmetricExceptWith(result.Values<string>());
            Assert.AreEqual(set.Count, 0);

            mStorage.multiRemove(keys, callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);
            Assert.IsNull(result);

            mStorage.getAllKeys(callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);
            Assert.AreEqual(result.Count, 0);
        }

        [TestMethod]
        public void AsyncStorageModule_testClear()
        {
            var mStorage = new AsyncStorageModule();
            var waitHandle = new AutoResetEvent(false);

            var error = default(JObject);
            var result = default(JArray);
            var callback = new MockCallback(res =>
            {
                error = res.Length > 0 ? (JObject)res[0] : null;
                result = res.Length > 1 ? (JArray)res[1] : null;
                waitHandle.Set();
            });

            mStorage.clear(callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);
            Assert.IsNull(result);

            var keys = new[] { "foo", "foo2" };
            var values = new[] { "bar", "bar2" };

            var keyValues = new[]
            {
                new[]
                {
                    keys[0],
                    values[0],
                },
                new[]
                {
                    keys[1],
                    values[1],
                },
            };

            mStorage.multiSet(keyValues, callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);
            Assert.IsNull(result);

            mStorage.clear(callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);
            Assert.IsNull(result);

            mStorage.getAllKeys(callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);
            Assert.AreEqual(result.Count, 0);
        }

        [TestMethod]
        public void AsyncStorageModule_testHugeMultiGetMultiGet()
        {
            var mStorage = new AsyncStorageModule();
            var waitHandle = new AutoResetEvent(false);

            var error = default(JObject);
            var result = default(JArray);
            var callback = new MockCallback(res =>
            {
                error = res.Length > 0 ? (JObject)res[0] : null;
                result = res.Length > 1 ? (JArray)res[1] : null;
                waitHandle.Set();
            });

            mStorage.clear(callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);
            Assert.IsNull(result);

            // Limitation on Android - not a limitation on Windows
            // Test with many keys, so that it's above the 999 limit per batch imposed by SQLite.
            int keyCount = 1001;
            // don't set keys that divide by this magical number, so that we can check that multiGet works,
            // and returns null for missing keys
            int magicalNumber = 343;

            var keyValues = new List<string[]>();
            for (int i = 0; i < keyCount; i++)
            {
                if (i % magicalNumber > 0)
                {
                    var key = "key" + i;
                    var value = "value" + i;
                    keyValues.Add(new[]
                    {
                        key,
                        value,
                    });
                }
            }
            mStorage.multiSet(keyValues.ToArray(), callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);
            Assert.IsNull(result);

            var keys = new List<string>();
            for (int i = 0; i < keyCount; i++)
            {
                keys.Add("key" + i);
            }

            mStorage.multiGet(keys.ToArray(), callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);
            Assert.AreEqual(result.Count, keys.Count);

            var keyReceived = new bool[keyCount];

            for (int i = 0; i < keyCount; i++)
            {
                var keyValue = result[i];
                var key = keyValue.Value<JArray>().First.Value<string>().Substring(3);

                int idx = int.Parse(key);
                Assert.IsFalse(keyReceived[idx]);
                keyReceived[idx] = true;

                if (idx % magicalNumber > 0)
                {
                    var value = keyValue.Value<JArray>().Last.Value<string>().Substring(5);
                    Assert.AreEqual(key, value);
                }
                else
                {
                    Assert.IsTrue(keyValue.Value<JArray>().Last.Type == JTokenType.Null);
                }   
            }

            var keyRemoves = new List<string>();
            for (int i = 0; i < keyCount; i++)
            {
                if (i % 2 > 0)
                {
                    keyRemoves.Add("key" + i);
                }
            }

            mStorage.multiRemove(keyRemoves.ToArray(), callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);
            Assert.IsNull(result);

            mStorage.getAllKeys(callback);
            Assert.IsTrue(waitHandle.WaitOne());
            Assert.IsNull(error);
            Assert.AreEqual(result.Count, 499);
            for (int i = 0; i < result.Count; i++)
            {
                var key = result[i].Value<string>().Substring(3); ;
                int idx = int.Parse(key);
                Assert.AreEqual(idx % 2,0);
            }
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
                            if (value is bool || value is long || value is double || value is System.Guid || 
                                value is System.TimeSpan || value is System.Uri || value is System.DateTime)
                            {
                                Assert.AreEqual(value, o);
                            }
                            else if (value is string)
                            {
                                Assert.IsTrue((value as string).CompareTo(o as string) == 0);
                            }
                            else if (value is JArray || value is JRaw || value is JConstructor)
                            {
                                Assert.IsTrue(value.ToString().CompareTo(o.ToString()) == 0);
                            }
                            else if (value is JObject)
                            {
                                Assert.IsTrue(JToken.DeepEquals(value as JObject, o as JObject));
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

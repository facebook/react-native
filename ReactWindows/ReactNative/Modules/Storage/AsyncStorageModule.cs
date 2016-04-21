using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using System;
using System.Text;
using System.Threading.Tasks;
using Windows.Storage;

namespace ReactNative.Modules.Storage
{
    class AsyncStorageModule : NativeModuleBase
    {
        private const string DirectoryName = "AsyncStorage\\";
        private const string FileExtension = ".data";

        private readonly object _gate = new object();

        public override string Name
        {
            get
            {
                return "AsyncLocalStorage";
            }
        }

        [ReactMethod]
        public async void multiGet(string[] keys, ICallback callback)
        {
            if (keys == null)
            {
                callback.Invoke(AsyncStorageErrorHelpers.GetInvalidKeyError(null), null);
                return;
            }

            var error = default(JObject);
            var data = new JArray();

            await Task.Run(() =>
            {
                lock (_gate)
                {
                    foreach (var key in keys)
                    {
                        if (key == null)
                        {
                            error = AsyncStorageErrorHelpers.GetInvalidKeyError(null);
                            break;
                        }

                        var value = Get(key);
                        data.Add(new JArray(key, value));
                    }
                }
            });

            if (error != null)
            {
                callback.Invoke(error);
            }
            else
            {
                callback.Invoke(null, data);
            }
        }

        [ReactMethod]
        public async void multiSet(string[][] keyValueArray, ICallback callback)
        {
            if (keyValueArray == null || keyValueArray.Length == 0)
            {
                callback.Invoke(AsyncStorageErrorHelpers.GetInvalidKeyError(null));
                return;
            }

            var error = default(JObject);

            await Task.Run(() =>
            {
                lock (_gate)
                {
                    foreach (var pair in keyValueArray)
                    {
                        if (pair.Length != 2)
                        {
                            error = AsyncStorageErrorHelpers.GetInvalidValueError(null);
                            break;
                        }

                        if (pair[0] == null)
                        {
                            error = AsyncStorageErrorHelpers.GetInvalidKeyError(null);
                            break;
                        }

                        if (pair[1] == null)
                        {
                            error = AsyncStorageErrorHelpers.GetInvalidValueError(pair[0]);
                            break;
                        }

                        error = Set(pair[0], pair[1]);
                        if (error != null)
                        {
                            break;
                        }
                    }
                }
            });

            if (error != null)
            {
                callback.Invoke(error);
            }
            else
            {
                callback.Invoke();
            }
        }

        [ReactMethod]
        public async void multiRemove(string[] keys, ICallback callback)
        {
            if (keys == null || keys.Length == 0)
            {
                callback.Invoke(AsyncStorageErrorHelpers.GetInvalidKeyError(null));
                return;
            }

            var error = default(JObject);

            await Task.Run(() =>
            {
                lock (_gate)
                {
                    foreach (var key in keys)
                    {
                        if (key == null)
                        {
                            error = AsyncStorageErrorHelpers.GetInvalidKeyError(null);
                            break;
                        }

                        error = Remove(key);
                        if (error != null)
                        {
                            break;
                        }
                    }
                }
            });

            if (error != null)
            {
                callback.Invoke(error);
            }
            else
            {
                callback.Invoke();
            }
        }

        [ReactMethod]
        public async void multiMerge(string[][] keyValueArray, ICallback callback)
        {
            if (keyValueArray == null || keyValueArray.Length == 0)
            {
                callback.Invoke(AsyncStorageErrorHelpers.GetInvalidKeyError(null));
                return;
            }

            var error = default(JObject);

            await Task.Run(() =>
            {
                lock (_gate)
                {
                    foreach (var pair in keyValueArray)
                    {
                        if (pair.Length != 2)
                        {
                            error = AsyncStorageErrorHelpers.GetInvalidValueError(null);
                            break;
                        }

                        if (pair[0] == null)
                        {
                            error = AsyncStorageErrorHelpers.GetInvalidKeyError(null);
                            break;
                        }

                        if (pair[1] == null)
                        {
                            error = AsyncStorageErrorHelpers.GetInvalidValueError(pair[0]);
                            break;
                        }

                        error = Merge(pair[0], pair[1]);
                        if (error != null)
                        {
                            break;
                        }
                    }
                }
            });

            if (error != null)
            {
                callback.Invoke(error);
            }
            else
            {
                callback.Invoke();
            }
        }

        [ReactMethod]
        public async void clear(ICallback callback)
        {
            await Task.Run(() =>
            {
                lock (_gate)
                {
                    var localFolder = ApplicationData.Current.LocalFolder;
                    var storageItem = localFolder.TryGetItemAsync(DirectoryName).AsTask().Result;
                    if (storageItem != null)
                    {
                        storageItem.DeleteAsync().AsTask().Wait();
                    }
                }
            });

            callback.Invoke();
        }

        [ReactMethod]
        public async void getAllKeys(ICallback callback)
        {
            var keys = new JArray();

            await Task.Run(() =>
            {
                lock (_gate)
                {
                    var localFolder = ApplicationData.Current.LocalFolder;
                    var storageItem = localFolder.TryGetItemAsync(DirectoryName).AsTask().Result;
                    if (storageItem != null)
                    {
                        var directory = localFolder.GetFolderAsync(DirectoryName).AsTask().Result;
                        var items = directory.GetItemsAsync().AsTask().Result;
                        foreach (var item in items)
                        {
                            var itemName = item.Name;
                            var itemLength = itemName.Length;
                            var extLength = FileExtension.Length;
                            if (itemName.EndsWith(FileExtension) && itemLength > extLength)
                            {
                                keys.Add(item.Name.Substring(0, itemLength - extLength));
                            }
                        }
                    }
                }
            });

            callback.Invoke(null, keys);
        }

        private string Get(string key)
        {
            var localFolder = ApplicationData.Current.LocalFolder;
            var fileName = GetFileName(key);

            var storageItem = localFolder.TryGetItemAsync(fileName).AsTask().Result;
            if (storageItem != null)
            {
                var file = localFolder.GetFileAsync(fileName).AsTask().Result;
                return FileIO.ReadTextAsync(file).AsTask().Result;
            }

            return null;
        }

        private JObject Merge(string key, string value)
        {
            var oldValue = Get(key);

            var newValue = default(string);
            if (oldValue == null)
            {
                newValue = value;
            }
            else
            {
                var oldJson = JObject.Parse(oldValue);
                var newJson = JObject.Parse(value);
                DeepMergeInto(oldJson, newJson);
                newValue = oldJson.ToString(Formatting.None);
            }

            return Set(key, newValue);
        }

        private JObject Remove(string key)
        {
            var localFolder = ApplicationData.Current.LocalFolder;
            var fileName = GetFileName(key);
            var storageItem = localFolder.TryGetItemAsync(fileName).AsTask().Result;
            if (storageItem != null)
            {
                storageItem.DeleteAsync().AsTask().Wait();
            }

            return null;
        }

        private JObject Set(string key, string value)
        {
            var localFolder = ApplicationData.Current.LocalFolder;
            var file = localFolder.CreateFileAsync(GetFileName(key), CreationCollisionOption.ReplaceExisting).AsTask().Result;
            FileIO.WriteTextAsync(file, value).AsTask().Wait();
            return default(JObject);
        }

        private static string GetFileName(string key)
        {
            var sb = new StringBuilder();
            sb.Append(DirectoryName);
            foreach (var ch in key)
            {
                switch (ch)
                {
                    case '\\':
                        sb.Append("{bsl}");
                        break;
                    case '/':
                        sb.Append("{fsl}");
                        break;
                    case ':':
                        sb.Append("{col}");
                        break;
                    case '*':
                        sb.Append("{asx}");
                        break;
                    case '?':
                        sb.Append("{q}");
                        break;
                    case '<':
                        sb.Append("{lt}");
                        break;
                    case '>':
                        sb.Append("{gt}");
                        break;
                    case '|':
                        sb.Append("{bar}");
                        break;
                    case '"':
                        sb.Append("{quo}");
                        break;
                    case '.':
                        sb.Append("{dot}");
                        break;
                    case '{':
                        sb.Append("{ocb}");
                        break;
                    case '}':
                        sb.Append("{ccb}");
                        break;
                    default:
                        sb.Append(ch);
                        break;
                }
            }

            sb.Append(FileExtension);

            return sb.ToString();
        }

        private static void DeepMergeInto(JObject oldJson, JObject newJson)
        {
            foreach (var property in newJson)
            {
                var key = property.Key;
                var value = property.Value;
                var newInner = value as JObject;
                var oldInner = oldJson[key] as JObject;
                if (newInner != null && oldInner != null)
                {
                    DeepMergeInto(oldInner, newInner);
                }
                else
                {
                    oldJson[key] = value;
                }
            }
        }
    }
}

using System;
using System.IO;
using System.Threading.Tasks;
using Windows.Storage;

namespace ReactNative.Bridge
{
    /// <summary>
    /// A class that stores JavaScript bundle information and allows the
    /// <see cref="IReactInstance"/> to load a correct bundle through the
    /// <see cref="IReactBridge"/>.
    /// </summary>
    public abstract class JavaScriptBundleLoader
    {
        /// <summary>
        /// The source URL of the bundle.
        /// </summary>
        public abstract string SourceUrl { get; }

        /// <summary>
        /// Initializes the JavaScript bundle loader, typically making an
        /// asynchronous call to cache the bundle in memory.
        /// </summary>
        /// <returns>A task to await initialization.</returns>
        public abstract Task InitializeAsync();

        /// <summary>
        /// Loads the bundle into a JavaScript executor.
        /// </summary>
        /// <param name="executor">The JavaScript executor.</param>
        public abstract void LoadScript(IReactBridge executor);

        /// <summary>
        /// This loader will read the file from the project directory.
        /// </summary>
        /// <param name="fileName">The file name.</param>
        /// <returns>The JavaScript bundle loader.</returns>
        public static JavaScriptBundleLoader CreateFileLoader(string fileName)
        {
            return new FileJavaScriptBundleLoader(fileName);
        }

        /// <summary>
        /// This loader will use the cached bundle from the
        /// <see cref="DevSupport.IDevSupportManager"/>.
        /// </summary>
        /// <param name="sourceUrl">The source URL.</param>
        /// <param name="cachedFileLocation">The cached bundle.</param>
        /// <returns>The JavaScript bundle loader.</returns>
        public static JavaScriptBundleLoader CreateCachedBundleFromNetworkLoader(string sourceUrl, string cachedFileLocation)
        {
            return new CachedJavaScriptBundleLoader(sourceUrl, cachedFileLocation);
        }

        class FileJavaScriptBundleLoader : JavaScriptBundleLoader
        {
            private string _script;

            public FileJavaScriptBundleLoader(string fileName)
            {
                SourceUrl = fileName;
            }

            public override string SourceUrl
            {
                get;
            }

            public override async Task InitializeAsync()
            {
                try
                {
                    var storageFile = SourceUrl.StartsWith("ms-appx:///")
                        ? await StorageFile.GetFileFromApplicationUriAsync(new Uri(SourceUrl))
                        : await StorageFile.GetFileFromPathAsync(SourceUrl);

                    using (var stream = await storageFile.OpenStreamForReadAsync())
                    using (var reader = new StreamReader(stream))
                    {
                        _script = await reader.ReadToEndAsync();
                    }
                }
                catch (Exception ex)
                {
                    var exceptionMessage = String.Format("File read exception for asset {0}", SourceUrl);
                    throw new InvalidOperationException(exceptionMessage, ex);
                }
            }

            public override void LoadScript(IReactBridge bridge)
            {
                if (_script == null)
                {
                    throw new InvalidOperationException("Bundle loader has not yet been initialized.");
                }

                bridge.RunScript(_script);
            }
        }

        class CachedJavaScriptBundleLoader : JavaScriptBundleLoader
        {
            private readonly string _cachedFileLocation;
            private string _script;

            public CachedJavaScriptBundleLoader(string sourceUrl, string cachedFileLocation)
            {
                SourceUrl = sourceUrl;
                _cachedFileLocation = cachedFileLocation;
            }

            public override string SourceUrl { get; }

            public override async Task InitializeAsync()
            {
                try
                {
                    var storageFile = await StorageFile.GetFileFromPathAsync(_cachedFileLocation);
                    using (var stream = await storageFile.OpenStreamForReadAsync())
                    using (var reader = new StreamReader(stream))
                    {
                        _script = await reader.ReadToEndAsync();
                    }
                }
                catch (Exception ex)
                {
                    var exceptionMessage = String.Format("File read exception for asset {0}", SourceUrl);
                    throw new InvalidOperationException(exceptionMessage, ex);
                }
            }

            public override void LoadScript(IReactBridge executor)
            {
                executor.RunScript(_script);
            }
        }
    }
}

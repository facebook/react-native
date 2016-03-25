using ReactNative.Bridge;
using System;
using Windows.System;

namespace ReactNative.Modules.Launch
{
    class LauncherModule : NativeModuleBase
    {
        public override string Name
        {
            get
            {
                return "LauncherWindows";
            }
        }

        [ReactMethod]
        public async void openURL(string url, IPromise promise)
        {
            if (url == null)
            {
                promise.Reject(new ArgumentNullException(nameof(url)));
                return;
            }

            var uri = default(Uri);
            if (!Uri.TryCreate(url, UriKind.Absolute, out uri))
            {
                promise.Reject(new ArgumentException($"URL argument '{uri}' is not valid."));
                return;
            }

            try
            {
                await Launcher.LaunchUriAsync(uri).AsTask().ConfigureAwait(false);
                promise.Resolve(true);
            }
            catch (Exception ex)
            {
                promise.Reject(new InvalidOperationException(
                    $"Could not open URL '{url}'.", ex));
            }
        }

        [ReactMethod]
        public async void canOpenURL(string url, IPromise promise)
        {
            if (url == null)
            {
                promise.Reject(new ArgumentNullException(nameof(url)));
                return;
            }

            var uri = default(Uri);
            if (!Uri.TryCreate(url, UriKind.Absolute, out uri))
            {
                promise.Reject(new ArgumentException($"URL argument '{uri}' is not valid."));
                return;
            }

            try
            {
                var support = await Launcher.QueryUriSupportAsync(uri, LaunchQuerySupportType.Uri).AsTask().ConfigureAwait(false);
                promise.Resolve(support == LaunchQuerySupportStatus.Available);
            }
            catch (Exception ex)
            {
                promise.Reject(new InvalidOperationException(
                    $"Could not check if URL '{url}' can be opened.", ex));
            }
        }
    }
}

using ReactNative.Bridge;
using System;
using Windows.UI.Core;
using DataTransfer = Windows.ApplicationModel.DataTransfer;

namespace ReactNative.Modules.Clipboard
{
    /// <summary>
    /// A module that allows JS to get/set clipboard contents.
    /// </summary>
    class ClipboardModule : ReactContextNativeModuleBase
    {
        /// <summary>
        /// Instantiates the <see cref="ClipboardModule"/>.
        /// </summary>
        /// <param name="reactContext">The context.</param>
        internal ClipboardModule(ReactContext reactContext)
            : base(reactContext)
        {
        }

        /// <summary>
        /// The name of the native module.
        /// </summary>
        public override string Name
        {
            get
            {
                return "Clipboard";
            }
        }

        /// <summary>
        /// Get the clipboard content through a promise.
        /// </summary>
        /// <param name="promise">The promise.</param>
        [ReactMethod]
        public void getString(IPromise promise)
        {
            if (promise == null)
            {
                throw new ArgumentNullException(nameof(promise));
            }

            RunOnDispatcher(async () =>
            {
                try
                {
                    var clip = DataTransfer.Clipboard.GetContent();
                    if (clip == null)
                    {
                        promise.Resolve("");
                    }
                    else if (clip.Contains(DataTransfer.StandardDataFormats.Text))
                    {
                        var text = await clip.GetTextAsync();
                        promise.Resolve(text);
                    }
                    else
                    {
                        promise.Resolve("");
                    }
                }
                catch (Exception ex)
                {
                    promise.Reject(ex);
                }
            });
        }

        /// <summary>
        /// Add text to the clipboard or clear the clipboard.
        /// </summary>
        /// <param name="text">The text. If null clear clipboard.</param>
        [ReactMethod]
        public void setString(string text)
        {
            RunOnDispatcher(() =>
            {
                if (text == null)
                {
                    DataTransfer.Clipboard.Clear();
                }
                else
                {
                    var package = new DataTransfer.DataPackage();
                    package.SetData(DataTransfer.StandardDataFormats.Text, text);
                    DataTransfer.Clipboard.SetContent(package);
                }
            });
        }

        /// <summary>
        /// Run action in UI thread.
        /// </summary>
        /// <param name="action">The action.</param>
        private static async void RunOnDispatcher(DispatchedHandler action)
        {
            await Windows.ApplicationModel.Core.CoreApplication.MainView.CoreWindow.Dispatcher.RunAsync(CoreDispatcherPriority.Normal, action);
        }
    }
}

using ReactNative.Bridge;
using System;
using DT = Windows.ApplicationModel.DataTransfer;

namespace ReactNative.Modules.Clipboard
{
    /**
    * A module that allows JS to get/set clipboard contents.
    */
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

        [ReactMethod]
        public void getString(IPromise promise)
        {
            if (promise == null)
            {
                throw new ArgumentNullException(nameof(promise));
            }

            DispatcherHelpers.RunOnDispatcher(async () =>
            {
                try
                {
                    var clip = DT.Clipboard.GetContent();
                    if (clip == null)
                    {
                        promise.Resolve("");
                    }
                    else if (clip.Contains(DT.StandardDataFormats.Text))
                    {
                        string text = await clip.GetTextAsync();
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

        [ReactMethod]
        public void setString(string text)
        {
            DispatcherHelpers.RunOnDispatcher(() =>
            {
                try
                {
                    if (text == null)
                    {
                        DT.Clipboard.Clear();
                    }
                    else
                    {
                        DT.DataPackage package = new DT.DataPackage();
                        package.SetData(DT.StandardDataFormats.Text, text);
                        DT.Clipboard.SetContent(package);
                    }
                }
                catch (Exception) {}
            });
        }
    }
}

using ReactNative.Bridge;

namespace ReactNative.Modules.Image
{
    class ImageLoaderModule : NativeModuleBase
    {
        public override string Name
        {
            get
            {
                return "ImageLoader";
            }
        }

        [ReactMethod]
        public void prefetchImage(string uriString, IPromise promise)
        {
            // TODO: (#366) Implement prefetch mechanism.
            promise.Reject("Prefect is not yet supported.");
        }
    }
}

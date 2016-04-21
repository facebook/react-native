namespace ReactNative.Views.Image
{
    /// <summary>
    /// A class for managing virtual images within a parent element.
    /// </summary>
    public class ReactVirtualImageManager : ReactImageManager
    {
        private const string ReactClass = "RCTVirtualImage";

        /// <summary>
        /// The name of the view manager.
        /// </summary>
        public override string Name
        {
            get
            {
                return ReactClass;
            }
        }
    }
}

namespace ReactNative.Views.Text
{
    /// <summary>
    /// A virtual view manager for raw text nodes.
    /// </summary>
    public class ReactVirtualTextViewManager : ReactRawTextManager
    {
        private const string ReactClass = "RCTVirtualText";

        /// <summary>
        /// The view manager name.
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

namespace ReactNative.Views.Text
{
    public class ReactVirtualTextViewManager : ReactRawTextManager
    {
        private const string ReactClass = "RCTVirtualText";

        public override string Name
        {
            get
            {
                return ReactClass;
            }
        }
    }
}

namespace ReactNative.UIManager
{
    /// <summary>
    /// View manager for react root view components.
    /// </summary>
    public class RootViewManager : PanelViewGroupManager<SizeMonitoringPanel>
    {
        /// <summary>
        /// The name of the react root view.
        /// </summary>
        public override string Name
        {
            get
            {
                return "RootView";
            }
        }

        /// <summary>
        /// Creates a new view instance of type <see cref="Windows.UI.Xaml.Controls.Panel"/>.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <returns>The view instance.</returns>
        protected override SizeMonitoringPanel CreateViewInstanceCore(ThemedReactContext reactContext)
        {
            return new SizeMonitoringPanel();
        }
    }
}
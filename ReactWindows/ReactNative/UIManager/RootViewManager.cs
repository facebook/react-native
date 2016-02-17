namespace ReactNative.UIManager
{
    /// <summary>
    /// View manager for react root view components.
    /// </summary>
    public class RootViewManager : PanelViewParentManager<SizeMonitoringCanvas>
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
        /// Called when view is detached from view hierarchy and allows for 
        /// additional cleanup by the <see cref="RootViewManager"/>.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <param name="view">The view.</param>
        public override void OnDropViewInstance(ThemedReactContext reactContext, SizeMonitoringCanvas view)
        {
            view.RemoveSizeChanged();
        }

        /// <summary>
        /// Creates a new view instance of type <see cref="Windows.UI.Xaml.Controls.Panel"/>.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <returns>The view instance.</returns>
        protected override SizeMonitoringCanvas CreateViewInstance(ThemedReactContext reactContext)
        {
            return new SizeMonitoringCanvas();
        }
    }
}
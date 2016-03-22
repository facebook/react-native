using Windows.Foundation;
using Windows.UI;

namespace ReactNative.Modules.StatusBar
{
    /// <summary>
    /// An interface for statusbar.
    /// </summary>
    public interface IStatusBar
    {
        /// <summary>
        /// Gets or sets the opacity of the background color of the status bar.
        /// </summary>
        /// <returns>The opacity of the background color of the status bar.</returns>
        double BackgroundOpacity { get; set; }

        /// <summary>
        /// Gets or sets the background color of the status bar. The alpha channel of the color is not used.
        /// </summary>
        /// <returns>The background color of the status bar.</returns>
        Color? BackgroundColor { get; set; }

        /// <summary>
        /// Hides the status bar.
        /// </summary>
        /// <returns>The asynchronous results of the operation. Use this to determine when the async call is complete</returns>
        IAsyncAction HideAsync();

        /// <summary>
        /// Shows the status bar.
        /// </summary>
        /// <returns>The asynchronous results of the operation. Use this to determine when the async call is complete</returns>
        IAsyncAction ShowAsync();
    }
}

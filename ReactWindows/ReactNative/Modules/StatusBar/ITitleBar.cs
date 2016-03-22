using Windows.UI;

namespace ReactNative.Modules.StatusBar
{
    /// <summary>
    /// An interface for titlebar.
    /// </summary>
    public interface ITitleBar
    {
        /// <summary>
        /// Gets or sets the background color of the status bar. The alpha channel of the color is not used.
        /// </summary>
        /// <returns> The background color of the status bar.</returns>
        Color? BackgroundColor { get; set; }
    }
}

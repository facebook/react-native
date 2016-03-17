using Windows.UI.Xaml;

namespace ReactNative.UIManager
{
    /// <summary>
    /// Interface for overriding layout behavior for a view.
    /// </summary>
    public interface ILayoutManager
    {
        /// <summary>
        /// Updates the layout of the current instance.
        /// </summary>
        /// <param name="x">The left coordinate.</param>
        /// <param name="y">The top coordinate.</param>
        /// <param name="width">The layout width.</param>
        /// <param name="height">The layout height.</param>
        void UpdateLayout(int x, int y, int width, int height);
    }
}

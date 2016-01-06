using Windows.UI.Xaml;

namespace ReactNative.UIManager
{
    /// <summary>
    /// Common base class for most of the <see cref="ViewManager"/>s. 
    /// It provides support for most common properties through extending <see cref="BaseViewManager"/>.
    /// </summary>
    /// <typeparam name="TFrameworkElement">Type of framework element.</typeparam>
    public abstract class SimpleViewManager<TFrameworkElement> : BaseViewManager<TFrameworkElement, LayoutShadowNode>
        where TFrameworkElement : FrameworkElement
    {
        /// <summary>
        /// Creates a <see cref="LayoutShadowNode"/> instance.
        /// </summary>
        /// <returns>The shadow node instance.</returns>
        protected sealed override LayoutShadowNode CreateShadowNodeInstanceCore()
        {
            return new LayoutShadowNode();
        }

        /// <summary>
        /// Implement this method to receive optional extra data enqueued from
        /// the corresponding instance of <see cref="ReactShadowNode"/> in
        /// <see cref="ReactShadowNode.OnCollectExtraUpdates"/>.
        /// </summary>
        /// <param name="root">The root view.</param>
        /// <param name="extraData">The extra data.</param>
        protected override void UpdateExtraData(TFrameworkElement root, object extraData)
        {
        }
    }
}

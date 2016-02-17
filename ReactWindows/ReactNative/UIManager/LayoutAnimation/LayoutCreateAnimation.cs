namespace ReactNative.UIManager.LayoutAnimation
{
    /// <summary>
    /// Base Layout animation manager responsible for establishing the basic
    /// animation <see cref="Storyboard"/>.
    /// </summary>
    class LayoutCreateAnimation : BaseLayoutAnimation
    {
        /// <summary>
        /// Signals if the animation should be performed in reverse.
        /// </summary>
        protected override bool IsReverse
        {
            get
            {
                return false;
            }
        }
    }
}

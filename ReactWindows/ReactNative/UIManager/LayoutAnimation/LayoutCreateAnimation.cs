namespace ReactNative.UIManager.LayoutAnimation
{
    /// <summary>
    /// Layout animation manager for newly created views.
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

namespace ReactNative.Views.Scroll
{
    interface IScrollCommandHandler<T>
    {
        void ScrollTo(T scrollView, double x, double y, bool animated);
    }
}

using Facebook.CSSLayout;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;

namespace ReactNative.UIManager
{
    static class BorderExtensions
    {
        public static void SetBorderWidth(this Border border, CSSSpacingType kind, double width)
        {
            var thickness = border.BorderThickness;
            switch (kind)
            {
                case CSSSpacingType.Left:
                    thickness.Left = width;
                    break;
                case CSSSpacingType.Top:
                    thickness.Top = width;
                    break;
                case CSSSpacingType.Right:
                    thickness.Right = width;
                    break;
                case CSSSpacingType.Bottom:
                    thickness.Bottom = width;
                    break;
                case CSSSpacingType.All:
                    thickness = new Thickness(width);
                    break;
            }

            border.BorderThickness = thickness;
        }
    }
}

using Facebook.CSSLayout;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;

namespace ReactNative.UIManager
{
    static class BorderExtensions
    {
        public static void SetBorderWidth(this Border border, CSSSpacingType kind, double? width)
        {
            if (!width.HasValue)
            {
                border.BorderThickness = default(Thickness);
                return;
            }

            var widthValue = width.Value;
            var thickness = border.BorderThickness;
            switch (kind)
            {
                case CSSSpacingType.Left:
                    thickness.Left = widthValue;
                    break;
                case CSSSpacingType.Top:
                    thickness.Top = widthValue;
                    break;
                case CSSSpacingType.Right:
                    thickness.Right = widthValue;
                    break;
                case CSSSpacingType.Bottom:
                    thickness.Bottom = widthValue;
                    break;
                case CSSSpacingType.All:
                    thickness = new Thickness(widthValue);
                    break;
            }

            border.BorderThickness = thickness;
        }
    }
}

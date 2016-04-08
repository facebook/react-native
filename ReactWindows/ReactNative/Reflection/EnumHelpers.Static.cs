#if NO_REFLECTION
using Facebook.CSSLayout;
using ReactNative.UIManager.LayoutAnimation;
using System;
using Windows.UI.Text;
using Windows.UI.Xaml;

namespace ReactNative.Reflection
{
    static partial class EnumHelpers
    {
        public static T ParseStatic<T>(string value)
        {
            if (typeof(T) == typeof(CSSFlexDirection))
            {
                return (T)ParseFlexDirection(value);
            }
            else if (typeof(T) == typeof(CSSWrap))
            {
                return (T)ParseWrap(value);
            }
            else if (typeof(T) == typeof(CSSAlign))
            {
                return (T)ParseAlign(value);
            }
            else if (typeof(T) == typeof(CSSJustify))
            {
                return (T)ParseJustify(value);
            }
            else if (typeof(T) == typeof(CSSPositionType))
            {
                return (T)ParsePositionType(value);
            }
            else if (typeof(T) == typeof(TextAlignment))
            {
                return (T)ParseTextAlignment(value);
            }
            else if (typeof(T) == typeof(VerticalAlignment))
            {
                return (T)ParseVerticalAlignment(value);
            }
            else if (typeof(T) == typeof(FontStyle))
            {
                return (T)ParseFontStyle(value);
            }
            else if (typeof(T) == typeof(AnimatedPropertyType))
            {
                return (T)ParseAnimatedPropertyType(value);
            }
            else if (typeof(T) == typeof(InterpolationType))
            {
                return (T)ParseInterpolationType(value);
            }
            else
            {
                throw new NotImplementedException(
                    $"Enum parsing is not implemented for type '{typeof(T)}'.");
            }
        }

        private static object ParseFlexDirection(string value)
        {
            switch (value)
            {
                case "column":
                    return CSSFlexDirection.Column;
                case "columnReverse":
                    return CSSFlexDirection.ColumnReverse;
                case "row":
                    return CSSFlexDirection.Row;
                case "rowReverse":
                    return CSSFlexDirection.RowReverse;
                default:
                    throw new ArgumentOutOfRangeException(
                        nameof(value), $"Unexpected value '{value}' for enum type '{typeof(CSSFlexDirection)}'.");
            }
        }

        private static object ParseWrap(string value)
        {
            switch (value)
            {
                case "nowrap":
                    return CSSWrap.NoWrap;
                case "wrap":
                    return CSSWrap.Wrap;
                default:
                    throw new ArgumentOutOfRangeException(
                        nameof(value), $"Unexpected value '{value}' for enum type '{typeof(CSSWrap)}'.");
            }
        }

        private static object ParseAlign(string value)
        {
            switch (value)
            {
                case "auto":
                    return CSSAlign.Auto;
                case "flex-start":
                    return CSSAlign.FlexStart;
                case "center":
                    return CSSAlign.Center;
                case "flex-end":
                    return CSSAlign.FlexEnd;
                case "stretch":
                    return CSSAlign.Stretch;
                default:
                    throw new ArgumentOutOfRangeException(
                        nameof(value), $"Unexpected value '{value}' for enum type '{typeof(CSSAlign)}'.");
            }
        }

        private static object ParseJustify(string value)
        {
            switch (value)
            {
                case "flex-start":
                    return CSSJustify.FlexStart;
                case "center":
                    return CSSJustify.Center;
                case "flex-end":
                    return CSSJustify.FlexEnd;
                case "space-between":
                    return CSSJustify.SpaceBetween;
                case "space-around":
                    return CSSJustify.SpaceAround;
                default:
                    throw new ArgumentOutOfRangeException(
                        nameof(value), $"Unexpected value '{value}' for enum type '{typeof(CSSJustify)}'.");
            }
        }

        private static object ParsePositionType(string value)
        {
            switch (value)
            {
                case "relative":
                    return CSSPositionType.Relative;
                case "absolute":
                    return CSSPositionType.Absolute;
                default:
                    throw new ArgumentOutOfRangeException(
                        nameof(value), $"Unexpected value '{value}' for enum type '{typeof(CSSPositionType)}'.");
            }
        }

        private static object ParseTextAlignment(string value)
        {
            switch (value)
            {
                case "center":
                    return TextAlignment.Center;
                case "left":
                    return TextAlignment.Left;
                case "right":
                    return TextAlignment.Right;
                case "justify":
                    return TextAlignment.Justify;
                default:
                    throw new ArgumentOutOfRangeException(
                        nameof(value), $"Unexpected value '{value}' for enum type '{typeof(TextAlignment)}'.");
            }
        }

        private static object ParseVerticalAlignment(string value)
        {
            switch (value)
            {
                case "top":
                    return VerticalAlignment.Top;
                case "center":
                    return VerticalAlignment.Center;
                case "bottom":
                    return VerticalAlignment.Bottom;
                case "stretch":
                    return VerticalAlignment.Stretch;
                default:
                    throw new ArgumentOutOfRangeException(
                        nameof(value), $"Unexpected value '{value}' for enum type '{typeof(VerticalAlignment)}'.");
            }
        }

        private static object ParseFontStyle(string value)
        {
            switch (value)
            {
                case "normal":
                    return FontStyle.Normal;
                case "italic":
                    return FontStyle.Italic;
                default:
                    throw new ArgumentOutOfRangeException(
                        nameof(value), $"Unexpected value '{value}' for enum type '{typeof(FontStyle)}'.");
            }
        }

        private static object ParseAnimatedPropertyType(string value)
        {
            switch (value)
            {
                case "opacity":
                    return AnimatedPropertyType.Opacity;
                case "scaleXY":
                    return AnimatedPropertyType.ScaleXY;
                default:
                    throw new ArgumentOutOfRangeException(
                        nameof(value), $"Unexpected value '{value}' for enum type '{typeof(AnimatedPropertyType)}'.");
            }
        }

        private static object ParseInterpolationType(string value)
        {
            switch (value)
            {
                case "linear":
                    return InterpolationType.Linear;
                case "easeIn":
                    return InterpolationType.EaseIn;
                case "easeOut":
                    return InterpolationType.EaseOut;
                case "easeInEaseOut":
                    return InterpolationType.EaseInEaseOut;
                case "spring":
                    return InterpolationType.Spring;
                default:
                    throw new ArgumentOutOfRangeException(
                        nameof(value), $"Unexpected value '{value}' for enum type '{typeof(InterpolationType)}'.");
            }
        }
    }
}
#endif
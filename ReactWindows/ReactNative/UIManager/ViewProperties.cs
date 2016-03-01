using Facebook.CSSLayout;
using System.Collections.Generic;
using System.Linq;

namespace ReactNative.UIManager
{
    /// <summary>
    /// Property keys for React views.
    /// </summary>
    public static class ViewProperties
    {
#pragma warning disable CS1591
        public const string ViewClassName = "RCTView";

        // Layout only (only affect positions of children, causes no drawing)
        // !!! Keep in sync with s_layoutOnlyProperties below !!!
        public const string AlignItems = "alignItems";
        public const string AlignSelf = "alignSelf";
        public const string Bottom = "bottom";
        public const string Collapsible = "collapsable";
        public const string Flex = "flex";
        public const string FlexDirection = "flexDirection";
        public const string FlexWrap = "flexWrap";
        public const string Height = "height";
        public const string JustifyContent = "justifyContent";
        public const string Left = "left";

        public const string Margin = "margin";
        public const string MarginVertical = "marginVertical";
        public const string MarginHorizontal = "marginHorizontal";
        public const string MarginLeft = "marginLeft";
        public const string MarginRight = "marginRight";
        public const string MarginTop = "marginTop";
        public const string MarginBottom = "marginBottom";

        public const string Padding = "padding";
        public const string PaddingVertical = "paddingVertical";
        public const string PaddingHorizontal = "paddingHorizontal";
        public const string PaddingLeft = "paddingLeft";
        public const string PaddingRight = "paddingRight";
        public const string PaddingTop = "paddingTop";
        public const string PaddingBottom = "paddingBottom";

        public const string Position = "position";
        public const string Right = "right";
        public const string Top = "top";
        public const string Width = "width";
      
        // Properties that affect more than just layout
        public const string Disabled = "disabled";
        public const string BackgroundColor = "backgroundColor";
        public const string Color = "color";
        public const string FontSize = "fontSize";
        public const string FontWeight = "fontWeight";
        public const string FontStyle = "fontStyle";
        public const string FontFamily = "fontFamily";
        public const string LineHeight = "lineHeight";
        public const string NeedsOffscreenAlphaCompositing = "needsOffscreenAlphaCompositing";
        public const string NumberOfLines = "numberOfLines";
        public const string Value = "value";
        public const string ResizeMode = "resizeMode";
        public const string TextAlign = "textAlign";

        public const string BorderWidth = "borderWidth";
        public const string BorderLeftWidth = "borderLeftWidth";
        public const string BorderTopWidth = "borderTopWidth";
        public const string BorderRightWidth = "borderRightWidth";
        public const string BorderBottomWidth = "borderBottomWidth";
#pragma warning restore CS1591

        /// <summary>
        /// Ordered list of margin spacing types.
        /// </summary>
        public static readonly IReadOnlyList<CSSSpacingType> PaddingMarginSpacingTypes = 
            new List<CSSSpacingType>
            {
                CSSSpacingType.All,
                CSSSpacingType.Vertical,
                CSSSpacingType.Horizontal,
                CSSSpacingType.Left,
                CSSSpacingType.Right,
                CSSSpacingType.Top,
                CSSSpacingType.Bottom,
            };

        /// <summary>
        /// Ordered list of border spacing types.
        /// </summary>
        public static readonly IReadOnlyList<CSSSpacingType> BorderSpacingTypes =
            new List<CSSSpacingType>
            {
                CSSSpacingType.All,
                CSSSpacingType.Left,
                CSSSpacingType.Right,
                CSSSpacingType.Top,
                CSSSpacingType.Bottom,
            };

        private static readonly HashSet<string> s_layoutOnlyProperties =
            new HashSet<string>
            {
                AlignItems,
                AlignSelf,
                Bottom,
                Collapsible,
                Flex,
                FlexDirection,
                FlexWrap,
                Height,
                JustifyContent,
                Left,
                
                Margin,
                MarginVertical,
                MarginHorizontal,
                MarginLeft,
                MarginRight,
                MarginTop,
                MarginBottom,
                
                Padding,
                PaddingVertical,
                PaddingHorizontal,
                PaddingLeft,
                PaddingRight,
                PaddingTop,
                PaddingBottom,
      
                Position,
                Right,
                Top,
                Width,
            };

        /// <summary>
        /// Checks if the property key is layout-only.
        /// </summary>
        /// <param name="key">The key.</param>
        /// <returns>
        /// <b>true</b> if the property is layout-only, <b>false</b> otherwise.
        /// </returns>
        public static bool IsLayoutOnly(string key)
        {
            return s_layoutOnlyProperties.Contains(key);
        }
    }
}
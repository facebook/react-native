using Facebook.CSSLayout;

namespace ReactNative.UIManager
{
    static class CSSNodeExtensions
    {
        public static float GetLeftBorderWidth(this CSSNode node)
        {
            var width = node.GetBorder(CSSSpacingType.Left);
            if (!CSSConstants.IsUndefined(width))
            {
                return width;
            }

            width = node.GetBorder(CSSSpacingType.Horizontal);
            if (!CSSConstants.IsUndefined(width))
            {
                return width;
            }

            width = node.GetBorder(CSSSpacingType.Start);
            if (!CSSConstants.IsUndefined(width))
            {
                return width;
            }

            width = node.GetBorder(CSSSpacingType.All);
            if (!CSSConstants.IsUndefined(width))
            {
                return width;
            }

            return 0.0f;
        }

        public static float GetTopBorderWidth(this CSSNode node)
        {
            var width = node.GetBorder(CSSSpacingType.Top);
            if (!CSSConstants.IsUndefined(width))
            {
                return width;
            }

            width = node.GetBorder(CSSSpacingType.Vertical);
            if (!CSSConstants.IsUndefined(width))
            {
                return width;
            }

            width = node.GetBorder(CSSSpacingType.Start);
            if (!CSSConstants.IsUndefined(width))
            {
                return width;
            }

            width = node.GetBorder(CSSSpacingType.All);
            if (!CSSConstants.IsUndefined(width))
            {
                return width;
            }

            return 0.0f;
        }
    }
}

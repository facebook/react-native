using Facebook.CSSLayout;
using ReactNative.Reflection;
using ReactNative.UIManager.Annotations;

namespace ReactNative.UIManager
{
    /// <summary>
    /// Shadow node subclass that supplies setters for base view layout
    /// properties such as width, height, flex properties, borders, etc.
    /// </summary>
    public class LayoutShadowNode : ReactShadowNode
    {
        private const float Undefined = CSSConstants.Undefined;

        /// <summary>
        /// Set the width of the shadow node.
        /// </summary>
        /// <param name="width">The width.</param>
        [ReactProp(ViewProps.Width, DefaultFloat = Undefined)]
        public void SetWidth(float? width)
        {
            Width = width ?? CSSConstants.Undefined;
        }

        /// <summary>
        /// Set the heigth of the shadow node.
        /// </summary>
        /// <param name="height">The height.</param>
        [ReactProp(ViewProps.Height, DefaultFloat = Undefined)]
        public void SetHeight(float? height)
        {
            Height = height ?? CSSConstants.Undefined;
        }

        /// <summary>
        /// Sets the left position of the shadow node.
        /// </summary>
        /// <param name="left">The left position.</param>
        [ReactProp(ViewProps.Left, DefaultFloat = Undefined)]
        public void SetLeft(float? left)
        {
            PositionLeft = left ?? CSSConstants.Undefined;
        }

        /// <summary>
        /// Sets the top position of the shadow node.
        /// </summary>
        /// <param name="top">The top position.</param>
        [ReactProp(ViewProps.Top, DefaultFloat = Undefined)]
        public void SetTop(float? top)
        {
            PositionTop = top ?? CSSConstants.Undefined;
        }

        /// <summary>
        /// Sets the bottom position of the shadow node.
        /// </summary>
        /// <param name="bottom">The bottom position.</param>
        [ReactProp(ViewProps.Bottom, DefaultFloat = Undefined)]
        public void SetBottom(float? bottom)
        {
            PositionBottom = bottom ?? CSSConstants.Undefined;
        }

        /// <summary>
        /// Sets the right position of the shadow node.
        /// </summary>
        /// <param name="right">The right position.</param>
        [ReactProp(ViewProps.Right, DefaultFloat = Undefined)]
        public void SetRight(float? right)
        {
            PositionRight = right ?? CSSConstants.Undefined;
        }

        /// <summary>
        /// Sets the flex of the shadow node.
        /// </summary>
        /// <param name="flex">The flex value.</param>
        [ReactProp(ViewProps.Flex, DefaultFloat = 0f)]
        public void SetFlex(float? flex)
        {
            Flex = flex ?? CSSConstants.Undefined;
        }

        /// <summary>
        /// Sets the flex direction of the shadow node.
        /// </summary>
        /// <param name="flexDirection">The flex direction.</param>
        [ReactProp(ViewProps.FlexDirection)]
        public void SetFlexDirection(string flexDirection)
        {
            FlexDirection = flexDirection != null
                ? EnumHelpers.Parse<CSSFlexDirection>(flexDirection)
                : CSSFlexDirection.Column;
        }

        /// <summary>
        /// Sets the wrap property on the shadow node.
        /// </summary>
        /// <param name="flexWrap">The wrap.</param>
        [ReactProp(ViewProps.FlexWrap)]
        public void SetFlexWrap(string flexWrap)
        {
            Wrap = flexWrap != null
                ? EnumHelpers.Parse<CSSWrap>(flexWrap)
                : CSSWrap.NoWrap;
        }

        /// <summary>
        /// Sets the self alignment of the shadow node.
        /// </summary>
        /// <param name="alignSelf">The align self property.</param>
        [ReactProp(ViewProps.AlignSelf)]
        public void SetAlignSelf(string alignSelf)
        {
            AlignSelf = alignSelf != null
                ? EnumHelpers.Parse<CSSAlign>(alignSelf)
                : CSSAlign.Auto;
        }

        /// <summary>
        /// Sets the item alignment for the shadow node.
        /// </summary>
        /// <param name="alignItems">The item alignment.</param>
        [ReactProp(ViewProps.AlignItems)]
        public void SetAlignItems(string alignItems)
        {
            AlignItems = alignItems != null
                ? EnumHelpers.Parse<CSSAlign>(alignItems)
                : CSSAlign.Stretch;
        }

        /// <summary>
        /// Sets the content justification.
        /// </summary>
        /// <param name="justifyContent">The content justification.</param>
        [ReactProp(ViewProps.JustifyContent)]
        public void SetJustifyContent(string justifyContent)
        {
            JustifyContent = justifyContent != null
                ? EnumHelpers.Parse<CSSJustify>(justifyContent)
                : CSSJustify.FlexStart;
        }

        /// <summary>
        /// Sets the margins of the shadow node.
        /// </summary>
        /// <param name="index">The spacing type index.</param>
        /// <param name="margin">The margin value.</param>
        [ReactPropGroup(
            ViewProps.Margin,
            ViewProps.MarginVertical,
            ViewProps.MarginHorizontal,
            ViewProps.MarginLeft,
            ViewProps.MarginRight,
            ViewProps.MarginTop,
            ViewProps.MarginBottom,
            DefaultFloat = Undefined)]
        public void SetMargins(int index, float margin)
        {
            SetMargin(ViewProps.PaddingMarginSpacingTypes[index], margin);
        }

        /// <summary>
        /// Sets the paddings of the shadow node.
        /// </summary>
        /// <param name="index">The spacing type index.</param>
        /// <param name="padding">The padding value.</param>
        [ReactPropGroup(
            ViewProps.Padding,
            ViewProps.PaddingVertical,
            ViewProps.PaddingHorizontal,
            ViewProps.PaddingLeft,
            ViewProps.PaddingRight,
            ViewProps.PaddingTop,
            ViewProps.PaddingBottom,
            DefaultFloat = Undefined)]
        public void SetPaddings(int index, float padding)
        {
            SetPadding(ViewProps.PaddingMarginSpacingTypes[index], padding);
        }

        /// <summary>
        /// Sets the border width properties for the shadow node.
        /// </summary>
        /// <param name="index">The border spacing type index.</param>
        /// <param name="borderWidth">The border width.</param>
        [ReactPropGroup(
            ViewProps.BorderWidth,
            ViewProps.BorderLeftWidth,
            ViewProps.BorderRightWidth,
            ViewProps.BorderTopWidth,
            ViewProps.BorderBottomWidth,
            DefaultFloat = Undefined)]
        public void SetBorderWidth(int index, float borderWidth)
        {
            SetBorder(ViewProps.BorderSpacingTypes[index], borderWidth);
        }

        /// <summary>
        /// Sets the position of the shadow node.
        /// </summary>
        /// <param name="position">The position.</param>
        [ReactProp(ViewProps.Position)]
        public void SetPosition(string position)
        {
            PositionType = position != null
                ? EnumHelpers.Parse<CSSPositionType>(position)
                : CSSPositionType.Relative;
        }

        /// <summary>
        /// Sets if the view should send an event on layout.
        /// </summary>
        /// <param name="shouldNotifyOnLayout">
        /// The flag signaling if the view should sent an event on layout.
        /// </param>
        [ReactProp("onLayout")]
        public void SetShouldNotifyOnLayout(bool shouldNotifyOnLayout)
        {
            ShouldNotifyOnLayout = shouldNotifyOnLayout;
        }
    }
}
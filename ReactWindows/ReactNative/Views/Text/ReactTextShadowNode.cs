using Facebook.CSSLayout;
using ReactNative.Bridge;
using ReactNative.Reflection;
using ReactNative.UIManager;
using ReactNative.UIManager.Annotations;
using System;
using System.Collections.Generic;
using Windows.Foundation;
using Windows.UI.Text;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Documents;
using Windows.UI.Xaml.Media;

namespace ReactNative.Views.Text
{
    /// <summary>
    /// The shadow node implementation for text views.
    /// </summary>
    public class ReactTextShadowNode : LayoutShadowNode
    {
        private const int Unset = -1;

        private uint? _color;

        private int _fontSize = Unset;

        private FontStyle? _fontStyle;
        private FontWeight? _fontWeight;

        private string _fontFamily;

        private Inline _inline;

        private readonly bool _isVirtual;

        /// <summary>
        /// Instantiates the <see cref="ReactTextShadowNode"/>.
        /// </summary>
        /// <param name="isVirtual">
        /// A flag signaling whether or not the shadow node is virtual.
        /// </param>
        public ReactTextShadowNode(bool isVirtual)
        {
            _isVirtual = isVirtual;

            if (!isVirtual)
            {
                MeasureFunction = MeasureText;
            }
        }

        /// <summary>
        /// Flag signaling if the given node is virtual.
        /// </summary>
        /// <remarks>
        /// All text nodes except the root text node are virtual.
        /// </remarks>
        public override bool IsVirtual
        {
            get
            {
                return _isVirtual;
            }
        }

        /// <summary>
        /// Flag signaling if the given node is a root node for virtual nodes.
        /// </summary>
        /// <remarks>
        /// The root text node is a virtual anchor.
        /// </remarks>
        public override bool IsVirtualAnchor
        {
            get
            {
                return !_isVirtual;
            }
        }

        /// <summary>
        /// The text value.
        /// </summary>
        protected string Text
        {
            get;
            private set;
        }

        /// <summary>
        /// Called once per batch of updates by the <see cref="UIManagerModule"/>
        /// if the text node is dirty.
        /// </summary>
        public override void OnBeforeLayout()
        {
            if (_isVirtual)
            {
                return;
            }

            _inline = DispatcherHelpers.CallOnDispatcher(() => ReactTextShadowNodeInlineVisitor.Apply(this)).Result;
            MarkUpdated();
        }

        /// <summary>
        /// Called to aggregate all the changes to the virtual text nodes.
        /// </summary>
        /// <param name="uiViewOperationQueue">The UI operation queue.</param>
        public override void OnCollectExtraUpdates(UIViewOperationQueue uiViewOperationQueue)
        {
            if (_isVirtual)
            {
                return;
            }

            base.OnCollectExtraUpdates(uiViewOperationQueue);

            if (_inline != null)
            {
                uiViewOperationQueue.EnqueueUpdateExtraData(ReactTag, _inline);
            }
        }

        /// <summary>
        /// Sets the text for the node.
        /// </summary>
        /// <param name="text">The text.</param>
        [ReactProp("text")]
        public void SetText(string text)
        {
            Text = text;
            MarkUpdated();
        }

        /// <summary>
        /// Sets the font size for the node.
        /// </summary>
        /// <param name="fontSize">The font size.</param>
        [ReactProp(ViewProps.FontSize, DefaultDouble = Unset)]
        public void SetFontSize(double fontSize)
        {
            _fontSize = (int)fontSize;
            MarkUpdated();
        }

        /// <summary>
        /// Sets the font color for the node.
        /// </summary>
        /// <param name="color">The masked color value.</param>
        [ReactProp(ViewProps.Color, CustomType = "Color")]
        public void SetColor(uint? color)
        {
            _color = color;
            MarkUpdated();
        }

        /// <summary>
        /// Sets the font family for the node.
        /// </summary>
        /// <param name="fontFamily">The font family.</param>
        [ReactProp(ViewProps.FontFamily)]
        public void SetFontFamily(string fontFamily)
        {
            _fontFamily = fontFamily;
            MarkUpdated();
        }

        /// <summary>
        /// Sets the font weight for the node.
        /// </summary>
        /// <param name="fontWeightString">The font weight string.</param>
        [ReactProp(ViewProps.FontWeight)]
        public void SetFontWeight(string fontWeightString)
        {
            var fontWeight = FontStyleHelpers.ParseFontWeight(fontWeightString);
            if (_fontWeight.HasValue != fontWeight.HasValue ||
                (_fontWeight.HasValue && fontWeight.HasValue &&
                _fontWeight.Value.Weight != fontWeight.Value.Weight))
            {
                _fontWeight = fontWeight;
                MarkUpdated();
            }
        }

        /// <summary>
        /// Sets the font style for the node.
        /// </summary>
        /// <param name="fontStyleString">The font style string.</param>
        [ReactProp(ViewProps.FontStyle)]
        public void SetFontStyle(string fontStyleString)
        {
            var fontStyle = EnumHelpers.ParseNullable<FontStyle>(fontStyleString);
            if (_fontStyle != fontStyle)
            {
                _fontStyle = fontStyle;
                MarkUpdated();
            }
        }

        /// <summary>
        /// Marks a node as updated.
        /// </summary>
        protected override void MarkUpdated()
        {
            base.MarkUpdated();

            if (!_isVirtual)
            {
                dirty();
            }
        }

        /// <summary>
        /// Formats an inline instance with shadow properties.
        /// </summary>
        /// <param name="textNode">The text shadow node.</param>
        /// <param name="inline">The inline.</param>
        /// <param name="measureOnly">Signals if the operation is used only for measurement.</param>
        protected static void FormatInline(ReactTextShadowNode textNode, Inline inline, bool measureOnly)
        {
            if (!measureOnly && textNode._color.HasValue)
            {
                inline.Foreground = new SolidColorBrush(ColorHelpers.Parse(textNode._color.Value));
            }

            if (textNode._fontSize != Unset)
            {
                var fontSize = textNode._fontSize;
                inline.FontSize = fontSize;
            }

            if (textNode._fontStyle.HasValue)
            {
                var fontStyle = textNode._fontStyle.Value;
                inline.FontStyle = fontStyle;
            }

            if (textNode._fontWeight.HasValue)
            {
                var fontWeight = textNode._fontWeight.Value;
                inline.FontWeight = fontWeight;
            }

            if (textNode._fontFamily != null)
            {
                var fontFamily = new FontFamily(textNode._fontFamily);
                inline.FontFamily = fontFamily;
            }
        }

        private static MeasureOutput MeasureText(CSSNode node, float width, float height)
        {
            // This is not a terribly efficient way of projecting the height of
            // the text elements. It requires that we have access to the
            // dispatcher in order to do measurement, which, for obvious
            // reasons, can cause perceived performance issues as it will block
            // the UI thread from handling other work.
            //
            // TODO: determine another way to measure text elements.
            var task = DispatcherHelpers.CallOnDispatcher(() =>
            {
                var textBlock = new TextBlock
                {
                    TextWrapping = TextWrapping.Wrap,
                };

                textBlock.Inlines.Add(ReactTextShadowNodeInlineVisitor.Apply(node));

                try
                {
                    var normalizedWidth = CSSConstants.IsUndefined(width) ? double.PositiveInfinity : width;
                    var normalizedHeight = CSSConstants.IsUndefined(height) ? double.PositiveInfinity : height;
                    textBlock.Measure(new Size(normalizedWidth, normalizedHeight));
                    return new MeasureOutput(
                        (float)Math.Ceiling(textBlock.DesiredSize.Width),
                        (float)Math.Ceiling(textBlock.DesiredSize.Height));
                }
                finally
                {
                    textBlock.Inlines.Clear();
                }
            });

            return task.Result;
        }

        class ReactTextShadowNodeInlineVisitor : CSSNodeVisitor<Inline>
        {
            private static readonly ReactTextShadowNodeInlineVisitor s_instance = new ReactTextShadowNodeInlineVisitor();

            public static Inline Apply(CSSNode node)
            {
                return s_instance.Visit(node);
            }

            protected sealed override Inline Make(CSSNode node, IList<Inline> children)
            {
                var textNode = (ReactTextShadowNode)node;
                if (textNode._isVirtual)
                {
                    textNode.MarkUpdateSeen();
                }

                var text = textNode.Text;
                if (text != null && children.Count > 0)
                {
                    throw new InvalidOperationException("Only leaf nodes can contain text.");
                }
                else if (text != null)
                {
                    var inline = new Run();
                    inline.Text = text;
                    FormatInline(textNode, inline, false);
                    return inline;
                }
                else
                {
                    var inline = new Span();
                    foreach (var child in children)
                    {
                        inline.Inlines.Add(child);
                    }

                    FormatInline(textNode, inline, false);
                    return inline;
                }
            }
        }
    }
}

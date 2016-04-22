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
        private const double FontSizeUnset = -1;
        private readonly bool _isVirtual;

        private bool _underline;
        private uint? _color;

        private int _letterSpacing;
        private int _numberOfLines;

        private double _fontSize = FontSizeUnset;
        private double _lineHeight;

        private FontStyle? _fontStyle;
        private FontWeight? _fontWeight;
        private TextAlignment _textAlignment = TextAlignment.DetectFromContent;

        private string _fontFamily;
        private Inline _inline;

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
                var args = Tuple.Create(
                    _inline,
                    _textAlignment,
                    _lineHeight,
                    _numberOfLines,
                    _letterSpacing);

                uiViewOperationQueue.EnqueueUpdateExtraData(ReactTag, args);
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
        [ReactProp(ViewProps.FontSize, DefaultDouble = FontSizeUnset)]
        public void SetFontSize(double fontSize)
        {
            if (_fontSize != fontSize)
            {
                _fontSize = fontSize;
                MarkUpdated();
            }
        }

        /// <summary>
        /// Sets the font color for the node.
        /// </summary>
        /// <param name="color">The masked color value.</param>
        [ReactProp(ViewProps.Color, CustomType = "Color")]
        public void SetColor(uint? color)
        {
            if (_color != color)
            {
                _color = color;
                MarkUpdated();
            }
        }

        /// <summary>
        /// Sets the font family for the node.
        /// </summary>
        /// <param name="fontFamily">The font family.</param>
        [ReactProp(ViewProps.FontFamily)]
        public void SetFontFamily(string fontFamily)
        {
            if (_fontFamily != fontFamily)
            {
                _fontFamily = fontFamily;
                MarkUpdated();
            }
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
        /// Sets the letter spacing for the node.
        /// </summary>
        /// <param name="letterSpacing">The letter spacing.</param>
        [ReactProp(ViewProps.LetterSpacing)]
        public void SetLetterSpacing(int letterSpacing)
        {
            if (_isVirtual)
            {
                ThrowException("letterSpacing");
            }

            var spacing = 50 * letterSpacing; // TODO: Find exact multiplier (50) to match iOS

            if (_letterSpacing != spacing)
            {
                _letterSpacing = spacing;
                MarkUpdated();
            }
        }

        /// <summary>
        /// Sets the line height.
        /// </summary>
        /// <param name="lineHeight">The line height.</param>
        [ReactProp(ViewProps.LineHeight)]
        public virtual void SetLineHeight(double lineHeight)
        {
            if (_isVirtual)
            {
                ThrowException("lineHeight");
            }

            if (_lineHeight != lineHeight)
            {
                _lineHeight = lineHeight;
                MarkUpdated();
            }
        }

        /// <summary>
        /// Sets the maximum number of lines.
        /// </summary>
        /// <param name="numberOfLines">Max number of lines.</param>
        [ReactProp(ViewProps.NumberOfLines)]
        public virtual void SetNumberOfLines(int numberOfLines)
        {
            if (_isVirtual)
            {
                ThrowException("numberOfLines");
            }

            if (_numberOfLines != numberOfLines)
            {
                _numberOfLines = numberOfLines;
                MarkUpdated();
            }
        }

        /// <summary>
        /// Sets the text alignment.
        /// </summary>
        /// <param name="textAlign">The text alignment string.</param>
        [ReactProp(ViewProps.TextAlign)]
        public void SetTextAlign(string textAlign)
        {
            if (_isVirtual)
            {
                ThrowException("textAlign");
            }

            var textAlignment = textAlign == "auto" || textAlign == null ? 
                TextAlignment.DetectFromContent :
                EnumHelpers.Parse<TextAlignment>(textAlign);

            if (_textAlignment != textAlignment)
            {
                _textAlignment = textAlignment;
                MarkUpdated();
            }
        }

        /// <summary>
        /// Sets the text decoration.
        /// </summary>
        /// <param name="textDecoration">The text decoration string.</param>
        [ReactProp(ViewProps.TextDecorationLine)]
        public void SetTextDecoration(string textDecoration)
        {
            var underline = textDecoration?.Contains("underline") ?? false;

            if (_underline != underline)
            {
                _underline = underline;
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

            if (textNode._fontSize != FontSizeUnset)
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

        private static void ThrowException(string property)
        {
            throw new InvalidOperationException("Property "  + property + " is supported only on the outermost text block.");
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
                    TextAlignment = TextAlignment.DetectFromContent,
                    TextTrimming = TextTrimming.CharacterEllipsis,
                };

                var textNode = (ReactTextShadowNode)node;

                textBlock.CharacterSpacing = textNode._letterSpacing;
                textBlock.LineHeight = textNode._lineHeight;
                textBlock.MaxLines = textNode._numberOfLines;
                textBlock.TextAlignment = (TextAlignment)textNode._textAlignment;

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
                else if (textNode._underline)
                {
                    var inline = new Underline();
                    foreach (var child in children)
                    {
                        inline.Inlines.Add(child);
                    }

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

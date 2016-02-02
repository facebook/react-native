using Facebook.CSSLayout;
using ReactNative.Bridge;
using ReactNative.UIManager;
using System;
using System.Globalization;
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
        private const string INLINE_IMAGE_PLACEHOLDER = "I";
        private const int UNSET = -1;

        private const string PROP_TEXT = "text";

        private int _lineHeight = UNSET;
        private bool _isColorSet = false;
        private uint _color;
        private bool _isBackgroundColorSet = false;
        private uint _backgroundColor;

        private int _numberOfLines = UNSET;
        private int _fontSize = UNSET;

        private FontStyle? _fontStyle;
        private FontWeight? _fontWeight;

        private string _fontFamily;
        private string _text;

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
        /// Called once per batch of updates by the <see cref="UIManagerModule"/>
        /// if the text node is dirty.
        /// </summary>
        public override void OnBeforeLayout()
        {
            // We need to perform this operation on the dispatcher in UWP as 
            // WinRT lacks the tools needed to "predict" the height of text.
            // Instead, we simply instantiate the Inline object, insert it into
            // a text block, and extract how tall the element will be.
            if (_isVirtual)
            {
                return;
            }

            _inline = DispatcherHelpers.CallOnDispatcher(() => FromTextCSSNode(this)).Result;
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
        [ReactProperty("text")]
        public void SetText(string text)
        {
            _text = text;
            MarkUpdated();
        }

        /// <summary>
        /// Sets the number of lines for the node.
        /// </summary>
        /// <param name="numberOfLines">The number of lines.</param>
        [ReactProperty(ViewProperties.NumberOfLines, DefaultInteger = UNSET)]
        public void SetNumberOfLines(int numberOfLines)
        {
            _numberOfLines = numberOfLines;
            MarkUpdated();
        }

        /// <summary>
        /// Sets the line height for the node.
        /// </summary>
        /// <param name="lineHeight">The line height.</param>
        [ReactProperty(ViewProperties.LineHeight, DefaultInteger = UNSET)]
        public void SetLineHeight(int lineHeight)
        {
            _lineHeight = lineHeight;
            MarkUpdated();
        }

        /// <summary>
        /// Sets the font size for the node.
        /// </summary>
        /// <param name="fontSize">The font size.</param>
        [ReactProperty(ViewProperties.FontSize, DefaultDouble = UNSET)]
        public void SetFontSize(double fontSize)
        {
            _fontSize = (int)fontSize;
            MarkUpdated();
        }

        /// <summary>
        /// Sets the font color for the node.
        /// </summary>
        /// <param name="color">The masked color value.</param>
        [ReactProperty(ViewProperties.Color, CustomType = "Color")]
        public void SetColor(uint? color)
        {
            _isColorSet = color.HasValue;
            if (_isColorSet)
            {
                _color = color.Value;
            }

            MarkUpdated();
        }

        /// <summary>
        /// Sets the background color for the node.
        /// </summary>
        /// <param name="color">The masked color value.</param>
        [ReactProperty(ViewProperties.BackgroundColor, CustomType = "Color")]
        public void SetBackgroundColor(uint? color)
        {
            if (!IsVirtualAnchor)
            {
                _isBackgroundColorSet = color.HasValue;
                if (_isBackgroundColorSet)
                {
                    _backgroundColor = color.Value;
                }

                MarkUpdated();
            }
        }

        /// <summary>
        /// Sets the font family for the node.
        /// </summary>
        /// <param name="fontFamily">The font family.</param>
        [ReactProperty(ViewProperties.FontFamily)]
        public void SetFontFamily(string fontFamily)
        {
            _fontFamily = fontFamily;
            MarkUpdated();
        }

        /// <summary>
        /// Sets the font weight for the node.
        /// </summary>
        /// <param name="fontWeightString">The font weight string.</param>
        [ReactProperty(ViewProperties.FontWeight)]
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
        [ReactProperty(ViewProperties.FontStyle)]
        public void SetFontStyle(string fontStyleString)
        {
            var fontStyle = FontStyleHelpers.ParseFontStyle(fontStyleString);
            if (_fontStyle != fontStyle)
            {
                _fontStyle = fontStyle;
                MarkUpdated();
            }
        }

        /// <summary>
        /// Marks a node as dirty.
        /// </summary>
        protected override void MarkUpdated()
        {
            base.MarkUpdated();

            if (!_isVirtual)
            {
                dirty();
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
                var shadowNode = (ReactTextShadowNode)node;
                var textBlock = new TextBlock
                {
                    TextWrapping = TextWrapping.Wrap,
                };

                textBlock.Inlines.Add(shadowNode._inline);

                try
                {
                    var adjustedWidth = float.IsNaN(width) ? double.PositiveInfinity : width;
                    var adjustedHeight = float.IsNaN(height) ? double.PositiveInfinity : height;
                    textBlock.Measure(new Size(adjustedWidth, adjustedHeight));
                    return new MeasureOutput(
                        (float)textBlock.DesiredSize.Width,
                        (float)textBlock.DesiredSize.Height);
                }
                finally
                {
                    textBlock.Inlines.Clear();
                }
            });

            return task.Result;
        }
        
        private static Inline FromTextCSSNode(ReactTextShadowNode textNode)
        {
            return BuildInlineFromTextCSSNode(textNode);
        }

        private static Inline BuildInlineFromTextCSSNode(ReactTextShadowNode textNode)
        {
            var length = textNode.ChildCount;
            var inline = default(Inline);
            if (length == 0)
            {
                inline = new Run { Text = textNode._text };
            }
            else
            {
                var span = new Span();
                for (var i = 0; i < length; ++i)
                {
                    var child = textNode.GetChildAt(i);
                    var textChild = child as ReactTextShadowNode;
                    if (textChild == null)
                    {
                        throw new InvalidOperationException(
                            string.Format(
                                CultureInfo.InvariantCulture,
                                "Unexpected view type '{0}' nested under text node.",
                                child.GetType()));
                    }

                    var childInline = BuildInlineFromTextCSSNode(textChild);
                    span.Inlines.Add(childInline);
                }

                inline = span;
            }

            if (textNode._isColorSet)
            {
                inline.Foreground = new SolidColorBrush(ColorHelpers.Parse(textNode._color));
            }

            if (textNode._fontSize != UNSET)
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

            return inline;
        }
    }
}
using Facebook.CSSLayout;
using ReactNative.Bridge;
using ReactNative.UIManager;
using System;
using System.Globalization;
using Windows.Foundation;
using Windows.UI.Text;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Documents;
using Windows.UI.Xaml.Media;

namespace ReactNative.Views.Text
{
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

        public ReactTextShadowNode(bool isVirtual)
        {
            _isVirtual = isVirtual;

            if (!isVirtual)
            {
                MeasureFunction = MeasureText;
            }
        }

        public override bool IsVirtual
        {
            get
            {
                return _isVirtual;
            }
        }

        public override bool IsVirtualAnchor
        {
            get
            {
                return !_isVirtual;
            }
        }

        public override void OnBeforeLayout()
        {
            // We need to perform this operation on the dispatcher in UWP as 
            // WinRT lacks the tools needed to "predict" the height of text.
            // Instead, we simply instantiate the Inline object, insert it into
            // a text block, and extract how tall the element will be.
            DispatcherHelpers.AssertOnDispatcher();

            if (_isVirtual)
            {
                return;
            }

            _inline = FromTextCSSNode(this);
            MarkUpdated();
        }

        protected override void MarkUpdated()
        {
            base.MarkUpdated();

            if (!_isVirtual)
            {
                dirty();
            }
        }

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

        [ReactProperty("text")]
        public void SetText(string text)
        {
            _text = text;
            MarkUpdated();
        }

        [ReactProperty(ViewProperties.NumberOfLines, DefaultInteger = UNSET)]
        public void SetNumberOfLines(int numberOfLines)
        {
            _numberOfLines = numberOfLines;
            MarkUpdated();
        }

        [ReactProperty(ViewProperties.LineHeight, DefaultInteger = UNSET)]
        public void SetLineHeight(int lineHeight)
        {
            _lineHeight = lineHeight;
            MarkUpdated();
        }

        [ReactProperty(ViewProperties.FontSize, DefaultDouble = UNSET)]
        public void SetFontSize(double fontSize)
        {
            _fontSize = (int)fontSize;
            MarkUpdated();
        }

        [ReactProperty(ViewProperties.Color)]
        public void SetColor(uint? color)
        {
            _isColorSet = color.HasValue;
            if (_isColorSet)
            {
                _color = color.Value;
            }

            MarkUpdated();
        }

        [ReactProperty(ViewProperties.BackgroundColor)]
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

        [ReactProperty(ViewProperties.FontFamily)]
        public void SetFontFamily(string fontFamily)
        {
            _fontFamily = fontFamily;
            MarkUpdated();
        }

        [ReactProperty(ViewProperties.FontWeight)]
        public void SetFontWeight(string fontWeightString)
        {
            var fontWeight = default(FontWeight);
            if (FontStyleHelpers.TryParseFontWeightString(fontWeightString, out fontWeight))
            {
                if (_fontWeight.HasValue && _fontWeight.Value.Weight != fontWeight.Weight)
                {
                    _fontWeight = fontWeight;
                    MarkUpdated();
                }
            }
        }

        [ReactProperty(ViewProperties.FontStyle)]
        public void SetFontStyle(string fontStyleString)
        {
            var fontStyle = default(FontStyle);
            if (FontStyleHelpers.TryParseFontStyleString(fontStyleString, out fontStyle))
            {
                if (_fontStyle != fontStyle)
                {
                    _fontStyle = fontStyle;
                    MarkUpdated();
                }
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
            var shadowNode = (ReactTextShadowNode)node;
            var textBlock = new TextBlock();
            textBlock.Inlines.Add(shadowNode._inline);

            try
            {
                var adjustedWidth = float.IsNaN(width) ? double.PositiveInfinity : width;
                var adjustedHeight = float.IsNaN(height) ? double.PositiveInfinity : height;
                textBlock.Measure(new Size(width, adjustedHeight));
                return new MeasureOutput(
                    (float)textBlock.DesiredSize.Width,
                    (float)textBlock.DesiredSize.Height);
            }
            finally
            {
                textBlock.Inlines.Clear();
            }
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
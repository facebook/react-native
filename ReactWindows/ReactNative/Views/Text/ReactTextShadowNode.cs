using Facebook.CSSLayout;
using ReactNative.UIManager;
using System;
using System.Collections.Generic;
using System.Globalization;
using Windows.UI;
using Windows.UI.Text;
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
        private int _color;
        private bool _isBackgroundColorSet = false;
        private int _backgroundColor;

        private int _numberOfLines = UNSET;
        private int _fontSize = UNSET;

        private FontStyle? _fontStyle;
        private FontWeight? _fontWeight;

        private string _fontFamily;
        private string _text;

        private InlineManager _inline;

        private readonly bool _isVirtual;

        public ReactTextShadowNode(bool isVirtual)
        {
            _isVirtual = isVirtual;
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
        public void SetColor(int? color)
        {
            _isColorSet = color.HasValue;
            if (_isColorSet)
            {
                _color = color.Value;
            }

            MarkUpdated();
        }

        [ReactProperty(ViewProperties.BackgroundColor)]
        public void SetBackgroundColor(int? color)
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
            var fontWeightNumeric = fontWeightString != null
                ? ParseNumericFontWeight(fontWeightString)
                : -1;

            var fontWeight = default(FontWeight?);
            if (fontWeightNumeric >= 500 || fontWeightString == "bold")
            {
                fontWeight = FontWeights.Bold;
            }
            else if (fontWeightString == "normal" || (fontWeightNumeric != -1 && fontWeightNumeric < 500))
            {
                fontWeight = FontWeights.Normal;
            }

            if (_fontWeight.HasValue != fontWeight.HasValue ||
                (_fontWeight.HasValue && fontWeight.HasValue &&
                _fontWeight.Value.Weight != fontWeight.Value.Weight))
            {
                _fontWeight = fontWeight;
                MarkUpdated();
            }
        }

        [ReactProperty(ViewProperties.FontStyle)]
        public void SetFontStyle(string fontStyleString)
        {
            var fontStyle = default(FontStyle?);
            if (fontStyleString == "italic")
            {
                fontStyle = FontStyle.Italic;
            }
            else if (fontStyleString == "normal")
            {
                fontStyle = FontStyle.Normal;
            }

            if (_fontStyle != fontStyle)
            {
                _fontStyle = fontStyle;
                MarkUpdated();
            }
        }

        private static int ParseNumericFontWeight(string fontWeightString)
        {
            return fontWeightString.Length == 3 && fontWeightString.EndsWith("00") &&
                fontWeightString[0] <= '9' && fontWeightString[0] >= '1'
                ? 100 * (fontWeightString[0] - '0')
                : -1;
        }

        private static InlineManager FromTextCSSNode(ReactTextShadowNode textNode)
        {
            return BuildInlineFromTextCSSNode(textNode);
        }

        private static InlineManager BuildInlineFromTextCSSNode(ReactTextShadowNode textNode)
        {
            var length = textNode.ChildCount;
            var inline = default(InlineManager);
            if (length == 0)
            {
                inline = new RunManager(textNode._text);
            }
            else
            {
                var span = new SpanManager();
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
                    span.Add(childInline);
                }

                inline = span;
            }

            if (textNode._isColorSet)
            {
                var color = textNode._color;
                var b = (byte)color;
                color >>= 8;
                var g = (byte)color;
                color >>= 8;
                var r = (byte)color;
                color >>= 8;
                var a = (byte)color;
                var brush = new SolidColorBrush(Color.FromArgb(a, r, g, b));
                inline.Do(i => i.Foreground = brush);
            }

            if (textNode._fontSize != UNSET)
            {
                var fontSize = textNode._fontSize;
                inline.Do(i => i.FontSize = fontSize);
            }

            if (textNode._fontStyle.HasValue)
            {
                var fontStyle = textNode._fontStyle.Value;
                inline.Do(i => i.FontStyle = fontStyle);
            }

            if (textNode._fontWeight.HasValue)
            {
                var fontWeight = textNode._fontWeight.Value;
                inline.Do(i => i.FontWeight = fontWeight);
            }

            if (textNode._fontFamily != null)
            {
                var fontFamily = new FontFamily(textNode._fontFamily);
                inline.Do(i => i.FontFamily = fontFamily);
            }

            return inline;
        }

        class RunManager : InlineManager
        {
            private readonly string _text;

            public RunManager(string text)
            {
                _text = text;
            }

            protected override Inline Create()
            {
                return new Run { Text = _text };
            }
        }

        class SpanManager : InlineManager
        {
            private readonly List<InlineManager> _children = new List<InlineManager>();

            public void Add(InlineManager child)
            {
                _children.Add(child);
            }

            protected override Inline Create()
            {
                var span = new Span();

                foreach (var child in _children)
                {
                    span.Inlines.Add(child.Evaluate());
                }

                return span;
            }
        }
    }
}
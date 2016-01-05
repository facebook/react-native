using Facebook.CSSLayout;
using ReactNative.UIManager;
using System;
using System.Collections.Generic;
using System.Text;
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

        private const string PROP_SHADOW_OFFSET = "textShadowOffset";
        private const string PROP_SHADOW_RADIUS = "textShadowRadius";
        private const string PROP_SHADOW_COLOR = "textShadowColor";
        private const int DEFAULT_TEXT_SHADOW_COLOR = 0x55000000;

        private int _lineHeight = UNSET;
        private bool _isColorSet = false;
        private int _color;
        private bool _isBackgroundColorSet = false;
        private int _backgroundColor;

        private int _numberOfLines = UNSET;
        private int _fontSize = UNSET;

        private double _textShadowOffsetDx = 0.0;
        private double _textShadowOffsetDy = 0.0;
        private double _textShadowRadius = 1.0;
        private int _textShadowColor = DEFAULT_TEXT_SHADOW_COLOR;

        private FontStyle? _fontStyle;
        private FontWeight? _fontWeight;

        private string _fontFamily;
        private string _text;

        private string _inlineText;

        private readonly bool _isVirtual;

        public ReactTextShadowNode(bool isVirtual)
        {
            _isVirtual = isVirtual;

            if (!_isVirtual)
            {
                MeasureFunction = TextMeasureFunction;
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
            if (_isVirtual)
            {
                return;
            }

            _inlineText = FromTextCSSNode(this);
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
            if (_inlineText != null)
            {
                uiViewOperationQueue.EnqueueUpdateExtraData(ReactTag, _inlineText);
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

        private static MeasureOutput TextMeasureFunction(CSSNode node, float width, float height)
        {
            // TODO: implement
            return new MeasureOutput(width, height);
        }

        private static int ParseNumericFontWeight(string fontWeightString)
        {
            return fontWeightString.Length == 3 && fontWeightString.EndsWith("00") &&
                fontWeightString[0] <= '9' && fontWeightString[0] >= '1'
                ? 100 * (fontWeightString[0] - '0')
                : -1;
        }

        private static string FromTextCSSNode(ReactTextShadowNode textNode)
        {
            var builder = new StringBuilder();
            for (var i = 0; i < textNode.ChildCount; ++i)
            {
                var child = textNode.GetChildAt(i);
                var textChild = child as ReactTextShadowNode;
                if (textChild != null)
                {
                    builder.Append(textChild._text);
                }
            }

            return builder.ToString();
        }
    }
}
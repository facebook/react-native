using Facebook.CSSLayout;
using ReactNative.Bridge;
using ReactNative.UIManager;
using ReactNative.Views.Text;
using Windows.Foundation;
using Windows.UI.Text;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Media;

namespace ReactNative.Views.TextInput
{
    /// <summary>
    /// This extension of <see cref="LayoutShadowNode"/> is responsible for measuring the layout for Native <see cref="TextBox"/>.
    /// </summary>
    public class ReactTextInputShadowNode : LayoutShadowNode
    {
        public const int UNSET = -1;
        private readonly bool _isVirtual;
        private ReactTextBoxProperties _textBoxStyle;
        
        public ReactTextInputShadowNode(bool isVirtual)
        {
            _textBoxStyle = new ReactTextBoxProperties();
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

        /// <summary>
        /// Queues up the view operations onto the <see cref="UIViewOperationQueue"/>.
        /// </summary>
        /// <param name="uiViewOperationQueue"></param>
        public override void OnCollectExtraUpdates(UIViewOperationQueue uiViewOperationQueue)
        {
            if (_isVirtual)
            {
                return;
            }

            base.OnCollectExtraUpdates(uiViewOperationQueue);
            if (_textBoxStyle != null)
            {
                uiViewOperationQueue.EnqueueUpdateExtraData(ReactTag, _textBoxStyle);
            }
        }

        /// <summary>
        /// This lifecycle method is called by <see cref="UIImplementation"/> to bind the CSS styling to the <see cref="ReactTextInputShadowNode"/>.
        /// </summary>
        public override void OnBeforeLayout()
        {
            DispatcherHelpers.AssertOnDispatcher();

            if (_isVirtual)
            {
                return;
            }

            MarkUpdated();
        }

        /// <summary>
        /// Sets the font size for the <see cref="TextBox"/>.
        /// </summary>
        /// <param name="fontSize">font size value</param>
        [ReactProperty(ViewProperties.FontSize, DefaultDouble = UNSET)]
        public void SetFontSize(double fontSize)
        {
            _textBoxStyle.FontSize = (int)fontSize;
            MarkUpdated();
        }

        /// <summary>
        /// Sets the text <see cref="FontFamily"/> for the <see cref="TextBox"/>.
        /// </summary>
        /// <param name="fontFamily">Font family string.</param>
        [ReactProperty(ViewProperties.FontFamily)]
        public void SetFontFamily(string fontFamily)
        {
            _textBoxStyle.FontFamily = new FontFamily(fontFamily);
            MarkUpdated();
        }

        /// <summary>
        /// Sets the text <see cref="FontWeight"/> for the <see cref="TextBox"/>.
        /// </summary>
        /// <param name="fontWeightString">Font weight string.</param>
        [ReactProperty(ViewProperties.FontWeight)]
        public void SetFontWeight(string fontWeightString)
        {
            var fontWeight = default(FontWeight);
            if (FontStyleHelpers.TryParseFontWeightString(fontWeightString, out fontWeight))
            {
                if (_textBoxStyle.FontWeight.HasValue || _textBoxStyle.FontWeight.Value.Weight != fontWeight.Weight)
                {
                    _textBoxStyle.FontWeight = fontWeight;
                    MarkUpdated();
                }
            }
        }

        /// <summary>
        /// Sets the text <see cref="FontStyle"/> for the <see cref="TextBox"/>.
        /// </summary>
        /// <param name="fontStyleString">Font style string.</param>
        [ReactProperty(ViewProperties.FontStyle)]
        public void SetFontStyle(string fontStyleString)
        {
            var fontStyle = default(FontStyle);
            if (FontStyleHelpers.TryParseFontStyleString(fontStyleString, out fontStyle))
            {
                if (_textBoxStyle.FontStyle != fontStyle)
                {
                    _textBoxStyle.FontStyle = fontStyle;
                    MarkUpdated();
                }
            }
        }

        /// <summary>
        /// Sets the text value for the <see cref="TextBox"/>.
        /// </summary>
        /// <param name="text"></param>
        [ReactProperty("text")]
        public void SetText(string text)
        {
            _textBoxStyle.Text = text;
            MarkUpdated();
        }
        
        /// <summary>
        /// Marks the node as updated/dirty. This occurs on any property 
        /// changes affecting the measurement of the <see cref="TextBox"/>.
        /// </summary>
        protected override void MarkUpdated()
        {
            base.MarkUpdated();

            if (!_isVirtual)
            {
                dirty();
            }
        }

        private static Thickness PaddingThickness(ReactTextInputShadowNode node)
        {
            return new Thickness(node.GetPaddingSpace(CSSSpacingType.Left), node.GetPaddingSpace(CSSSpacingType.Top),
                                 node.GetPaddingSpace(CSSSpacingType.Right), node.GetPaddingSpace(CSSSpacingType.Bottom));
        }

        private static MeasureOutput MeasureText(CSSNode node, float width, float height)
        {
            var shadowNode = (ReactTextInputShadowNode)node;
            var textBlock = new TextBox();
            shadowNode._textBoxStyle.Padding = PaddingThickness(shadowNode);
            textBlock.SetReactTextBoxProperties(shadowNode._textBoxStyle);

            var adjustedHeight = float.IsNaN(height) ? double.PositiveInfinity : height;
            textBlock.Measure(new Size(width, adjustedHeight));

            return new MeasureOutput((float)textBlock.DesiredSize.Width, (float)textBlock.DesiredSize.Height);
        }
    }
}

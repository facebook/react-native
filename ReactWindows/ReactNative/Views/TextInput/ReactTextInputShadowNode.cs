using Facebook.CSSLayout;
using ReactNative.Bridge;
using ReactNative.UIManager;
using ReactNative.Views.Text;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Windows.Foundation;
using Windows.UI.Text;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;

namespace ReactNative.Views.TextInput
{
    public class ReactTextInputShadowNode : LayoutShadowNode
    {
        private ReactTextBox _textBoxStyle;
        private readonly bool _isVirtual;
        public const int UNSET = -1;

        public ReactTextInputShadowNode(bool isVirtual)
        {
            _textBoxStyle = new ReactTextBox();
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
            var shadowNode = (ReactTextInputShadowNode)node;
            var textBlock = ReactTextBoxToNativeTextBoxForMeasurement(shadowNode.textBoxStyle);

            var adjustedHeight = float.IsNaN(height) ? double.PositiveInfinity : height;
                textBlock.Measure(new Size(width, adjustedHeight));

            return new MeasureOutput((float)textBlock.DesiredSize.Width, (float)textBlock.DesiredSize.Height);
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

        private static TextBox ReactTextBoxToNativeTextBoxForMeasurement(ReactTextBox textBoxStyle)
        {
                var textBox = new TextBox() {
                    Text = textBoxStyle.Text != null ? textBoxStyle.Text : ""
                };

                if (textBoxStyle.FontWeight.HasValue)
                {
                    textBox.FontWeight = textBoxStyle.FontWeight.Value;
                }

                if (textBoxStyle.FontStyle.HasValue)
                {
                    textBox.FontStyle = textBoxStyle.FontStyle.Value;
                }

                if (textBoxStyle.FontSize != UNSET)
                {
                    textBox.FontSize = textBoxStyle.FontSize;
                }

                if (textBoxStyle.FontFamily != null)
                {
                    textBox.FontFamily = textBoxStyle.FontFamily;
                }

                if (textBoxStyle.Padding.HasValue)
                {
                    textBox.Padding = textBoxStyle.Padding.Value;
                }

            return textBox;
        }
        
        [ReactPropertyGroup(
            ViewProperties.Padding,
            ViewProperties.PaddingVertical,
            ViewProperties.PaddingHorizontal,
            ViewProperties.PaddingLeft,
            ViewProperties.PaddingRight,
            ViewProperties.PaddingTop,
            ViewProperties.PaddingBottom)]
        public override void SetPaddings(int index, float padding)
        {
            base.SetPaddings(index, padding);
            _textBoxStyle.Padding = PaddingThickness;
            MarkUpdated();
        }

        [ReactProperty("text")]
        public void SetText(string text)
        {
            _textBoxStyle.Text = text;
            MarkUpdated();
        }

        private Thickness PaddingThickness
        {
            get
            {
                return new Thickness(GetPadding(CSSSpacingType.Left), GetPadding(CSSSpacingType.Top),
                                     GetPadding(CSSSpacingType.Right), GetPadding(CSSSpacingType.Bottom));
            }
        }
    }
}

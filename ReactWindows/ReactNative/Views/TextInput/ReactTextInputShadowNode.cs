using Facebook.CSSLayout;
using ReactNative.Views.Text;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Windows.UI.Text;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;

namespace ReactNative.Views.TextInput
{
    public class ReactTextInputShadowNode : ReactTextShadowNode
    {
        
        private Style _style;
        private readonly bool _isVirtual;
        
        public ReactTextInputShadowNode(bool isVirtual) : base(false)
        {
            _isVirtual = isVirtual;

            if (!isVirtual)
            {
                MeasureFunction = MeasureText;
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
    }
}

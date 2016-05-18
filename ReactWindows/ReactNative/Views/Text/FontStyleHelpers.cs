using Windows.UI.Text;

namespace ReactNative.Views.Text
{
    static class FontStyleHelpers
    {
        public static FontWeight? ParseFontWeight(string fontWeightString)
        {
            var fontWeightNumeric = fontWeightString != null
                ? ParseNumericFontWeight(fontWeightString)
                : -1;

            if (fontWeightNumeric > ushort.MaxValue)
            {
                return FontWeights.ExtraBold;
            }
            else if (fontWeightNumeric > 0)
            {
                return new FontWeight
                {
                    Weight = (ushort)fontWeightNumeric,
                };
            }
            else if (fontWeightString == "bold")
            {
                return FontWeights.Bold;
            }
            else if (fontWeightString == "normal")
            {
                return FontWeights.Normal;
            }

            return null;
        }

        private static int ParseNumericFontWeight(string fontWeightString)
        {
            var result = default(int);
            if (int.TryParse(fontWeightString, out result))
            {
                return result;
            }

            return -1;
        }
    }
}

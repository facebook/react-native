using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ReactNative.Views.Image
{
    public class ReactVirtualImageManager : ReactImageManager
    {
        private const string ReactClass = "RCTVirtualImage";

        public override string Name
        {
            get
            {
                return ReactClass;
            }
        }
    }
}

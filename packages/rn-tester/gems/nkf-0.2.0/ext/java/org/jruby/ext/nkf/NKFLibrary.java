package org.jruby.ext.nkf;

import org.jruby.Ruby;
import org.jruby.runtime.load.Library;

import java.io.IOException;

public class NKFLibrary implements Library {
    @Override
    public void load(Ruby ruby, boolean b) throws IOException {
        RubyNKF.load(ruby);
    }
}

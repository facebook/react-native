/***** BEGIN LICENSE BLOCK *****
 * Version: EPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Eclipse Public
 * License Version 2.0 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of
 * the License at http://www.eclipse.org/legal/epl-v20.html
 *
 * Software distributed under the License is distributed on an "AS
 * IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing
 * rights and limitations under the License.
 *
 * Copyright (C) 2011 Koichiro Ohba <koichiro@meadowy.org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the LGPL, and not to allow others to
 * use your version of this file under the terms of the EPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the EPL, the LGPL.
 ***** END LICENSE BLOCK *****/

package org.jruby.ext.nkf;

import java.util.regex.Pattern;

public class Option {
    private final String opt;
    private final String longOpt;
    private boolean hasArg = false;
    private String value = null;
    private Pattern pattern;

    public Option(String opt, String longOpt, String pattern) {
        this.opt = opt;
        this.longOpt = longOpt;
        if (pattern != null) {
            this.hasArg = true;
            this.pattern = Pattern.compile(pattern);
        }
    }
    String getOpt() { return opt; }
    String getLongOpt() { return longOpt; }
    boolean hasShortOpt() {
        return opt != null;
    }
    boolean hasLongOpt() {
        return longOpt != null;
    }
    boolean hasArg() {
        return hasArg;
    }
    public String getValue() {
        return value;
    }
    void setValue(String v) {
        value = v;
    }
    String getKey() {
        if (opt == null)
            return longOpt;
        else
            return opt;
    }
    Pattern pattern() {
        return pattern;
    }
    public String toString() {
        return "[opt: " + opt
            + " longOpt: " + longOpt
            + " hasArg: " + hasArg
            + " pattern: " + pattern
            + " value: " + value + "]";
    }
}

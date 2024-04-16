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

import java.util.Map;
import java.util.LinkedHashMap;
import java.util.regex.Matcher;

public class Options {
    private final Map<String, Option> shortOpts = new LinkedHashMap<String, Option>();
    private final Map<String, Option> longOpts = new LinkedHashMap<String, Option>();

    public Options addOption(String opt) {
        return addOption(opt, null);
    }
    public Options addOption(String opt, String longOpt) {
        return addOption(opt, longOpt, null);
    }
    public Options addOption(String opt, String longOpt, String pattern) {
        return addOption(new Option(opt, longOpt, pattern));
    }
    public Options addOption(Option opt) {
        if (opt.hasLongOpt()) {
            longOpts.put(opt.getLongOpt(), opt);
        }
        if (opt.hasShortOpt()) {
            shortOpts.put(opt.getOpt(), opt);
        }
        return this;
    }
    boolean hasShortOption(String opt) {
        for (Map.Entry<String , Option> e : shortOpts.entrySet()) {
            if (opt.startsWith(e.getKey())) {
                return true;
            }
        }
        return false;
    }
    public Option matchShortOption(String opt) {
        // independent of opt length
        for (Map.Entry<String , Option> e : shortOpts.entrySet()) {
            //System.out.println(opt + " = " + e.getKey());
            if (opt.startsWith(e.getKey())) {
                //System.out.println("match[" + e.getKey() + "]");
                Option cmd = e.getValue();
                if (cmd.hasArg()) {
                    Matcher m = cmd.pattern().matcher(opt);
                    if (m.find()) {
                        //System.out.println("regix[" + m.group() + "]");
                        cmd.setValue(m.group());
                    }
                }
                return cmd;
            }
        }
        return null;
    }
    boolean hasLongOption(String opt) {
        for (Map.Entry<String , Option> e : longOpts.entrySet()) {
            if (opt.startsWith(e.getKey())) {
                return true;
            }
        }
        return false;
    }
    Option matchLongOption(String opt) {
        for (Map.Entry<String , Option> e : longOpts.entrySet()) {
            //System.out.println(opt + " = " + e.getKey());
            if (opt.startsWith(e.getKey())) {
                //System.out.println("match[" + e.getKey() + "]");
                Option cmd = e.getValue();
                if (cmd.hasArg()) {
                    Matcher m = cmd.pattern().matcher(opt);
                    if (m.find()) {
                        //System.out.println("regix[" + m.group() + "]");
                        cmd.setValue(m.group(1));
                    }
                }
                return cmd;
            }
        }
        return null;
    }
}

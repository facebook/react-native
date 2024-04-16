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

public class CommandParser {
    public Command parse(Options opt, String args) {
        Command cc = new Command();
        String[] tokens = args.split("\\s");
        for (int i = 0; i < tokens.length; i++) {
            // long option
            if (tokens[i].startsWith("--")) {
                String s = stripDash(tokens[i]);
                if (opt.hasLongOption(s)) {
                    cc.addOption(opt.matchLongOption(s));
                }
            } else {
                // short option
                String s = stripDash(tokens[i]);
                int max = s.length();
                for (int j = 0; j < max; j++) {
                    if (opt.hasShortOption(s)) {
                        Option cmd = opt.matchShortOption(s);
                        if (cmd.getValue() != null) {
                            int op_len = cmd.getValue().length();
                            s = s.substring(op_len);
                            j = j + op_len;
                        }
                        cc.addOption(cmd);
                    }
                    s = s.substring(1);
                }
            }
        }
        return cc;
    }
    private String stripDash(String s) {
        if (s.startsWith("--")) {
            return s.substring(2, s.length());
        } else if (s.startsWith("-")) {
            return s.substring(1, s.length());
        } else {
            return s;
        }
    }
}

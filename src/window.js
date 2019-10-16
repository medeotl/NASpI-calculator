/* window.js
 *
 * Copyright 2019 nikito
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

const { GObject, Gtk } = imports.gi;
const Util = imports.util;

var NaspiCalculatorWindow = GObject.registerClass ({
    GTypeName: 'NaspiCalculatorWindow',
    Template: 'resource:///com/github/medeotl/NASpI-Calculator/window.ui',
    InternalChildren: ['next1', 'previous1']
}, class NaspiCalculatorWindow extends Gtk.ApplicationWindow {
    
    _init (application) {
        super._init ({ application });
    }
    
    _setWrongDateStyle (entry) {
        /* style entry in red */
        let context = entry.get_style_context ();
        context.add_class ("wrong-date");
    }
    
    _removeWrondDateStyle (entry) {
        /* remove red style */
        let context = entry.get_style_context ();
        context.remove_class ("wrong-date");
    }

    _onEntryLostFocus (entry) {
        /* validate date and format it as DD/MM/YYYY 
         * - if date is valid remove wrong-date style
         * - else add wrong-date style 
         */
         
        let date = entry.get_text ();

        if (date.length == 0) {
            print ("Do nothing (empty entry)");
            return;
        }

        let formattedDate = Util.formatDate (date);
        if (Util.isDateValid (formattedDate)) {
            // remove wrong date style (if any)
            this._removeWrondDateStyle (entry);
            // write date in entry
            entry.set_text (formattedDate);
        } else { 
            this._setWrongDateStyle (entry);
        }

    }

);

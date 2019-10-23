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
    InternalChildren: ['prevDayBtn', 'nextDayBtn', 'submissionEntry',
                       'effectEntry']
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
            return 0;  // empty string
        }

        let formattedDate = Util.formatDate (date);
        if (Util.isDateValid (formattedDate)) {
            // remove wrong date style (if any)
            this._removeWrondDateStyle (entry);
            // write date in entry
            entry.set_text (formattedDate);
            return formattedDate;  // valid date
        } else {
            this._setWrongDateStyle (entry);
            return -1  // invalid date
        }
    }

    _onSubmissionEntryLostFocus (entry) {
        /* validate date of submission entry (data presentazione)
         * if date valid, copy it to effect entry (decorrenza)
         */

        let formattedDate = this._onEntryLostFocus (entry);
        if (isNaN (formattedDate)) {
            this._effectEntry.set_text (formattedDate);
            this._nextDayBtn.set_sensitive (true);
        }
    }

    _onNextDayBtnClicked (button) {
        /* increase effect date by one day */

        let date = this._effectEntry.get_text ();
        let DD = Number (date.slice (0,2));
        let MM = Number (date.slice (3,5));
        let YY = Number (date.slice (6));
        let newDate = new Date (YY, MM, DD + 1).toLocaleString();
        this._effectEntry.set_text (
            new Date (YY, MM - 1, DD + 1).toLocaleString()
        );
        this._prevDayBtn.set_sensitive (true);
    }

    _onPrevDayBtnClicked (button) {
        /* decrease effect date by one day */

        let date = this._effectEntry.get_text ();
        let DD = Number (date.slice (0,2));
        let MM = Number (date.slice (3,5));
        let YY = Number (date.slice (6));
        this._effectEntry.set_text (
            new Date (YY, MM - 1, DD - 1).toLocaleString()
        );
        let submissionDate = this._submissionEntry.get_text ();
        let effectDate = this._effectEntry.get_text ();
        if (effectDate == submissionDate) {
            this._prevDayBtn.set_sensitive (false);
        }
    }

});

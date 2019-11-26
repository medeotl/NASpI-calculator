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

const { GObject, Gtk, Gdk } = imports.gi;
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

    _onDateEntryLostFocus (entry) {
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
            return -1;  // invalid date
        }
    }

    _onSubmissionEntryLostFocus (entry) {
        /* validate date of submission entry (data presentazione)
         * if date valid, copy it to effect entry (decorrenza)
         */

        let formattedDate = this._onDateEntryLostFocus (entry);
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

    _checkNumeric (entry, event) {
		/* allow insertion of numeric only values, or a comma*/

		var key_val = event.get_keyval ()[1];
		print ("@@@ ", key_val);
		if ( key_val >= Gdk.keyval_from_name ('0')
			 &&
			 key_val <= Gdk.keyval_from_name ('9') ) {
				// numeric value always accepted
				return;
		}
		if ( key_val >= Gdk.keyval_from_name ('KP_0')
			 &&
			 key_val <= Gdk.keyval_from_name ('KP_9') ) {
				// keypad numeric value always accepted
				return;
		}
		if (key_val == Gdk.keyval_from_name ('comma') ) {
			// only one comma accepted
			if (entry.get_text ().split (',').length-1 == 0) {
				return;
			}
		}
		if (key_val == Gdk.keyval_from_name ('Delete')
				   ||
				   key_val == Gdk.keyval_from_name ('BackSpace')
				   ||
				   key_val == Gdk.keyval_from_name ('Right')
				   ||
				   key_val == Gdk.keyval_from_name ('Left')
				   ||
				   key_val == Gdk.keyval_from_name ('Home')
				   ||
                   key_val == Gdk.keyval_from_name ('End')
				    ) {
			// these keys are always accepted
			return;
		}
		// unallowed value
		GObject.signal_stop_emission_by_name(entry, "key-press-event");
	}

    _onMoneyEntryLostFocus (entry) {
	    /* add "€ " to the text
		 * example: "12.345,67" --> "€ 12.345,67"
		 */

		let averageMontlySalary = entry.get_text ();
		if (averageMontlySalary.length == 0) {
			return;
		}
		entry.set_text ("€ " + averageMontlySalary);
	}

	_onMoneyEntryGetFocus (entry) {
	    /* remove "€ " to make user focus in inserting numeric values */

		let averageMontlySalary = entry.get_text ();
		entry.set_text (averageMontlySalary.slice (2) );
		// TODO - set cursor position at the right position
	}

	_pippo (entry) {
		let averageMontlySalary = entry.get_text ();
		let [value, decimal] = averageMontlySalary.split(",");
		decimal = (decimal == undefined) ? "" : "," + decimal;
		//~ print ("@@@ ", value, " @@@ ", value.replace ('.', '') );
		var new_value = Util.add_dots (value.replace (/\./g, '') );
		if (new_value != value) {
			entry.set_text (new_value + decimal);
		}

	}

});

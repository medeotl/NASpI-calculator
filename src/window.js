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

const { GObject, Gtk, Gdk, GLib } = imports.gi;
const Mainloop = imports.mainloop;
const Util = imports.util;
var is_entry_value_valid = [false, false, false, false, false];

var NaspiCalculatorWindow = GObject.registerClass ({
    GTypeName: 'NaspiCalculatorWindow',
    Template: 'resource:///com/github/medeotl/NASpI-Calculator/window.ui',
    InternalChildren: ['hiredEntry', 'firedEntry', 'submissionEntry',
                       'prevDayBtn', 'effectEntry', 'nextDayBtn',
                       'daysEntry', 'moneyEntry',
                       'btnCalcola',
                       'revealer', 'lbl_inapp_error']
}, class NaspiCalculatorWindow extends Gtk.ApplicationWindow {

    _init (application) {
        super._init ({ application });
    }

    _addWrongValueStyle (entry) {
        /* style entry in red */

        let context = entry.get_style_context ();
        context.add_class ("wrong-value");
    }

    _removeWrongValueStyle (entry) {
        /* remove red style */

        let context = entry.get_style_context ();
        context.remove_class ("wrong-value");
    }

    _set_validation (entry, entry_id, type) {
        /* set validation mask for the entry and add/remove wrong entry style */

        switch (type)
        {
            case "good":
                this._removeWrongValueStyle (entry);
                entry.set_icon_from_icon_name (Gtk.EntryIconPosition.SECONDARY, null);
                is_entry_value_valid[entry_id] = true;
                break;
            case "wrong":
                this._addWrongValueStyle (entry);
                is_entry_value_valid[entry_id] = false;
                break;
            case "empty":
                this._removeWrongValueStyle (entry);
                is_entry_value_valid[entry_id] = false;
        }
        if (is_entry_value_valid == "true,true,true,true,true") {
            this._btnCalcola.set_sensitive (true);
        } else {
            this._btnCalcola.set_sensitive (false);
        }
        print ("\n@@@ ", is_entry_value_valid);
    }

    _checkInsertedChars (entry, new_text, length) {
        /* limit date chars to digits or / */

        if (length == 1 ) { // trying to inserting a non numeric char
            if (isNaN (+new_text) && new_text != '/' ) {
                GObject.signal_stop_emission_by_name (entry, "insert-text");
            }
        } else { // getting a paste event
            if (isNaN (new_text.replace (/\//g, '') ) ) {
                GObject.signal_stop_emission_by_name (entry, "insert-text");
                let error_msg = "Stai provando a incollare un valore non corretto: "
                                + new_text;
                this._lbl_inapp_error.set_text (error_msg);
                this._revealer.set_reveal_child (true);
            }
        }
    }

    _onSubmissionEntryLostFocus (entry) {
        /* validate date of submission entry (data presentazione)
         * if date valid, copy it to effect entry (decorrenza)
         */

        let entry_text = entry.get_text ();

        if (entry_text.length == 0) {
            // empty string
            print ("Do nothing (empty entry)");
            this._set_validation (entry, 2, "empty");
            this._effectEntry.set_text ("");
            this._prevDayBtn.set_sensitive (false);
            this._nextDayBtn.set_sensitive (false);
            return;
        }

        let submission_date = Util.formatDate (entry_text);
        if (Util.isDateValid (submission_date) ) {
            // date is valid
            entry.set_text (submission_date);
            let fired_date = this._firedEntry.get_text ();
            if (Util.isDateValid (fired_date) ) {
                // check consistency between fired date and submission date
                fired_date = new Date (Util.dateEng (fired_date) );
                submission_date = new Date (Util.dateEng (submission_date) );
                if (fired_date >= submission_date) {
                    // dates valid but not consistent
                    this._set_validation (entry, 2, "wrong");
                    entry.set_icon_from_icon_name (Gtk.EntryIconPosition.SECONDARY,
                                                   'dialog-warning');
                } else {
                    // dates valid and consistent
                    this._set_validation (entry, 2, "good");
                }
                return;
            }



            this._set_validation (entry, 2, "good");

            this._effectEntry.set_text (submission_date);
            this._prevDayBtn.set_sensitive (false);
            this._nextDayBtn.set_sensitive (true);
        } else {
            // date is unvalid
            this._set_validation (entry, 2, "wrong");
            this._effectEntry.set_text ("");
            this._prevDayBtn.set_sensitive (false);
            this._nextDayBtn.set_sensitive (false);
        }
    }

    _onNextDayBtnClicked (button) {
        /* increase effect date by one day */

        let date = this._effectEntry.get_text ();
        let DD = Number (date.slice (0,2));
        let MM = Number (date.slice (3,5));
        let YY = Number (date.slice (6));
        let newDate = new Date (YY, MM, DD + 1).toLocaleString ();
        this._effectEntry.set_text (
            new Date (YY, MM - 1, DD + 1).toLocaleString ()
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
            new Date (YY, MM - 1, DD - 1).toLocaleString ()
        );
        let submissionDate = this._submissionEntry.get_text ();
        let effectDate = this._effectEntry.get_text ();
        if (effectDate == submissionDate) {
            this._prevDayBtn.set_sensitive (false);
        }
    }

    _checkNumeric (entry, new_text) {
        /* allow insertion of numeric only valuse */

        if (isNaN (new_text) ) {
            GObject.signal_stop_emission_by_name(entry, "insert-text");
        }
    }

    _onKeyPressed (entry, event) {
        /* allow insertion of numeric only values, or one comma
         * then call:
         * _onMoneyEntryIncrease if key_val is numeric
         * _onMoneyEntryDecrease if key_val is cancel or delete
         * _onMoneyEntryCommaAdded if the first comma is inserted
         * _onMoneyEntryCommaDeleted if comma is removed
         */

        function move_cursor_right () {
            // used when pressing Canc with cursor before a dot
            entry.set_position (cursor_pos + 1);
        }

        var key_val = event.get_keyval ()[1];
        if ((key_val >= 48 && key_val <= 57) || (key_val >= 65456 && key_val <= 65465)) {
            // key pressed is 0..9 or KP0..KP9
            // numeric value always accepted
            this._onMoneyEntryIncrease (entry, Gdk.keyval_name (key_val).slice(-1));
            return;
        }
        if (key_val == Gdk.keyval_from_name ('comma') ) {
            if (entry.get_text ().indexOf (',') != - 1) {
                // there's alrealdy a comma
                GObject.signal_stop_emission_by_name(entry, "key-press-event");
                return;
            } else {
                this._onMoneyEntryCommaAdded (entry);
                return;
            }
        }
        if (key_val == Gdk.keyval_from_name ('BackSpace') ) {
            let cursor_pos = entry.get_position ();
            let value = entry.get_text ();
            let char_to_be_deleted = value.charAt (cursor_pos - 1);
            switch (char_to_be_deleted) {
                case '.':
                    GObject.signal_stop_emission_by_name(entry, "key-press-event");
                    return;
                case ',':
                    this._onMoneyEntryCommaDeleted (entry, value, cursor_pos);
                    return;
                default:
                    this._onMoneyEntryDecrease (entry, value, cursor_pos);
                    return;
            }
        }

        if (key_val == Gdk.keyval_from_name ('Delete') ) {
            var cursor_pos = entry.get_position ();
            let value = entry.get_text ();
            let char_to_be_deleted = value.charAt (cursor_pos);
            switch (char_to_be_deleted) {
                case '.':
                    GObject.signal_stop_emission_by_name (entry, "key-press-event");
                    GLib.idle_add (200, move_cursor_right);
                    return;
                case ',':
                    // cursor position + 1 to "simulate" a backspace
                    this._onMoneyEntryCommaDeleted (entry, value, cursor_pos + 1);
                    return;
                default:
                    // cursor position + 1 to "simulate" a backspace
                    this._onMoneyEntryDecrease (entry, value, cursor_pos + 1);
                    return;
            }
        }

        if (key_val == Gdk.keyval_from_name ('Right')
            ||
            key_val == Gdk.keyval_from_name ('Left')
            ||
            key_val == Gdk.keyval_from_name ('Home')
            ||
            key_val == Gdk.keyval_from_name ('End') ) {
                // these keys are always accepted
                return;
        }
        // unallowed value
        GObject.signal_stop_emission_by_name(entry, "key-press-event");
    }

    _checkAcknowledgedDays (entry) {
        /* check if days are over 4 years (730 days) */

        let value = entry.get_text ();
        if (value == "") {
            // empty value
            this._set_validation (entry, 3, "empty")
        } else if (value <= 730 ) {
            // good value
            this._set_validation (entry, 3, "good")
            entry.set_icon_from_icon_name (Gtk.EntryIconPosition.SECONDARY, null);
        } else {
            // wrong value
            this._set_validation (entry, 3, "wrong");
            entry.set_icon_from_icon_name (Gtk.EntryIconPosition.SECONDARY,
                                           'dialog-warning');
        }
    }

    _onMoneyEntryGetFocus (entry) {
        /* remove "€ " to make user focus in inserting numeric values */

        let averageMontlySalary = entry.get_text ();
        entry.set_text (averageMontlySalary.slice (2) );
        // TODO - set cursor position at the right position
    }

    _onMoneyEntryLostFocus (entry) {
        /* add "€ " to the text, remove extra decimal digits
         * example: "12.345,6789" --> "€ 12.345,67"
         */

        let averageMontlySalary = entry.get_text ();
        if (averageMontlySalary.length == 0) {
            // empty value
            this._set_validation (entry, 4, "empty")
            return;
        }

        if (averageMontlySalary.includes(",") ) {
            // remove extra decimal digits (if any)
            let comma_position = averageMontlySalary.indexOf (",");
            averageMontlySalary = averageMontlySalary.slice (0, comma_position + 3)
        }
        this._set_validation (entry, 4, "good")
        entry.set_text ("€ " + averageMontlySalary);
    }

    _onMoneyEntryIncrease (entry, new_digit) {
        /* Add new digit, put dots accordingly and move cursor */

        function update_cursor_position () {
            // used because GLib.idle_add doesn't accept function parameters
            if (entry.get_text ().charAt (1) == '.') {
                // there's a new dot on the entry
                entry.set_position (cursor_pos + 2);
            } else {
                entry.set_position (cursor_pos + 1);
            }
        }
        let averageMontlySalary = entry.get_text ();
        var cursor_pos = entry.get_position ();
        var comma_position = averageMontlySalary.indexOf (",");
        if (comma_position != -1 && cursor_pos >= comma_position) {
            return; // I'm inserting decimal value
        }
        let [floor, decimal] = averageMontlySalary.split (",");
        // create new value accordingly to cursor position
        floor = floor.slice (0, cursor_pos) + new_digit + floor.slice (cursor_pos);
        decimal = (decimal == undefined) ? "" : "," + decimal;
        var new_value = Util.add_dots (floor.replace (/\./g, '') );
        if (new_value != floor) {
            entry.set_text (new_value + decimal);
            GObject.signal_stop_emission_by_name (entry, "key-press-event");
            // move cursor
            GLib.idle_add (200, update_cursor_position);
        }
    }

    _onMoneyEntryDecrease (entry, averageMontlySalary, cursor_pos) {
        /* Remove the digit, put dots accordingly and move cursor */

        function update_cursor_position () {
            // used because GLib.idle_add doesn't accept function parameters
            let value = entry.get_text ();
            if ( (value.charAt(3) == '.') || (value.length == 3) ) {
                entry.set_position (cursor_pos - 2);
            } else {
                entry.set_position (cursor_pos - 1);
            }
        }

        let [floor, decimal] = averageMontlySalary.split (",");
        // create new value accordingly to cursor position
        floor = floor.slice (0, cursor_pos - 1) + floor.slice (cursor_pos);
        decimal = (decimal == undefined) ? "" : "," + decimal;
        var new_value = Util.add_dots (floor.replace (/\./g, '') );
        if (new_value != floor) {
            entry.set_text (new_value + decimal);
            GObject.signal_stop_emission_by_name (entry, "key-press-event");
            // move cursor accordingly
            GLib.idle_add (200, update_cursor_position);
        }
    }

    _onMoneyEntryCommaAdded (entry) {
        /* add the comma and reformat the value in the entry */

        function update_cursor_position () {
            if (new_value.length > value.length) {
                entry.set_position (cursor_pos + 1);
            } else {
                entry.set_position (cursor_pos);
            }
        }

        let value = entry.get_text ();
        let cursor_pos = entry.get_position ();
        if (cursor_pos == value.length) {
            // usual entry behaviour is ok, nothing to do
            return;
        }
        let floor = value.slice (0, cursor_pos).replace (/\./g, '');
        let decimal = value.slice (cursor_pos).replace (/\./g, '');
        let dotted_floor = Util.add_dots (floor);
        let new_value = dotted_floor + "," + decimal;
        entry.set_text (new_value);

        GObject.signal_stop_emission_by_name (entry, "key-press-event");
        // move cursor accordingly
        GLib.idle_add (200, update_cursor_position);
    }

    _onMoneyEntryCommaDeleted (entry, value, cursor_pos) {
        /* remove the comma and reformat the value in the entry */

        function update_cursor_position () {
            if (new_value.length < value.length) {
                entry.set_position (cursor_pos - 1);
            } else {
                entry.set_position (cursor_pos);
            }
        }

        let new_value = value.replace (',', '');  // remove comma
        new_value = new_value.replace (/\./g, ''); // remove extra dots
        new_value = Util.add_dots (new_value);
        entry.set_text (new_value);

        GObject.signal_stop_emission_by_name (entry, "key-press-event");
        // move cursor accordingly
        GLib.idle_add (200, update_cursor_position);
    }

    _onBtnCloseClicked (button) {
        /* remove in-app notification */

        this._revealer.set_reveal_child (false);
    }

    _onHiredEntryLostFocus (entry) {

        let entry_text = entry.get_text ();

        if (entry_text.length == 0) {
            print ("Do nothing (empty entry)");
            this._set_validation (entry, 0, "empty");
            return;  // empty string
        }

        let hired_date = Util.formatDate (entry_text);
        if (Util.isDateValid (hired_date) ) {
            // date is valid
            entry.set_text (hired_date);
            if (is_entry_value_valid[1]) {
                // check consistency between hired and fired date
                let fired_date = this._firedEntry.get_text ();
                hired_date = new Date (Util.dateEng (hired_date) );
                fired_date = new Date (Util.dateEng (fired_date) );
                if (hired_date >= fired_date) {
                    // report the error in the GUI
                    this._set_validation (entry, 0, "wrong");
                    this._set_validation (this._firedEntry, 1, "wrong");
                    entry.set_icon_from_icon_name (Gtk.EntryIconPosition.SECONDARY,
                                                   'dialog-warning');
                    this._firedEntry.set_icon_from_icon_name (Gtk.EntryIconPosition.SECONDARY,
                                                   'dialog-warning');
                    return;
                }
            }
            this._set_validation (entry, 0, "good");

        } else {
            // date is unvalid
            this._set_validation (entry, 0, "wrong");
        }
    }

    _onFiredEntryLostFocus (entry) {

        let entry_text = entry.get_text ();

        if (entry_text.length == 0) {
            // empty string
            print ("Do nothing (empty entry)");
            this._set_validation (entry, 1, "empty");
            if (entry.get_icon_name (Gtk.EntryIconPosition.SECONDARY) != null) {
                // hired and fired date were inconsistent
                this._hiredEntry.set_icon_from_icon_name (Gtk.EntryIconPosition.SECONDARY,
                                                          null);
                entry.set_icon_from_icon_name (Gtk.EntryIconPosition.SECONDARY, null);
                this._removeWrongValueStyle (this._hiredEntry);
            }
            return;
        }

        let fired_date = Util.formatDate (entry_text);
        if (Util.isDateValid (fired_date) ) {
            // date is valid
            entry.set_text (fired_date);
            let hired_date = this._hiredEntry.get_text ();
            if (Util.isDateValid (hired_date) ) {
                // check consistency between hired and fired date
                hired_date = new Date (Util.dateEng (hired_date) );
                fired_date = new Date (Util.dateEng (fired_date) );
                if (hired_date >= fired_date) {
                    // dates valid but not consistent
                    this._set_validation (this._hiredEntry, 0, "wrong");
                    this._set_validation (entry, 1, "wrong");
                    this._hiredEntry.set_icon_from_icon_name (Gtk.EntryIconPosition.SECONDARY,
                                                              'dialog-warning');
                    entry.set_icon_from_icon_name (Gtk.EntryIconPosition.SECONDARY,
                                                   'dialog-warning');

                    return;
                } else {
                    // dates valid and consistent
                    this._set_validation (this._hiredEntry, 0, "good");
                    this._set_validation (entry, 1, "good");
                }
            }
            this._set_validation (entry, 1, "good");

        } else {
            // date is unvalid
            this._set_validation (entry, 1, "wrong");
            if (entry.get_icon_name (Gtk.EntryIconPosition.SECONDARY) != null) {
                // hired and fired date were inconsistent
                this._hiredEntry.set_icon_from_icon_name (Gtk.EntryIconPosition.SECONDARY,
                                                          null);
                entry.set_icon_from_icon_name (Gtk.EntryIconPosition.SECONDARY, null);
                this._removeWrongValueStyle (this._hiredEntry);
            }
        }
    }

    _onBtnCalcolaClicked (button) {
        /* check entries correctness and make calculations */

        // check values
        this._extraDateCheck ();

        // make calculation
    }

});

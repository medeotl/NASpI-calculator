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
                       'lblTotalIncome','lblLastNaspiDay',
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
        /* - set validation mask for the entry
         * - add/remove wrong entry style
         * - add/remove dialog-warning tooltip
         * - if entry is submission properly set some values of effect entry
         */

        switch (type)
        {
            case "good":
                this._removeWrongValueStyle (entry);
                entry.set_icon_from_icon_name (Gtk.EntryIconPosition.SECONDARY, null);
                is_entry_value_valid[entry_id] = true;
                break;
            case "inconsistent":
                this._addWrongValueStyle (entry);
                entry.set_icon_from_icon_name (Gtk.EntryIconPosition.SECONDARY,
                                               "dialog-warning");
                is_entry_value_valid[entry_id] = false;
                break;
            case "wrong":
                this._addWrongValueStyle (entry);
                entry.set_icon_from_icon_name (Gtk.EntryIconPosition.SECONDARY, null);
                is_entry_value_valid[entry_id] = false;
                break;
            case "empty":
                this._removeWrongValueStyle (entry);
                entry.set_icon_from_icon_name (Gtk.EntryIconPosition.SECONDARY, null);
                is_entry_value_valid[entry_id] = false;
        }

        if (entry_id == 2 && type != "good") {
            // doing extra setting on effect entry
            this._effectEntry.set_text ("");
            this._prevDayBtn.set_sensitive (false);
            this._nextDayBtn.set_sensitive (false);
        }
        //~ print ("\n@@@ ", is_entry_value_valid);
    }

    _checkInsertedChars (entry, new_text, length) {
        /* limit date chars to digits or / */

        if (length == 1) {
            // trying to inserting a single char
            if (isNaN (+new_text) && new_text != '/' ) {
                GObject.signal_stop_emission_by_name (entry, "insert-text");
            }
        } else {
            // getting a paste event
            if (isNaN (new_text.replace (/\//g, '') ) ) {
                GObject.signal_stop_emission_by_name (entry, "insert-text");
                this._reportError ("Stai provando a incollare un valore non corretto: "
                                   , new_text);
            }
        }
    }

    _onNextDayBtnClicked (button) {
        /* increase effect date by one day */

        let date = this._effectEntry.get_text ();
        let DD = Number (date.slice (0,2));
        let MM = Number (date.slice (3,5));
        let YY = Number (date.slice (6));
        this._effectEntry.set_text (
            new Date (YY, MM - 1, DD + 1).toLocaleDateString ()
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
            new Date (YY, MM - 1, DD - 1).toLocaleDateString ()
        );
        let submissionDate = this._submissionEntry.get_text ();
        let effectDate = this._effectEntry.get_text ();
        if (effectDate == submissionDate) {
            this._prevDayBtn.set_sensitive (false);
        }
    }

    _checkNumeric (entry, new_text, length) {
        /* allow insertion of numeric only values
         * if value is pasted, it can't be higher then 730
         */

        if (isNaN (+new_text) ) {
            GObject.signal_stop_emission_by_name(entry, "insert-text");
            if (length > 1) {
                // received a paste event with wrong value
                this._reportError ("Stai provando a inserire un valore non numerico: \n"
                                   , new_text);
            }
        } else if (+new_text > 730) {
            // received a paste event with out of range value
            GObject.signal_stop_emission_by_name(entry, "insert-text");
            this._reportError ("Stai provando a inserire un valore troppo grande: "
                              + "<b>" + new_text + "</b>"
                              + "\nMax consentito: 730 (2 anni)" );
        } else {
            // received a paste event with in range value
            entry.set_icon_from_icon_name (Gtk.EntryIconPosition.SECONDARY, null);
            this._removeWrongValueStyle (entry);
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
                // there's already a comma
                GObject.signal_stop_emission_by_name (entry, "key-press-event");
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
                    GObject.signal_stop_emission_by_name (entry, "key-press-event");
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

    _onHiredEntryLostFocus (hired_entry) {
        /* chek value inserted and his consistency with fired date */

        let entry_text = hired_entry.get_text ();

        if (entry_text.length == 0) {
            if (hired_entry.get_icon_name (Gtk.EntryIconPosition.SECONDARY) != null) {
                // HIRED and FIRED date were inconsistent
                this._set_validation (this._firedEntry, 1, "good");
            }
            this._set_validation (hired_entry, 0, "empty");
            return;  // empty string
        }

        let hired_date = Util.formatDate (entry_text);
        if (Util.isDateValid (hired_date) ) {
            // HIRED date is valid
            hired_entry.set_text (hired_date);
            let fired_date = this._firedEntry.get_text ();
            if (Util.isDateValid (fired_date)) {
                // check consistency between HIRED and FIRED date
                if (Util.areDatesConsistent (hired_date, fired_date) ) {
                    // dates are consistent
                    this._set_validation (hired_entry, 0, "good");
                    this._set_validation (this._firedEntry, 1, "good");
                } else {
                    // dates are inconsistent
                    this._set_validation (hired_entry, 0, "inconsistent");
                    this._set_validation (this._firedEntry, 1, "inconsistent");
                }
            } else {
                // HIRED date is valid and FIRED date is invalid
                this._set_validation (hired_entry, 0, "good");
            }
        } else {
            // HIRED date is unvalid
            this._set_validation (hired_entry, 0, "wrong");
            if (hired_entry.get_icon_name (Gtk.EntryIconPosition.SECONDARY) != null) {
                // HIRED and FIRED date were inconsistent
                this._set_validation (this._firedEntry, 1, "good");
            }
        }
    }

    _onFiredEntryLostFocus (fired_entry) {
        /* chek value inserted and his consistency with hired and submission dates */

        let entry_text = fired_entry.get_text ();

        if (entry_text.length == 0) {
            // empty string
            if (fired_entry.get_icon_name (Gtk.EntryIconPosition.SECONDARY) != null) {
                // HIRED and FIRED date were inconsistent
                this._set_validation (this._hiredEntry, 0, "good");
            }
            if (this._submissionEntry.get_icon_name (Gtk.EntryIconPosition.SECONDARY) != null) {
                // FIRED and SUBMISSION date were inconsistent
                this._set_validation (this._submissionEntry, 2, "good");
                this._effectEntry.set_text (this._submissionEntry.get_text () );
                this._prevDayBtn.set_sensitive (false);
                this._nextDayBtn.set_sensitive (true);

            }
            this._set_validation (fired_entry, 1, "empty");
            return;
        }

        let fired_date = Util.formatDate (entry_text);
        if (Util.isDateValid (fired_date) ) {
            // FIRED date is valid
            fired_entry.set_text (fired_date);
            let hired_date = this._hiredEntry.get_text ();
            let submission_date = this._submissionEntry.get_text ();
            if (Util.isDateValid (submission_date) ) {
                // check consistency between FIRED and SUBMISSION date
                if (Util.areDatesConsistent (fired_date, submission_date) ) {
                    // dates are consistent
                    this._set_validation (this._submissionEntry, 2, "good");
                } else {
                    // dates are inconsistent
                    this._set_validation (fired_entry, 1, "good")
                    this._set_validation (this._submissionEntry, 2, "inconsistent");
                }
            }
            if (Util.isDateValid (hired_date) ) {
                // check consistency between HIRED and FIRED date
                if (Util.areDatesConsistent (hired_date, fired_date) ) {
                    // dates are consistent
                    this._set_validation (this._hiredEntry, 0, "good");
                    this._set_validation (fired_entry, 1, "good");
                } else {
                    // dates are inconsistent
                    this._set_validation (this._hiredEntry, 0, "inconsistent");
                    this._set_validation (fired_entry, 1, "inconsistent");
                }
            } else {
                // HIRED date is invalid and FIRED date is valid
                this._set_validation (fired_entry, 1, "good");
            }
        } else {
            // FIRED date is unvalid
            this._set_validation (fired_entry, 1, "wrong");
            if (fired_entry.get_icon_name (Gtk.EntryIconPosition.SECONDARY) != null) {
                // HIRED and FIRED date were inconsistent
                this._set_validation (this._hiredEntry, 0, "good");
            }
            if (this._submissionEntry.get_icon_name (Gtk.EntryIconPosition.SECONDARY) != null) {
                // FIRED and SUBMISSION date were inconsistent
                this._set_validation (this._submissionEntry, 2, "good");
                this._effectEntry.set_text (this._submissionEntry.get_text () );
                this._prevDayBtn.set_sensitive (false);
                this._nextDayBtn.set_sensitive (true);
            }

        }
    }

    _onSubmissionEntryLostFocus (submission_entry) {
        /* chek value inserted and his consistency with fired date
         * if date valid, copy it to effect entry
         */

        let entry_text = submission_entry.get_text ();

        if (entry_text.length == 0) {
            // empty string
            this._set_validation (submission_entry, 2, "empty");
            return;
        }

        let submission_date = Util.formatDate (entry_text);

        if (Util.isDateValid (submission_date) ) {
            // SUBMISSION date is valid
            submission_entry.set_text (submission_date);
            let fired_date = this._firedEntry.get_text ();
            if (Util.isDateValid (fired_date) ) {
                // check consistency between FIRED date and SUBMISSION date
                if (Util.areDatesConsistent (fired_date, submission_date) ) {
                    // dates are consistent
                    this._set_validation (submission_entry, 2, "good");
                    this._effectEntry.set_text (submission_entry.get_text () );
                    this._prevDayBtn.set_sensitive (false);
                    this._nextDayBtn.set_sensitive (true);
                } else {
                    // dates are inconsistent
                    this._set_validation (submission_entry, 2, "inconsistent");
                }
            } else {
                // SUBMISSION date is valid and FIRED date is invalid
                this._set_validation (submission_entry, 2, "good");
                this._effectEntry.set_text (submission_entry.get_text () );
                this._prevDayBtn.set_sensitive (false);
                this._nextDayBtn.set_sensitive (true);
            }
        } else {
            // SUBMISSION date is unvalid
            this._set_validation (submission_entry, 2, "wrong");
        }
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

    _reportError (error_msg, pasted_value="") {
        /* show in-app notification of the error message */

        this._lbl_inapp_error.set_markup_with_mnemonic(error_msg
                                                       + '<i>' + pasted_value + '</i>');
        this._revealer.set_reveal_child (true);
    }

    _onBtnCloseClicked (button) {
        /* remove in-app notification */

        this._revealer.set_reveal_child (false);
    }

    _onBtnCalcolaClicked (button) {
        /* make calculations */

        if (is_entry_value_valid == "true,true,true,true,true") {
            // calculate due amount
            let monthly_income = this._moneyEntry.get_text ();
            monthly_income = parseFloat (monthly_income.slice (2).replace (".", "")
                                                                 .replace (",", "."));
            if (monthly_income <= 1195) {
                monthly_income = monthly_income * 0.75;
            } else {
                monthly_income = (1195 * 0.75) + ((monthly_income - 1195) * 0.25);
                monthly_income = (monthly_income <= 1300) ? monthly_income : 1300;
            }
            print ("@@@ quanto mi tocca al mese:", monthly_income);
            let daily_income = monthly_income / 4.33 / 7;
            print ("@@@ quanto mi tocca al giorno:", daily_income);
            let naspi_days = this._daysEntry.get_text ();

            if (naspi_days <= 90) {
                var total_income = (daily_income * naspi_days);
            } else {
                // calculate montlhly 3% reduction
                var total_income = daily_income * 90;
                naspi_days = naspi_days - 90;
                let daily_income_reduction = daily_income * 0.03;
                daily_income = daily_income - daily_income_reduction;
                while (naspi_days > 30) {
                    total_income += daily_income * 30;
                    daily_income = daily_income - daily_income_reduction;
                    naspi_days = naspi_days - 30;
                }
                total_income = (naspi_days > 0) ?
                    total_income + (naspi_days * daily_income) :
                    total_income;
            }
            // add dots to separate the thousands and comma for italian locale
            total_income = total_income.toFixed(2);
            let [floor, decimal] = total_income.split(".");
            total_income = Util.add_dots (floor) + "," + decimal;
            print ("@@@ quanto mi tocca in tutto: ", total_income);
            this._lblTotalIncome.set_text ("Importo spettante: € " + total_income);

            // calculate last NASpI date
            let date = this._effectEntry.get_text ();
            let last_naspi_day = Util.increaseDate (date, naspi_days);
            this._lblLastNaspiDay.set_text ("Ultimo giorno NASpI: " + last_naspi_day );
        } else {
            // some values is incorrect or empty
            this._reportError ("Controllare che tutti i campi siano compilati "
                               + "correttamente e riprovare");
        }
    }

});

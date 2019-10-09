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

var NaspiCalculatorWindow = GObject.registerClass({
    GTypeName: 'NaspiCalculatorWindow',
    Template: 'resource:///com/github/medeotl/NASpI-Calculator/window.ui',
    InternalChildren: ['next1', 'previous1']
}, class NaspiCalculatorWindow extends Gtk.ApplicationWindow {
    
    _init(application) {
        super._init({ application });
    }
    
    _setWrongDateStyle (entry) {
		// style entry in red
		let context = entry.get_style_context ();
		context.add_class ("wrong-date");
	}
	
	_removeWrondDateStyle (entry) {
		// remove red style
		let context = entry.get_style_context ();
		context.remove_class ("wrong-date");
	}
	
    _onEntryLostFocus (entry) {
		/* Validate date inserted in entry
		 * 
		 * valide formats of the date:
		 * 
		 * DDMMYY
		 * DDMMYYYY
		 * D/M/YY
		 * D/M/YYYY
		 * D/MM/YY
		 * D/MM/YYYY
		 * DD/M/YY
		 * DD/M/YYYY
		 * DD/MM/YY
		 * DD/MM/YYYY
		 */
		 
		var entryText = entry.get_text();
		var entryLength = entryText.length;
		
		if (entryLength == 0) {
			print("Do nothing (empty entry)");
			return;
		}
		
		switch(entryText.split("/").length-1) { // # of occurrence of /
				
			case 0:
				if ( (entryLength == 6 ) || (entryLength == 8) ) {
					var DD = entryText.slice(0,2);
					var MM = entryText.slice(2,4);
					var YY = entryText.slice(4); 
					break;
				} else {
					// TODO bordo entry in rosso
					this._setWrongDateStyle (entry);
					print("Bordo rosso !!!");
					return;
				}
				
			case 2:
				if ( (entryLength > 5) && (entryLength < 11) ) {
					var [DD, MM, YY] = entryText.split("/");
					break;
				} else {
					// TODO bordo entry in rosso
					this._setWrongDateStyle(entry);
					print("Bordo rosso !!!");
					return;
				}
				
			default:
				print ("default")
				// TODO bordo entry in rosso
				this._setWrongDateStyle(entry);
				print("Bordo rosso !!!");
				return;
		}
		// date is ok, let's compose it in english format
		if (YY.length == 2) {
			YY = "20" + YY;
		}
		var dateEng = MM + "/" + DD + "/" + YY;
		print( "data inglese: " + dateEng);
		print( new Date(dateEng).toLocaleDateString() );	
	    // remove wrong date style (if any)
	    this._removeWrondDateStyle (entry);
	  }
	
	}
	
);

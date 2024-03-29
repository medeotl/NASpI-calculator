/* main.js
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

pkg.initGettext ();
pkg.initFormat ();
pkg.require ({
  'Gio': '2.0',
  'Gtk': '3.0'
});

const { Gio, Gtk, Gdk } = imports.gi;

const { NaspiCalculatorWindow } = imports.window;

function main (argv) {
    const application = new Gtk.Application ({
        application_id: 'com.github.medeotl.NASpI-Calculator',
        flags: Gio.ApplicationFlags.FLAGS_NONE,
    });

    application.connect ('startup', app => {
        // Css style
        let style_provider = new Gtk.CssProvider ();
        style_provider.load_from_resource (
            "/com/github/medeotl/NASpI-Calculator/application.css"
        );
        Gtk.StyleContext.add_provider_for_screen (
            Gdk.Screen.get_default(),
            style_provider,
            Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
        );
    });

    application.connect ('activate', app => {
        let activeWindow = app.activeWindow;

        if (!activeWindow) {
            activeWindow = new NaspiCalculatorWindow (app);
        }

        // Shortcuts
        let accel_group = new Gtk.AccelGroup ();
        accel_group.connect (
            Gdk.keyval_from_name('Q'),
            Gdk.ModifierType.CONTROL_MASK,
            0,
            () => { application.quit (); }
        );
        activeWindow.add_accel_group (accel_group);

        activeWindow.present ();
    });

    return application.run (argv);
}

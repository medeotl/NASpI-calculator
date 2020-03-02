function formatDate (date) {
    /* return date formatted as DD/MM/YYYY if it is in one of the valid formats
     * else return -1
     *
     * valid formats of the date:
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

    var dateLength = date.length;

    switch (date.split ("/").length-1) { // # of occurrences of "/"

        case 0:
            if ( (dateLength == 6 ) || (dateLength == 8) ) {
                var DD = date.slice (0,2);
                var MM = date.slice (2,4);
                var YY = date.slice (4);
                break;
            } else {
                return -1;
            }

        case 2:
            if ( (dateLength > 5) && (dateLength < 11) ) {
                var [DD, MM, YY] = date.split ("/");
                if (DD.length == 1) {
                    DD = '0' + DD;
                }
                if (MM.length == 1) {
                    MM = '0' + MM;
                }
                break;
            } else {
                return -1;
            }

        default: // 1 or 2+ occurrences of "/"
            return -1;
    }

    switch (YY.length) {
        case 2:
            YY = '20' + YY;
            break;
        case 4:
            break;
        default: // YY.length = 1, 3, >4
            return -1;
    }

    return (DD + "/" + MM + "/" + YY);

}

function isDateValid (date) {
    /* validate a date formatted as DD/MM/YYYY */

    if (date == -1) {
        return false;
    }
    let [DD, MM, YY] = date.split ("/");
    let dateEng = MM + "/" + DD + "/" + YY;

    if (new Date(dateEng).getDate () == DD) {
        return true;
    } else {
        return false;
    }
}

function dateEng (dateIta) {
    /* return a date in english format (MM/DD/YY), the one used by new Date(String) */

    let [DD, MM, YY] = dateIta.split ("/");
    return (MM + "/" + DD + "/" + YY);
}

function datesAreConsitancy (first_date, second_date) {
    /* check if first date is preceding second date */


}

function add_dots (value, new_value = "") {
    /* recursively add dots to numeric value:
     * 12132143432 --> 12.132.143.432
     */

    if (value.length < 4) {
        return (value + new_value);
    } else {
        new_value = "." + value.slice (-3) + new_value;
        return add_dots (value.slice (0,-3), new_value );
    }

}

function test () {
    /* test date validation */

    add_dots ("1234567");

    print (isDateValid (formatDate ("010775") ) );
    print (isDateValid (formatDate ("01072075") ) );
    print (isDateValid (formatDate ("1/7/75") ) );
    print (isDateValid (formatDate ("1/7/2075") ) );
    print (isDateValid (formatDate ("1/07/75") ) );
    print (isDateValid (formatDate ("1/07/2075") ) );
    print (isDateValid (formatDate ("01/7/75") ) );
    print (isDateValid (formatDate ("01/7/2075") ) );
    print (isDateValid (formatDate ("01/07/75") ) );
    print (isDateValid (formatDate ("01/07/2075") ) );

    print ("\nNow only invalid dates ")
    print (isDateValid (formatDate ("01/071975") ) );
    print (isDateValid (formatDate ("01/07//1975") ) );
    print (isDateValid (formatDate ("1775") ) );
    print (isDateValid (formatDate ("0107975") ) );
    print (isDateValid (formatDate ("010711975") ) );
    print (isDateValid (formatDate ("1/7/5") ) );
    print (isDateValid (formatDate ("01/07/11975") ) );

    print ("\nNow valid formats with letters instead of numbers")
    print (isDateValid (formatDate ("DDMMYY") ) );
    print (isDateValid (formatDate ("DDMMYYYY") ) );
    print (isDateValid (formatDate ("D/M/YY") ) );
    print (isDateValid (formatDate ("D/M/YYYY") ) );
    print (isDateValid (formatDate ("D/MM/YY") ) );
    print (isDateValid (formatDate ("D/MM/YYYY") ) );
    print (isDateValid (formatDate ("DD/M/YY") ) );
    print (isDateValid (formatDate ("DD/M/YYYY") ) );
    print (isDateValid (formatDate ("DD/MM/YY") ) );
    print (isDateValid (formatDate ("DD/MM/YYYY") ) );

}

//~ test ();

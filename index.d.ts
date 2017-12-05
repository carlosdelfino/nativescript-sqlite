    export default class Database {

        /**
         * 
         * @param dbname 
         */
        constructor(dbname:string|File);

        /***
         * Constant that this structure is a sqlite structure
         * @type {boolean}
         */
        _isSqlite: boolean;

        /***
         * This gets or sets the database version
         * @param valueOrCallback to set or callback(err, version)
         * @returns Promise
         */
        version(valueOrCallback);

        /***
         * Is the database currently open
         * @returns {boolean} - true if the db is open
         */
        isOpen();

        /***
         * Gets/Sets whether you get Arrays or Objects for the row values
         * @param value - Database.RESULTSASARRAY or Database.RESULTSASOBJECT
         * @returns {number} - Database.RESULTSASARRAY or Database.RESULTSASOBJECT
         */
        resultType(value);

        /***
         * Gets/Sets whether you get Native or Strings for the row values
         * @param value - Database.VALUESARENATIVE or Database.VALUESARESTRINGS
         * @returns {number} - Database.VALUESARENATIVE or Database.VALUESARESTRINGS
         */
        valueType(value);

        /**
         * Dummy transaction function for public version
         * @param callback
         * @returns {Promise<T>}
         */
        begin(callback);

        /***
         * Closes this database, any queries after this will fail with an error
         * @param callback
         */
        close(callback);

        /***
         * Exec SQL
         * @param sql - sql to use
         * @param params - optional array of parameters
         * @param callback - (err, result) - can be last_row_id for insert, and rows affected for update/delete
         * @returns Promise
         */
        execSQL(sql, params, callback);

        /***
         * Get the first record result set
         * @param sql - sql to run
         * @param params - optional
         * @param callback - callback (error, results)
         * @param mode - allows you to manually override the results set to be a array or object
         * @returns Promise
         */
        get(sql, params, callback, mode);

        private _getResultEngine(mode);

        /***
         * This returns the entire result set in a array of rows
         * @param sql - Sql to run
         * @param params - optional
         * @param callback - (err, results)
         * @returns Promise
         */
        all(sql, params, callback);

        /***
         * This sends each row of the result set to the "Callback" and at the end calls the complete callback upon completion
         * @param sql - sql to run
         * @param params - optional
         * @param callback - callback (err, rowsResult)
         * @param complete - callback (err, recordCount)
         * @returns Promise
         */
        each(sql, params, callback, complete);

        /***
         * Converts a Mixed Array to a String Array
         * @param params
         * @returns {Array}
         * @private
         */
        private _toStringArray(params);

        /***
         * Is this a SQLite object
         * @param obj - possible sqlite object to check
         * @returns {boolean}
         */
        static isSqlite(obj);

        /**
         * Does this database exist on disk
         * @param name
         * @returns {*}
         */
        static exists(name);

        /**
         * Delete the database file if it exists
         * @param name
         */
        static deleteDatabase(name);

        /**
         * Copy the database from the install location
         * @param name
         */
        static copyDatabase(name);

        // Literal Defines
        static readonly RESULTSASARRAY;
        static readonly RESULTSASOBJECT;
        static readonly VALUESARENATIVE;
        static readonly VALUESARESTRINGS;

    }
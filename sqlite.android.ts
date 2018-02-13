/**************************************************************************************
 * (c) 2015-2017, Master Technology
 * Licensed under the MIT license or contact me for a support, changes, enhancements,
 * and/or if you require a commercial licensing
 *
 * Any questions please feel free to email me or put a issue up on github
 * Nathan@master-technology.com                           http://nativescript.tools
 * Version 2.0.0 - Android
 * 
 * Version 2.0.0-ts-01                                 consultoria@carlosdelfino.eti.br
 *************************************************************************************/

import * as appModule from "tns-core-modules/application"
import * as platform from "tns-core-modules/platform";
import { SQLiteBase } from "./sqlite-common";

/*jshint undef: true */
/*global java, android, Promise */

// Needed for Creating Database - Android Specific flag
//var CREATEIFNEEDED = 0x10000000;

// Used to track any plugin Init
var _DatabasePluginInits = [];


/***
 * Parses a Row of data into a JS Array (as Native)
 * @param cursor {Object}
 * @returns {Array}

 */
function DBGetRowArrayNative(cursor) {
    //noinspection JSUnresolvedFunction
    var count = cursor.getColumnCount();
    var results = [];
    for (var i = 0; i < count; i++) {
        var type = cursor.getType(i);
        switch (type) {
            case 0: // NULL
                results.push(null);
                break;

            case 1: // Integer
                //noinspection JSUnresolvedFunction
                results.push(cursor.getLong(i));
                break;

            case 2: // Float
                //noinspection JSUnresolvedFunction
                results.push(cursor.getFloat(i));
                break;

            case 3: // String
                results.push(cursor.getString(i));
                break;

            case 4: // Blob
                results.push(cursor.getBlob(i));
                break;

            default:
                throw new Error('SQLITE - Unknown Field Type ' + type);
        }
    }
    return results;
}

/***
 * Parses a Row of data into a JS Array (as String)
 * @param cursor
 * @returns {Array}

 */
function DBGetRowArrayString(cursor) {
    //noinspection JSUnresolvedFunction
    var count = cursor.getColumnCount();
    var results = [];
    for (var i = 0; i < count; i++) {
        var type = cursor.getType(i);
        switch (type) {
            case 0: // NULL
                results.push(null);
                break;

            case 1: // Integer
                //noinspection JSUnresolvedFunction
                results.push(cursor.getString(i));
                break;

            case 2: // Float
                //noinspection JSUnresolvedFunction
                results.push(cursor.getString(i));
                break;

            case 3: // String
                results.push(cursor.getString(i));
                break;

            case 4: // Blob
                results.push(cursor.getBlob(i));
                break;

            default:
                throw new Error('SQLITE - Unknown Field Type ' + type);
        }
    }
    return results;
}

/***
 * Parses a Row of data into a JS Object (as Native)
 * @param cursor
 * @returns {{}}

 */
function DBGetRowObjectNative(cursor) {
    //noinspection JSUnresolvedFunction
    var count = cursor.getColumnCount();
    var results = {};
    for (var i = 0; i < count; i++) {
        var type = cursor.getType(i);
        //noinspection JSUnresolvedFunction
        var name = cursor.getColumnName(i);
        switch (type) {
            case 0: // NULL
                results[name] = null;
                break;

            case 1: // Integer
                //noinspection JSUnresolvedFunction
                results[name] = cursor.getLong(i);
                break;

            case 2: // Float
                //noinspection JSUnresolvedFunction
                results[name] = cursor.getFloat(i);
                break;

            case 3: // String
                results[name] = cursor.getString(i);
                break;

            case 4: // Blob
                results[name] = cursor.getBlob(i);
                break;

            default:
                throw new Error('SQLITE - Unknown Field Type ' + type);
        }
    }
    return results;
}

/***
 * Parses a Row of data into a JS Object (as String)
 * @param cursor
 * @returns {{}}

 */
function DBGetRowObjectString(cursor) {
    //noinspection JSUnresolvedFunction
    var count = cursor.getColumnCount();
    var results = {};
    for (var i = 0; i < count; i++) {
        var type = cursor.getType(i);
        //noinspection JSUnresolvedFunction
        var name = cursor.getColumnName(i);
        switch (type) {
            case 0: // NULL
                results[name] = null;
                break;

            case 1: // Integer
                //noinspection JSUnresolvedFunction
                results[name] = cursor.getString(i);
                break;

            case 2: // Float
                //noinspection JSUnresolvedFunction
                results[name] = cursor.getString(i);
                break;

            case 3: // String
                results[name] = cursor.getString(i);
                break;

            case 4: // Blob
                results[name] = cursor.getBlob(i);
                break;

            default:
                throw new Error('SQLITE - Unknown Field Type ' + type);
        }
    }
    return results;
}

// Default Resultset engine
var DBGetRowResults: (cursor: any) => any = DBGetRowArrayNative;

function setResultValueTypeEngine(resultType, valueType) {
    if (resultType === SQLiteBase.RESULTSASOBJECT) {
        if (valueType === SQLiteBase.VALUESARENATIVE) {
            DBGetRowResults = DBGetRowObjectNative;
        } else {
            DBGetRowResults = DBGetRowObjectString;
        }
    } else { // RESULTSASARRAY
        if (valueType === SQLiteBase.VALUESARENATIVE) {
            DBGetRowResults = DBGetRowArrayNative;
        } else {
            DBGetRowResults = DBGetRowArrayString;
        }
    }
}


/***
 * Database Constructor
 * @param dbname - Database Name

 * @param options
 * @returns {Promise} object
 * @constructor
 */
export class Database extends SQLiteBase {

    private _db: android.database.sqlite.SQLiteDatabase;


    constructor(dbname: string, options: any) {
        super((resolve, reject) => {



            // Check to see if it has a path, or if it is a relative dbname
            // dbname = "" - Temporary Database
            // dbname = ":memory:" = memory database
            if (dbname !== "" && dbname !== ":memory:") {
                //var pkgName = appModule.android.context.getPackageName();
                //noinspection JSUnresolvedFunction
                dbname = _getContext().getDatabasePath(dbname).getAbsolutePath();
                var path = dbname.substr(0, dbname.lastIndexOf('/') + 1);

                // Create "databases" folder if it is missing.  This causes issues on Emulators if it is missing
                // So we create it if it is missing

                try {
                    var javaFile = new java.io.File(path);
                    if (!javaFile.exists()) {
                        //noinspection JSUnresolvedFunction
                        javaFile.mkdirs();
                        //noinspection JSUnresolvedFunction
                        javaFile.setReadable(true);
                        //noinspection JSUnresolvedFunction
                        javaFile.setWritable(true);
                    }

                    var flags = 0;
                    if (typeof options.androidFlags !== 'undefined') {
                        flags = options.androidFlags;
                    }
                    this._db = this._openDatabase(dbname, flags, options, _getContext());
                } catch (err) {
                    console.error("SQLITE.CONSTRUCTOR -  Open DB Error", err);

                    reject(err);
                    return;
                }

                this._isOpen = true;
                resolve(this);

                var doneCnt = _DatabasePluginInits.length, doneHandled = 0;
                var done = function (err) {
                    if (err) {
                        doneHandled = doneCnt;  // We don't want any more triggers after this
                        reject(err);
                        return;
                    }
                    doneHandled++;
                    if (doneHandled === doneCnt) {
                        resolve(this);
                    }
                };

                if (doneCnt) {
                    try {
                        for (var i = 0; i < doneCnt; i++) {
                            _DatabasePluginInits[i].call(self, options, done);
                        }
                    }
                    catch (err) {
                        done(err);
                    }
                } else {
                    resolve(this);
                }
            }
        });
    }

    /**
     * Function to handle opening Database
     * @param dbname
     * @param flags
     * @param options
     * @private
     */
    private _openDatabase(dbname, flags, options?, context?) {
        if (dbname === ":memory:") {
            //noinspection JSUnresolvedVariable
            return android.database.sqlite.SQLiteDatabase.create(flags);
        } else {
            //noinspection JSUnresolvedVariable,JSUnresolvedFunction
            return android.database.sqlite.SQLiteDatabase.openDatabase(dbname, null, flags | 0x10000000);
        }
    };

    /***
     * This gets or sets the database version
     * @param valueOrCallback to set or callback(err, version)
     * @returns Promise
     */
    /*
    public version(valueOrCallback) {
        if (typeof valueOrCallback === 'function') {
            return this.get('PRAGMA user_version', function (err, data) {
                valueOrCallback(err, data && data[0]);
            }, Database.RESULTSASARRAY);
        } else if (!isNaN(valueOrCallback+0)) {
            return this.execSQL('PRAGMA user_version='+(valueOrCallback+0).toString());
        } else {
            return this.get('PRAGMA user_version', undefined, undefined, Database.RESULTSASARRAY);
        }
    };
    */

    /***
     * Is the database currently open
     * @returns {boolean} - true if the db is open
     */
    /* 
     public isOpen = function() {
       return this._isOpen;
     };
    */

    /***
     * Gets/Sets whether you get Arrays or Objects for the row values
     * @param value - Database.RESULTSASARRAY or Database.RESULTSASOBJECT
     * @returns {number} - Database.RESULTSASARRAY or Database.RESULTSASOBJECT
     */
    public resultType(value) {
        if (value === SQLiteBase.RESULTSASARRAY) {
            this._resultType = SQLiteBase.RESULTSASARRAY;
            setResultValueTypeEngine(this._resultType, this._valuesType);

        } else if (value === SQLiteBase.RESULTSASOBJECT) {
            this._resultType = SQLiteBase.RESULTSASOBJECT;
            setResultValueTypeEngine(this._resultType, this._valuesType);
        }
        return this._resultType;
    };

    /***
     * Gets/Sets whether you get Native or Strings for the row values
     * @param value - Database.VALUESARENATIVE or Database.VALUESARESTRINGS
     * @returns {number} - Database.VALUESARENATIVE or Database.VALUESARESTRINGS
     */
    public valueType(value) {
        if (value === Database.VALUESARENATIVE) {
            this._valuesType = Database.VALUESARENATIVE;
            setResultValueTypeEngine(this._resultType, this._valuesType);

        } else if (value === Database.VALUESARESTRINGS) {
            this._valuesType = Database.VALUESARESTRINGS;
            setResultValueTypeEngine(this._resultType, this._valuesType);
        }
        return this._resultType;
    };

    /**
     * Start a transaction
     * @param callback
     * @returns {Promise<T>}
     */
    public begin() {


        if (!this._isOpen) {
            throw new Error('SQLITE.BEGIN - Database is not open');
        }

        this._db.beginTransaction();
    };

    /**
     * Commits a transaction
     */
    public commit() {


        if (!this._db.inTransaction) {
            throw new Error('SQLITE.COMMIT - No pending transactions');
        }

        this._db.setTransactionSuccessful();
        this._db.endTransaction();
    };

    /**
     * Commits a transaction
     */
    public rollback() {


        if (!this._db.inTransaction) {
            throw new Error('SQLITE.ROLLBACK - No pending transactions');
        }

        this._db.endTransaction();
    };

    /***
     * Closes this database, any queries after this will fail with an error
     * @param callback
     */
    public close(): Promise<void> {

        return new Promise((resolve, reject) => {
            if (!this._isOpen) {
                reject('SQLITE.CLOSE - Database is already closed');
                return;
            }

            this._db.close();
            this._isOpen = false;

            resolve();
        });
    };

    /***
     * Exec SQL
     * @param sql - sql to use
     * @param params - optional array of parameters 
     * @returns Promise - result(resultset) - can be last_row_id for insert, and rows affected for update/delete
     */
    public execSQL(sql, params) {

        return new Promise((resolve, reject) => {



            if (!this._isOpen) {
                reject("SQLITE.EXECSQL - Database is not open");
                return;
            }

            // Need to see if we have to run any status queries afterwords
            var flags = 0;
            var test = sql.trim().substr(0, 7).toLowerCase();
            if (test === 'insert ') {
                flags = 1;
            } else if (test === 'update ' || test === 'delete ') {
                flags = 2;
            }

            try {
                if (params !== undefined) {
                    this._db.execSQL(sql, this._toStringArray(params));
                } else {
                    this._db.execSQL(sql);
                }
            } catch (Err) {
                reject(Err);
                return;
            }

            switch (flags) {
                case 0:

                    resolve(null);
                    break;
                case 1:
                    this.get('select last_insert_rowid()', Database.RESULTSASARRAY | Database.VALUESARENATIVE).
                        then((data) => {
                            resolve(data && data[0]);
                        }).
                        catch((err) => {
                            reject(err);
                        });
                    break;
                case 2:
                    this.get('select changes()', Database.RESULTSASARRAY | Database.VALUESARENATIVE).
                        then((data) => {
                            resolve(data && data[0]);
                        }).
                        catch((err) => {
                            reject(err);
                        });;
                    break;
                default:
                    resolve();
            }

        });
    };

    /***
     * Get the first record result set
     * @param sql - sql to run
     * @param params - optional
    
     * @param mode - allows you to manually override the results set to be a array or object
     * @returns Promise
     */
    get(sql: string, params?: any, mode?: any) {

        return new Promise((resolve, reject) => {

            if (!this._isOpen) {
                reject("SQLITE.GET - Database is not open");
                return;
            }

            var cursor;
            try {
                if (params !== undefined) {
                    //noinspection JSUnresolvedFunction
                    cursor = this._db.rawQuery(sql, this._toStringArray(params));
                } else {
                    //noinspection JSUnresolvedFunction
                    cursor = this._db.rawQuery(sql, null);
                }
            } catch (err) {
                reject(err);
                return;
            }

            // No Records
            if (cursor.getCount() === 0) {
                cursor.close();

                resolve(null);
                return;
            }

            var results;
            var resultEngine = this._getResultEngine(mode);
            try {
                //noinspection JSUnresolvedFunction
                cursor.moveToFirst();
                results = resultEngine(cursor);
                cursor.close();
            } catch (err) {
                reject(err);
                return;
            }

            resolve(results);
        });
    };

    private _getResultEngine(mode) {
        if (mode == null || mode === 0) return DBGetRowResults;

        var resultType = (mode & Database.RESULTSASARRAY | Database.RESULTSASOBJECT);
        if (resultType === 0) {
            resultType = this._resultType;
        }
        var valueType = (mode & Database.VALUESARENATIVE | Database.VALUESARESTRINGS);
        if (valueType === 0) {
            valueType = this._valuesType;
        }

        if (resultType === Database.RESULTSASOBJECT) {
            if (valueType === Database.VALUESARESTRINGS) {
                return DBGetRowObjectString;
            } else {
                return DBGetRowObjectNative;
            }
        } else {
            if (valueType === Database.VALUESARESTRINGS) {
                return DBGetRowArrayString;
            } else {
                return DBGetRowArrayNative;
            }
        }

    };

    /***
     * This returns the entire result set in a array of rows
     * @param sql - Sql to run
     * @param params - optional 

     * @returns Promise
     */
    public all(sql: string, params?: any) {


        return new Promise((resolve, reject) => {

            if (!this._isOpen) {
                reject("SQLITE.ALL - Database is not open");
                return;
            }

            var cursor, count;
            try {
                if (params !== undefined) {
                    //noinspection JSUnresolvedFunction
                    cursor = this._db.rawQuery(sql, this._toStringArray(params));
                } else {
                    //noinspection JSUnresolvedFunction
                    cursor = this._db.rawQuery(sql, null);
                }
                count = cursor.getCount();
            } catch (err) {
                reject(err);
                return;
            }


            // No Records
            if (count === 0) {
                cursor.close();

                resolve([]);
                return;
            }
            //noinspection JSUnresolvedFunction
            cursor.moveToFirst();

            var results = [];
            try {
                for (var i = 0; i < count; i++) {
                    var data = DBGetRowResults(cursor); // jshint ignore:line
                    results.push(data);
                    //noinspection JSUnresolvedFunction
                    cursor.moveToNext();
                }
                cursor.close();
            } catch (err) {
                reject(err);
                return;
            }

            resolve(results);
        });
    };

    /***
     * This sends each row of the result set to the "Callback" and at the end calls the complete callback upon completion
     * @param sql - sql to run
     * @param params - optional
     * @param callback - callback (err, rowsResult)
     * @param complete - callback (err, recordCount)
     * @returns Promise
     */
    public each(sql: string, params: any, callback?: (err: any, data: any) => any, complete?: (err: any, data: any) => any) {
        if (typeof params === 'function') {
            complete = callback;
            callback = params;
            params = undefined;
        }

        // Callback is required
        if (typeof callback !== 'function') {
            throw new Error("SQLITE.EACH - requires a callback");
        }

        return new Promise((resolve, reject) => {

            // Set the error Callback
            var errorCB = complete || callback;

            var cursor, count;
            try {
                if (params !== undefined) {
                    //noinspection JSUnresolvedFunction
                    cursor = this._db.rawQuery(sql, this._toStringArray(params));
                } else {
                    //noinspection JSUnresolvedFunction
                    cursor = this._db.rawQuery(sql, null);
                }
                count = cursor.getCount();
            } catch (err) {
                errorCB(err, null);
                reject(err);
                return;
            }

            // No Records
            if (count === 0) {
                cursor.close();
                if (complete) {
                    complete(null, 0);
                }
                resolve(0);
                return;
            }
            //noinspection JSUnresolvedFunction
            cursor.moveToFirst();

            try {
                for (var i = 0; i < count; i++) {
                    var data = DBGetRowResults(cursor); // jshint ignore:line
                    callback(null, data);
                    //noinspection JSUnresolvedFunction
                    cursor.moveToNext();
                }
                cursor.close();
            } catch (err) {
                errorCB(err, null);
                reject(err);
                return;
            }
            if (complete) {
                complete(null, count);
            }
            resolve(count);
        });
    };





    /**
     * Does this database exist on disk
     * @param name
     * @returns {*}
     */
    public static exists(name): boolean {
        //noinspection JSUnresolvedFunction
        var dbName = _getContext().getDatabasePath(name).getAbsolutePath();
        var dbFile = new java.io.File(dbName);
        return dbFile.exists();
    };

    /**
     * Delete the database file if it exists
     * @param name
     */
    public static deleteDatabase(name) {
        //noinspection JSUnresolvedFunction
        var dbName = _getContext().getDatabasePath(name).getAbsolutePath();
        var dbFile = new java.io.File(dbName);
        if (dbFile.exists()) {
            dbFile.delete();
            dbFile = new java.io.File(dbName + '-journal');
            if (dbFile.exists()) {
                dbFile.delete();
            }
        }
    };

    /**
     * Copy the database from the install location
     * @param name
     */
    public static copyDatabase(name) {

        //Open your local db as the input stream
        //noinspection JSUnresolvedFunction
        var myInput = _getContext().getAssets().open("app/" + name);

        if (name.indexOf('/')) {
            name = name.substring(name.indexOf('/') + 1);
        }

        //noinspection JSUnresolvedFunction
        var dbname = _getContext().getDatabasePath(name).getAbsolutePath();
        var path = dbname.substr(0, dbname.lastIndexOf('/') + 1);

        // Create "databases" folder if it is missing.  This causes issues on Emulators if it is missing
        // So we create it if it is missing

        try {
            var javaFile = new java.io.File(path);
            if (!javaFile.exists()) {
                //noinspection JSUnresolvedFunction
                javaFile.mkdirs();
                //noinspection JSUnresolvedFunction
                javaFile.setReadable(true);
                //noinspection JSUnresolvedFunction
                javaFile.setWritable(true);
            }
        }
        catch (err) {
            console.info("SQLITE - COPYDATABASE - Creating DB Folder Error", err);
        }

        //Open the empty db as the output stream
        var myOutput = new java.io.FileOutputStream(dbname);


        var success = true;
        try {
            //transfer bytes from the inputfile to the outputfile
            //noinspection JSUnresolvedFunction,JSUnresolvedVariable
            var buffer = java.lang.reflect.Array.newInstance(java.lang.Byte.class.getField("TYPE").get(null), 1024);
            var length;
            while ((length = myInput.read(buffer)) > 0) {
                //noinspection JSCheckFunctionSignatures
                myOutput.write(buffer, 0, length);
            }
        }
        catch (err) {
            success = false;
        }


        //Close the streams
        myOutput.flush();
        myOutput.close();
        myInput.close();
        return success;
    };



}

/**
     * gets the current application context
     * @returns {*}
     * @private
     */
function _getContext(): any {
    if (appModule.android.context) {
        return (appModule.android.context);
    }
    var ctx = java.lang.Class.forName("android.app.AppGlobals").getMethod("getInitialApplication", null).invoke(null, null);
    if (ctx)
        return ctx;
    ctx = java.lang.Class.forName("android.app.ActivityThread").getMethod("currentApplication", null).invoke(null, null);
    return ctx;
}

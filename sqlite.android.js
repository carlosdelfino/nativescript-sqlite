"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
var appModule = require("tns-core-modules/application");
var sqlite_common_1 = require("./sqlite-common");
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
            case 0:// NULL
                results.push(null);
                break;
            case 1:// Integer
                //noinspection JSUnresolvedFunction
                results.push(cursor.getLong(i));
                break;
            case 2:// Float
                //noinspection JSUnresolvedFunction
                results.push(cursor.getFloat(i));
                break;
            case 3:// String
                results.push(cursor.getString(i));
                break;
            case 4:// Blob
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
            case 0:// NULL
                results.push(null);
                break;
            case 1:// Integer
                //noinspection JSUnresolvedFunction
                results.push(cursor.getString(i));
                break;
            case 2:// Float
                //noinspection JSUnresolvedFunction
                results.push(cursor.getString(i));
                break;
            case 3:// String
                results.push(cursor.getString(i));
                break;
            case 4:// Blob
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
            case 0:// NULL
                results[name] = null;
                break;
            case 1:// Integer
                //noinspection JSUnresolvedFunction
                results[name] = cursor.getLong(i);
                break;
            case 2:// Float
                //noinspection JSUnresolvedFunction
                results[name] = cursor.getFloat(i);
                break;
            case 3:// String
                results[name] = cursor.getString(i);
                break;
            case 4:// Blob
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
            case 0:// NULL
                results[name] = null;
                break;
            case 1:// Integer
                //noinspection JSUnresolvedFunction
                results[name] = cursor.getString(i);
                break;
            case 2:// Float
                //noinspection JSUnresolvedFunction
                results[name] = cursor.getString(i);
                break;
            case 3:// String
                results[name] = cursor.getString(i);
                break;
            case 4:// Blob
                results[name] = cursor.getBlob(i);
                break;
            default:
                throw new Error('SQLITE - Unknown Field Type ' + type);
        }
    }
    return results;
}
// Default Resultset engine
var DBGetRowResults = DBGetRowArrayNative;
function setResultValueTypeEngine(resultType, valueType) {
    if (resultType === sqlite_common_1.SQLite.RESULTSASOBJECT) {
        if (valueType === sqlite_common_1.SQLite.VALUESARENATIVE) {
            DBGetRowResults = DBGetRowObjectNative;
        }
        else {
            DBGetRowResults = DBGetRowObjectString;
        }
    }
    else {
        if (valueType === sqlite_common_1.SQLite.VALUESARENATIVE) {
            DBGetRowResults = DBGetRowArrayNative;
        }
        else {
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
var Database = /** @class */ (function (_super) {
    __extends(Database, _super);
    function Database(dbname, options) {
        var _this = _super.call(this, function (resolve, reject) {
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
                    _this._db = _this._openDatabase(dbname, flags, options, _getContext());
                }
                catch (err) {
                    console.error("SQLITE.CONSTRUCTOR -  Open DB Error", err);
                    reject(err);
                    return;
                }
                _this._isOpen = true;
                resolve(_this);
                var doneCnt = _DatabasePluginInits.length, doneHandled = 0;
                var done = function (err) {
                    if (err) {
                        doneHandled = doneCnt; // We don't want any more triggers after this
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
                }
                else {
                    resolve(_this);
                }
            }
        }) || this;
        return _this;
    }
    /**
     * Function to handle opening Database
     * @param dbname
     * @param flags
     * @param options
     * @private
     */
    Database.prototype._openDatabase = function (dbname, flags, options, context) {
        if (dbname === ":memory:") {
            //noinspection JSUnresolvedVariable
            return android.database.sqlite.SQLiteDatabase.create(flags);
        }
        else {
            //noinspection JSUnresolvedVariable,JSUnresolvedFunction
            return android.database.sqlite.SQLiteDatabase.openDatabase(dbname, null, flags | 0x10000000);
        }
    };
    ;
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
    Database.prototype.resultType = function (value) {
        if (value === sqlite_common_1.SQLite.RESULTSASARRAY) {
            this._resultType = sqlite_common_1.SQLite.RESULTSASARRAY;
            setResultValueTypeEngine(this._resultType, this._valuesType);
        }
        else if (value === sqlite_common_1.SQLite.RESULTSASOBJECT) {
            this._resultType = sqlite_common_1.SQLite.RESULTSASOBJECT;
            setResultValueTypeEngine(this._resultType, this._valuesType);
        }
        return this._resultType;
    };
    ;
    /***
     * Gets/Sets whether you get Native or Strings for the row values
     * @param value - Database.VALUESARENATIVE or Database.VALUESARESTRINGS
     * @returns {number} - Database.VALUESARENATIVE or Database.VALUESARESTRINGS
     */
    Database.prototype.valueType = function (value) {
        if (value === Database.VALUESARENATIVE) {
            this._valuesType = Database.VALUESARENATIVE;
            setResultValueTypeEngine(this._resultType, this._valuesType);
        }
        else if (value === Database.VALUESARESTRINGS) {
            this._valuesType = Database.VALUESARESTRINGS;
            setResultValueTypeEngine(this._resultType, this._valuesType);
        }
        return this._resultType;
    };
    ;
    /**
     * Start a transaction
     * @param callback
     * @returns {Promise<T>}
     */
    Database.prototype.begin = function () {
        if (!this._isOpen) {
            throw new Error('SQLITE.BEGIN - Database is not open');
        }
        this._db.beginTransaction();
    };
    ;
    /**
     * Commits a transaction
     */
    Database.prototype.commit = function () {
        if (!this._db.inTransaction) {
            throw new Error('SQLITE.COMMIT - No pending transactions');
        }
        this._db.setTransactionSuccessful();
        this._db.endTransaction();
    };
    ;
    /**
     * Commits a transaction
     */
    Database.prototype.rollback = function () {
        if (!this._db.inTransaction) {
            throw new Error('SQLITE.ROLLBACK - No pending transactions');
        }
        this._db.endTransaction();
    };
    ;
    /***
     * Closes this database, any queries after this will fail with an error
     * @param callback
     */
    Database.prototype.close = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!_this._isOpen) {
                reject('SQLITE.CLOSE - Database is already closed');
                return;
            }
            _this._db.close();
            _this._isOpen = false;
            resolve();
        });
    };
    ;
    /***
     * Exec SQL
     * @param sql - sql to use
     * @param params - optional array of parameters
     * @returns Promise - result(resultset) - can be last_row_id for insert, and rows affected for update/delete
     */
    Database.prototype.execSQL = function (sql, params) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!_this._isOpen) {
                reject("SQLITE.EXECSQL - Database is not open");
                return;
            }
            // Need to see if we have to run any status queries afterwords
            var flags = 0;
            var test = sql.trim().substr(0, 7).toLowerCase();
            if (test === 'insert ') {
                flags = 1;
            }
            else if (test === 'update ' || test === 'delete ') {
                flags = 2;
            }
            try {
                if (params !== undefined) {
                    _this._db.execSQL(sql, _this._toStringArray(params));
                }
                else {
                    _this._db.execSQL(sql);
                }
            }
            catch (Err) {
                reject(Err);
                return;
            }
            switch (flags) {
                case 0:
                    resolve(null);
                    break;
                case 1:
                    _this.get('select last_insert_rowid()', Database.RESULTSASARRAY | Database.VALUESARENATIVE).
                        then(function (data) {
                        resolve(data && data[0]);
                    }).
                        catch(function (err) {
                        reject(err);
                    });
                    break;
                case 2:
                    _this.get('select changes()', Database.RESULTSASARRAY | Database.VALUESARENATIVE).
                        then(function (data) {
                        resolve(data && data[0]);
                    }).
                        catch(function (err) {
                        reject(err);
                    });
                    ;
                    break;
                default:
                    resolve();
            }
        });
    };
    ;
    /***
     * Get the first record result set
     * @param sql - sql to run
     * @param params - optional
    
     * @param mode - allows you to manually override the results set to be a array or object
     * @returns Promise
     */
    Database.prototype.get = function (sql, params, mode) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!_this._isOpen) {
                reject("SQLITE.GET - Database is not open");
                return;
            }
            var cursor;
            try {
                if (params !== undefined) {
                    //noinspection JSUnresolvedFunction
                    cursor = _this._db.rawQuery(sql, _this._toStringArray(params));
                }
                else {
                    //noinspection JSUnresolvedFunction
                    cursor = _this._db.rawQuery(sql, null);
                }
            }
            catch (err) {
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
            var resultEngine = _this._getResultEngine(mode);
            try {
                //noinspection JSUnresolvedFunction
                cursor.moveToFirst();
                results = resultEngine(cursor);
                cursor.close();
            }
            catch (err) {
                reject(err);
                return;
            }
            resolve(results);
        });
    };
    ;
    Database.prototype._getResultEngine = function (mode) {
        if (mode == null || mode === 0)
            return DBGetRowResults;
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
            }
            else {
                return DBGetRowObjectNative;
            }
        }
        else {
            if (valueType === Database.VALUESARESTRINGS) {
                return DBGetRowArrayString;
            }
            else {
                return DBGetRowArrayNative;
            }
        }
    };
    ;
    /***
     * This returns the entire result set in a array of rows
     * @param sql - Sql to run
     * @param params - optional

     * @returns Promise
     */
    Database.prototype.all = function (sql, params) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!_this._isOpen) {
                reject("SQLITE.ALL - Database is not open");
                return;
            }
            var cursor, count;
            try {
                if (params !== undefined) {
                    //noinspection JSUnresolvedFunction
                    cursor = _this._db.rawQuery(sql, _this._toStringArray(params));
                }
                else {
                    //noinspection JSUnresolvedFunction
                    cursor = _this._db.rawQuery(sql, null);
                }
                count = cursor.getCount();
            }
            catch (err) {
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
            }
            catch (err) {
                reject(err);
                return;
            }
            resolve(results);
        });
    };
    ;
    /***
     * This sends each row of the result set to the "Callback" and at the end calls the complete callback upon completion
     * @param sql - sql to run
     * @param params - optional
     * @param callback - callback (err, rowsResult)
     * @param complete - callback (err, recordCount)
     * @returns Promise
     */
    Database.prototype.each = function (sql, params, callback, complete) {
        var _this = this;
        if (typeof params === 'function') {
            complete = callback;
            callback = params;
            params = undefined;
        }
        // Callback is required
        if (typeof callback !== 'function') {
            throw new Error("SQLITE.EACH - requires a callback");
        }
        return new Promise(function (resolve, reject) {
            // Set the error Callback
            var errorCB = complete || callback;
            var cursor, count;
            try {
                if (params !== undefined) {
                    //noinspection JSUnresolvedFunction
                    cursor = _this._db.rawQuery(sql, _this._toStringArray(params));
                }
                else {
                    //noinspection JSUnresolvedFunction
                    cursor = _this._db.rawQuery(sql, null);
                }
                count = cursor.getCount();
            }
            catch (err) {
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
            }
            catch (err) {
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
    ;
    /**
     * Does this database exist on disk
     * @param name
     * @returns {*}
     */
    Database.exists = function (name) {
        //noinspection JSUnresolvedFunction
        var dbName = _getContext().getDatabasePath(name).getAbsolutePath();
        var dbFile = new java.io.File(dbName);
        return dbFile.exists();
    };
    ;
    /**
     * Delete the database file if it exists
     * @param name
     */
    Database.deleteDatabase = function (name) {
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
    ;
    /**
     * Copy the database from the install location
     * @param name
     */
    Database.copyDatabase = function (name) {
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
    ;
    return Database;
}(sqlite_common_1.SQLite));
exports.Database = Database;
/**
     * gets the current application context
     * @returns {*}
     * @private
     */
function _getContext() {
    if (appModule.android.context) {
        return (appModule.android.context);
    }
    var ctx = java.lang.Class.forName("android.app.AppGlobals").getMethod("getInitialApplication", null).invoke(null, null);
    if (ctx)
        return ctx;
    ctx = java.lang.Class.forName("android.app.ActivityThread").getMethod("currentApplication", null).invoke(null, null);
    return ctx;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3FsaXRlLmFuZHJvaWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzcWxpdGUuYW5kcm9pZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7Ozs7dUZBVXVGOztBQUV2Rix3REFBeUQ7QUFFekQsaURBQXVEO0FBRXZELHVCQUF1QjtBQUN2QixrQ0FBa0M7QUFFbEMsdURBQXVEO0FBQ3ZELGtDQUFrQztBQUVsQyxnQ0FBZ0M7QUFDaEMsSUFBSSxvQkFBb0IsR0FBRyxFQUFFLENBQUM7QUFHOUI7Ozs7O0dBS0c7QUFDSCw2QkFBNkIsTUFBTTtJQUMvQixtQ0FBbUM7SUFDbkMsSUFBSSxLQUFLLEdBQUcsTUFBTSxDQUFDLGNBQWMsRUFBRSxDQUFDO0lBQ3BDLElBQUksT0FBTyxHQUFHLEVBQUUsQ0FBQztJQUNqQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQzdCLElBQUksSUFBSSxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDN0IsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNYLEtBQUssQ0FBQyxDQUFFLE9BQU87Z0JBQ1gsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDbkIsS0FBSyxDQUFDO1lBRVYsS0FBSyxDQUFDLENBQUUsVUFBVTtnQkFDZCxtQ0FBbUM7Z0JBQ25DLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNoQyxLQUFLLENBQUM7WUFFVixLQUFLLENBQUMsQ0FBRSxRQUFRO2dCQUNaLG1DQUFtQztnQkFDbkMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pDLEtBQUssQ0FBQztZQUVWLEtBQUss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QUFDLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQzVCLE1BQU0sQ0FBQyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDdkMsQ0FBQztJQUNELElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLFNBQVMsQ0FBQyx1QkFBdUIsRUFBRSxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3hILEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQztRQUNKLE1BQU0sQ0FBQyxHQUFHLENBQUM7SUFDZixHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLDRCQUE0QixDQUFDLENBQUMsU0FBUyxDQUFDLG9CQUFvQixFQUFFLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDckgsTUFBTSxDQUFDLEdBQUcsQ0FBQztBQUNmLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqIChjKSAyMDE1LTIwMTcsIE1hc3RlciBUZWNobm9sb2d5XG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2Ugb3IgY29udGFjdCBtZSBmb3IgYSBzdXBwb3J0LCBjaGFuZ2VzLCBlbmhhbmNlbWVudHMsXG4gKiBhbmQvb3IgaWYgeW91IHJlcXVpcmUgYSBjb21tZXJjaWFsIGxpY2Vuc2luZ1xuICpcbiAqIEFueSBxdWVzdGlvbnMgcGxlYXNlIGZlZWwgZnJlZSB0byBlbWFpbCBtZSBvciBwdXQgYSBpc3N1ZSB1cCBvbiBnaXRodWJcbiAqIE5hdGhhbkBtYXN0ZXItdGVjaG5vbG9neS5jb20gICAgICAgICAgICAgICAgICAgICAgICAgICBodHRwOi8vbmF0aXZlc2NyaXB0LnRvb2xzXG4gKiBWZXJzaW9uIDIuMC4wIC0gQW5kcm9pZFxuICogXG4gKiBWZXJzaW9uIDIuMC4wLXRzLTAxICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3VsdG9yaWFAY2FybG9zZGVsZmluby5ldGkuYnJcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5pbXBvcnQgKiBhcyBhcHBNb2R1bGUgZnJvbSBcInRucy1jb3JlLW1vZHVsZXMvYXBwbGljYXRpb25cIlxuaW1wb3J0ICogYXMgcGxhdGZvcm0gZnJvbSBcInRucy1jb3JlLW1vZHVsZXMvcGxhdGZvcm1cIjtcbmltcG9ydCB7IFNRTGl0ZSBhcyBTUUxpdGVCYXNlIH0gZnJvbSBcIi4vc3FsaXRlLWNvbW1vblwiO1xuXG4vKmpzaGludCB1bmRlZjogdHJ1ZSAqL1xuLypnbG9iYWwgamF2YSwgYW5kcm9pZCwgUHJvbWlzZSAqL1xuXG4vLyBOZWVkZWQgZm9yIENyZWF0aW5nIERhdGFiYXNlIC0gQW5kcm9pZCBTcGVjaWZpYyBmbGFnXG4vL3ZhciBDUkVBVEVJRk5FRURFRCA9IDB4MTAwMDAwMDA7XG5cbi8vIFVzZWQgdG8gdHJhY2sgYW55IHBsdWdpbiBJbml0XG52YXIgX0RhdGFiYXNlUGx1Z2luSW5pdHMgPSBbXTtcblxuXG4vKioqXG4gKiBQYXJzZXMgYSBSb3cgb2YgZGF0YSBpbnRvIGEgSlMgQXJyYXkgKGFzIE5hdGl2ZSlcbiAqIEBwYXJhbSBjdXJzb3Ige09iamVjdH1cbiAqIEByZXR1cm5zIHtBcnJheX1cblxuICovXG5mdW5jdGlvbiBEQkdldFJvd0FycmF5TmF0aXZlKGN1cnNvcikge1xuICAgIC8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZEZ1bmN0aW9uXG4gICAgdmFyIGNvdW50ID0gY3Vyc29yLmdldENvbHVtbkNvdW50KCk7XG4gICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgICAgdmFyIHR5cGUgPSBjdXJzb3IuZ2V0VHlwZShpKTtcbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICBjYXNlIDA6IC8vIE5VTExcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2gobnVsbCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgMTogLy8gSW50ZWdlclxuICAgICAgICAgICAgICAgIC8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZEZ1bmN0aW9uXG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGN1cnNvci5nZXRMb25nKGkpKTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAyOiAvLyBGbG9hdFxuICAgICAgICAgICAgICAgIC8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZEZ1bmN0aW9uXG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGN1cnNvci5nZXRGbG9hdChpKSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgMzogLy8gU3RyaW5nXG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGN1cnNvci5nZXRTdHJpbmcoaSkpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlIDQ6IC8vIEJsb2JcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goY3Vyc29yLmdldEJsb2IoaSkpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignU1FMSVRFIC0gVW5rbm93biBGaWVsZCBUeXBlICcgKyB0eXBlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0cztcbn1cblxuLyoqKlxuICogUGFyc2VzIGEgUm93IG9mIGRhdGEgaW50byBhIEpTIEFycmF5IChhcyBTdHJpbmcpXG4gKiBAcGFyYW0gY3Vyc29yXG4gKiBAcmV0dXJucyB7QXJyYXl9XG5cbiAqL1xuZnVuY3Rpb24gREJHZXRSb3dBcnJheVN0cmluZyhjdXJzb3IpIHtcbiAgICAvL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRGdW5jdGlvblxuICAgIHZhciBjb3VudCA9IGN1cnNvci5nZXRDb2x1bW5Db3VudCgpO1xuICAgIHZhciByZXN1bHRzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICAgIHZhciB0eXBlID0gY3Vyc29yLmdldFR5cGUoaSk7XG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgY2FzZSAwOiAvLyBOVUxMXG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKG51bGwpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlIDE6IC8vIEludGVnZXJcbiAgICAgICAgICAgICAgICAvL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRGdW5jdGlvblxuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChjdXJzb3IuZ2V0U3RyaW5nKGkpKTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAyOiAvLyBGbG9hdFxuICAgICAgICAgICAgICAgIC8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZEZ1bmN0aW9uXG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGN1cnNvci5nZXRTdHJpbmcoaSkpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlIDM6IC8vIFN0cmluZ1xuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChjdXJzb3IuZ2V0U3RyaW5nKGkpKTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSA0OiAvLyBCbG9iXG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGN1cnNvci5nZXRCbG9iKGkpKTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NRTElURSAtIFVua25vd24gRmllbGQgVHlwZSAnICsgdHlwZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdHM7XG59XG5cbi8qKipcbiAqIFBhcnNlcyBhIFJvdyBvZiBkYXRhIGludG8gYSBKUyBPYmplY3QgKGFzIE5hdGl2ZSlcbiAqIEBwYXJhbSBjdXJzb3JcbiAqIEByZXR1cm5zIHt7fX1cblxuICovXG5mdW5jdGlvbiBEQkdldFJvd09iamVjdE5hdGl2ZShjdXJzb3IpIHtcbiAgICAvL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRGdW5jdGlvblxuICAgIHZhciBjb3VudCA9IGN1cnNvci5nZXRDb2x1bW5Db3VudCgpO1xuICAgIHZhciByZXN1bHRzID0ge307XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICAgIHZhciB0eXBlID0gY3Vyc29yLmdldFR5cGUoaSk7XG4gICAgICAgIC8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZEZ1bmN0aW9uXG4gICAgICAgIHZhciBuYW1lID0gY3Vyc29yLmdldENvbHVtbk5hbWUoaSk7XG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgY2FzZSAwOiAvLyBOVUxMXG4gICAgICAgICAgICAgICAgcmVzdWx0c1tuYW1lXSA9IG51bGw7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgMTogLy8gSW50ZWdlclxuICAgICAgICAgICAgICAgIC8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZEZ1bmN0aW9uXG4gICAgICAgICAgICAgICAgcmVzdWx0c1tuYW1lXSA9IGN1cnNvci5nZXRMb25nKGkpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlIDI6IC8vIEZsb2F0XG4gICAgICAgICAgICAgICAgLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkRnVuY3Rpb25cbiAgICAgICAgICAgICAgICByZXN1bHRzW25hbWVdID0gY3Vyc29yLmdldEZsb2F0KGkpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlIDM6IC8vIFN0cmluZ1xuICAgICAgICAgICAgICAgIHJlc3VsdHNbbmFtZV0gPSBjdXJzb3IuZ2V0U3RyaW5nKGkpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlIDQ6IC8vIEJsb2JcbiAgICAgICAgICAgICAgICByZXN1bHRzW25hbWVdID0gY3Vyc29yLmdldEJsb2IoaSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdTUUxJVEUgLSBVbmtub3duIEZpZWxkIFR5cGUgJyArIHR5cGUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHRzO1xufVxuXG4vKioqXG4gKiBQYXJzZXMgYSBSb3cgb2YgZGF0YSBpbnRvIGEgSlMgT2JqZWN0IChhcyBTdHJpbmcpXG4gKiBAcGFyYW0gY3Vyc29yXG4gKiBAcmV0dXJucyB7e319XG5cbiAqL1xuZnVuY3Rpb24gREJHZXRSb3dPYmplY3RTdHJpbmcoY3Vyc29yKSB7XG4gICAgLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkRnVuY3Rpb25cbiAgICB2YXIgY291bnQgPSBjdXJzb3IuZ2V0Q29sdW1uQ291bnQoKTtcbiAgICB2YXIgcmVzdWx0cyA9IHt9O1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgICAgICB2YXIgdHlwZSA9IGN1cnNvci5nZXRUeXBlKGkpO1xuICAgICAgICAvL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRGdW5jdGlvblxuICAgICAgICB2YXIgbmFtZSA9IGN1cnNvci5nZXRDb2x1bW5OYW1lKGkpO1xuICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgMDogLy8gTlVMTFxuICAgICAgICAgICAgICAgIHJlc3VsdHNbbmFtZV0gPSBudWxsO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlIDE6IC8vIEludGVnZXJcbiAgICAgICAgICAgICAgICAvL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRGdW5jdGlvblxuICAgICAgICAgICAgICAgIHJlc3VsdHNbbmFtZV0gPSBjdXJzb3IuZ2V0U3RyaW5nKGkpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlIDI6IC8vIEZsb2F0XG4gICAgICAgICAgICAgICAgLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkRnVuY3Rpb25cbiAgICAgICAgICAgICAgICByZXN1bHRzW25hbWVdID0gY3Vyc29yLmdldFN0cmluZyhpKTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAzOiAvLyBTdHJpbmdcbiAgICAgICAgICAgICAgICByZXN1bHRzW25hbWVdID0gY3Vyc29yLmdldFN0cmluZyhpKTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSA0OiAvLyBCbG9iXG4gICAgICAgICAgICAgICAgcmVzdWx0c1tuYW1lXSA9IGN1cnNvci5nZXRCbG9iKGkpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignU1FMSVRFIC0gVW5rbm93biBGaWVsZCBUeXBlICcgKyB0eXBlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0cztcbn1cblxuLy8gRGVmYXVsdCBSZXN1bHRzZXQgZW5naW5lXG52YXIgREJHZXRSb3dSZXN1bHRzOiAoY3Vyc29yOiBhbnkpID0+IGFueSA9IERCR2V0Um93QXJyYXlOYXRpdmU7XG5cbmZ1bmN0aW9uIHNldFJlc3VsdFZhbHVlVHlwZUVuZ2luZShyZXN1bHRUeXBlLCB2YWx1ZVR5cGUpIHtcbiAgICBpZiAocmVzdWx0VHlwZSA9PT0gU1FMaXRlQmFzZS5SRVNVTFRTQVNPQkpFQ1QpIHtcbiAgICAgICAgaWYgKHZhbHVlVHlwZSA9PT0gU1FMaXRlQmFzZS5WQUxVRVNBUkVOQVRJVkUpIHtcbiAgICAgICAgICAgIERCR2V0Um93UmVzdWx0cyA9IERCR2V0Um93T2JqZWN0TmF0aXZlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgREJHZXRSb3dSZXN1bHRzID0gREJHZXRSb3dPYmplY3RTdHJpbmc7XG4gICAgICAgIH1cbiAgICB9IGVsc2UgeyAvLyBSRVNVTFRTQVNBUlJBWVxuICAgICAgICBpZiAodmFsdWVUeXBlID09PSBTUUxpdGVCYXNlLlZBTFVFU0FSRU5BVElWRSkge1xuICAgICAgICAgICAgREJHZXRSb3dSZXN1bHRzID0gREJHZXRSb3dBcnJheU5hdGl2ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIERCR2V0Um93UmVzdWx0cyA9IERCR2V0Um93QXJyYXlTdHJpbmc7XG4gICAgICAgIH1cbiAgICB9XG59XG5cblxuLyoqKlxuICogRGF0YWJhc2UgQ29uc3RydWN0b3JcbiAqIEBwYXJhbSBkYm5hbWUgLSBEYXRhYmFzZSBOYW1lXG5cbiAqIEBwYXJhbSBvcHRpb25zXG4gKiBAcmV0dXJucyB7UHJvbWlzZX0gb2JqZWN0XG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZXhwb3J0IGNsYXNzIERhdGFiYXNlIGV4dGVuZHMgU1FMaXRlQmFzZSB7XG5cbiAgICBwcml2YXRlIF9kYjogYW5kcm9pZC5kYXRhYmFzZS5zcWxpdGUuU1FMaXRlRGF0YWJhc2U7XG5cblxuICAgIGNvbnN0cnVjdG9yKGRibmFtZTogc3RyaW5nLCBvcHRpb25zOiBhbnkpIHtcbiAgICAgICAgc3VwZXIoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG5cblxuICAgICAgICAgICAgLy8gQ2hlY2sgdG8gc2VlIGlmIGl0IGhhcyBhIHBhdGgsIG9yIGlmIGl0IGlzIGEgcmVsYXRpdmUgZGJuYW1lXG4gICAgICAgICAgICAvLyBkYm5hbWUgPSBcIlwiIC0gVGVtcG9yYXJ5IERhdGFiYXNlXG4gICAgICAgICAgICAvLyBkYm5hbWUgPSBcIjptZW1vcnk6XCIgPSBtZW1vcnkgZGF0YWJhc2VcbiAgICAgICAgICAgIGlmIChkYm5hbWUgIT09IFwiXCIgJiYgZGJuYW1lICE9PSBcIjptZW1vcnk6XCIpIHtcbiAgICAgICAgICAgICAgICAvL3ZhciBwa2dOYW1lID0gYXBwTW9kdWxlLmFuZHJvaWQuY29udGV4dC5nZXRQYWNrYWdlTmFtZSgpO1xuICAgICAgICAgICAgICAgIC8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZEZ1bmN0aW9uXG4gICAgICAgICAgICAgICAgZGJuYW1lID0gX2dldENvbnRleHQoKS5nZXREYXRhYmFzZVBhdGgoZGJuYW1lKS5nZXRBYnNvbHV0ZVBhdGgoKTtcbiAgICAgICAgICAgICAgICB2YXIgcGF0aCA9IGRibmFtZS5zdWJzdHIoMCwgZGJuYW1lLmxhc3RJbmRleE9mKCcvJykgKyAxKTtcblxuICAgICAgICAgICAgICAgIC8vIENyZWF0ZSBcImRhdGFiYXNlc1wiIGZvbGRlciBpZiBpdCBpcyBtaXNzaW5nLiAgVGhpcyBjYXVzZXMgaXNzdWVzIG9uIEVtdWxhdG9ycyBpZiBpdCBpcyBtaXNzaW5nXG4gICAgICAgICAgICAgICAgLy8gU28gd2UgY3JlYXRlIGl0IGlmIGl0IGlzIG1pc3NpbmdcblxuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBqYXZhRmlsZSA9IG5ldyBqYXZhLmlvLkZpbGUocGF0aCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghamF2YUZpbGUuZXhpc3RzKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZEZ1bmN0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICBqYXZhRmlsZS5ta2RpcnMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZEZ1bmN0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICBqYXZhRmlsZS5zZXRSZWFkYWJsZSh0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZEZ1bmN0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICBqYXZhRmlsZS5zZXRXcml0YWJsZSh0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHZhciBmbGFncyA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5hbmRyb2lkRmxhZ3MgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmbGFncyA9IG9wdGlvbnMuYW5kcm9pZEZsYWdzO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2RiID0gdGhpcy5fb3BlbkRhdGFiYXNlKGRibmFtZSwgZmxhZ3MsIG9wdGlvbnMsIF9nZXRDb250ZXh0KCkpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiU1FMSVRFLkNPTlNUUlVDVE9SIC0gIE9wZW4gREIgRXJyb3JcIiwgZXJyKTtcblxuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMuX2lzT3BlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh0aGlzKTtcblxuICAgICAgICAgICAgICAgIHZhciBkb25lQ250ID0gX0RhdGFiYXNlUGx1Z2luSW5pdHMubGVuZ3RoLCBkb25lSGFuZGxlZCA9IDA7XG4gICAgICAgICAgICAgICAgdmFyIGRvbmUgPSBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvbmVIYW5kbGVkID0gZG9uZUNudDsgIC8vIFdlIGRvbid0IHdhbnQgYW55IG1vcmUgdHJpZ2dlcnMgYWZ0ZXIgdGhpc1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZG9uZUhhbmRsZWQrKztcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRvbmVIYW5kbGVkID09PSBkb25lQ250KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIGlmIChkb25lQ250KSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRvbmVDbnQ7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9EYXRhYmFzZVBsdWdpbkluaXRzW2ldLmNhbGwoc2VsZiwgb3B0aW9ucywgZG9uZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZG9uZShlcnIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0aGlzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZ1bmN0aW9uIHRvIGhhbmRsZSBvcGVuaW5nIERhdGFiYXNlXG4gICAgICogQHBhcmFtIGRibmFtZVxuICAgICAqIEBwYXJhbSBmbGFnc1xuICAgICAqIEBwYXJhbSBvcHRpb25zXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBwcml2YXRlIF9vcGVuRGF0YWJhc2UoZGJuYW1lLCBmbGFncywgb3B0aW9ucz8sIGNvbnRleHQ/KSB7XG4gICAgICAgIGlmIChkYm5hbWUgPT09IFwiOm1lbW9yeTpcIikge1xuICAgICAgICAgICAgLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbiAgICAgICAgICAgIHJldHVybiBhbmRyb2lkLmRhdGFiYXNlLnNxbGl0ZS5TUUxpdGVEYXRhYmFzZS5jcmVhdGUoZmxhZ3MpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGUsSlNVbnJlc29sdmVkRnVuY3Rpb25cbiAgICAgICAgICAgIHJldHVybiBhbmRyb2lkLmRhdGFiYXNlLnNxbGl0ZS5TUUxpdGVEYXRhYmFzZS5vcGVuRGF0YWJhc2UoZGJuYW1lLCBudWxsLCBmbGFncyB8IDB4MTAwMDAwMDApO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKipcbiAgICAgKiBUaGlzIGdldHMgb3Igc2V0cyB0aGUgZGF0YWJhc2UgdmVyc2lvblxuICAgICAqIEBwYXJhbSB2YWx1ZU9yQ2FsbGJhY2sgdG8gc2V0IG9yIGNhbGxiYWNrKGVyciwgdmVyc2lvbilcbiAgICAgKiBAcmV0dXJucyBQcm9taXNlXG4gICAgICovXG4gICAgLypcbiAgICBwdWJsaWMgdmVyc2lvbih2YWx1ZU9yQ2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZU9yQ2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdldCgnUFJBR01BIHVzZXJfdmVyc2lvbicsIGZ1bmN0aW9uIChlcnIsIGRhdGEpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZU9yQ2FsbGJhY2soZXJyLCBkYXRhICYmIGRhdGFbMF0pO1xuICAgICAgICAgICAgfSwgRGF0YWJhc2UuUkVTVUxUU0FTQVJSQVkpO1xuICAgICAgICB9IGVsc2UgaWYgKCFpc05hTih2YWx1ZU9yQ2FsbGJhY2srMCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmV4ZWNTUUwoJ1BSQUdNQSB1c2VyX3ZlcnNpb249JysodmFsdWVPckNhbGxiYWNrKzApLnRvU3RyaW5nKCkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0KCdQUkFHTUEgdXNlcl92ZXJzaW9uJywgdW5kZWZpbmVkLCB1bmRlZmluZWQsIERhdGFiYXNlLlJFU1VMVFNBU0FSUkFZKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgKi9cblxuICAgIC8qKipcbiAgICAgKiBJcyB0aGUgZGF0YWJhc2UgY3VycmVudGx5IG9wZW5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gLSB0cnVlIGlmIHRoZSBkYiBpcyBvcGVuXG4gICAgICovXG4gICAgLyogXG4gICAgIHB1YmxpYyBpc09wZW4gPSBmdW5jdGlvbigpIHtcbiAgICAgICByZXR1cm4gdGhpcy5faXNPcGVuO1xuICAgICB9O1xuICAgICovXG5cbiAgICAvKioqXG4gICAgICogR2V0cy9TZXRzIHdoZXRoZXIgeW91IGdldCBBcnJheXMgb3IgT2JqZWN0cyBmb3IgdGhlIHJvdyB2YWx1ZXNcbiAgICAgKiBAcGFyYW0gdmFsdWUgLSBEYXRhYmFzZS5SRVNVTFRTQVNBUlJBWSBvciBEYXRhYmFzZS5SRVNVTFRTQVNPQkpFQ1RcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSAtIERhdGFiYXNlLlJFU1VMVFNBU0FSUkFZIG9yIERhdGFiYXNlLlJFU1VMVFNBU09CSkVDVFxuICAgICAqL1xuICAgIHB1YmxpYyByZXN1bHRUeXBlKHZhbHVlKSB7XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gU1FMaXRlQmFzZS5SRVNVTFRTQVNBUlJBWSkge1xuICAgICAgICAgICAgdGhpcy5fcmVzdWx0VHlwZSA9IFNRTGl0ZUJhc2UuUkVTVUxUU0FTQVJSQVk7XG4gICAgICAgICAgICBzZXRSZXN1bHRWYWx1ZVR5cGVFbmdpbmUodGhpcy5fcmVzdWx0VHlwZSwgdGhpcy5fdmFsdWVzVHlwZSk7XG5cbiAgICAgICAgfSBlbHNlIGlmICh2YWx1ZSA9PT0gU1FMaXRlQmFzZS5SRVNVTFRTQVNPQkpFQ1QpIHtcbiAgICAgICAgICAgIHRoaXMuX3Jlc3VsdFR5cGUgPSBTUUxpdGVCYXNlLlJFU1VMVFNBU09CSkVDVDtcbiAgICAgICAgICAgIHNldFJlc3VsdFZhbHVlVHlwZUVuZ2luZSh0aGlzLl9yZXN1bHRUeXBlLCB0aGlzLl92YWx1ZXNUeXBlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5fcmVzdWx0VHlwZTtcbiAgICB9O1xuXG4gICAgLyoqKlxuICAgICAqIEdldHMvU2V0cyB3aGV0aGVyIHlvdSBnZXQgTmF0aXZlIG9yIFN0cmluZ3MgZm9yIHRoZSByb3cgdmFsdWVzXG4gICAgICogQHBhcmFtIHZhbHVlIC0gRGF0YWJhc2UuVkFMVUVTQVJFTkFUSVZFIG9yIERhdGFiYXNlLlZBTFVFU0FSRVNUUklOR1NcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSAtIERhdGFiYXNlLlZBTFVFU0FSRU5BVElWRSBvciBEYXRhYmFzZS5WQUxVRVNBUkVTVFJJTkdTXG4gICAgICovXG4gICAgcHVibGljIHZhbHVlVHlwZSh2YWx1ZSkge1xuICAgICAgICBpZiAodmFsdWUgPT09IERhdGFiYXNlLlZBTFVFU0FSRU5BVElWRSkge1xuICAgICAgICAgICAgdGhpcy5fdmFsdWVzVHlwZSA9IERhdGFiYXNlLlZBTFVFU0FSRU5BVElWRTtcbiAgICAgICAgICAgIHNldFJlc3VsdFZhbHVlVHlwZUVuZ2luZSh0aGlzLl9yZXN1bHRUeXBlLCB0aGlzLl92YWx1ZXNUeXBlKTtcblxuICAgICAgICB9IGVsc2UgaWYgKHZhbHVlID09PSBEYXRhYmFzZS5WQUxVRVNBUkVTVFJJTkdTKSB7XG4gICAgICAgICAgICB0aGlzLl92YWx1ZXNUeXBlID0gRGF0YWJhc2UuVkFMVUVTQVJFU1RSSU5HUztcbiAgICAgICAgICAgIHNldFJlc3VsdFZhbHVlVHlwZUVuZ2luZSh0aGlzLl9yZXN1bHRUeXBlLCB0aGlzLl92YWx1ZXNUeXBlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5fcmVzdWx0VHlwZTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogU3RhcnQgYSB0cmFuc2FjdGlvblxuICAgICAqIEBwYXJhbSBjYWxsYmFja1xuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPFQ+fVxuICAgICAqL1xuICAgIHB1YmxpYyBiZWdpbigpIHtcblxuXG4gICAgICAgIGlmICghdGhpcy5faXNPcGVuKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NRTElURS5CRUdJTiAtIERhdGFiYXNlIGlzIG5vdCBvcGVuJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9kYi5iZWdpblRyYW5zYWN0aW9uKCk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIENvbW1pdHMgYSB0cmFuc2FjdGlvblxuICAgICAqL1xuICAgIHB1YmxpYyBjb21taXQoKSB7XG5cblxuICAgICAgICBpZiAoIXRoaXMuX2RiLmluVHJhbnNhY3Rpb24pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignU1FMSVRFLkNPTU1JVCAtIE5vIHBlbmRpbmcgdHJhbnNhY3Rpb25zJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9kYi5zZXRUcmFuc2FjdGlvblN1Y2Nlc3NmdWwoKTtcbiAgICAgICAgdGhpcy5fZGIuZW5kVHJhbnNhY3Rpb24oKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQ29tbWl0cyBhIHRyYW5zYWN0aW9uXG4gICAgICovXG4gICAgcHVibGljIHJvbGxiYWNrKCkge1xuXG5cbiAgICAgICAgaWYgKCF0aGlzLl9kYi5pblRyYW5zYWN0aW9uKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NRTElURS5ST0xMQkFDSyAtIE5vIHBlbmRpbmcgdHJhbnNhY3Rpb25zJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9kYi5lbmRUcmFuc2FjdGlvbigpO1xuICAgIH07XG5cbiAgICAvKioqXG4gICAgICogQ2xvc2VzIHRoaXMgZGF0YWJhc2UsIGFueSBxdWVyaWVzIGFmdGVyIHRoaXMgd2lsbCBmYWlsIHdpdGggYW4gZXJyb3JcbiAgICAgKiBAcGFyYW0gY2FsbGJhY2tcbiAgICAgKi9cbiAgICBwdWJsaWMgY2xvc2UoKTogUHJvbWlzZTx2b2lkPiB7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGlmICghdGhpcy5faXNPcGVuKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KCdTUUxJVEUuQ0xPU0UgLSBEYXRhYmFzZSBpcyBhbHJlYWR5IGNsb3NlZCcpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5fZGIuY2xvc2UoKTtcbiAgICAgICAgICAgIHRoaXMuX2lzT3BlbiA9IGZhbHNlO1xuXG4gICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvKioqXG4gICAgICogRXhlYyBTUUxcbiAgICAgKiBAcGFyYW0gc3FsIC0gc3FsIHRvIHVzZVxuICAgICAqIEBwYXJhbSBwYXJhbXMgLSBvcHRpb25hbCBhcnJheSBvZiBwYXJhbWV0ZXJzIFxuICAgICAqIEByZXR1cm5zIFByb21pc2UgLSByZXN1bHQocmVzdWx0c2V0KSAtIGNhbiBiZSBsYXN0X3Jvd19pZCBmb3IgaW5zZXJ0LCBhbmQgcm93cyBhZmZlY3RlZCBmb3IgdXBkYXRlL2RlbGV0ZVxuICAgICAqL1xuICAgIHB1YmxpYyBleGVjU1FMKHNxbCwgcGFyYW1zKSB7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuXG5cbiAgICAgICAgICAgIGlmICghdGhpcy5faXNPcGVuKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KFwiU1FMSVRFLkVYRUNTUUwgLSBEYXRhYmFzZSBpcyBub3Qgb3BlblwiKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE5lZWQgdG8gc2VlIGlmIHdlIGhhdmUgdG8gcnVuIGFueSBzdGF0dXMgcXVlcmllcyBhZnRlcndvcmRzXG4gICAgICAgICAgICB2YXIgZmxhZ3MgPSAwO1xuICAgICAgICAgICAgdmFyIHRlc3QgPSBzcWwudHJpbSgpLnN1YnN0cigwLCA3KS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgaWYgKHRlc3QgPT09ICdpbnNlcnQgJykge1xuICAgICAgICAgICAgICAgIGZsYWdzID0gMTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGVzdCA9PT0gJ3VwZGF0ZSAnIHx8IHRlc3QgPT09ICdkZWxldGUgJykge1xuICAgICAgICAgICAgICAgIGZsYWdzID0gMjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAocGFyYW1zICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZGIuZXhlY1NRTChzcWwsIHRoaXMuX3RvU3RyaW5nQXJyYXkocGFyYW1zKSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZGIuZXhlY1NRTChzcWwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKEVycikge1xuICAgICAgICAgICAgICAgIHJlamVjdChFcnIpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc3dpdGNoIChmbGFncykge1xuICAgICAgICAgICAgICAgIGNhc2UgMDpcblxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG51bGwpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2V0KCdzZWxlY3QgbGFzdF9pbnNlcnRfcm93aWQoKScsIERhdGFiYXNlLlJFU1VMVFNBU0FSUkFZIHwgRGF0YWJhc2UuVkFMVUVTQVJFTkFUSVZFKS5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4oKGRhdGEpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGRhdGEgJiYgZGF0YVswXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KS5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2V0KCdzZWxlY3QgY2hhbmdlcygpJywgRGF0YWJhc2UuUkVTVUxUU0FTQVJSQVkgfCBEYXRhYmFzZS5WQUxVRVNBUkVOQVRJVkUpLlxuICAgICAgICAgICAgICAgICAgICAgICAgdGhlbigoZGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZGF0YSAmJiBkYXRhWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pLlxuICAgICAgICAgICAgICAgICAgICAgICAgY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7O1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8qKipcbiAgICAgKiBHZXQgdGhlIGZpcnN0IHJlY29yZCByZXN1bHQgc2V0XG4gICAgICogQHBhcmFtIHNxbCAtIHNxbCB0byBydW5cbiAgICAgKiBAcGFyYW0gcGFyYW1zIC0gb3B0aW9uYWxcbiAgICBcbiAgICAgKiBAcGFyYW0gbW9kZSAtIGFsbG93cyB5b3UgdG8gbWFudWFsbHkgb3ZlcnJpZGUgdGhlIHJlc3VsdHMgc2V0IHRvIGJlIGEgYXJyYXkgb3Igb2JqZWN0XG4gICAgICogQHJldHVybnMgUHJvbWlzZVxuICAgICAqL1xuICAgIGdldChzcWw6IHN0cmluZywgcGFyYW1zPzogYW55LCBtb2RlPzogYW55KSB7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICAgICAgaWYgKCF0aGlzLl9pc09wZW4pIHtcbiAgICAgICAgICAgICAgICByZWplY3QoXCJTUUxJVEUuR0VUIC0gRGF0YWJhc2UgaXMgbm90IG9wZW5cIik7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgY3Vyc29yO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAocGFyYW1zICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkRnVuY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgY3Vyc29yID0gdGhpcy5fZGIucmF3UXVlcnkoc3FsLCB0aGlzLl90b1N0cmluZ0FycmF5KHBhcmFtcykpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZEZ1bmN0aW9uXG4gICAgICAgICAgICAgICAgICAgIGN1cnNvciA9IHRoaXMuX2RiLnJhd1F1ZXJ5KHNxbCwgbnVsbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBObyBSZWNvcmRzXG4gICAgICAgICAgICBpZiAoY3Vyc29yLmdldENvdW50KCkgPT09IDApIHtcbiAgICAgICAgICAgICAgICBjdXJzb3IuY2xvc2UoKTtcblxuICAgICAgICAgICAgICAgIHJlc29sdmUobnVsbCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgcmVzdWx0cztcbiAgICAgICAgICAgIHZhciByZXN1bHRFbmdpbmUgPSB0aGlzLl9nZXRSZXN1bHRFbmdpbmUobW9kZSk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIC8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZEZ1bmN0aW9uXG4gICAgICAgICAgICAgICAgY3Vyc29yLm1vdmVUb0ZpcnN0KCk7XG4gICAgICAgICAgICAgICAgcmVzdWx0cyA9IHJlc3VsdEVuZ2luZShjdXJzb3IpO1xuICAgICAgICAgICAgICAgIGN1cnNvci5jbG9zZSgpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXNvbHZlKHJlc3VsdHMpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgcHJpdmF0ZSBfZ2V0UmVzdWx0RW5naW5lKG1vZGUpIHtcbiAgICAgICAgaWYgKG1vZGUgPT0gbnVsbCB8fCBtb2RlID09PSAwKSByZXR1cm4gREJHZXRSb3dSZXN1bHRzO1xuXG4gICAgICAgIHZhciByZXN1bHRUeXBlID0gKG1vZGUgJiBEYXRhYmFzZS5SRVNVTFRTQVNBUlJBWSB8IERhdGFiYXNlLlJFU1VMVFNBU09CSkVDVCk7XG4gICAgICAgIGlmIChyZXN1bHRUeXBlID09PSAwKSB7XG4gICAgICAgICAgICByZXN1bHRUeXBlID0gdGhpcy5fcmVzdWx0VHlwZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgdmFsdWVUeXBlID0gKG1vZGUgJiBEYXRhYmFzZS5WQUxVRVNBUkVOQVRJVkUgfCBEYXRhYmFzZS5WQUxVRVNBUkVTVFJJTkdTKTtcbiAgICAgICAgaWYgKHZhbHVlVHlwZSA9PT0gMCkge1xuICAgICAgICAgICAgdmFsdWVUeXBlID0gdGhpcy5fdmFsdWVzVHlwZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyZXN1bHRUeXBlID09PSBEYXRhYmFzZS5SRVNVTFRTQVNPQkpFQ1QpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZVR5cGUgPT09IERhdGFiYXNlLlZBTFVFU0FSRVNUUklOR1MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gREJHZXRSb3dPYmplY3RTdHJpbmc7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBEQkdldFJvd09iamVjdE5hdGl2ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZVR5cGUgPT09IERhdGFiYXNlLlZBTFVFU0FSRVNUUklOR1MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gREJHZXRSb3dBcnJheVN0cmluZztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIERCR2V0Um93QXJyYXlOYXRpdmU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICAvKioqXG4gICAgICogVGhpcyByZXR1cm5zIHRoZSBlbnRpcmUgcmVzdWx0IHNldCBpbiBhIGFycmF5IG9mIHJvd3NcbiAgICAgKiBAcGFyYW0gc3FsIC0gU3FsIHRvIHJ1blxuICAgICAqIEBwYXJhbSBwYXJhbXMgLSBvcHRpb25hbCBcblxuICAgICAqIEByZXR1cm5zIFByb21pc2VcbiAgICAgKi9cbiAgICBwdWJsaWMgYWxsKHNxbDogc3RyaW5nLCBwYXJhbXM/OiBhbnkpIHtcblxuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgICAgIGlmICghdGhpcy5faXNPcGVuKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KFwiU1FMSVRFLkFMTCAtIERhdGFiYXNlIGlzIG5vdCBvcGVuXCIpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGN1cnNvciwgY291bnQ7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGlmIChwYXJhbXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAvL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRGdW5jdGlvblxuICAgICAgICAgICAgICAgICAgICBjdXJzb3IgPSB0aGlzLl9kYi5yYXdRdWVyeShzcWwsIHRoaXMuX3RvU3RyaW5nQXJyYXkocGFyYW1zKSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkRnVuY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgY3Vyc29yID0gdGhpcy5fZGIucmF3UXVlcnkoc3FsLCBudWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY291bnQgPSBjdXJzb3IuZ2V0Q291bnQoKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuXG4gICAgICAgICAgICAvLyBObyBSZWNvcmRzXG4gICAgICAgICAgICBpZiAoY291bnQgPT09IDApIHtcbiAgICAgICAgICAgICAgICBjdXJzb3IuY2xvc2UoKTtcblxuICAgICAgICAgICAgICAgIHJlc29sdmUoW10pO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZEZ1bmN0aW9uXG4gICAgICAgICAgICBjdXJzb3IubW92ZVRvRmlyc3QoKTtcblxuICAgICAgICAgICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkYXRhID0gREJHZXRSb3dSZXN1bHRzKGN1cnNvcik7IC8vIGpzaGludCBpZ25vcmU6bGluZVxuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIC8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZEZ1bmN0aW9uXG4gICAgICAgICAgICAgICAgICAgIGN1cnNvci5tb3ZlVG9OZXh0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGN1cnNvci5jbG9zZSgpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXNvbHZlKHJlc3VsdHMpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgLyoqKlxuICAgICAqIFRoaXMgc2VuZHMgZWFjaCByb3cgb2YgdGhlIHJlc3VsdCBzZXQgdG8gdGhlIFwiQ2FsbGJhY2tcIiBhbmQgYXQgdGhlIGVuZCBjYWxscyB0aGUgY29tcGxldGUgY2FsbGJhY2sgdXBvbiBjb21wbGV0aW9uXG4gICAgICogQHBhcmFtIHNxbCAtIHNxbCB0byBydW5cbiAgICAgKiBAcGFyYW0gcGFyYW1zIC0gb3B0aW9uYWxcbiAgICAgKiBAcGFyYW0gY2FsbGJhY2sgLSBjYWxsYmFjayAoZXJyLCByb3dzUmVzdWx0KVxuICAgICAqIEBwYXJhbSBjb21wbGV0ZSAtIGNhbGxiYWNrIChlcnIsIHJlY29yZENvdW50KVxuICAgICAqIEByZXR1cm5zIFByb21pc2VcbiAgICAgKi9cbiAgICBwdWJsaWMgZWFjaChzcWw6IHN0cmluZywgcGFyYW1zOiBhbnksIGNhbGxiYWNrPzogKGVycjogYW55LCBkYXRhOiBhbnkpID0+IGFueSwgY29tcGxldGU/OiAoZXJyOiBhbnksIGRhdGE6IGFueSkgPT4gYW55KSB7XG4gICAgICAgIGlmICh0eXBlb2YgcGFyYW1zID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjb21wbGV0ZSA9IGNhbGxiYWNrO1xuICAgICAgICAgICAgY2FsbGJhY2sgPSBwYXJhbXM7XG4gICAgICAgICAgICBwYXJhbXMgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDYWxsYmFjayBpcyByZXF1aXJlZFxuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTUUxJVEUuRUFDSCAtIHJlcXVpcmVzIGEgY2FsbGJhY2tcIik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgICAgICAvLyBTZXQgdGhlIGVycm9yIENhbGxiYWNrXG4gICAgICAgICAgICB2YXIgZXJyb3JDQiA9IGNvbXBsZXRlIHx8IGNhbGxiYWNrO1xuXG4gICAgICAgICAgICB2YXIgY3Vyc29yLCBjb3VudDtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKHBhcmFtcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZEZ1bmN0aW9uXG4gICAgICAgICAgICAgICAgICAgIGN1cnNvciA9IHRoaXMuX2RiLnJhd1F1ZXJ5KHNxbCwgdGhpcy5fdG9TdHJpbmdBcnJheShwYXJhbXMpKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRGdW5jdGlvblxuICAgICAgICAgICAgICAgICAgICBjdXJzb3IgPSB0aGlzLl9kYi5yYXdRdWVyeShzcWwsIG51bGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb3VudCA9IGN1cnNvci5nZXRDb3VudCgpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgZXJyb3JDQihlcnIsIG51bGwpO1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTm8gUmVjb3Jkc1xuICAgICAgICAgICAgaWYgKGNvdW50ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgY3Vyc29yLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgaWYgKGNvbXBsZXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbXBsZXRlKG51bGwsIDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXNvbHZlKDApO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZEZ1bmN0aW9uXG4gICAgICAgICAgICBjdXJzb3IubW92ZVRvRmlyc3QoKTtcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRhdGEgPSBEQkdldFJvd1Jlc3VsdHMoY3Vyc29yKTsgLy8ganNoaW50IGlnbm9yZTpsaW5lXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICAvL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRGdW5jdGlvblxuICAgICAgICAgICAgICAgICAgICBjdXJzb3IubW92ZVRvTmV4dCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjdXJzb3IuY2xvc2UoKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGVycm9yQ0IoZXJyLCBudWxsKTtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY29tcGxldGUpIHtcbiAgICAgICAgICAgICAgICBjb21wbGV0ZShudWxsLCBjb3VudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXNvbHZlKGNvdW50KTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuXG5cblxuXG4gICAgLyoqXG4gICAgICogRG9lcyB0aGlzIGRhdGFiYXNlIGV4aXN0IG9uIGRpc2tcbiAgICAgKiBAcGFyYW0gbmFtZVxuICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgZXhpc3RzKG5hbWUpOiBib29sZWFuIHtcbiAgICAgICAgLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkRnVuY3Rpb25cbiAgICAgICAgdmFyIGRiTmFtZSA9IF9nZXRDb250ZXh0KCkuZ2V0RGF0YWJhc2VQYXRoKG5hbWUpLmdldEFic29sdXRlUGF0aCgpO1xuICAgICAgICB2YXIgZGJGaWxlID0gbmV3IGphdmEuaW8uRmlsZShkYk5hbWUpO1xuICAgICAgICByZXR1cm4gZGJGaWxlLmV4aXN0cygpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBEZWxldGUgdGhlIGRhdGFiYXNlIGZpbGUgaWYgaXQgZXhpc3RzXG4gICAgICogQHBhcmFtIG5hbWVcbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIGRlbGV0ZURhdGFiYXNlKG5hbWUpIHtcbiAgICAgICAgLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkRnVuY3Rpb25cbiAgICAgICAgdmFyIGRiTmFtZSA9IF9nZXRDb250ZXh0KCkuZ2V0RGF0YWJhc2VQYXRoKG5hbWUpLmdldEFic29sdXRlUGF0aCgpO1xuICAgICAgICB2YXIgZGJGaWxlID0gbmV3IGphdmEuaW8uRmlsZShkYk5hbWUpO1xuICAgICAgICBpZiAoZGJGaWxlLmV4aXN0cygpKSB7XG4gICAgICAgICAgICBkYkZpbGUuZGVsZXRlKCk7XG4gICAgICAgICAgICBkYkZpbGUgPSBuZXcgamF2YS5pby5GaWxlKGRiTmFtZSArICctam91cm5hbCcpO1xuICAgICAgICAgICAgaWYgKGRiRmlsZS5leGlzdHMoKSkge1xuICAgICAgICAgICAgICAgIGRiRmlsZS5kZWxldGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBDb3B5IHRoZSBkYXRhYmFzZSBmcm9tIHRoZSBpbnN0YWxsIGxvY2F0aW9uXG4gICAgICogQHBhcmFtIG5hbWVcbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIGNvcHlEYXRhYmFzZShuYW1lKSB7XG5cbiAgICAgICAgLy9PcGVuIHlvdXIgbG9jYWwgZGIgYXMgdGhlIGlucHV0IHN0cmVhbVxuICAgICAgICAvL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRGdW5jdGlvblxuICAgICAgICB2YXIgbXlJbnB1dCA9IF9nZXRDb250ZXh0KCkuZ2V0QXNzZXRzKCkub3BlbihcImFwcC9cIiArIG5hbWUpO1xuXG4gICAgICAgIGlmIChuYW1lLmluZGV4T2YoJy8nKSkge1xuICAgICAgICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyaW5nKG5hbWUuaW5kZXhPZignLycpICsgMSk7XG4gICAgICAgIH1cblxuICAgICAgICAvL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRGdW5jdGlvblxuICAgICAgICB2YXIgZGJuYW1lID0gX2dldENvbnRleHQoKS5nZXREYXRhYmFzZVBhdGgobmFtZSkuZ2V0QWJzb2x1dGVQYXRoKCk7XG4gICAgICAgIHZhciBwYXRoID0gZGJuYW1lLnN1YnN0cigwLCBkYm5hbWUubGFzdEluZGV4T2YoJy8nKSArIDEpO1xuXG4gICAgICAgIC8vIENyZWF0ZSBcImRhdGFiYXNlc1wiIGZvbGRlciBpZiBpdCBpcyBtaXNzaW5nLiAgVGhpcyBjYXVzZXMgaXNzdWVzIG9uIEVtdWxhdG9ycyBpZiBpdCBpcyBtaXNzaW5nXG4gICAgICAgIC8vIFNvIHdlIGNyZWF0ZSBpdCBpZiBpdCBpcyBtaXNzaW5nXG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHZhciBqYXZhRmlsZSA9IG5ldyBqYXZhLmlvLkZpbGUocGF0aCk7XG4gICAgICAgICAgICBpZiAoIWphdmFGaWxlLmV4aXN0cygpKSB7XG4gICAgICAgICAgICAgICAgLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkRnVuY3Rpb25cbiAgICAgICAgICAgICAgICBqYXZhRmlsZS5ta2RpcnMoKTtcbiAgICAgICAgICAgICAgICAvL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRGdW5jdGlvblxuICAgICAgICAgICAgICAgIGphdmFGaWxlLnNldFJlYWRhYmxlKHRydWUpO1xuICAgICAgICAgICAgICAgIC8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZEZ1bmN0aW9uXG4gICAgICAgICAgICAgICAgamF2YUZpbGUuc2V0V3JpdGFibGUodHJ1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5pbmZvKFwiU1FMSVRFIC0gQ09QWURBVEFCQVNFIC0gQ3JlYXRpbmcgREIgRm9sZGVyIEVycm9yXCIsIGVycik7XG4gICAgICAgIH1cblxuICAgICAgICAvL09wZW4gdGhlIGVtcHR5IGRiIGFzIHRoZSBvdXRwdXQgc3RyZWFtXG4gICAgICAgIHZhciBteU91dHB1dCA9IG5ldyBqYXZhLmlvLkZpbGVPdXRwdXRTdHJlYW0oZGJuYW1lKTtcblxuXG4gICAgICAgIHZhciBzdWNjZXNzID0gdHJ1ZTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vdHJhbnNmZXIgYnl0ZXMgZnJvbSB0aGUgaW5wdXRmaWxlIHRvIHRoZSBvdXRwdXRmaWxlXG4gICAgICAgICAgICAvL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRGdW5jdGlvbixKU1VucmVzb2x2ZWRWYXJpYWJsZVxuICAgICAgICAgICAgdmFyIGJ1ZmZlciA9IGphdmEubGFuZy5yZWZsZWN0LkFycmF5Lm5ld0luc3RhbmNlKGphdmEubGFuZy5CeXRlLmNsYXNzLmdldEZpZWxkKFwiVFlQRVwiKS5nZXQobnVsbCksIDEwMjQpO1xuICAgICAgICAgICAgdmFyIGxlbmd0aDtcbiAgICAgICAgICAgIHdoaWxlICgobGVuZ3RoID0gbXlJbnB1dC5yZWFkKGJ1ZmZlcikpID4gMCkge1xuICAgICAgICAgICAgICAgIC8vbm9pbnNwZWN0aW9uIEpTQ2hlY2tGdW5jdGlvblNpZ25hdHVyZXNcbiAgICAgICAgICAgICAgICBteU91dHB1dC53cml0ZShidWZmZXIsIDAsIGxlbmd0aCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgc3VjY2VzcyA9IGZhbHNlO1xuICAgICAgICB9XG5cblxuICAgICAgICAvL0Nsb3NlIHRoZSBzdHJlYW1zXG4gICAgICAgIG15T3V0cHV0LmZsdXNoKCk7XG4gICAgICAgIG15T3V0cHV0LmNsb3NlKCk7XG4gICAgICAgIG15SW5wdXQuY2xvc2UoKTtcbiAgICAgICAgcmV0dXJuIHN1Y2Nlc3M7XG4gICAgfTtcblxuXG5cbn1cblxuLyoqXG4gICAgICogZ2V0cyB0aGUgY3VycmVudCBhcHBsaWNhdGlvbiBjb250ZXh0XG4gICAgICogQHJldHVybnMgeyp9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbmZ1bmN0aW9uIF9nZXRDb250ZXh0KCk6IGFueSB7XG4gICAgaWYgKGFwcE1vZHVsZS5hbmRyb2lkLmNvbnRleHQpIHtcbiAgICAgICAgcmV0dXJuIChhcHBNb2R1bGUuYW5kcm9pZC5jb250ZXh0KTtcbiAgICB9XG4gICAgdmFyIGN0eCA9IGphdmEubGFuZy5DbGFzcy5mb3JOYW1lKFwiYW5kcm9pZC5hcHAuQXBwR2xvYmFsc1wiKS5nZXRNZXRob2QoXCJnZXRJbml0aWFsQXBwbGljYXRpb25cIiwgbnVsbCkuaW52b2tlKG51bGwsIG51bGwpO1xuICAgIGlmIChjdHgpXG4gICAgICAgIHJldHVybiBjdHg7XG4gICAgY3R4ID0gamF2YS5sYW5nLkNsYXNzLmZvck5hbWUoXCJhbmRyb2lkLmFwcC5BY3Rpdml0eVRocmVhZFwiKS5nZXRNZXRob2QoXCJjdXJyZW50QXBwbGljYXRpb25cIiwgbnVsbCkuaW52b2tlKG51bGwsIG51bGwpO1xuICAgIHJldHVybiBjdHg7XG59XG4iXX0=
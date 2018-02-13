import * as app from "tns-core-modules/application";
import * as platform from "tns-core-modules/platform";

export interface DataBase {

}
export abstract class SQLiteBase extends Promise<DataBase> implements DataBase {

    _isOpen: boolean;
    _resultType: number;
    _valuesType: number;

    /***
     * Constant that this structure is a sqlite structure
     * @type {boolean}
     */
    _isSqlite: boolean = true;

    /**
     *  
     * @param executor Executor function for Promise
     */
    constructor(executor: (resolve: Function, reject: Function) => any) {
        super((resolve, reject) => {

            this._isOpen = false;
            this._resultType = SQLiteBase.RESULTSASARRAY;
            this._valuesType = SQLiteBase.VALUESARENATIVE;

            return new Promise(executor);
        });
    }

    /***
     * This gets or sets the database version
     * @param ver to set or underfined to get version
     * @returns Promise<any>
     */
    public version(ver?: number | string): Promise<any> {
        if (ver !== undefined) {
            return this.execSQL('PRAGMA user_version=' + (ver).toString());
        } else {
            return this.get('PRAGMA user_version', SQLiteBase.RESULTSASARRAY).then((data) => {
                return (data && data[0]);
            });
        }
    };


    /***
     * Is the database currently open
     * @returns {boolean} - true if the db is open
     */
    public isOpen() {
        return this._isOpen;
    };

    /***
     * Gets/Sets whether you get Arrays or Objects for the row values
     * @param value - Database.RESULTSASARRAY or Database.RESULTSASOBJECT
     * @returns {number} - Database.RESULTSASARRAY or Database.RESULTSASOBJECT
     */
    public abstract resultType(value);

    /***
     * Gets/Sets whether you get Native or Strings for the row values
     * @param value - Database.VALUESARENATIVE or Database.VALUESARESTRINGS
     * @returns {number} - Database.VALUESARENATIVE or Database.VALUESARESTRINGS
     */
    public abstract valueType(value);

    /***
     * Closes this database, any queries after this will fail with an error
     * @param callback
     * @returns Promise
     */
    public abstract close(): Promise<any>;

    /***
     * Exec SQL
     * @param sql - sql to use
     * @param params - optional array of parameters
     * @param callback - (err, result) - can be last_row_id for insert, and rows affected for update/delete
     * @returns Promise
     */
    public abstract execSQL(sql: string, params?: string): Promise<any>;

    /***
     * Get the first record result set
     * @param sql - sql to run
     * @param params - optional
     * @param mode - allows you to manually override the results set to be a array or object
     * @returns Promise
     */
    public abstract get(sql: string, params?: any, mode?: number): Promise<any>;

    /***
     * Converts a Mixed Array to a String Array
     * @param params
     * @returns {Array}
     * @private
     */
    protected _toStringArray(params: any) {
        var stringParams = [];
        if (Object.prototype.toString.apply(params) === '[object Array]') {
            var count = params.length;
            for (var i = 0; i < count; ++i) {
                if (params[i] == null) { // jshint ignore:line
                    stringParams.push(null);
                } else {
                    stringParams.push(params[i].toString());
                }
            }
        } else {
            if (params == null) { // jshint ignore:line
                stringParams.push(null);
            } else {
                stringParams.push(params.toString());
            }
        }
        return stringParams;
    };

    /***
     * Is this a SQLite object
     * @param obj - possible sqlite object to check
     * @returns {boolean}
     */
    public static isSqlite(obj) {
        return obj && obj._isSqlite;
    };

    // Literal Defines
    public static RESULTSASARRAY = 1;
    public static RESULTSASOBJECT = 2;
    public static VALUESARENATIVE = 4;
    public static VALUESARESTRINGS = 8;
}
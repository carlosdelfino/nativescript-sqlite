
import * as app from "tns-core-modules/application";
import * as platform from "tns-core-modules/platform";


export abstract class SQLite implements Promise<SQLite>{
    protected dbname: string;
    protected options: any;


    readonly [Symbol.toStringTag]: "Promise";

    protected _promise: Promise<SQLite>;


    // Literal Defines
    public static readonly RESULTSASARRAY: number = 1;
    public static readonly RESULTSASOBJECT: number = 2;
    public static readonly VALUESARENATIVE: number = 4;
    public static readonly VALUESARESTRINGS: number = 8;

    protected _isOpen: boolean;
    protected _resultType: number;
    protected _valuesType: number;

    /***
     * Constant that this structure is a sqlite structure
     * @type {boolean}
     */
    protected _isSqlite: boolean = true;

    /**
     *  
     * @param executor Executor function for Promise
     */
    public constructor(dbname: string, options: any = {}) {

        console.log("constructor do sqlite.commons");
        this._isOpen = false;
        this._resultType = SQLite.RESULTSASARRAY;
        this._valuesType = SQLite.VALUESARENATIVE;
        this.dbname = dbname;
        this.options = options;
        console.log("finaliza o construtor do sqllite.commons");
    }
    /**
      * Attaches callbacks for the resolution and/or rejection of the Promise.
      * @param onfulfilled The callback to execute when the Promise is resolved.
      * @param onrejected The callback to execute when the Promise is rejected.
      * @returns A Promise for the completion of which ever callback is executed.
      */
    public then<TResult1 = SQLite, TResult2 = never>(onfulfilled?: ((value: SQLite) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<TResult1 | TResult2> {
        console.log("Sqlite-common.then inicia");
        if (this._promise == undefined) {
            this._promise = new Promise<SQLite>((resolve, reject) => {

                console.log("executor do sqllite.android");
                try {
                    this._initDataBase();
                } catch (err) {
                    console.error("SQLITE.CONSTRUCTOR -  Open DB Error", err);
                    reject(err);
                }

                console.log("finaliza executor do sqlite.android: " + this);
                console.dir(this);
                return resolve(this);
            });
        }
        let then = this._promise.then((a) => onfulfilled(a), (a) => onrejected(a));
        console.log("Sqlite-common.then finaliza: ");
        console.dir(then);
        return then;
    }

    /**
      * Attaches a callback for only the rejection of the Promise.
      * @param onrejected The callback to execute when the Promise is rejected.
      * @returns A Promise for the completion of the callback.
      */
    public catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<SQLite | TResult> {
        console.log("Sqlite-common.catch");
        //  console.log(new Error().stack);
        return this._promise.catch(onrejected);
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
            return this.get('PRAGMA user_version', SQLite.RESULTSASARRAY).then((data) => {
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
    public abstract execSQL(sql: string, params?: string[]): Promise<any>;

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
    protected _toStringArray(...params: any[]) {
        var stringParams = [];
        if (Object.prototype.toString.apply(params) === '[object Array]') {
            params.forEach((value: any) => {
                if (value == null) { // jshint ignore:line
                    stringParams.push(null);
                } else {
                    stringParams.push(value.toString());
                }
            });
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

    protected abstract _initDataBase(): any;

    /***
     * This returns the entire result set in a array of rows
     * @param sql - Sql to run
     * @param params - optional 

     * @returns Promise
     */
    public abstract all(sql: String, ...params: any[]);

}
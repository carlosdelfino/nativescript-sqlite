export type DbName = (string | File);
export type Callback = (err:string, data:any) => any;

export default class Database extends Promise<Database>{

    /**
     * 
     * @param dbname 
     */
    public constructor(dbname: DbName);

    /***
     * Constant that this structure is a sqlite structure
     * @type {boolean}
     */
    private _isSqlite: boolean;

    /***
     * This gets or sets the database version
     * @param val to set or undefined for get version
     * @returns Promise<any>
     */
    public version(ver?: number|string): Promise<any> ;

    /***
     * Is the database currently open
     * @returns {boolean} - true if the db is open
     */
    public isOpen():boolean;

    /***
     * Gets/Sets whether you get Arrays or Objects for the row values
     * @param value - Database.RESULTSASARRAY or Database.RESULTSASOBJECT
     * @returns {number} - Database.RESULTSASARRAY or Database.RESULTSASOBJECT
     */
    public resultType(value:any):number;

    /***
     * Gets/Sets whether you get Native or Strings for the row values
     * @param value - Database.VALUESARENATIVE or Database.VALUESARESTRINGS
     * @returns {number} - Database.VALUESARENATIVE or Database.VALUESARESTRINGS
     */
    public valueType(value:any):number;

    /*
     * Dummy transaction function for public version
     * @param callback
     * @returns {Promise<T>}
     */
    public begin():Promise<any>;

    /***
     * Closes this database, any queries after this will fail with an error
     * @param callback
     */
    public close():Promise<any>;

    /***
     * Exec SQL
     * @param sql - sql to use
     * @param params - optional array of parameters
     * @param callback - (err, result) - can be last_row_id for insert, and rows affected for update/delete
     * @returns Promise
     */
    public execSQL(sql:string, params?: any);

    /***
     * Get the first record result set
     * @param sql - sql to run
     * @param params - optional 
     * @param mode - allows you to manually override the results set to be a array or object
     * @returns Promise
     */
    public get(sql: string, params?: any, mode?: any): Promise<any>;

    private _getResultEngine(mode);

    /***
     * This returns the entire result set in a array of rows
     * @param sql - Sql to run
     * @param params - optional
     * @returns Promise
     */
    public all(sql: string, params?: any): Promise<any>;

    /***
     * This sends each row of the result set to the "Callback" and at the end calls the complete callback upon completion
     * @param sql - sql to run
     * @param params - optional
     * @param callback - callback (err, rowsResult)
     * @param complete - callback (err, recordCount)
     * @returns Promise
     */
    public each(sql: string, params?: (any | Callback), callback?: Callback, complete?: Callback);

    /***
     * Converts a Mixed Array to a String Array
     * @param params
     * @returns {Array}
     * @private
     */
    private _toStringArray(params: any): string[];

    /***
     * Is this a SQLite object
     * @param obj - possible sqlite object to check
     * @returns {boolean}
     */
    public static isSqlite(obj: any): boolean;

    /**
     * Does this database exist on disk
     * @param name
     * @returns {boolean}
     */
    public static exists(name: string): boolean;

    /**
     * Delete the database file if it exists
     * @param name
     */
    public static deleteDatabase(name: string);

    /**
     * Copy the database from the install location
     * @param name
     */
    public static copyDatabase(name: string);

    // Literal Defines
    public static readonly RESULTSASARRAY;
    public static readonly RESULTSASOBJECT;
    public static readonly VALUESARENATIVE;
    public static readonly VALUESARESTRINGS;

}

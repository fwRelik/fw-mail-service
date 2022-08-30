import { NextFunction, Request, Response } from 'express';
import mysql, { Pool } from 'mysql';
import { clientCheckConfig } from '../service.config.json';

interface IDataCreate {
    id: string;
    name?: string;
    ip?: string;
    email?: string;
    phone?: string;
    message?: string;
    attempt: number;
    date?: string;
}

export class ClientCheck {
    body: any;
    default_attempt: number;
    dataCreate: IDataCreate;
    pool: Pool

    constructor(
        private req: Request,
        private res: Response,
        private next: NextFunction
    ) {
        this.body = this.req.body;
        this.default_attempt = 2;
        this.dataCreate = {
            id: '',
            name: this.body.name,
            ip: req.ip,
            email: this.body.email,
            phone: this.body.phone,
            message: this.body.message,
            attempt: this.default_attempt,
            date: this.dateFunc(new Date())
        };

        this.pool = mysql.createPool(clientCheckConfig.pool);
    }

    commands(method: string, data?: IDataCreate): string {
        let cName: Array<string> = [],
            cValue: Array<string | number> = [],
            command: Array<string> = [];

        if (data) {
            Object.entries(data).forEach(item => {
                cName.push(item[0]);
                cValue.push(item[1]);
                command.push(`${item[0]} = '${item[1]}'`);
            });
        }

        const commands: any = {
            get: `SELECT * FROM ${clientCheckConfig.table_name}`,
            update: `UPDATE ${clientCheckConfig.table_name} SET ${command.join(', ')} WHERE id = ${data?.id}`,
            insert: `INSERT INTO ${clientCheckConfig.table_name} (${cName.join(', ')}) VALUES ( '${cValue.join("', '")}')`
        }

        return commands[method];
    }

    dateFunc(date: any) {
        const d = new Date(date);
        return `${d.getFullYear()}-${('0' + (d.getMonth() + 1)).slice(-2)}-${('0' + d.getDate()).slice(-2)}`;
    }

    async userCheck() {
        const data = await this.appealDB(this.commands('get'));
        const result = data.find((item: IDataCreate) => this.req.ip === item.ip);

        return new Promise((resolve, reject) => {
            if (!result) {
                this.appealDB(this.commands('insert', this.dataCreate));
                resolve(null);
                return;
            } else if (result.attempt <= 0) {
                if (String(this.dateFunc(new Date())) == this.dateFunc(result.date)) {
                    reject();
                    return;
                } else {
                    this.appealDB(this.commands('update', {
                        id: result.id,
                        attempt: this.default_attempt - 1,
                        date: this.dateFunc(new Date())
                    }));
                    resolve(null);
                    return;
                }
            }

            this.appealDB(this.commands('update', {
                id: result.id,
                attempt: result.attempt - 1
            }));
            resolve(null);
        });
    }

    async appealDB(command: string): Promise<any> {
        return await new Promise((resolve) => {
            try {
                this.pool.getConnection((err, connection) => {
                    if (err) throw new Error(String(err));
                    connection.query(command, (err, rows) => {
                        connection.release();

                        if (err) throw new Error(String(err));
                        resolve(rows);
                    });
                });
            } catch (e) {
                console.log(e);
            }
        });
    }

    init() {
        this.userCheck()
            .then(() => this.next())
            .catch(() => {
                console.log('Denied: ' + this.req.ip);
                this.res.status(403).send('Send limit per day reached.');
            });
    }
}
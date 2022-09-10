import { NextFunction, Request, Response } from 'express';
import mysql, { Pool } from 'mysql';
import { clientCheckConfig } from '../service.config.json';
import { IClientCheck, IDataCreate } from './client-check.middleware.interface';

export class ClientCheck implements IClientCheck {
    body: any;
    default_attempt: number;
    dataCreate: IDataCreate;
    pool: Pool;
    clientIp: string | string[] | undefined;

    constructor(
        private req: Request,
        private res: Response,
        private next: NextFunction
    ) {
        this.default_attempt = 2;

        // x-forwarded-for сreates a risk for customer validation and database overflow.
        this.clientIp = this.req.headers['x-forwarded-for'] || this.req.socket.remoteAddress;

        this.dataCreate = {
            id: '',
            name: this.req.body.name,
            ip: this.clientIp,
            email: this.req.body.email,
            phone: this.req.body.phone,
            message: this.req.body.message,
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

    dateFunc(date: Date): string {
        const d = new Date(date);
        return `${d.getFullYear()}-${('0' + (d.getMonth() + 1)).slice(-2)}-${('0' + d.getDate()).slice(-2)}`;
    }

    async userCheck(): Promise<void> {
        const data = await this.appealDB(this.commands('get'));
        const result = data.find((item: IDataCreate) => this.clientIp === item.ip);

        return new Promise((resolve, reject) => {
            if (!result) {
                this.appealDB(this.commands('insert', this.dataCreate));
                resolve();
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
                    resolve();
                    return;
                }
            }

            this.appealDB(this.commands('update', {
                id: result.id,
                attempt: result.attempt - 1
            }));
            resolve();
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
                console.log('Denied: ' + this.clientIp);
                this.res.status(403).send('Send limit per day reached.');
            });
    }
}
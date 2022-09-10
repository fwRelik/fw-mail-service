import express, { Express } from 'express';
import { Server } from 'http';
import bodyParser from 'body-parser';

import { MailService } from './service/mail.service';
import { IMailService } from './service/mail.service.interface';
import { ClientCheck } from './middleware/client-check.middleware';
import { RequestValidator } from './middleware/validator.middleware';
import { IRequestValidator } from './middleware/validator.middleware.interface';

export class App {
    app: Express;
    server: Server;
    port: number | string;
    mailService: IMailService;
    requestValidator: IRequestValidator;

    constructor() {
        this.app = express();
        this.port = process.env.PORT ?? 3000;
        this.mailService = new MailService();
        this.requestValidator = new RequestValidator();
    }

    useMiddleware(): void {
        // application/x-www-form-urlencoded
        this.app.use(bodyParser.urlencoded({ extended: false }));

        this.app.use((req, res, next) => {
            res.append('Access-Control-Allow-Origin', ['*']);
            res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
            res.append('Access-Control-Allow-Headers', 'Content-Type');
            next();
        });

        this.app.use(this.requestValidator.headers);
        this.app.use(this.requestValidator.body);

        this.app.use((req, res, next) => {
            new ClientCheck(req, res, next).init();
        });
    }

    useRoutes(): void {
        this.app.post('/', (req, res) => {
            const body = req.body;

            console.log('Client IP: ' + req.headers['x-forwarded-for'] || req.socket.remoteAddress);

            this.mailService.transition(body)
                .then(result => {
                    console.log(result);
                    res.status(200).send('Ok');
                })
                .catch(e => {
                    console.error('Mail service error: ' + e);
                    res.status(500).send('Mail service error');
                });
        });


        this.app.all('*', (req, res) => {
            res.status(404).send('Not Found.');
        });
    }

    public async init(): Promise<void> {
        this.useMiddleware();
        this.useRoutes();

        this.app.listen(this.port);

        console.log(`Сервер запущен на http://localhost:${this.port}`)
    }
}
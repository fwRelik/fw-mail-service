import express, { Express } from 'express';
import { Server } from 'http';
import bodyParser from 'body-parser';

import { MailService } from './service/mail.service';
import { IMailService } from './service/mail.service.interface';
import { ClientCheck } from './middleware/client-check.middleware';
import { RequestValidator } from './middleware/validator.middleware';
import { IRequestValidator } from './middleware/validator.middleware.interface';
import { ServerController } from './server/server.controller';

export class App {
    app: Express;
    server: Server;
    port: number | string;
    mailService: IMailService;
    requestValidator: IRequestValidator;
    serverController: ServerController;

    constructor() {
        this.app = express();
        this.port = process.env.PORT ?? 3000;
        this.mailService = new MailService();
        this.requestValidator = new RequestValidator();
        this.serverController = new ServerController(this.mailService);
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

        // Requests validation.
        this.app.use(this.requestValidator.headers);
        this.app.use(this.requestValidator.body);

        // Preclusion  tion too frequent requests.
        this.app.use((req, res, next) => {
            new ClientCheck(req, res, next).init();
        });
    }

    useRoutes(): void {
        this.app.use('/', this.serverController.router);

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
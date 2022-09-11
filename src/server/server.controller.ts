import { NextFunction, Request, Response } from "express";
import { BaseController } from "../common/base.controller";
import { IMailService } from "../service/mail.service.interface";
import { IServerController } from "./server.controller.interface";

export class ServerController extends BaseController implements IServerController {
    constructor(
        private mailService: IMailService
    ) {
        super();
        this.bindRoutes([
            {
                path: '/',
                method: 'post',
                func: this.mail
            }
        ]);
    }

    mail(req: Request, res: Response, next: NextFunction): void {
        const body = req.body;
        this.mailService.transition(body)
            .then(result => {
                console.log(result);
                res.status(200).send('Ok');
            })
            .catch(e => {
                console.error('Mail service error: ' + e);
                res.status(500).send('Mail service error');
            });
    }
}
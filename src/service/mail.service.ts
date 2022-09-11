import nodemailer, { SentMessageInfo } from 'nodemailer';
import { MailTemplate } from '../common/mail-template';
import { IMailTemplate } from '../common/mail-template.interface';
import { IMailService } from './mail.service.interface';

import { mailServiceConfig } from '../service.config.json';
const { sender } = mailServiceConfig;

export class MailService implements IMailService {
    mailTemplate: IMailTemplate;

    constructor() {
        this.mailTemplate = new MailTemplate();
    }

    async transition(data: object): Promise<SentMessageInfo> {
        const html = await this.mailTemplate.readTemplate(data);

        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: sender.email,
                pass: sender.account_app_password,
            }
        });

        let result = await transporter.sendMail({
            from: sender.email,
            to: sender.target,
            subject: html.head,
            html: html.body
        });

        return result;
    }
}
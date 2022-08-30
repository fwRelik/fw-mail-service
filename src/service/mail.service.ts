import nodemailer, { SentMessageInfo } from 'nodemailer';
import { MailTemplate } from '../common/mail-template';
import { mailServiceConfig } from '../service.config.json';

const { sender } = mailServiceConfig;

export class MailService {
    mailTemplate: MailTemplate;

    constructor() {
        this.mailTemplate = new MailTemplate();
    }

    async transition(data: any): Promise<SentMessageInfo> {
        const html = await this.mailTemplate.readTemplate(data);

        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: sender.email,
                pass: sender.account_api_key,
            }
        });

        let result = await transporter.sendMail({
            from: sender.email,
            to: data.target,
            subject: `New Mail from ${data.email}`,
            html: html
        });

        return result;
    }
}
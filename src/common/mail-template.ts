import { readFile } from 'node:fs';
import { mailServiceConfig } from '../service.config.json';
import path from 'path';
import { IDataObject, IMailTemplate } from './mail-template.interface';

const { html_template_file_name } = mailServiceConfig;


export class MailTemplate implements IMailTemplate {
    templatePath: string;

    constructor() {
        this.templatePath = path.resolve(__dirname, '../mail-template/', html_template_file_name);
    }

    templateFilling(template: string, data: object): IDataObject {
        const regex = new RegExp(`<email-subject>(.*?)<email-subject>`, 'g');
        const obj: IDataObject = { 'body': undefined, 'head': undefined };
        let body = template;

        Object.entries(data).forEach(item => {
            let regex = new RegExp(`\\[\\{\\$${item[0]}\\}\\]`, 'g');
            body = body.replace(regex, item[1]);
        });

        let head = body.match(regex);
        obj.head = head ? head[0].replace(regex, '$1') : undefined;
        obj.body = body;

        return obj;
    }

    async readTemplate(data: object): Promise<IDataObject> {
        return new Promise((resolve, reject) => {
            readFile(this.templatePath, 'utf8', (err, result) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(this.templateFilling(result, data));
            });
        });
    }
}
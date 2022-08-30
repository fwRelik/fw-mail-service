import { readFile } from 'node:fs';
import { mailServiceConfig } from '../service.config.json';
import path from 'path';

const { html_template_file_name } = mailServiceConfig;

export class MailTemplate {
    templatePath: string;

    constructor() {
        this.templatePath = path.resolve(__dirname, '../mail-template/', html_template_file_name);
    }

    templateFilling(template: string, data: object): string {
        let result = template;

        Object.entries(data).forEach(item => {
            result = result.replace(`[{${item[0]}}]`, item[1]);
        });

        return result;
    }

    async readTemplate(data: object): Promise<string> {
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
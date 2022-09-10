import { SentMessageInfo } from "nodemailer";

export interface IMailService {
    transition: (data: object) => Promise<SentMessageInfo>;
}
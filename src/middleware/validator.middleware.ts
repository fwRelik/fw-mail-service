import { NextFunction, Request, Response } from "express";

export class RequestValidator {
    headers(req: Request, res: Response, next: NextFunction): void {
        const { headers, method } = req;

        if (method === 'POST') {
            if (headers['content-type'] !== 'application/x-www-form-urlencoded') {
                res.status(400).send(`Content-Type only must be 'application/x-www-form-urlencoded'`);
                return;
            }

            next();
        } else {
            res.status(403).send(`Forbidden`);
        }
    }

    body(req: Request, res: Response, next: NextFunction): void {
        try {
            req.body = JSON.parse(Object.keys(req.body)[0]);
            next();
        } catch (e) {
            res.status(500).send(`Wrong data format`);
        }
    }
}
import { NextFunction, Request, Response } from "express";

export interface IServerController {
    mail: (req: Request, res: Response, next: NextFunction) => void;
}
import { NextFunction, Request, Response } from "express";

export interface IRequestValidator {
    headers: (req: Request, res: Response, next: NextFunction) => void;
    body: (req: Request, res: Response, next: NextFunction) => void;
}
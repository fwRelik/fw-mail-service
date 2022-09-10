export interface IDataCreate {
    id: string;
    name?: string;
    ip?: string | string[] | undefined;
    email?: string;
    phone?: string;
    message?: string;
    attempt: number;
    date?: string;
}

export interface IClientCheck {
    init: () => void;
    userCheck?: () => Promise<void>;
    appealDB?: (command: string) => Promise<any>
    commands?: (method: string, data?: IDataCreate) => string;
    dateFunc?: (date: Date) => string;
}
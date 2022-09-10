export interface IDataObject {
    head: string | undefined;
    body: string | undefined;
}

export interface IMailTemplate {
    templateFilling: (template: string, data: object) => IDataObject;
    readTemplate: (data: object) => Promise<IDataObject>;
}
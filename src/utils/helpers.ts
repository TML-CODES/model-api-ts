import { Request } from 'express';

export function verifyTokenFormat(req: Request): string{
    if (!req.headers.authorization) throw({ status: 401 });

    const tokenSplited = req.headers.authorization.split(" ");

    if (tokenSplited.length !== 2 || !/^Bearer$/i.test(tokenSplited[0]))
        throw({ status: 401, message: 'Invalid format Bearer token' });

    return tokenSplited[1];
}

export function booleanify (value: string): boolean {
    const truthy: string[] = [
        'true',
        'True',
        '1'
    ]

    return truthy.includes(String(value))
}
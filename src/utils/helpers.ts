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


type WherePrisma = {
    [key: string]: any,
    AND?: any[],
    OR?: any[],
    NOT?: any[]
}

type OrderByPrisma = {
    [key: string]: 'asc' | 'desc'
}

export function buildSqlToPrismaClosures (where?: string | any, orderBy?: string | any): {where: WherePrisma, orderBy: OrderByPrisma}{
    let whereObj: WherePrisma = undefined;
    let orderByObj: OrderByPrisma = undefined;

    function formatObjOperator(keyValueStr: string, obj = {}){
        let charOp: string;

        if(keyValueStr.includes('=')){
            charOp = '=';
        }else if(keyValueStr.toLowerCase().includes('not')){
            charOp = 'not';
        }else if(keyValueStr.toLowerCase().includes('contains')){
            charOp = 'contains';
        }
    
        let key: string = keyValueStr.split(charOp)[0];
        let value: any = keyValueStr.split(charOp)[1];

        key = key.trim();
        value = value.trim().replace(/['"]/gim, '');
        
        if(value.toLowerCase() === 'null')
            value = null;
        else if(value.toLowerCase() === 'true' || value.toLowerCase() === 'false')
            value = booleanify(value);
    
        if(charOp === '='){
            obj[key] = {
                equals: value
            };
        }else if(charOp === 'not'){
            if(value === null){
                obj[key] = {
                    not: null
                };
            }else{
                obj[key] = {
                    not: {
                        contains: value
                    },
                    mode: 'insensitive'
                };
            }
        }else if(charOp === 'contains'){
            obj[key] = {
                contains: value,
                mode: 'insensitive'
            };
        }
    
        return obj;
    }

    if(where){
        if(typeof where === 'string'){
            whereObj = {};
    
            where.split(' and ').forEach((value, index, arr) =>{
                if(arr.length === 1 && !value.includes(' or ')){
                    whereObj = formatObjOperator(value);
                }else if(value.includes(' or ')){
                    if(!whereObj['OR'])
                        whereObj['OR'] = [];
    
                    value.split(' or ').forEach((value)=>{
                        whereObj.OR.push(formatObjOperator(value));
                    })            
                }else{
                    if(!whereObj['AND'])
                        whereObj['AND'] = [];
    
                    whereObj.AND.push(formatObjOperator(value));
                }
            });
        }else {
            whereObj = {};

            for(let key in where){
                key = key.trim();

                let value = where[key];
                if(typeof value == 'string'){
                    value = value.trim().replace(/['"]/gim, '');
                    if(value.toLowerCase() === 'null'){
                        value = null;
                    }else if(value.toLowerCase() === 'true' || value.toLowerCase() === 'false'){
                        value = booleanify(value);
                    }else if(value.includes('< ') || value.includes('> ')){
                        const operator = value.split(' ');
                        value = { [ (operator[0] == '<') ? 'lte' : 'gte' ]: operator[1] }
                    }
                }
                
                whereObj[key] = value;
            }
        }
    }

    if(orderBy){
        if(typeof orderBy === 'string'){
            const field: string = orderBy.split(' ')[0];
            const order = <'asc'|'desc'> orderBy.split(' ')[1].toLowerCase();
            orderByObj = (field && order) 
                ? { [field]: order } 
                : {}
            ;
        }else{
            orderByObj = orderBy;
        }
    }

    return {
        where: whereObj, 
        orderBy: orderByObj
    };
}
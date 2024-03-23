import { Request, Response, NextFunction } from "express";
import { JWTPayload, auth } from "express-oauth2-jwt-bearer";
import jwt from "jsonwebtoken";
import User from "../models/user";

// Extend the Request interface(for req.userId error)
declare global {
    namespace Express {
        interface Request {
            userId: string;
            auth0Id: string;
        }
    }
}

//from auth0 site's created api 
export const jwtCheck = auth({
    //provide this audeience in froentend auth0Provider as well
    audience: process.env.AUTH0_AUDIENCE,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
    tokenSigningAlg: 'RS256'
});

export const jwtParse = async (req: Request, res: Response, next: NextFunction) => {
    const { authorization } = req.headers;

    if (!authorization || !authorization.startsWith("Bearer ")) {
        return res.sendStatus(401);
    }

    const token = authorization.split(" ")[1];

    try {
        const decoded = jwt.decode(token) as JWTPayload;
        const auth0Id = decoded.sub;

        const user = await User.findOne({ auth0Id });

        if (!user) {
            return res.sendStatus(401);
        }

        req.auth0Id = auth0Id || '';
        req.userId = user._id.toString();
        next();

    } catch (error) {
        return res.sendStatus(401);
    }
}
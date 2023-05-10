import bodyParser from "body-parser";

export const parseURI = (req: any, res: any, next: any) => {
    var err = null;
    try {
        decodeURIComponent(req.path)
    } catch(e) {
        err = e
    }
    if(err) {
        return res.redirect('/')    
    }
    next();
}

export const parseBody = (req: any, res: any, next: () => void) => {
    bodyParser.json()(req, res, (error) => {
        if (error && error.status >= 400) {
            res.status(400).send({message: "Invalid request body"});
        } else {
            next();
        }
    });
}
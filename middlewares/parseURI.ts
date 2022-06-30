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
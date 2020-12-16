module.exports = (req, res, next) => {
  const {
    authorization
  } = req.headers;
  console.log("restricted", {
    authorization
  });
  if (authorization) {
    jwt.verify(authorization, JWT_SECRET, (err, decodedToken) => {
      if (err) {
        res.status(401).json({
          errorMessage: "Invalid Credentials"
        });
      } else {
        req.decodedToken = decodedToken;
        next();
      }
    });
  } else {
    res.status(400).json({
      message: "No credentials provided"
    });
  }
};

const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  let jwtToken;
  const authHeader = req.headers["authorization"];
  if (authHeader) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (!jwtToken) {
    res.status(400);
    res.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "login-token", async (error, payload) => {
      if (error) {
        res.status(401);
        res.send("Invalid JWT Token");
      } else {
        req.userId = payload.userId;
        req.role = payload.role;
        next();
      }
    });
  }
};

module.exports = authenticate;

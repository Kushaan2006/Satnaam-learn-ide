export const validateApiKey = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) throw new Error("Access Denied");

    const [type, token] = authHeader.split(" ");

    if (type !== "Bearer" || !token)
      throw new Error("Invalid Authorization Parameters");

    if (token !== process.env.COMPILER_SERVICE_API_KEY)
      throw new Error("Forbidden Access - Access Denied");

    console.log(`Access Granted!`);

    next();
  } catch (error) {
    console.log(error);
    res.status(401).json({
      message: error.message,
    });
  }
};

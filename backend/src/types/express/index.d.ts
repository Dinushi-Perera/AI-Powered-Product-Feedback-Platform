declare namespace Express {
  interface Request {
    admin?: {
      email: string;
      userId: string;
      role: string;
    };
  }
}

import dotenv from "dotenv";
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

export const allowedOrigins = [
  "localhost:3000",
];

const corsOptions = {
  origin: allowedOrigins,
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Apikey",
    "Accept",
    "Origin",
    "X-Requested-With",
  ],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

export default corsOptions;
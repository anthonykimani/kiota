import dotenv from "dotenv";

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const APPLICATION_API_BASEURL = process.env.APPLICATION_API_BASEURL;
const APPLICATION_NAME = process.env.APPLICATION_NAME;
const APPLICATION_API_KEY = process.env.APPLICATION_API_KEY;

const apiOptions = {
    name: APPLICATION_NAME,
    baseApiUrl: APPLICATION_API_BASEURL,
    apiKey: APPLICATION_API_KEY,
    endPoints: {
        
    }
}

export default apiOptions;
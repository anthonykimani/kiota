import axios from "axios";
import apiOptions from "../../configs/apiconfig";
import { IResponse } from "../../interfaces/IResponse";

interface Params {
  headers: any;
}

const httpConfig: Params = {
  headers: {
    Authorization: "",
    apiKey: `${apiOptions.apiKey}`,
  },
};

const Http = {
  /**
   * Post request
   * @param url Url endpoint path
   * @param data Post data
   * @returns Promise<IResponse>
   */
  post: async function (url: string, data: any): Promise<IResponse> {
    try {
      let response = await axios({
        ...httpConfig,
        url: `${url}`,
        data,
        method: "post",
      });

      return {
        data: response.data,
        status: response.status,
        message: response.statusText,
      };
    } catch (er) {
      console.log(er);
      return {
        data: undefined,
        status: 512,
        message: er,
      };
    }
  },

  /**
   * Get request
   * @param url Url endpoint path
   * @param data Get data
   * @returns Promise<IResponse>
   */
  get: async function (url: string): Promise<IResponse> {
    try {
      let response = await axios({
        ...httpConfig,
        url: `${url}`,
        method: "get",
      });

      return {
        data: response.data,
        status: response.status,
        message: response.statusText,
      };
    } catch (er) {
      return {
        data: undefined,
        status: 512,
        message: er,
      };
    }
  },

  /**
   * delete request
   * @param url Url endpoint path
   * @param data Delete data
   * @returns Promise<IResponse>
   */
  delete: async function (url: string, data: any): Promise<IResponse> {
    try {
      let response = await axios({
        ...httpConfig,
        url: `${url}`,
        data,
        method: "delete",
      });

      return {
        data: response.data,
        status: response.status,
        message: response.statusText,
      };
    } catch (er) {
      return {
        data: undefined,
        status: 512,
        message: er,
      };
    }
  },

  //TODO: implement methods
  //UPDATE
  //PATCH
};

export default Http;

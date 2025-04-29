import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';

interface CreateSiteOptions {
  domain: string; // 主域名
  path: string;   // 网站根目录
  type_id: number; // 分类ID
  version: string; // PHP版本
  port: number;    // 端口
  ps: string;      // 备注
  ftp?: boolean;   // 是否创建FTP
  ftp_username?: string;
  ftp_password?: string;
  sql?: boolean;   // 是否创建数据库
  codeing?: 'utf8' | 'utf8mb4' | 'gbk' | 'big5';
  datauser?: string;
  datapassword?: string;
}

interface SignParams {
  request_time: number;
  request_token: string;
}

export class BtPanelSDK {
  private apiUrl: string;
  private apiKey: string;
  private client: AxiosInstance;

  constructor(apiUrl: string, apiKey: string) {
    this.apiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    this.apiKey = apiKey;

    this.client = axios.create({
      baseURL: this.apiUrl,
      timeout: 5000,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  }

  /**
   * 生成签名参数
   */
  private generateSign(): SignParams {
    const request_time = Math.floor(Date.now() / 1000);
    const md5ApiKey = crypto.createHash('md5').update(this.apiKey).digest('hex');
    const request_token = crypto.createHash('md5').update(request_time + md5ApiKey).digest('hex');
    return { request_time, request_token };
  }

  /**
   * 通用POST请求
   * @param path 请求路径
   * @param data 请求参数
   */
  private async post(path: string, data: Record<string, any> = {}): Promise<any> {
    const { request_time, request_token } = this.generateSign();
    const payload = {
      ...data,
      request_time,
      request_token,
    };

    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(payload)) {
      searchParams.append(key, value.toString());
    }

    try {
      const response = await this.client.post(path, searchParams.toString());
      return response.data;
    } catch (error: any) {
      console.error('Request Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * 创建网站
   * @param options 网站参数
   */
  public async createSite(options: CreateSiteOptions): Promise<any> {
    const path = '/site?action=AddSite';

    const payload: Record<string, any> = {
      webname: JSON.stringify({ domain: options.domain, domainlist: [], count: 0 }),
      path: options.path,
      type_id: options.type_id,
      type: 'PHP',
      version: options.version,
      port: options.port,
      ps: options.ps,
      ftp: options.ftp ? 'true' : 'false',
      sql: options.sql ? 'true' : 'false',
    };

    if (options.ftp) {
      payload.ftp_username = options.ftp_username;
      payload.ftp_password = options.ftp_password;
    }

    if (options.sql) {
      payload.codeing = options.codeing || 'utf8';
      payload.datauser = options.datauser;
      payload.datapassword = options.datapassword;
    }

    return await this.post(path, payload);
  }
}

export default BtPanelSDK;

import axios from 'axios';
import crypto from 'crypto';

// 定义基础配置接口
interface BtPanelConfig {
    apiSk: string;
    baseUrl: string;
}

// 定义更新面板的接口
interface UpdatePanelOptions {
    check?: boolean;
    force?: boolean;
}

// 定义获取网站列表的接口
interface GetSitesOptions {
    limit: number;
    p?: number;
    type?: number;
    order?: string;
    tojs?: string;
    search?: string;
}
interface WebName {
  domain:string,         // 主域名 如：www.test.com
  domainlist:string[],   // 除了主域名外的其他域名 如：['aa.test.com','www.aaa.com']
  count:number,        // 需要添加的域名数量 如：2
}
// 定义创建网站的接口
interface CreateSiteOptions {
    webname: WebName;
    path: string;
    type_id: number;
    type: string;
    version: number;
    port: number;
    ps: string;
    ftp: boolean;
    sql: string;
    ftp_username?: string;
    ftp_password?: string;
    codeing?: string;
    datauser?: string;
    datapassword?: string;
    need_index?: number; // 是否需要默认首页 0:不需要 1:需要
    need_404?: number; // 是否需要404页面 0:不需要 1:需要
}

// 定义删除网站的接口
interface DeleteSiteOptions {
    id: number;
    webname: string;
    ftp?: number;
    database?: number;
    path?: number;
}

// 定义获取网站备份列表的接口
interface GetSiteBackupsOptions {
    limit: number;
    search: string;
    p?: number;
    tojs?: string;
}

class BtPanelSDK {
    private apiSk: string;
    private baseUrl: string;

    constructor(config: BtPanelConfig) {
        this.apiSk = config.apiSk;
        this.baseUrl = config.baseUrl;
    }

    private generateSignature(): { request_time: number, request_token: string } {
        const request_time = Math.floor(Date.now() / 1000);
        const md5Sk = crypto.createHash('md5').update(this.apiSk).digest('hex');
        const request_token = crypto.createHash('md5').update(request_time + md5Sk).digest('hex');
        return { request_time, request_token };
    }

    private async sendRequest<T>(uri: string, data: any = {}): Promise<T> {
        const { request_time, request_token } = this.generateSignature();
        console.log(this.baseUrl + uri, {
            ...data,
             request_time,
             request_token
         })
        const response = await axios.post(this.baseUrl + uri, {
           ...data,
            request_time,
            request_token
        },{
          headers:{
            "Content-Type":"application/x-www-form-urlencoded"
          }
        });
        return response.data;
    }

    // 获取系统基础统计
    async getSystemTotal(): Promise<any> {
        return this.sendRequest('/system?action=GetSystemTotal');
    }

    // 获取磁盘分区信息
    async getDiskInfo(): Promise<any> {
        return this.sendRequest('/system?action=GetDiskInfo');
    }

    // 获取实时状态信息(CPU、内存、网络、负载)
    async getNetWork(): Promise<any> {
        return this.sendRequest('/system?action=GetNetWork');
    }

    // 检查是否有安装任务
    async getTaskCount(): Promise<any> {
        return this.sendRequest('/ajax?action=GetTaskCount');
    }

    // 检查面板更新
    async updatePanel(options: UpdatePanelOptions = {}): Promise<any> {
        const data: any = {};
        if (options.check) data.check = true;
        if (options.force) data.force = true;
        return this.sendRequest('/ajax?action=UpdatePanel', data);
    }

    // 获取网站列表
    async getSites(options: GetSitesOptions): Promise<any> {
        const data: any = { limit: options.limit };
        if (options.p) data.p = options.p;
        if (options.type) data.type = options.type;
        if (options.order) data.order = options.order;
        if (options.tojs) data.tojs = options.tojs;
        if (options.search) data.search = options.search;
        return this.sendRequest('/data?action=getData&table=sites', data);
    }

    // 获取网站分类
    async getSiteTypes(): Promise<any> {
        return this.sendRequest('/site?action=get_site_types');
    }

    // 获取已安装的PHP版本列表
    async getPHPVersion(): Promise<any> {
        return this.sendRequest('/site?action=GetPHPVersion');
    }

    // 创建网站
    async createSite(options: CreateSiteOptions): Promise<any> {
        const data: any = {
            webname: JSON.stringify(options.webname),
            path: options.path,
            type_id: options.type_id,
            type: options.type,
            version: options.version,
            port: options.port,
            ps: options.ps,
            ftp: options.ftp
        };
        if (options.ftp) {
            if (!options.ftp_username ||!options.ftp_password) {
                throw new Error('FTP username and password are required when creating FTP');
            }
            data.ftp_username = options.ftp_username;
            data.ftp_password = options.ftp_password;
        }
        if (options.sql) {
            if (!options.codeing ||!options.datauser ||!options.datapassword) {
                throw new Error('Database charset, username and password are required when creating database');
            }
            data.codeing = options.codeing;
            data.datauser = options.datauser;
            data.datapassword = options.datapassword;
        }
        try{
        return this.sendRequest('/site?action=AddSite', data);
        }catch(e){
            // console.error(e)
        }
    }

    // 删除网站
    async deleteSite(options: DeleteSiteOptions): Promise<any> {
        const data: any = { id: options.id, webname: options.webname };
        if (options.ftp) data.ftp = options.ftp;
        if (options.database) data.database = options.database;
        if (options.path) data.path = options.path;
        return this.sendRequest('/site?action=DeleteSite', data);
    }

    // 停用网站
    async siteStop(id: number, name: string): Promise<any> {
        return this.sendRequest('/site?action=SiteStop', { id, name });
    }

    // 启用网站
    async siteStart(id: number, name: string): Promise<any> {
        return this.sendRequest('/site?action=SiteStart', { id, name });
    }

    // 设置网站到期时间
    async setEdate(id: number, edate: string): Promise<any> {
        return this.sendRequest('/site?action=SetEdate', { id, edate });
    }

    // 修改网站备注
    async setPs(id: number, ps: string): Promise<any> {
        return this.sendRequest('/data?action=setPs&table=sites', { id, ps });
    }

    // 获取网站备份列表
    async getSiteBackups(options: GetSiteBackupsOptions): Promise<any> {
        const data: any = { limit: options.limit, type: 0, search: options.search };
        if (options.p) data.p = options.p;
        if (options.tojs) data.tojs = options.tojs;
        return this.sendRequest('/data?action=getData&table=backup', data);
    }

    // 创建网站备份
    async createSiteBackup(id: number): Promise<any> {
        return this.sendRequest('/site?action=ToBackup', { id });
    }

    // 删除网站备份
    async deleteSiteBackup(id: number): Promise<any> {
        return this.sendRequest('/site?action=DelBackup', { id });
    }

    // 获取网站的域名列表
    async getDomainList(search: string): Promise<any> {
        return this.sendRequest('/data?action=getData&table=domain', { search, list: true });
    }

    // 添加域名
    async addDomain(id: number, webname: string, domain: string): Promise<any> {
        return this.sendRequest('/site?action=AddDomain', { id, webname, domain });
    }

    // 删除域名
    async deleteDomain(id: number, webname: string, domain: string, port: number): Promise<any> {
        return this.sendRequest('/site?action=DelDomain', { id, webname, domain, port });
    }

    // 获取可选的预定义伪静态列表
    async getRewriteList(siteName: string): Promise<any> {
        return this.sendRequest('/site?action=GetRewriteList', { siteName });
    }

    // 获取指定预定义伪静态规则内容(获取文件内容)
    async getFileBody(path: string): Promise<any> {
        return this.sendRequest('/files?action=GetFileBody', { path });
    }

    // 保存伪静态规则内容(保存文件内容)
    async saveFileBody(path: string, data: string, encoding = 'utf-8'): Promise<any> {
        return this.sendRequest('/files?action=SaveFileBody', { path, data, encoding });
    }

    // 取回指定网站的根目录
    async getSitePath(id: number): Promise<any> {
        return this.sendRequest('/data?action=getKey&table=sites&key=path', { id });
    }

    // 取回防跨站配置/运行目录/日志开关状态/可设置的运行目录列表/密码访问状态
    async getDirUserINI(id: number, path: string): Promise<any> {
        return this.sendRequest('/site?action=GetDirUserINI', { id, path });
    }

    // 设置防跨站状态(自动取反)
    async setDirUserINI(path: string): Promise<any> {
        return this.sendRequest('/site?action=SetDirUserINI', { path });
    }

    // 设置是否写访问日志
    async setLogsOpen(id: number): Promise<any> {
        return this.sendRequest('/site?action=logsOpen', { id });
    }

    // 修改网站根目录
    async setSitePath(id: number, newPath: string): Promise<any> {
        return this.sendRequest('/site?action=SetPath', { id, newPath });
    }

    // 设置是否写访问日志
    async setSiteRunPath(id: number, runPath: string): Promise<any> {
        return this.sendRequest('/site?action=SetSiteRunPath', { id, runPath });
    }

    // 设置密码访问
    async setHasPwd(id: number, username: string, password: string): Promise<any> {
        return this.sendRequest('/site?action=SetHasPwd', { id, username, password });
    }

    // 关闭密码访问
    async closeHasPwd(id: number): Promise<any> {
        return this.sendRequest('/site?action=CloseHasPwd', { id });
    }

    // 获取流量限制相关配置(仅支持nginx)
    async getLimitNet(id: number): Promise<any> {
        return this.sendRequest('/site?action=GetLimitNet', { id });
    }

    // 开启或保存流量限制配置(仅支持nginx)
    async setLimitNet(id: number, perserver: number, perip: number, limit_rate: number): Promise<any> {
        return this.sendRequest('/site?action=SetLimitNet', { id, perserver, perip, limit_rate });
    }

    // 关闭流量限制(仅支持nginx)
    async closeLimitNet(id: number): Promise<any> {
        return this.sendRequest('/site?action=CloseLimitNet', { id });
    }

    // 取默认文档信息
    async getIndex(id: number): Promise<any> {
        return this.sendRequest('/site?action=GetIndex', { id });
    }

    // 设置默认文档
    async setIndex(id: number, Index: string): Promise<any> {
        return this.sendRequest('/site?action=SetIndex', { id, Index });
    }

    // 取网站配置文件内容(获取文件内容)
    async getSiteConfigFileBody(path: string): Promise<any> {
        return this.sendRequest('/files?action=GetFileBody', { path });
    }

    // 保存网站配置文件(保存文件内容)
    async saveSiteConfigFile(path: string, data: string, encoding = 'utf-8'): Promise<any> {
        return this.sendRequest('/files?action=SaveFileBody', { path, data, encoding });
    }
}

export default BtPanelSDK;


// const bt = new BtPanelSDK({apiSk:"aAkcMpqg3aBLsAVLPq7MQcFLHSCTd9dW",baseUrl:"http://154.95.187.194:36099"})

// // bt.getSystemTotal().then(console.log)
// bt.createSite({
//   webname:{domain:'www.yy.com',domainlist:['aa.yy.com','www.yy.com'],count:2},
//   path:"/www/wwwroot/test.com",
//   type_id:0,
//   type:"PHP",
//   version:80,
//   port:80,
//   ps:"test",
//   ftp:false,
//   sql:"MySQL",
//   codeing:"utf8mb4",
//   datapassword:"das43rijfisdf",
//   datauser:"dasdsad",
//   need_index:0,
//   need_404:0,
// }).then(console.log).catch(console.error)
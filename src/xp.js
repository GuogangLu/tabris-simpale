if (typeof WebSocket !== 'function') {
    throw new Error('浏览器不支持WebSocket')
}
class Validate {
    constructor(success, message) {
        this.success = success
        this.message = message
    }
}
/**
 * Events
 *    wsopen    ws连接到智能服务器
 *    wserror   ws错误
 *    wsclose   ws关闭
 *    login     用户已登录
 *    unlogin   无用户登录，无法获取用户信息
 */
class IServer /*extends EventTarget */{
    constructor(host, port, id) {
        //super()
        Object.defineProperties(this, {
            host: {
                value: typeof host === 'string' ? host : window.location.hostname,
                configurable: true,
                writable: true,
                enumerable: true
            },
            port: {
                value: isNaN(parseInt(port)) ? 8000 : parseInt(port),
                configurable: true,
                writable: true,
                enumerable: true
            },
            id: {
                value: IServer.isIServerId(id) ? id : null,
                configurable: true,
                writable: true,
                enumerable: true
            },
            network: {
                value: null,
                configurable: true,
                writable: true,
                enumerable: true
            },
            user: {
                value: null,
                configurable: true,
                writable: true,
                enumerable: true
            },
            password: {
                value: null,
                configurable: true,
                writable: true,
                enumerable: true
            },
            main_ws: {
                value: null,
                configurable: true,
                writable: true,
                enumerable: true
            },
            dl: {
                value: [],
                configurable: true,
                writable: true,
                enumerable: true
            },
            cl: {
                value: [],
                configurable: true,
                writable: true,
                enumerable: true
            },
            gl: {
                value: [],
                configurable: true,
                writable: true,
                enumerable: true
            },
            sl: {
                value: [],
                configurable: true,
                writable: true,
                enumerable: true
            },
            ml: {
                value: [],
                configurable: true,
                writable: true,
                enumerable: true
            },
            currentRequst: {
                value: null,
                configurable: true,
                writable: true,
                enumerable: true
            },
            requests: {
                value: [],
                configurable: true,
                writable: true,
                enumerable: true
            },
            groups: {
                value: [],
                configurable: true,
                writable: true,
                enumerable: true
            },
            lastRequest: {
                value: null,
                writable: true,
                configurable: true,
                enumerable: false
            },
        })
        this.connect()
    }

    /**
     * 判断是否为空
     * @param {any} str 输入
     */
    static isNull(str) {
        let ok = false;
        if (str === "" || str === null || str === undefined) 
            ok = true;
        return ok;
    }

    /**
     * 判断一个字串是否为智能服务器ID
     * id 智能服务器id
     */
    static isIServerId(id) {
        let ok = false
        if (typeof id === 'string') {
            let idl = id.split(':')
            if (idl.length === 3) {
                let pid = parseInt(idl[0])
                let cid = parseInt(idl[1])
                let did = parseInt(idl[2])
                if (!isNaN(pid) && !isNaN(cid) && !isNaN(did) &&
                    pid >= 0 && cid === 0 && did >= 0) {
                    ok = true
                }
            }
        }
        return ok
    }

    /**
     * 判断一个字串是否为智能服务器ID
     * ip 智能服务器id
     */
    static isId(id) {
        let ok = false
        if (typeof id === 'string') {
            let idl = id.split(':')
            if (idl.length === 3) {
                let pid = parseInt(idl[0])
                let cid = parseInt(idl[1])
                let did = parseInt(idl[2])
                if (!isNaN(pid) && !isNaN(cid) && !isNaN(did) &&
                    pid >= 0 && cid === 0 && did >= 0) {
                    ok = true
                }
            }
        }
        return ok
    }

    /**
     * 判断一个参数是否为网络地址
     * @param {string} ip 网络地址
     */
    static isIp(ip) {
        if (typeof ip !== 'string') return false;
        if (IServer.isNull(ip)) return false;
        let re = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/g //匹配IP地址的正则表达式
        if (re.test(ip)) {
            if (RegExp.$1 < 256 && RegExp.$2 < 256 && RegExp.$3 < 256 && RegExp.$4 < 256) return true;
        }
        return false;
    }

    /**
     * 判断一个参数是否为网络端口号
     * @param {number} port 端口号
     */
    static isPort(port) {
        let ok = false;
        if (isNaN(port) === false && typeof port === 'number' && port > 0 && port < 65536) {
            ok = true;    
        }
        return ok;
    }

    /**
     * 创建到智能服务器的ws连接
     * @params host 智能服务器主机名
     * @params port 智能服务器监听端口
     * @params id 智能服务器ID
     */
    async connect(host, port, id) {
        let is_host = typeof host === 'string' ? host : this.host
        let is_port = isNaN(parseInt(port)) ? this.port : parseInt(port)
        let is_id = IServer.isIServerId(id) ? id : this.id
        if (this.main_ws instanceof WebSocket) {
            if (this.main_ws.readyState === WebSocket.OPEN && is_host === this.host && is_port === this.port && is_id === this.id) {
                return this.main_ws
            } else {
                this.main_ws.close()
            }
        }
        this.main_ws = null
        return new Promise((resolve, reject) => {
            let t = setTimeout(() => {
                reject('链接服务器超时')
            }, 3000)
            this.main_ws = new WebSocket(`ws://${is_host}:${is_port}/app/${is_id}`)
            this.main_ws.onopen = evt => {
                clearTimeout(t)
                // console.log(`链接到${this.main_ws.url}`, evt)
                // this.dispatchEvent(new Event('wsopen'))
                this.host = is_host
                this.port = is_port
                this.id = is_id
                resolve(this.main_ws)
            }
            this.main_ws.onmessage = evt => {
                if (evt.data === 'iserver\n') {
                    this.getUserInfo()
                } else {
                    console.log(`getMessage: ${evt.data}`)
                    if (typeof this.currentRequst === 'object' && this.currentRequst !== null &&
                        typeof this.currentRequst.callback === 'function') {
                        this.currentRequst.callback(evt.data)
                    } else {
                        console.error(`未处理的应答数据: ${evt.data}`)
                    }
                    if (this.requests.length > 0) {
                        this.sendRequest(this.requests.shift())
                    }else{
                        this.currentRequst = null
                    }
                }
            }
            this.main_ws.onerror = evt => {
                console.log(`ws error: `, evt)
                // this.dispatchEvent(new Event('wserror'))
            }
            this.main_ws.onclose = evt => {
                console.log(`ws close: `, evt)
                // this.dispatchEvent(new Event('wsclose'))
            }
        })
    }

    sendRequest(req) {
        if (this.main_ws instanceof WebSocket && this.main_ws.readyState === WebSocket.OPEN) {
            this.currentRequst = req
            let reqStr = JSON.stringify(req) + '\n'
            this.main_ws.send(reqStr)
            this.lastRequest = setTimeout(() => {
                if (typeof this.currentRequst === 'object' && this.currentRequst !== null &&
                    typeof this.currentRequst.callback === 'function') {
                        this.currentRequst.callback(`执行失败,未收到应答`)
                        if (this.requests.length > 0) {
                            this.sendRequest(this.requests.shift())
                        }else{
                            this.currentRequst = null
                        }
                }
            }, 4000)
            console.log(`sendMessage: ${reqStr}`)
        } else {
            throw new Error('发送请求错误，ws未链接')
        }
    }

    async addRequest(req) {
        if (typeof req !== 'object' || req === null || typeof req.operate !== 'string') {
            throw new Error('操作请求格式错误')
        }
        return new Promise((resolve, reject) => {
            req.callback = data => {
                clearTimeout(this.lastRequest);
              
                if (data.startsWith('ERR')) {
                    reject(data.substr(4))
                    if (req.operate === 'user info') {
                        //this.dispatchEvent(new Event('unlogin'))
                    }
                }
                try {
                    let ack = JSON.parse(data)
                    if (ack.ecode === 0) {
                        // console.log('resovle:', ack.data)
                        if (req.operate === 'user login') {
                            this.password = req.params.password
                            //this.dispatchEvent(new Event('login'))
                            this.getUserInfo()
                        } else if (req.operate === 'user info') {
                            this.user = ack.data
                            this.init()
                        }
                        resolve(ack.data)
                    } else if (typeof ack.estring === 'string' && ack.estring !== '') {
                        if (req.operate === 'user info') {
                            this.userLogin('admin', 'admin')
                        }
                        reject(ack.estring)
                    } else {
                        reject(`无法解析的应答：${data}`)
                    }
                } catch (e) {
                    reject(`应答格式错误：${data}`)
                }
              
            }
            if (this.currentRequst === null) {
                this.sendRequest(req)
            } else {
                this.requests.push(req)
            }
        })
    }

    async init() {
        this.dl = await this.getDeviceList()
        this.cl = await this.commandList()
        this.gl = await this.grpcmdList()
        this.sl = await this.scheduleList()
        this.ml = await this.modeList()
        let network = await this.manageGetNetwork()
        this.network = network['network'];
    }


    /*-------------------------用户操作-------------------*/


    async userLogin(name, password) {
        this.password = password
        let req = {
            operate: 'user login',
            target: null,
            params: {
                user: name,
                password: password
            }
        }
        return this.addRequest(req)
    }

    async getUserInfo() {
        let req = {
            operate: 'user info',
            target: null,
            params: null
        }
        return this.addRequest(req)
    }
    /**
    * 查看用户列表
    */
    async userList() {
        let data = {
            "operate": "user list"
        }
        return this.addRequest(data)
    }
    async getDeviceList() {
        let req = {
            operate: 'dev list',
            target: null,
            params: null
        }
        return this.addRequest(req)
    }
    /**
     * 添加用户
     * @param {用户} params 
     */
    async userAdd(params) {
        let data = {
            "operate": "user add",
            "params": params
        }
        return this.addRequest(data)
    }
    /**
     * 删除用户
     * @param {用户名} target 
     */
    async userDelete(target) {
        let data = {
            "operate": "user delete",
            "target": target
        }
        return this.addRequest(data)
    }
    /**
     * 修改用户密码
     * @param {密码} params 
     */
    async userPassword(params) {
        let data = {
            "operate": "user password",
            "params": params
        }
        return this.addRequest(data)
    }
    /**
     * 修改用户配置
     * @param {用户名} target 
     * @param {配置参数} params 
     */
    async userReplace(target, params) {
        let data = {
            "operate": "user replace",
            "params": params
        }
        if (target) {
            data.target = target
        }
        return this.addRequest(data)
    }



    /*----------------------设备操作----------------------------*/

    /**
       * 检查设备id是否合法
       * @param {设备id} id 
       * @param {是否需要设备id存在} isExist true:需要,false:不需要
       */
    isDevId(id) {
        if (id === undefined || id === null || id === "") {
            return new Validate(false, `id不能为空`)
        } else {
            if (typeof id === 'string') {
                let idl = id.split(":")
                if (idl.length === 3) {
                    let pid = parseInt(idl[0])
                    let cid = parseInt(idl[1])
                    let did = parseInt(idl[2])
                    if (!isNaN(pid) && !isNaN(cid) && !isNaN(did) && pid >= 0 && cid >= 0 && did >= 0) {
                        let ok = false;
                        for (let i = 0; i < this.dl.length; i++) {
                            if (id === this.dl[i].id) {
                                ok = true
                            }
                        }
                        return new Validate(true, "OK")
                    } else {
                        return new Validate(false, `设备id:${id}不合法`)
                    }
                } else {
                    return new Validate(false, `设备id:${id}格式错误`)
                }
            } else {
                return new Validate(false, `设备id:${id}不为一个字符串`)
            }
        }

    }

    /**
    * 检查设备名称是否合法
    * @param {设备名称} name 
    * @param {是否需要设备名称存在} idExist 
    */
    isDevName(name) {
        if (name === undefined || name === null || name === "") {
            return new Validate(false, `设备名称不能为空`)
        } else {
            if (typeof name === 'string') {
                if (name.indexOf(".") === -1) {
                    let ok = false;
                    for (let i = 0; i < this.dl.length; i++) {
                        if (name === this.dl[i].name) {
                            ok = true
                        }
                    }
                    return new Validate(true, "OK")
                } else {
                    return new Validate(false, `设备名称${name}包含非法字符"."`)
                }
            } else {
                return new Validate(false, `设备名称:${name}不为一个字符串`)
            }
        }
    }
    /**
     * 检查设备标识是否合法且存在
     */
    isdev(target) {
        let dev = target.split(".")
        if (dev.length > 1) {
            target = dev[0]
        }
        let validateId = this.isDevName(target)
        //设备名称存在
        if (validateId.success) {
            return validateId
        } else {
            return this.isDevId(target)
        }
    }

    /**
    * 检查设备ip是否合法
    * @param {设备ip} ip 
    * @param {是否需要设备ip存在} idExist true:需要false:不需要
    */
    isDevIP(ip) {
        if (IServer.isIp(ip)) {
            return new Validate(true, "OK")
        } else {
            return new Validate(false, `IP:${ip}格式错误`)
        }
    }

    /**
     * 获取虚拟设备文件列表
     */
    async devSlist() {
        let data = {
            "operate": "dev slist",
            "params": null
        }
        return this.addRequest(data)
    }
    /**
     * 获取设备列表
     * @param {过滤参数} params 
     */
    async devList(params) {
        let data = {
            "operate": "dev list",
            "params": params ? null : params
        }
        return this.addRequest(data)
    }
    /**
     * 读取设备属性
     * @param {设备标识} dev 
     * @param {属性列表} attrs 
     * @param {设备端点} epnum 
     */
    async devRead(dev, attrs, epnum) {
        let validate = this.isdev(dev)
        if (!validate.success) throw new Error(validate.message)
        let req = {
            operate: 'dev read',
            target: typeof epnum === 'number' ? `${dev}.${epnum}` : dev,
            params: attrs
        }
        return this.addRequest(req)
    }
    /**
     * 修改设备属性
     * @param {设备标识} dev 
     * @param {属性列表} attrs 
     * @param {端点} epnum 
     */
    async devWrite(dev, attrs, epnum) {
        let validate = this.isdev(dev)
        if (!validate.success) throw new Error(validate.message)
        let req = {
            operate: 'dev write',
            target: typeof epnum === 'number' ? `${dev}.${epnum}` : dev,
            params: attrs
        }
        return this.addRequest(req)
    }
    /**
     * 执行设备方法
     * @param {设备标识} dev 
     * @param {方法名} name 
     * @param {参数列表} params 
     * @param {端点} epnum 
     */
    async devRun(dev, name, params, epnum) {
        let validate = this.isdev(dev)
        if (!validate.success) throw new Error(validate.message)
        let req = {
            operate: 'dev run',
            target: typeof epnum === 'number' ? `${dev}.${epnum}` : dev,
            params: {
                name: name,
                params: params
            }
        }
        return this.addRequest(req)
    }
    /**
     * 设备扫描
     * @param {设备标识} target 
     * @param {功能端口号} params 
     */
    async devScan(target, params) {
        let validate = this.isdev(target)
        if (!validate.success) throw new Error(validate.message)
        let data = {
            "operate": "dev scan",
            "target": target,
            "params": params
        }
        return this.addRequest(data)
    }
    /**
     * 获取帮助信息
     * @param {设备标识} target 
     * @param {方法名或属性名} params 
     */
    async devHelp(target, params) {
        let validate = this.isdev(target)
        if (!validate.success) throw new Error(validate.message)
        let data = {
            "operate": "dev help",
            "target": target,
            "params": params
        }
        return this.addRequest(data)
    }
    /**
     * 调试虚拟设备
     * @param {设备标识} target 
     * @param {参数列表} params 
     */
    async devDebug(target, params) {
        let validate = this.isdev(target)
        if (!validate.success) throw new Error(validate.message)
        let data = {
            "operate": "dev debug",
            "target": target,
            "params": params
        }
        return this.addRequest(data)
    }
    /**
     * 重启虚拟设备
     * @param {设备标识} target 
     */
    async devReboot(target) {
        let validate = this.isdev(target)
        if (!validate.success) throw new Error(validate.message)
        let data = {
            "operate": "dev reboot",
            "target": target
        }
        return this.addRequest(data)
    }
    /**
     * 启动设备
     * @param {设备标识} target 
     * @param {虚拟设备启动参数} params 
     */
    async devStart(target, params) {
        let validate = this.isdev(target)
        if (!validate.success) throw new Error(validate.message)
        let data = {
            "operate": "dev start",
            "target": target,
            "params": params
        }
        return this.addRequest(data)
    }
    /**
     * 停止设备
     * @param {设备标识} target 
     */
    async devStop(target) {
        let validate = this.isdev(target)
        if (!validate.success) throw new Error(validate.message)
        let data = {
            "operate": "dev stop",
            "target": target
        }
        return this.addRequest(data)
    }
    /**
     * 添加设备
     * @param {配置参数} params 
     */
    async devAdd(params) {
        if (params.ip != undefined) {
            let validate = this.isDevIP(params.ip)
            if (!validate.success) throw new Error(validate.message)
        }
        // this.dl.push(params)
        let data = {
            "operate": "dev add",
            "params": params
        }

        return this.addRequest(data)
    }
    /**
     * 删除设备
     * @param {设备标识} target 
     */
    async devDelete(target) {
        let validate = this.isdev(target)
        if (!validate.success) throw new Error(validate.message)
        let data = {
            "operate": "dev delete",
            "target": target
        }
        return this.addRequest(data)
    }
    /**
     * 探测设备
     * @param {探测参数} params 
     */
    async devInquire(params) {

        let data = {
            "operate": "dev inquire",
            "params": params
        }
        return this.addRequest(data)
    }
    /**
     * 设备重命名
     * @param {设备标识} target 
     * @param {新设备名} params 
     */
    async devRename(target, params) {
        let validate = this.isdev(target)
        if (!validate.success) throw new Error(validate.message)
        let data = {
            "operate": "dev rename",
            "target": target,
            "params": params
        }
        return this.addRequest(data)
    }
    /**
     * 修改设备配置
     * @param {设备标识} target 
     * @param {配置参数} params 
     */
    async devReplace(target, params) {
        if (!isNull(target)) {
            let validate = this.isdev(target)
            if (!validate.success) throw new Error(validate.message)
        }
        let data = {
            "operate": "dev replace",
            "target": target,
            "params": params
        }
        return this.addRequest(data)
    }



    /*-------------------命令操作------------------------------------*/




    async connandRequest(data) {
        return this.addRequest(data)
    }

    /**
    * 查看命令列表
    * @param {过滤条件或页面信息等} params 
    */
    async commandList(params) {
        let data = {
            "operate": "command list",
            "params": params
        }
        return this.addRequest(data)
    }
    /**
     * 执行命令
     * @param {命令标识} target 
     * @param {请求参数} params 
     */
    async commandRun(target, params) {
        let data = {
            "operate": "command run",
            "target": target,
            "params": params
        }
        return this.addRequest(data)
    }
    /**
     * 添加命令
     * @param {命令配置参数} params 
     */
    async commandAdd(params) {
        let data = {
            "operate": "command add",
            "params": params
        }
        this.cl.push(params)
        return this.addRequest(data)
    }
    /**
     * 删除命令
     * @param {命令标识} target 
     */
    async commandDelete(target) {
        let data = {
            "operate": "command delete",
            "target": target
        }
        return this.addRequest(data)
    }
    /**
     * 修改命令配置名
     * @param {命令标识} target 
     * @param {命令新名称} params 
     */
    async commandRename(target, params) {
        let data = {
            "operate": "command rename",
            "target": target,
            "params": params
        }
        return this.addRequest(data)
    }
    /**
     * 修改命令配置
     * @param {命令标识} target 
     * @param {命令配置} params 
     */
    async commandReplace(target, params) {
        let data = {
            "operate": "command replace",
            "params": params
        }
        if (!isNull(target)) {
            data.target = target
        }

        return this.addRequest(data)
    }

    /*--------------------组操作----------------------*/

    /**
     * 查看组操作列表
     * @param {过滤条件或页面信息等} params 
     */
    async grpcmdList(params) {
        let data = {
            "operate": "grpcmd list",
            "params": params
        }
        return this.addRequest(data)
    }




    /**
     * 添加组
     * @param {组配置参数} params 
     */
    async grpcmdAdd(id, name, requestList) {
        let cmdgroup = {
            'id': id,
            'name': name,
            'requestList': requestList
        }
        let data = {
            "operate": "grpcmd add",
            "params": cmdgroup
        }
        return this.addRequest(data)
    }
    /**
     * 删除组
     * @param {组标识} target 
     */
    async grpcmdDelete(target) {
        let data = {
            "operate": "grpcmd delete",
            "target": target
        }
        return this.addRequest(data)
    }
    /**
     * 修改组名称
     * @param {组标识} target 
     * @param {新的组名称} params 
     */
    async grpcmdRename(target, params) {
        let data = {
            "operate": "grpcmd rename",
            "target": target,
            "params": params
        }
        return this.addRequest(data);
    }
    /**
     * 修改组配置
     * @param {组配置标识} target 
     * @param {组配置id} id 
     * @param {组配置名称} name 
     * @param {组操作实体} requestList 
     */
    async grpcmdReplace(target, id, name, requestList) {
        let data = {
            "operate": "grpcmd replace",
            "target": target,
            "params": {
                'id': id,
                'name': name,
                'requestList': requestList
            }
        }
        return this.addRequest(data)
    }

    /**
    * 替换组配置
    * @param {组标识} target 
    * @param {组配置参数} params 
    */
    async grpcmdReplaceAll(params) {
        let data = {
            "operate": "grpcmd replace",
            "params": params
        }
        return this.addRequest(data)
    }

    /*------------------定时任务---------------------------------------/
          
         /**
         * 检查定时任务标识是否存在
         * @param {*} isExit true:需要存在 false:不需要存在
         */
    exitScheduleTarget(target, isExit = true) {
        let exit = false;
        for (let index = 0; index < this.sl.length; index++) {
            let element = this.sl[index];
            if (element.id === target || element.name === target) {
                exit = true
            }
        }
        let validate;
        //需要定时任务标识存在
        if (isExit) {
            //定时任务标识存在
            if (exit) {
                validate = new Validate(true, `OK`)
            } else {
                validate = new Validate(false, `定时任务标识:${target}不存在`)
            }
        } else {//定时任务标识不存在
            if (exit) { //定时任务标识存在
                validate = new Validate(false, `定时任务标识:${target}已存在`)
            } else {
                validate = new Validate(true, `OK`)
            }
        }
        return validate;
    }

    /**
     * 查看定时任务列表
     * @param {过滤条件或则页面参数} params 
     */
    async scheduleList(params) {
        let data = {
            "operate": "schedule list",
            "params": params
        }
        return this.addRequest(data)
    }
    /**
     * 使能
     * @param {定时任务标识} target 
     */
    async scheduleEnable(target) {
        let validate = this.exitScheduleTarget(target)
        if (!validate.success) throw new Error(validate.message)
        let data = {
            "operate": "schedule enable",
            "target": target
        }
        return this.addRequest(data)
    }
    /**
     * 取消使能
     * @param {定时标识} target 
     */
    async scheduleDisable(target) {
        let validate = this.exitScheduleTarget(target)
        if (!validate.success) throw new Error(validate.message)
        let data = {
            "operate": "schedule disable",
            "target": target
        }
        return this.addRequest(data)
    }

    /**
     * 添加定时任务
     * @param {定时任务id} id      
     * @param {定时任务名称} name    
     * @param {定时执行的组标识} grpcmd  
     * @param {是否使能} enabled 
     * @param {定时任务的时间} time  
     */
    async scheduleAdd(id, name, grpcmd, enabled, time) {
        let schedule = {
            'id': id,
            'name': name,
            'grpcmd': grpcmd,
            'enabled': enabled,
            'time': time
        }
        let data = {
            "operate": "schedule add",
            "params": schedule
        }
        this.sl.push(schedule)
        return this.addRequest(data)
    }
    /**
     * 删除定时任务标识
     * @param {定时任务标识} target 
     */
    async scheduleDelete(target) {
        let validate = this.exitScheduleTarget(target)
        if (!validate.success) throw new Error(validate.message)
        let data = {
            "operate": "schedule delete",
            "target": target
        }
        return this.addRequest(data)
    }
    /**
     * 修改定时任务名称
     * @param {定时任务标识} target 
     * @param {定时任务新名称} params 
     */
    async scheduleRename(target, params) {
        let validate = this.exitScheduleTarget(target)
        if (!validate.success) throw new Error(validate.message)

        let data = {
            "operate": "schedule rename",
            "target": target,
            "params": params
        }
        return this.addRequest(data)
    }

    /**
     * 修改定时任务配置
     * @param {修改的定时任务标识} target 
     * @param {定时任务id} id      
     * @param {定时任务名称} name    
     * @param {定时执行的组标识} grpcmd  
     * @param {是否使能} enabled 
     * @param {定时任务的时间} time    
     */
    async scheduleReplace(target, id, name, grpcmd, enabled, time) {
        let validate = this.exitScheduleTarget(target)
        if (!validate.success) throw new Error(validate.message)
        validate = this.exitScheduleTarget(id, false)
        for (let i = 0; i < this.sl.length; i++) {
            let element = this.sl[i];
            if (element.id !== target && element.name === name) {
                throw new Error(`定时任务名称:${name}已经存在`)
            }
            if (element.id !== target && element.id === name) {
                throw new Error(`定时任务ID:${name}已经存在`)
            }
        }
        let data = {
            "operate": "schedule replace",
            "target": target,
            "params": {
                'id': id,
                'name': name,
                'grpcmd': grpcmd,
                'enabled': enabled,
                'time': time
            }
        }
        return this.addRequest(data)
    }

    /**
     * 替换定时任务配置
     * @param {定时任务配置} params 
     */
    async scheduleReplaceAll(params) {
        let data = {
            "operate": "schedule replace",
            "params": params
        }
        return this.addRequest(data)
    }


    /*-----------------------------模式操作-------------------------*/


    /**
     * 检查模式任务标识是否存在
     * @param {*} isExit true:需要存在 false:不需要存在
     */
    exitModeTarget(target, isExit = true) {
        let exit = false;
        for (let index = 0; index < this.ml.length; index++) {
            let element = this.ml[index];
            if (element.id === target || element.name === target) {
                exit = true
            }
        }
        let validate;
        //需要模式任务标识存在
        if (isExit) {
            //模式任务标识存在
            if (exit) {
                validate = new Validate(true, `OK`)
            } else {
                validate = new Validate(false, `模式任务标识:${target}不存在`)
            }
        } else {//模式任务标识不存在
            if (exit) { //模式任务标识存在
                validate = new Validate(false, `模式任务标识:${target}已存在`)
            } else {
                validate = new Validate(true, `OK`)
            }
        }
        return validate;
    }

    /**
     * 查看模式脚本列表
     */
    async modeSlist() {
        let data = {
            "operate": "mode slist"
        }
        return this.addRequest(data)
    }
    /**
     * 查看模式列表
     * @param {过滤条件或页面信息等} params 
     */
    async modeList(params) {
        let data = {
            "operate": "mode list",
            "params": params
        }
        return this.addRequest(data)
    }
    /**
     * 模式使能
     * @param {模式标识} target 
     */
    async modeEnable(target) {
        let validate = this.exitModeTarget(target)
        if (!validate.success) throw new Error(validate.message)
        let data = {
            "operate": "mode enable",
            "target": target
        }
        return this.addRequest(data)
    }
    /**
     * 取消使能
     * @param {模式标识} target 
     */
    async modeDisable(target) {
        let validate = this.exitModeTarget(target)
        if (!validate.success) throw new Error(validate.message)
        let data = {
            "operate": "mode disable",
            "target": target
        }
        return this.addRequest(data)
    }
    /**
     * 读取属性
     * @param {模式标识} target 
     * @param {属性列表} params 
     */
    async modeRead(target, params) {
        let validate = this.exitModeTarget(target)
        if (!validate.success) throw new Error(validate.message)
        let data = {
            "operate": "mode read",
            "target": target,
            "params": params
        }
        return this.addRequest(data)
    }
    /**
     * 修改模式属性
     * @param {模式标识} target 
     * @param {参数列表} params 
     */
    async modeWrite(target, params) {
        let validate = this.exitModeTarget(target)
        if (!validate.success) throw new Error(validate.message)
        let data = {
            "operate": "mode write",
            "target": target,
            "params": params
        }
        return this.addRequest(data)
    }
    /**
     * 执行模式功能
     * @param {模式标识} target 
     * @param {方法名和参数列表} params 
     */
    async modeRun(target, params) {
        let validate = this.exitModeTarget(target)
        if (!validate.success) throw new Error(validate.message)
        let data = {
            "operate": "mode run",
            "target": target,
            "params": params
        }
        return this.addRequest(data)
    }
    /**
     * 扫描模式信息
     * @param {模式标识} target 
     */
    async modeScan(target) {
        let validate = this.exitModeTarget(target)
        if (!validate.success) throw new Error(validate.message)
        let data = {
            "operate": "mode scan",
            "Ftarget": target
        }
        return this.addRequest(data)
    }
    /**
     * 获取模式资源帮助信息
     * @param {模式标识} target 
     * @param {属性名或者方法名} params 
     */
    async modeHelp(target, params) {
        let validate = this.exitModeTarget(target)
        if (!validate.success) throw new Error(validate.message)
        let data = {
            "operate": "mode help",
            "target": target,
            "params": params
        }
        return this.addRequest(data);
    }
    /**
     * 调试模式脚本
     * @param {模式标识} target 
     * @param {参数} params
     */
    async modeDebug(target, params) {
        let validate = this.exitModeTarget(target)
        if (!validate.success) throw new Error(validate.message)
        let data = {
            "operate": "mode debug",
            "target": target,
            "params": params
        }
        return this.addRequest(data)
    }
    /**
     * 重启模式标识
     * @param {模式标识} target 
     */
    async modeeboot(target) {
        let validate = this.exitModeTarget(target)
        if (!validate.success) throw new Error(validate.message)
        let data = {
            "operate": "mode reboot",
            "target": target
        }
        return this.addRequest(data)
    }
    /**
     * 添加模式
     * @param {模式id} id 
     * @param {模式名称} name 
     * @param {模式脚本} script 
     * @param {模式参数} params 
     * @param {是否使能} enabled 
     */
    async modeAdd(id, name, script, params, enabled) {
        // let validate = this.exitModeTarget(id, false)
        // if (!validate.success) throw new Error(validate.message)
        // validate = this.exitModeTarget(name, false)
        // if (!validate.success) throw new Error(validate.message)
        let mode = {
            'id': id,
            'name': name,
            'script': script,
            'params': params,
            'enabled': enabled
        }
        let data = {
            "operate": "mode add",
            "params": mode
        }
        this.ml.push(mode)
        return this.addRequest(data)
    }

    /**
     * 删除模式
     * @param {模式标识} target 
     */
    async modeDelete(target) {
        let validate = this.exitModeTarget(target)
        if (!validate.success) throw new Error(validate.message)
        let data = {
            "operate": "mode delete",
            "target": target
        }
        return this.addRequest(data)
    }
    /**
     * 修改模式配置
     * @param {模式标识} target 
     * @param {模式id} id 
     * @param {模式名称} name 
     * @param {模式脚本} script 
     * @param {模式参数} params 
     * @param {是否使能} enabled 
     */
    async modeReplace(target, id, name, script, params, enabled) {
        let validate = this.exitModeTarget(target)
        if (!validate.success) throw new Error(validate.message)
        validate = this.exitModeTarget(id, false)
        if (!validate.success) throw new Error(validate.message)
        validate = this.exitModeTarget(name, false)
        if (!validate.success) throw new Error(validate.message)
        let data = {
            "operate": "mode replace",
            "target": target,
            "params": {
                'id': id,
                'name': name,
                'script': script,
                'params': params,
                'enabled': enabled
            }
        }
        return this.addRequest(data)
    }

    /**
     * 替换模式配置
     * @param {模式配置} params 
     */
    async modeReplaceAll(params) {
        let data = {
            "operate": "mode replace",
            "params": params
        }
        return this.addRequest(data)
    }


    /*------------------------管理指令-------------------------*/



    /**
     * 获取服务器属性
     * @param {智能服务器属性} params 
     */
    async manageGetattr(params) {
        let data = {
            "operate": "get attr",
            "params": params
        }
        return this.addRequest(data)
    }
    /**
     * 修改服务器属性
     * @param {智能服务器属性} params 
     */
    async manageSetattr(params) {
        let data = {
            "operate": "set attr",
            "params": params
        }
        return this.addRequest(data)
    }
    /**
     * 查看授权信息
     */
    async manageGetAuthore() {
        let data = {
            "operate": "get authorize"
        }
        return this.addRequest(data)
    }
    /**
     * 更新授权信息
     * @param {授权信息} params 
     */
    async manageSetAuthore(params) {
        let data = {
            "operate": "set authorize",
            "params": params
        }
        return this.addRequest(data)
    }
    /**
     * 设置日期时间
     * @param {日期时间} params 
     */
    async manageSetTime(params) {
        let data = {
            "operate": "set date",
            "params": params
        }
        return this.addRequest(data)
    }
    /**
     * 获取服务器网络配置
     */
    async manageGetNetwork() {
        let data = {
            "operate": "get attr",
            "params": {
                "network":null
            }
        }
        return this.addRequest(data)
    }
    /**
     * 设置网络配置
     * @param {网络配置信息} params 
     */
    async manageSetNetwork(ip, gw, nm, dns = '114.114.114.114',endhcp) {
        let validate = this.isDevIP(ip, false)
        if (!validate.success) throw new Error(validate.message)
        let data = {
            "operate": "set attr",
            "params": {
                "network": {
                    "address": ip,
                    "netmask": nm,
                    "gateway": gw,
                    "dns": dns,
                    "endhcp":endhcp
                }
            }
        }
        return this.addRequest(data)
    }
    /**
     * 断开tcp连接
     */
    async manageExit() {
        let data = {
            "operate": "exit"
        }
        return this.addRequest(data)
    }
    /**
     * 重启服务器服务
     */
    async manageRestart() {
        let data = {
            "operate": "restart"
        }
        return this.addRequest(data)
    }
    /**
     * 重启服务器设备
     */
    async manageReboot() {
        let data = {
            "operate": "reboot"
        }
        return this.addRequest(data)
    }
    /**
     * 保存当前参数到磁盘
     */
    async manageSave() {
        let data = {
            "operate": "save attr",
            "params": "manage"
        }
        return this.addRequest(data)
    }
    /**
     * 保存授权
     */
    async manageSaveAuthourize() {
        
        return this.addRequest("@save authorize")
    }
    /**
     * 重置服务器设备
     */
    async manageReset() {
        return this.addRequest("@reset")
    }
}
    IServer.prototype.version = 'V1.0'

/**
 * Events
 *    start   组操作启动
 *    end     组操作停止
 *    message 组操作过程信息    
 */
class ISGroup/* extends EventTarget*/ {
    /**
     * is 智能服务器实体对象
     * grpid 组操作id
     * ignore 是否忽略组操作错误
     */
    constructor(is, grpid, ignore) {
        //super()
        if (is instanceof IServer === false) {
            throw new Error('is非IServer对象，创建操作组失败')
        }
        Object.defineProperties(this, {
            is: {
                value: is,
                configurable: true,
                writable: true,
                enumerable: true
            },
            ws: {
                value: null,
                configurable: true,
                writable: true,
                enumerable: true
            },
            name: {
                value: grpid,
                configurable: true,
                writable: true,
                enumerable: true
            },
            ignore: {
                value: ignore,
                configurable: true,
                writable: true,
                enumerable: true
            },
            state: {
                value: 'stop',
                configurable: true,
                writable: true,
                enumerable: true
            },
            currentRequst: {
                value: null,
                configurable: true,
                writable: true,
                enumerable: true
            },
            requests: {
                value: [],
                configurable: true,
                writable: true,
                enumerable: true
            },
        })
        this.connect().catch(e => {
            console.error(e)
        })
    }

    async connect() {
        if (this.ws instanceof WebSocket && this.ws.readyState === WebSocket.OPEN) {
            return this.ws
        }
        return new Promise((resolve, reject) => {
            let t = setTimeout(() => {
                reject('链接服务器超时')
            }, 3000)
            this.ws = new WebSocket(`ws://${this.is.host}:${this.is.port}/app/${this.is.id}`)
            this.ws.onopen = evt => {
                clearTimeout(t)
                resolve(this.ws)
            }
            this.ws.onmessage = evt => {
                if (evt.data === 'iserver\n') {
                    // console.log('登陆')
                    // this.userLogin(this.is.user.name,this.is.password)
                    this.addRequest({
                        operate: 'user info'
                    })
                } else {
                    console.log(`getMessage: ${evt.data}`)
                    if (typeof this.currentRequst === 'object' && this.currentRequst !== null &&
                        typeof this.currentRequst.callback === 'function') {
                        this.currentRequst.callback(evt.data)
                    } else {
                        console.error(`未处理的应答数据: ${evt.data}`)
                    }
                    if (this.state === 'running' || this.state === 'stopping') {
                        return
                    }
                    if (this.requests.length > 0) {
                        this.sendRequest(this.requests.shift())
                    }
                    else {
                        this.currentRequst = null
                    }
                }
            }
            this.ws.onclose = evt => {
                console.log('ws链接断开：', evt)
                this.ws = null
            }
            this.ws.onerror = evt => {
                console.log('ws链接错误：', evt)
            }
        })
    }



    async addRequest(req, isUrgent) {
        if (typeof req !== 'object' || req === null || typeof req.operate !== 'string') {
            throw new Error('操作请求格式错误')
        }
        return new Promise((resolve, reject) => {
            req.callback = data => {
                if (data.startsWith('ERR')) { // 操作出错
                    reject(data.substr(4))
                } else if (data.startsWith('grpcmd') && data.endsWith('end\n')) { // 组操作结束
                    this.state = 'stop'
                    // this.dispatchEvent(new Event('end'))
                } else if (data.startsWith('exit')) {
                    let e = new Event('message')
                    e.message = {
                        'req': data,
                        'ack': '执行结束'
                    }
                    // this.dispatchEvent(e)
                } else {
                    try {
                        if (data.startsWith('enter grpcmd')) {
                            let e = new Event('message')
                            e.message = {
                                'req': data,
                                'ack': '正在执行'
                            }
                            // this.dispatchEvent(e)
                        } else {
                            let ack = JSON.parse(data)
                            if (req.operate === 'grpcmd start' && this.state !== 'running') {
                                this.state = 'running'
                                // this.dispatchEvent(new Event('start'))
                            }
                            if (this.state === 'running' || this.state === 'stopping') {
                                if (typeof ack.ecode === 'number' && req.operate === 'grpcmd stop') {
                                    if (ack.ecode === 0) {
                                        resolve(ack)
                                    } else {
                                        reject(ack.estring)
                                    }
                                }
                                else {
                                    let e = new Event('message')
                                    e.message = ack
                                    // this.dispatchEvent(e)
                                }
                            } else {
                                if (ack.ecode === 0) {
                                    resolve(ack)
                                    if (req.operate === 'user login') {
                                        this.addRequest({
                                            operate: 'user info'
                                        })
                                    } else if (req.operate === 'user info') {
                                        this.start().catch(e => {
                                            console.log(e)
                                            // let ent = new Event('error')
                                            // ent.err = e
                                            // this.dispatchEvent(ent)
                                        })
                                    }

                                } else {
                                    if (req.operate === 'user info') {
                                        this.userLogin(this.is.user.name, this.is.password)
                                    }
                                    reject(ack.estring)
                                }
                            }
                        }
                    } catch (e) {
                        reject(`应答格式错误：${data}`)
                    }
                }
            }
            if (isUrgent || this.currentRequst === null) {
                this.sendRequest(req)
            } else {
                this.requests.push(req)
            }
        })
    }

    sendRequest(req) {
        if (this.ws instanceof WebSocket && this.ws.readyState === WebSocket.OPEN) {
            this.currentRequst = req
            let reqStr = JSON.stringify(req) + '\n'
            this.ws.send(reqStr)
            console.log(`sendMessage: ${reqStr}`)
            if (req.operate === 'grpcmd stop') {
                this.state = 'stopping'
            }
        } else {
            throw new Error('发送请求错误，ws未链接')
        }
    }

    async userLogin(name, password) {
        let req = {
            operate: 'user login',
            target: null,
            params: {
                user: name,
                password: password
            }
        }
        return this.addRequest(req)
    }

    async start(ignore) {
        if (typeof ignore === 'boolean') {
            this.ignore = ignore
        }
        let req = {
            operate: 'grpcmd start',
            target: this.name,
            params: {
                ignore: this.ignore
            }
        }
        return this.addRequest(req)
    }

    stop() {
        let req = {
            operate: 'grpcmd stop',
            target: this.name,
            params: null
        }
        this.addRequest(req, true)
    }

    dispose() { // 断开链接但不停止组操作
        if (this.ws instanceof WebSocket) {
            this.ws.close()
        }
    }
}

IServer.Group = ISGroup

if (!window.IServer) window.IServer = IServer
if (!window.ISGroup) window.ISGroup = ISGroup


/**
 *   用途：校验ip地址的格式
 *   输入：strIP：ip地址
 *   返回：如果通过验证返回true,否则返回false；
 **/

function isIP(strIP) {
    if (isNull(strIP)) return false;
    let re = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/g //匹配IP地址的正则表达式
    if (re.test(strIP)) {
        if (RegExp.$1 < 256 && RegExp.$2 < 256 && RegExp.$3 < 256 && RegExp.$4 < 256) return true;
    }
    return false;
}
/*
*  用途：检查输入字符串是否为空或者全部都是空格
*  输入：str
*  返回：
*  如果全是空返回true,否则返回false
*/
function isNull(str) {
    if (str === "" || str === null || str === undefined) return true;
    var regu = "^[ ]+$";
    var re = new RegExp(regu);
    return re.test(str);
}

module.exports = IServer
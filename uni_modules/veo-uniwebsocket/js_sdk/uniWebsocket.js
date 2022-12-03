
var url = '' //地址
var timeout = 0 //心跳检测
var cb = null 

var socketStatus = 0 //避免重复连接 0 无连接 1-9连接中 10 已连接
var heartbeatTimeOut = null //检测服务器端是否还活着
var reconnectTimeOut = null //重连之后多久再次重连
var reconnectNum = 0 //重连次数
var socketTask = null //ws对象
var msgQueue = []

var netIsConnected = false
var netType = 'none'

var autoFlag = true

/**
 * uniapp 的 connectSocket 封装
 * 
 */
class uniWebsocket {

    /**
     * 构造方法
     * @param {String} _url
     * @param {number} _timeout
     * @param {Function} _cb
     */
	constructor(_url, _cb, _timeout=50000) {
        
		url = _url //地址
		timeout = _timeout //心跳检测
		cb = _cb 
        
        // 监听网络状态变化
        uni.onNetworkStatusChange((res)=> {
        	console.log('WebSocket NetStatus',res.isConnected);
        	console.log('WebSocket NetStatus',res.networkType);
            netIsConnected = res.isConnected
            netType = res.networkType
            reconnectNum = 0 
            if(autoFlag) this.reconnect()
        });

		try {
            uni.getNetworkType({
            	success: (res)=> {
            		console.log('WebSocket getNetworkType',res.networkType);
                    netType = res.networkType
                    netIsConnected = true
                    
                    this.reconnect();   
            	}
            });
			
			// 有return ，则构造方法返回return的对象，没有，则返回new的对象
			// return this.hhh
		} catch (e) {
			console.log('连接初始化失败',e);
		}
		
	}

    /**
     * 连接创建方法，维护连接状态、心跳、回调
     */
	connectSocketInit() {
        
        if(!netIsConnected || netType == 'none') return
        if(socketStatus > 0) return
        if(!url) return
        
        heartbeatTimeOut && clearTimeout(heartbeatTimeOut)
        
        socketStatus = 1;
        
        console.log('正准备建立websocket...',url);
        
		uni.onSocketError(function (res) {
            socketStatus = 0;
            console.log('WebSocket 连接错误！',socketStatus,res);
		});
        
        uni.onSocketClose(function (res) {
            socketStatus = 0;
            console.log('WebSocket 连接关闭！',res);
        });
        
        uni.onSocketOpen(function (res) {
            socketStatus = 10;
            console.log('WebSocket 连接打开！',res);
		});
        
        // 建立连接
		socketTask = uni.connectSocket({
			url: url,
			success:(data)=>{
                socketStatus = 2;
				console.log("websocket 建立中...");
			},
            fail: (data)=> {
                socketStatus = 0;
                console.log("websocket 建立失败...");
            },
            complete: (data)=> {
                socketStatus = 3;
                console.log("websocket 建立完成...");
            }
		});
        
        // 连接打开
        // 上面的构造方法必须存在，否则 this.socketTask.onOpen 不可用
        socketTask.onOpen((res) => {
            console.log("socketTask 正常了");
            // 连接标识
            socketStatus = 10;
            reconnectNum = 0;
            // 心跳
            this.ping();
            // 注：只有连接正常打开中 ，才能正常收到消息
            socketTask.onMessage((res) => {
                // console.log(res.data.type,res.data)
                this.receive(res.data)
            });
        })
        
        // 连接关闭
        // 这里仅是事件监听【如果socket关闭了会执行】
        socketTask.onClose(() => {
            console.log("socketTask 关闭了")
            socketStatus = 0;
        })
        
        // 连接错误
        // 监听连接失败，这里代码我注释掉的原因是因为如果服务器关闭后，和下面的onclose方法一起发起重连操作，这样会导致重复连接
        socketTask.onError(() => {
            console.log("socketTask 错误了")
            socketStatus = 0;
        })
		
	}
	
    /**
     * 重新连接，循环检查连接状态
     */
	reconnect(){
        
        // 失败重连频率
		const reconnect_time = [3000,3000,3000,3000,10000,10000,10000,20000,20000,50000]
        // 自身巡检频率
        let reconnect_timeout = 30000

        // 任何情况下，清理定时器
        reconnectTimeOut && clearTimeout(reconnectTimeOut)
        
        if(socketStatus < 10) {
            // 失败重连
            if(reconnectNum > 50) return
            if(reconnectNum < reconnect_time.length) {
                reconnect_timeout = reconnect_time[reconnectNum]
            }else{
                reconnect_timeout = reconnect_time[reconnect_time.length-1]
            }
            
            console.log("uniWebsocket 重新连接",socketStatus,reconnectNum,reconnect_timeout)
            
            reconnectNum = reconnectNum + 1
            
            reconnectTimeOut = setTimeout(()=>{
                // 连接创建
                this.connectSocketInit();
                this.reconnect()
            },reconnect_timeout)
            
            return;
        }
        
        console.log("uniWebsocket 自身巡检",socketStatus,reconnectNum,reconnect_timeout)
        
        // 自身巡检循环
        reconnectTimeOut = setTimeout(()=>{
            // 连接创建
            this.connectSocketInit();
            this.reconnect()
        },reconnect_timeout)
        
	}
	
    /**
     * 重新打开链接
     */
    restart(){
        
        if(socketStatus >= 10) {
            console.log("连接已打开");
            return;
        }
        
        autoFlag = true
        
        this.reconnect()
        
    }
    
    /**
     * 关闭链接
     */
    close(){
        
        if(socketStatus < 10) {
            console.log("连接未打开");
            return;
        }
        
        heartbeatTimeOut && clearTimeout(heartbeatTimeOut)
        reconnectTimeOut && clearTimeout(reconnectTimeOut)
        
        autoFlag = false
        
        socketTask.close()
    	
    }
    
    /**
     * 发送消息
     * @param {String} value
     */
	send(value){
        
        value = JSON.stringify(value)
        
        msgQueue.push(value);
        
        if(socketStatus < 10) {
            console.log("**********","连接错误，消息发送失败",value);
            return;
        }
        // console.log("msgQueue ",this.msgQueue.length);
        let msg = '';
        while(msg = msgQueue.shift()){
            // 注：只有连接正常打开中 ，才能正常成功发送消息
            socketTask.send({
            	data: msg,
            	async success() {
                    console.log('++++++++++',msg)
            		// console.log("消息发送成功");
            	},
            });
        }
		
	}
    
    /**
     * 接收消息
     * @param {String} value
     */
    receive(data){
        
        data = JSON.parse(data)
        console.log('----------',data.type,data)
        if(typeof cb !== 'function') {
            console.log('receive callback fun is not function',data.type,data)
            return
        }
        cb(data)
        
    }
    
    getStatus(){
        return socketStatus
    }
	
    /**
     * 开启心跳检测
     */
	ping(){
		
		heartbeatTimeOut && clearTimeout(heartbeatTimeOut)
		
        if(socketStatus >= 10) {
            let data={'type': 'ping'}
            this.send(data);
        }
		
        if(timeout < 10000) return
        
        // 定时器
		heartbeatTimeOut = setTimeout(()=>{
			this.ping()
		},timeout)
        
	}
	
}

export default uniWebsocket
// module.exports = uniWebsocket

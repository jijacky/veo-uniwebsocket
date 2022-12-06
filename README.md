# veo-uniwebsocket

## 介绍
uniapp 的 connectSocket 封装，包含自动心跳，断线重连，消息重发，网络状态监听等功能

## 安装教程
import uniwebsocket from '@/uni_modules/veo-uniwebsocket/js_sdk/uniWebsocket.js'

## 使用说明
### 连接
    
    const S = new uniwebsocket(
        'ws://127.0.0.1:8800', // 必填，websocket 服务端地址
        function(data){
            
            // 接收到消息处理
            // 消息为 json 格式
            console.log('**********',data.type,data)
            
            uni.$emit(data.type,data)
        }, // 选填，服务端消息处理方法
        55000 // 选填，心跳间隔，默认50000ms
    )
    
### 发送消息
> 消息要求是 json 格式

    S.send(
        {
            type:"login",
            token:'XXX'
        }
    )
### 关闭连接
> 连接关闭后，网络状态监听功能失效

    S.close()
    
### 重新连接
> 重新连接后，全部自动状态恢复，包括网络状态监听

    S.restart()
    
### 获取状态
> 0 无连接 1-9连接中 10 已连接 

    S.getStatus()
    
## 仓库
> [dcloud 插件](https://ext.dcloud.net.cn/plugin?id=10311) https://ext.dcloud.net.cn/plugin?id=10311
> [gitee](https://gitee.com/veeoo/veo-uniwebsocket) https://gitee.com/veeoo/veo-uniwebsocket
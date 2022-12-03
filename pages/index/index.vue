<template>
	<view class="content">
		<image class="logo" src="/static/logo.png"></image>
		<view class="text-area">
			<text class="title">uniWebsocket 测试</text>
		</view>
        <view>
            <text v-for="item,idx in receive_msg" :key="idx">{{idx}}: {{item.time}}</text>
        </view>
        <button @click="sendMsg">发送</button>
        <text>{{socket_status}}</text>
	</view>
</template>

<script>
    import socket from "@/uni_modules/veo-uniwebsocket/js_sdk/uniWebsocket.js"
    
	export default {
		data() {
			return {
                socket: null,
                socket_status: 0,
                
                receive_msg: [],
			}
		},
		onLoad() {
            this.getSocketStatus()
            this.socket = new socket(
                'ws://127.0.0.1:8800',
                (data)=>{
                    console.log(data)
                    this.receiveMsg(data)
                }
            )
		},
		methods: {
            getSocketStatus(){
                if(this.socket){
                    this.socket_status = this.socket.getStatus()
                }
                
                setTimeout(()=>{
                    this.getSocketStatus()
                },1000)
            },
            
            sendMsg(){
                this.socket.send({
                    type:"test",
                    time:(new Date()).toString()
                })
            },
            
            receiveMsg(data){
                this.receive_msg.push(data)
            }
		}
	}
</script>

<style>
	.content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.logo {
		height: 200rpx;
		width: 200rpx;
		margin-top: 200rpx;
		margin-left: auto;
		margin-right: auto;
		margin-bottom: 50rpx;
	}

	.text-area {
		display: flex;
		justify-content: center;
	}

	.title {
		font-size: 36rpx;
		color: #8f8f94;
	}
</style>

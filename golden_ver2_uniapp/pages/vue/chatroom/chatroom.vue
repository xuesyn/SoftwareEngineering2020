<template>
    <view class="chat-room">
		<uni-popup ref="popupAsk" type="dialog">
			<uni-popup-dialog mode="base" title="提示" content="房主正在询问你是否准备完成" @confirm="checked"></uni-popup-dialog>
		</uni-popup>
		<uni-popup ref="popupCount" type="dialog">
			<uni-popup-dialog mode="input" placeholder="输入游戏轮数" title="输入" @confirm="gameTurns"></uni-popup-dialog>
		</uni-popup>
		<uni-popup ref="popupBottom" type="bottom" @change="switchPop">
			<slot>
			<view class="qiun-columns">
				<view class="qiun-charts" >
					<!--#ifdef MP-ALIPAY -->
					<canvas canvas-id="canvasLineA" id="canvasLineA" class="charts" :width="cWidth*pixelRatio" :height="cHeight*pixelRatio" :style="{'width':cWidth+'px','height':cHeight+'px'}" disable-scroll=true @touchstart="touchLineA" @touchmove="moveLineA" @touchend="touchEndLineA"></canvas>
					<!--#endif-->
					<!--#ifndef MP-ALIPAY -->
					<canvas canvas-id="canvasLineA" id="canvasLineA" class="charts"   disable-scroll=true @touchstart="touchLineA" @touchmove="moveLineA" @touchend="touchEndLineA"></canvas>
					<!--#endif-->
				</view>
			</view>
			</slot>	
		</uni-popup>
        <view class="online-avatar-container">
            <view class="online-avatar-item" v-for="(user, key) in room.onlineUsers.users" :key="key" 
			:style="{transform:'translateX('+ (room.onlineUsers.users.length - key-1)*20 +'rpx' +')'}">
                <image :src="user.avatar"></image>
            </view>
            <view class="online-count">{{room.onlineUsers.count}}</view>
        </view>
        <view class="chat-room-container">
            <scroll-view class="chat-room-box" scroll-y="true" :scroll-into-view="contentPosition"
                         show-scrollbar="true">
                <view class="message-box" v-for="(message, key) in room.messages" :key="key" :id="'message-box'+ key">
                    <view class="message-item">
                        <text class="user-name">{{message && message.senderNickname}}:</text>
                        <text :class="message.senderUserId == room.currentUser.id ? 'user-message self' : 'user-message' ">
                            {{message && message.content}}
                        </text>
                    </view>
                </view>
            </scroll-view>
            <view class="chat-room-input">
                <view style="position: relative;">
                    <input class="uni-input" :value="newMessageContent" placeholder="输入你的答案.." @input="onInputMessage"/>
					<view class="uni-btn" v-show="!isPopuping" @click="sendMessage(room.MessageType.CHAT, newMessageContent)">↑</view>
                </view>
                <image class="heart" @click="callQuest(room.MessageType.PROP, '')"
                       src="../../../static/images/check.svg"></image>
                <image class="heart" @click="openPopup"
                       src="../../../static/images/log.svg"></image>
            </view>
        </view>
    </view>
</template>

<script>
    import ChatRoomService from '../../../lib/chatservice.js';
	import uniFab from '@/components/uni-fab/uni-fab.vue';
	import uCharts from '@/js_sdk/u-charts/u-charts/u-charts.js';
	import uniPopup from '@/components/uni-popup/uni-popup.vue'
	import uniPopupMessage from '@/components/uni-popup/uni-popup-message.vue'
	import uniPopupDialog from '@/components/uni-popup/uni-popup-dialog.vue'
	
	var _self;
	var canvaLineA=null;
    export default {
		components: {
		    uniFab,
			uniPopup,
			uniPopupMessage,
			uniPopupDialog
		},
        data() {
            return {
                room: null,
                prop: {
                    showPropType: 0,
                    play: false,
                    timer: null
                },
                newMessageContent: "",
                contentPosition: '',
                chatRoomService: null,
				isPopuping: false,
				isOk: false,
				isOwner: false,
				owner: '',
				gameTurn: 0,
				//
				cWidth:'',
				cHeight:'',
				pixelRatio:1,
				textarea:''
				
            }
        },
        onLoad(options) {
            //获取数据
            var roomToken = JSON.parse(options.roomToken);
			var that = this;
			
			_self = this;
			//#ifdef MP-ALIPAY
			uni.getSystemInfo({
				success: function (res) {
					if(res.pixelRatio>1){
						//正常这里给2就行，如果pixelRatio=3性能会降低一点
						//_self.pixelRatio =res.pixelRatio;
						_self.pixelRatio =2;
					}
				}
			});
			//#endif
			this.cWidth=uni.upx2px(600);
			this.cHeight=uni.upx2px(400);
			//this.getServerData();
			
            //设置导航标题
            uni.setNavigationBarTitle({
                title: roomToken.roomName
            });
			
			const db = wx.cloud.database({
				env: 'rooms-7glacbsg9acdae52'
			});
			
			db.collection('totalRooms').where({
				roomId: roomToken.roomId,
			}).get().then(res => {
				// res.data 包含该记录的数据
				console.log(res.data[0]);
				//that.$set(that.roomList, res.data.roomInfo);
				that.owner = res.data[0].owner;
				console.log("nickname:");
				console.log(currentUser.nickname);
				console.log("owner:")
				console.log(that.owner);
				//if(currentUser.nickname == that.owner){
				//	that.isOwner = true;
				//}
			});

            //当前用户
            var currentUser = {
                id: roomToken.userId,
                avatar: roomToken.avatar,
                nickname: roomToken.nickname,
            };

            var room = {
                id: roomToken.roomId,
                name: roomToken.roomName,
				MessageType :roomToken.MessageType
            };
			
            //构造chatRoomService
            this.chatRoomService = new ChatRoomService(room, currentUser);
            this.chatRoomService.initialWhenNewMessage(this.whenNewMessage);
			//console.log(typeof(parseInt(room.id)));
			//console.log(room);
			//this.chatRoomService.initialOnlineUsers(parseInt(room.id));
            this.chatRoomService.connectGoEasyIM();

            //获取当前聊天室数据
            this.room = this.chatRoomService.room;

        },
        onBackPress() {//返回按钮
            //断开连接
            this.chatRoomService.quitRoom();
        },
        //todo:xxxx
        beforeDestroy() {
            this.chatRoomService.quitRoom();
        },
        methods: {
            onInputMessage(event) {//双向绑定消息 兼容
                this.newMessageContent = event.target.value;
            },
            whenNewMessage(message) {//新消息监听
                if (message.type == this.room.MessageType.PROP && !this.isOwner) {
                    this.openAsk();
                }
				console.log("newMessage:");
				console.log(message);
                setTimeout(() => {
                    this.contentPosition = 'message-box' + (this.room.messages.length - 1);
                }, 300)
            },
			callQuest (messageType, content){
				if (messageType == this.room.MessageType.PROP){
					this.openCount();
				}
			},
            sendMessage(messageType, content) {//发送消息
                if (content == "" && messageType == this.room.MessageType.CHAT) return;
                var message = {
                    senderNickname: this.room.currentUser.nickname,
                    type: messageType,
                    content: content
                }
                this.chatRoomService.sendMessages(this.room.id, message);
                this.newMessageContent = "";
				if (message.type == this.room.MessageType.PROP) {
				    this.isOk = true;
					this.isOwner = true;
					this.owner = this.room.currentUser.nickname;
					var message = {
					    senderNickname: this.room.currentUser.nickname,
					    type: 2,
					    content: ""
					}
					this.chatRoomService.sendMessages(this.room.id, message);
					console.log("im okkkkkkkk");
				}
            },
            openPopup() {
				console.log(this.room.res);
				this.getResData();
				this.$refs.popupBottom.open();
			},		
			openAsk() {
				this.$refs.popupAsk.open();
			},
			openCount() {
				this.$refs.popupCount.open();
			},
			gameTurns(done, value) {
				this.gameTurn = value;
				this.sendMessage(this.room.MessageType.PROP, value);
				done();
			},
			switchPop (){
				this.isPopuping = !this.isPopuping;
			},
			checked(done) {
				console.log("checked!!!!!!!");
				this.isOk = true;
				var message = {
				    senderNickname: this.room.currentUser.nickname,
				    type: 2,
				    content: ""
				}
				this.chatRoomService.sendMessages(this.room.id, message);
				console.log("im okkkkkkkk");
				done();
			},
						//
			getResData() {
				let LineA={categories:[],series:[]};
				//这里我后台返回的是数组，所以用等于，如果您后台返回的是单条数据，需要push进去
				LineA.categories=this.room.res.categories;
				LineA.series=this.room.res.series;
				_self.textarea = JSON.stringify(this.room.res);
				_self.showLineA("canvasLineA",LineA);
			}/*,
			getServerData(){
				uni.request({
					url: 'https://www.ucharts.cn/data.json',
					data:{
					},
					success: function(res) {
						console.log("data: ");
						console.log(res.data.data);
						let LineA={categories:[],series:[]};
						//这里我后台返回的是数组，所以用等于，如果您后台返回的是单条数据，需要push进去
						LineA.categories=this.room.res.categories;
						LineA.series=this.room.res.series;
						_self.textarea = JSON.stringify(this.room.res);
						_self.showLineA("canvasLineA",LineA);
					},
					fail: () => {
						_self.tips="网络错误，小程序端请检查合法域名";
					},
				});
			}*/,
			showLineA(canvasId,chartData){
				canvaLineA=new uCharts({
					$this:_self,
					canvasId: canvasId,
					type: 'line',
					fontSize:11,
					padding:[30,0,0,30],
					legend:{
						show:true,
						padding:5,
						lineHeight:11,
						margin:5,
					},
					dataLabel:true,
					dataPointShape:true,
					dataPointShapeType:'hollow',
					background:'#FFFFFF',
					pixelRatio:_self.pixelRatio,
					categories: chartData.categories,
					series: chartData.series,
					animation: true,
					enableScroll: true,//开启图表拖拽功能
					xAxis: {
						disableGrid:false,
						type:'grid',
						gridType:'dash',
						itemCount:4,
						scrollShow:true,
						scrollAlign:'left'
					},
					yAxis: {
						//disabled:true
						gridType:'dash',
						splitNumber:5,
						min:0,
						max:100,
						format:(val)=>{return val.toFixed(0)}//如不写此方法，Y轴刻度默认保留两位小数
					},
					width: _self.cWidth*_self.pixelRatio,
					height: _self.cHeight*_self.pixelRatio,
					extra: {
						line:{
							type: 'straight'
						}
					},
				});
				
			},
			touchLineA(e){
				canvaLineA.scrollStart(e);
			},
			moveLineA(e) {
				canvaLineA.scroll(e);
			},
			touchEndLineA(e) {
				canvaLineA.scrollEnd(e);
				//下面是toolTip事件，如果滚动后不需要显示，可不填写
				canvaLineA.touchLegend(e);
				canvaLineA.showToolTip(e, {
					format: function (item, category) {
						return category + ' ' + item.name + ':' + item.data 
					}
				});
			},
			changeData(){
				if(isJSON(_self.textarea)){
					let newdata=JSON.parse(_self.textarea);
					canvaLineA.updateData({
						series: newdata.series,
						categories: newdata.categories,
						scrollPosition:'right',
						animation:false
					});
				}else{
					uni.showToast({
						title:'数据格式错误',
						image:'../../../static/images/alert-warning.png'
					})
				}
			}
        }
    }
</script>

<style>
    page {
        height: 100%;;
    }

    uni-page-body {
        height: 100%;;
    }

    .chat-room {
        display: flex;
        flex-direction: column;
        height: 100%;;
    }

    .online-avatar-container {
        height: 80rpx;
        display: flex;
        justify-content: flex-end;
        padding: 28rpx;
        box-shadow: 10rpx 30rpx 50rpx #fff;
        z-index: 40;
    }

    .online-avatar-item {
        width: 80rpx;
        height: 80rpx;
        border-radius: 40rpx;
        text-align: center;
        line-height: 80rpx;
        background: rgba(51, 51, 51, 0.3);
        color: #fff;
        font-size: 18rpx 28rpx;
    }

    .online-count {
        width: 80rpx;
        height: 80rpx;
        border-radius: 40rpx;
        text-align: center;
        line-height: 80rpx;
        background: rgba(51, 51, 51, 0.3);
        color: #fff;
        font-size: 28rpx;
    }

    .online-avatar-item image {
        width: 80rpx;
        height: 80rpx;
		border-radius: 50%;
    }

    .chat-room-container {
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    .chat-room-box {
        flex: 1;
        padding: 10rpx 38rpx;
        overflow: auto;
        padding-top: 20rpx;
        box-sizing: border-box;
    }

    .message-box {
        margin-top: 16rpx;
    }

    .message-item {
        box-sizing: border-box;
        height: 72rpx;
        background-color: rgba(196, 196, 196, 0.2);
        display: inline-block;
        font-size: 28rpx;
        border-radius: 100rpx;
        padding: 18rpx 30rpx;
        font-family: Microsoft YaHei UI;
    }

    .user-name {
        color: #D02129;
        font-family: Microsoft YaHei UI;
    }

    .user-message {
        color: #333;
        font-family: Microsoft YaHei UI;
    }

    .chat-room-input {
        height: 92rpx;
        line-height: 92rpx;
        padding: 28rpx;
        display: flex;
    }

    .uni-input {
        width: 528rpx;
        background-color: rgba(51, 51, 51, 0.1);
        height: 92rpx;
        border-radius: 100rpx;
        box-sizing: border-box;
        padding: 26rpx 40rpx;
        font-size: 28rpx;
    }

    .uni-btn {
        position: absolute;
        width: 72rpx;
        height: 72rpx;
        background: #D02129;
        right: 10rpx;
        top: 10rpx;
        border-radius: 72rpx;
        text-align: center;
        line-height: 72rpx;
        color: #fff;
        font-weight: bold;
        font-size: 32rpx;
		z-index: 99;
    }

    .heart {
        width: 80rpx;
        height: 92rpx;
        padding: 0 15rpx;
    }

    .rocket {
        width: 40rpx;
        height: 92rpx;
    }

    .self {
        color: #D02129;
    }

    .show-animation {
        width: 80rpx;
        height: 320rpx;
        position: fixed;
        z-index: 44;
        left: 50%;
        bottom: 80rpx;
        margin: 0 -40rpx;
        justify-content: flex-end;
        animation: myanimation 2s linear;
    }

    .prop-heart {
        height: 80rpx;
        width: 80rpx;
    }

    .prop-rocket {
        height: 160rpx;
        width: 80rpx;
    }
	
	.qiun-columns {
		width: 600upx;
		border-radius: 30upx;
		margin-left: 80upx;
		margin-bottom: 50upx;
		background-color: #fff;
	}
	
	.qiun-charts {
		width: 600upx;
		height: 400upx;		
		border-radius: 30upx;
		background-color: #FFFFFF;
	}
		
	.charts {
		width: 600upx;
		height: 400upx;
		border-radius: 30upx;
		background-color: #FFFFFF;
	}

    @keyframes myanimation {
        from {
            bottom: 80rpx;
        }
        to {
            bottom: 600rpx;
        }
    }

</style>

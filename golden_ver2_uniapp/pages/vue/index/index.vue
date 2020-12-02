<template>
	<view>
		<view class="header" v-show="!hasUserInfo">
			<text class="title">Golden Point</text>
			<text class="content">Challenge yourself</text>
		</view>
		<view class="userinfo" v-show="hasUserInfo">
		    <image class="userinfo-avatar" :src="Avatar" mode="cover"></image>
		    <text class="userinfo-nickname">{{nickname}}</text>
		</view>
		<uni-popup ref="popup" type="dialog">
			<uni-popup-dialog mode="input" placeholder="输入房间Id" title="输入" @confirm="check"></uni-popup-dialog>
		</uni-popup>
		<view class="bottom-box">
			<button class="room-bottom" v-show="!hasUserInfo" open-type="getUserInfo" @getuserinfo="getUserInfo"> 授权登录 </button>
		</view>
		<view class="maincontent" v-show="hasUserInfo" >
			<text class="title">新建房间</text>
			<input :class='newRoomName == "" ? "input-notice uni-input" : "uni-input"' :value="newRoomName" placeholder="请输入房间名称"
			 @input="onInputRoomName">
			<view class="bottom-box">
				<text class="room-bottom" @click="open()">{{"创建新房间"}}
				</text>
			</view>
			<text class="title">进入房间</text>
			<view class="room-container">
				<scroll-view scroll-y>
				<view class="room-box">
					<text class="room-box-item" v-for="(room, key) in roomList" :key="room.roomId" @click="onSelectRoom(room)">{{room.name}}
					</text>
				</view>
				</scroll-view>
			</view>
		</view>
	</view>
</template>

<script>
	import uniPopup from '@/components/uni-popup/uni-popup.vue'
	import uniPopupMessage from '@/components/uni-popup/uni-popup-message.vue'
	import uniPopupDialog from '@/components/uni-popup/uni-popup-dialog.vue'
	export default {
		components: {
			uniPopup,
			uniPopupMessage,
			uniPopupDialog
		},
		data() {
			return {
				hasUserInfo: false,
				roomList: this.roomList,
				nickname: '',
				newRoomName: '',
				newRoomId: '',
				roomNum: '',
				logid: '',
				nickname: '',
				Avatar: '',
				newAddRoom: {},
				selectedAvatar: {
					imgUrl: '',
					id: ''
				},
				selectedRoom: {
					roomId: null,
					roomName: '',
				}

			}
		},
		onShow: function() {
			var that = this;
			Object.assign(this.$data, this.$options.data());
			console.log('App  1Show');
			const db = wx.cloud.database({
				env: 'rooms-7glacbsg9acdae52'
			});
			db.collection('totalRooms').doc("e62469b25fc1e8d3007d743e14cb82a2").get().then(res => {
				// res.data 包含该记录的数据
				console.log(res.data);
				//that.$set(that.roomList, res.data.roomInfo);
				that.roomList = res.data.roomInfo;
				that.roomNum = res.data.RoomNumber;
				that.logid = res.data._id;
			});
			uni.getProvider({
				service: 'oauth',
				success: function(res) {
					if (~res.provider.indexOf('weixin')) {
						uni.login({
							provider: 'weixin',
							success: (loginRes) => {
								// 获取用户信息
								uni.getUserInfo({
									provider: 'weixin',
									success: function(infoRes) {
										that.hasUserInfo = true;
										console.log(infoRes.userInfo);
										that.nickname = infoRes.userInfo.nickName;
										that.Avatar = infoRes.userInfo.avatarUrl;
										console.log(that.Avatar);
										uni.setStorage({ //缓存用户登陆状态
											key: 'userInfo',
											data: infoRes.userInfo
										});
									},
									fail: () => {
										uni.showToast({
											title: "微信登录授权失败",
											icon: "none"
										});
									}
								})
							},
							fail: () => {
								uni.showToast({
									title: "微信登录授权失败",
									icon: "none"
								});
							}
						})
					} else {
						uni.showToast({
							title: '请先安装微信或升级版本',
							icon: "none"
						});
					}
				}
			});
		},
		methods: {
			onInputRoomName(event) { // 输入用户名
				this.newRoomName = event.target.value;
			},
			open() {
				this.$refs.popup.open()
			},
			check(done, value) {
				console.log("check");
				console.log(value);
				this.newAddRoom = {
					roomId: value,
					name: this.newRoomName,
					owner: this.nickname
				};
				this.roomList.push(this.newAddRoom);
				console.log("roomList:");
				console.log(this.roomList);
				const db = wx.cloud.database({
					env: 'rooms-7glacbsg9acdae52'
				});
				const _ = db.command
				/*db.collection('totalRooms').doc("b1a52c595fc1365f0089d55f126d6ab0").remove({
				  success: function(res) {
				    console.log(res.data)
				  }
				})*/
				db.collection('totalRooms').doc("e62469b25fc1e8d3007d743e14cb82a2").set({
					// data 传入需要局部更新的数据
					data: {
						RoomNumber: this.roomNum + 1,
						roomInfo: this.roomList
					},
					success: function(res) {
						console.log(res.data)
					}
				});

				db.collection('totalRooms').add({
					// data 字段表示需新增的 JSON 数据
					data: {
						roomId: value,
						name: this.newRoomName,
						owner: this.nickname
					},
					success: function(res) {
						// res 是一个对象，其中有 _id 字段标记刚创建的记录的 id
						console.log(res)
					}
				})
				//this.$refs.popup.close();
				done();

			},
			getUserInfo(infoRes) {
										console.log(infoRes.target.userInfo);
										uni.setStorage({ //缓存用户登陆状态
											key: 'userInfo',
											data: infoRes.userInfo
										});
										this.hasUserInfo = true;
										this.nickname = infoRes.target.userInfo.nickName;
										this.Avatar = infoRes.target.userInfo.avatarUrl;
										    
									},
			onSelectRoom(room) { //登录
				this.roomToken = {
					roomId: room.roomId,
					roomName: room.name,
					userId: (Math.random() * 1000).toString(),
					nickname: this.nickname,
					avatar: this.Avatar
				};
				let roomTokenAsJsonString = JSON.stringify(this.roomToken)
				uni.navigateTo({
					url: "/pages/vue/chatroom/chatroom?roomToken=" + roomTokenAsJsonString
				})
			}
		}
	}
</script>

<style>
	.userinfo {
	  display: flex;
	  flex-direction: column;
	  align-items: center;
	}
	
	.userinfo-avatar {
	  width: 200rpx;
	  height: 200rpx;
	  margin: 20rpx;
	  margin-top: 50rpx;
	  border-radius: 50%;
	}
	
	.userinfo-nickname {
	  color: #aaa;
	  font-size: 40rpx;
	}
	
	.header {
		padding: 70rpx 0;
		font-size: 28rpx;
		line-height: 48rpx;
		text-align: center;
		display: flex;
		flex-direction: column;
		font-family: Microsoft YaHei UI;
	}

	.title {
		color: #D02129;
		font-weight: bold;
		font-size: 42rpx;
		line-height: 56rpx;
		margin-bottom: 20rpx;
		margin-top: 20rpx;
	}

	.content {
		display: flex;
		justify-content: center;
		flex-direction: column;
		padding: 0 60rpx;
	}
	
	.maincontent {
		display: flex;
		justify-content: center;
		flex-direction: column;
		padding: 0 60rpx;
	}

	.uni-input {
		height: 72rpx;
		border: 2rpx solid rgba(0, 0, 0, 0.1);
		outline: none;
		border-radius: 200rpx;
		padding: 16rpx 30rpx;
		box-sizing: border-box;
		font-size: 24rpx;
		text-align: center;
	}

	.avatar-container {
		padding: 60rpx 0;
	}

	.avatar-notice {
		line-height: 56rpx;
		font-size: 28rpx;
	}

	.avatar-notice-info {
		padding-left: 20rpx;
		color: #D02129;
	}

	.avatar-box {
		height: 300rpx;
		display: flex;
		flex-wrap: wrap;

	}

	.avatar-box-item {
		height: 140rpx;
		width: 140rpx;
		box-sizing: border-box;
		margin: 8rpx;
	}

	.avatar-box-item image {
		height: 124rpx;
		width: 124rpx;
		background-color: #F0AD4E;
		border-radius: 35px;
	}

	.avatar-box .active {
		border: 8rpx solid red;
		box-sizing: border-box;
		border-radius: 129rpx;
	}

	.avatar-box .active image {
		border: 8rpx solid #fff;
		box-sizing: border-box;
	}

	.room-container {
		height: 370rpx;
	}

	.room-title {
		font-size: 30rpx;
		line-height: 38rpx;
	}

	.room-box {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
	}

	.room-box-item {
		width: 288rpx;
		height: 90rpx;
		line-height: 90rpx;
		text-align: center;
		box-sizing: border-box;
		background-color: #D02129;
		border-radius: 100rpx;
		color: #fff;
		margin-top: 32rpx;
		font-size: 26rpx;
	}

	.bottom-box {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
	}

	.room-bottom {
		width: 288rpx;
		height: 90rpx;
		line-height: 90rpx;
		text-align: center;
		box-sizing: border-box;
		align-items: center;
		background-color: #D02129;
		border-radius: 100rpx;
		color: #fff;
		margin-top: 32rpx;
		font-size: 26rpx;
	}

	.input-notice {
		border: 1px solid #D02129;
	}

	::-webkit-input-placeholder {
		color: #D02129;
	}
</style>

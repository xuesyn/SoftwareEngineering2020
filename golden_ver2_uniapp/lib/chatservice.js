/*
 * @Author: jack.lu
 * @Date: 2020-4-21 10:10:20
 * @Last Modified by: jack.lu
 * @Last Modified time: 2020-4-21 15:01:41
 */


import GoEasyIM from './goeasy-im-1.0.9.js'

//用户
function User(id, nickname, avatar, value, score, ifsubmit,ifcheck) {
    this.id = id;
    this.nickname = nickname;
    this.avatar = avatar;
	this.value = value;
	this.score = score;
	this.ifsubmit = ifsubmit;
	this.ifcheck = ifcheck;
}

//消息
function Message(senderUserId, senderNickname, content, type) {
    this.senderNickname = senderNickname;
    this.senderUserId = senderUserId;
    this.content = content;
    this.type = type
}

function Log(nickname) {
    this.name = nickname;
	this.data = [];
}

//聊天室
function Room(id, name, currentUser) {

    this.id = id;
    this.name = name;
    this.currentUser = currentUser;
	this.running = 0;
	this.ifask = 0;
	this.countCheck = 0;
	this.totalTurn = 0;
	this.currentTurn = 0;
	this.res = {
		categories: [],
		series : []
	};

    this.onlineUsers = {
        count: 0,
        users: []
    };

    this.messages = [];

    this.MessageType = {
        CHAT: 0,//文字聊天
        PROP: 1,//道具
		CHECK: 2
    };

    this.Prop = {
        HEART: 0,//桃心
        ROCKET: 1//火箭
    };
}

function ChatRoomService(room, user) {
    this.room = new Room(room.id, room.name, user);
    this.whenNewMessage = function () {

    };
    this.whenOnlineUserChange = function () {

    };

}

//获取实例
ChatRoomService.prototype.connectGoEasyIM = function () {
    this.im = GoEasyIM.getInstance({
        appkey: 'BC-a5c3bad2831e49ed8f9e25c98debb9bb',
        host: 'hangzhou.goeasy.io'
    });

    //监听网络连接成功
    this.im.on(GoEasyIM.EVENT.CONNECTED, () => {
        console.log('GoEasyIM网络连接成功');
        //连接成功后，更新在线用户数和用户头像
        this.initialOnlineUsers(this.room.id);
    });

    //监听网络连接断开
    this.im.on(GoEasyIM.EVENT.DISCONNECTED, () => {
        console.log('GoEasyIM网络断开')
    });

    //监听上下线提醒
    this.listenerGroupPresence();

    //监听新消息
    this.listenerNewMessage();

    var currentUser = this.room.currentUser;
    //连接GoEasyIM
    this.im.connect({
        id: currentUser.id,
        data: {
            avatar: currentUser.avatar,
            nickname: currentUser.nickname
        }
    }).then(() => {
        console.log('连接成功');
        this.initialChatHistory(this.room.id);

        //订阅用户上下线事件
        this.subscribePresence(this.room.id);
        //订阅聊天室消息
        this.subscribeRoomMessage(this.room.id);


    }).catch(e => {
        console.log(e);
        console.log('连接失败');
    });
};

ChatRoomService.prototype.initialWhenNewMessage = function (whenNewMessage) {
    this.whenNewMessage = whenNewMessage;
};

ChatRoomService.prototype.initialWhenOnlineUserChange = function (whenOnlineUserChange) {
    this.whenOnlineUserChange = whenOnlineUserChange;
};


//监听新消息
ChatRoomService.prototype.listenerNewMessage = function () {

    this.im.on(GoEasyIM.EVENT.GROUP_MESSAGE_RECEIVED, (message) => {
		var content = JSON.parse(message.payload.text);
		//console.log(message);
        this.addNewMessage(message);
        this.whenNewMessage(content);
    })
}


ChatRoomService.prototype.addNewMessage = function (message) {
    var content = JSON.parse(message.payload.text);
	var roomMessage = this.room.onlineUsers; 
	var currentUser = this.room.currentUser
	var ifAllSubmit = 1;
	var number = content.content;
	console.log(message);
	console.log(currentUser);
	console.log(roomMessage);　
	console.log(number)　

	var countNum = 0;
	var flag = 0;
	
	if (content.type == this.room.MessageType.PROP && this.room.ifask == 0) {
		flag = 1;
		this.room.ifask = 1;	
		this.room.totalTurn = content.content;
		for (var i=0;i<content.content;i++) {
			this.room.res.categories.push(i+1);
		}
		for (var i=0;i<roomMessage.count;i++){
			let newLog = new Log(roomMessage.users[i].nickname);
			this.room.res.series.push(newLog);
		}
		let newLog = new Log('黄金点');
		this.room.res.series.push(newLog);
		console.log("Categories:");
		console.log(this.room.res.categories);
		console.log("Series:");
		console.log(this.room.res.series);
				
		let messageContent = "";
		messageContent = "发出了游戏开始请求";	
		let newMessage = new Message(message.senderId,  content.senderNickname, messageContent);
		this.room.messages.push(newMessage);	
	}
	
	if (content.type == this.room.MessageType.CHECK) {	
		for (var i=0;i<roomMessage.count;i++){
		    if (roomMessage.users[i].id == message.senderId){
				roomMessage.users[i].ifcheck = 1;
				flag = 1;
				this.room.countCheck = this.room.countCheck + 1;
				let messageContent = "";
				messageContent = "准备就绪" ;
				let newMessage = new Message(message.senderId,  content.senderNickname, messageContent);
				this.room.messages.push(newMessage);
				break;
			}
		}
	}
	
	if ((!this.room.running) && this.room.ifask){
		if (roomMessage.count == this.room.countCheck){
		 	this.room.running = 1;
			let messageContent = "";
			messageContent = "全员就绪,请输入0-100间数字,努力猜到黄金点吧";
			this.room.currentTurn = 0;
			this.room.ifask = 0;
			this.room.countCheck = 0;
			flag = 1;
			let newMessage = new Message(message.senderId, "", messageContent);
			this.room.messages.push(newMessage);
		}else{
			let messageContent = "";
			messageContent = "还有" + (roomMessage.count-this.room.countCheck) + "人未确认";
			flag = 1;
			let newMessage = new Message(message.senderId,"黄金点提醒您", messageContent);
			this.room.messages.push(newMessage);
		}
	}
	
	if (this.room.ifask == 0 && this.room.running == 0){
		let newMessage = new Message(message.senderId, content.senderNickname, content.content);
		this.room.messages.push(newMessage);
	}
	
	if (!isNaN(number) && flag == 0 && this.room.running == 1){
		for (var i=0;i<roomMessage.count;i++){
		    if (roomMessage.users[i].id == message.senderId){
				roomMessage.users[i].ifsubmit = 1;
				roomMessage.users[i].value = number;
				break;
			}
		}
		for (var i=0;i<roomMessage.count;i++){ 
		    if (roomMessage.users[i].ifsubmit == 0){
				countNum = countNum + 1;
				ifAllSubmit = 0;
			}
		}
		if (ifAllSubmit == 1){
			let messageContent = "";
			var total = 0;
			for (var i=0;i<roomMessage.count;i++){
				total = total + parseFloat(roomMessage.users[i].value);
			}
			console.log("total: " + total);
			var average = total / roomMessage.count;
			average = average * 0.618;
			console.log("average" + average);
			console.log("count" + roomMessage.count);
			var close = 101;
			var far = 0;
			var closeId = 0;
			var farId = 0;
			var diff = 0;
			for (var i=0;i<roomMessage.count;i++){
				diff = Math.abs(average - parseFloat(roomMessage.users[i].value));
				console.log("value",roomMessage.users[i].value);
				console.log("diff",diff);
				if (diff > far){
					far = diff;
					farId = i;
				}
				if (diff < close){
					close = diff;
					closeId = i;
				}
			}
			console.log("far",far);
			console.log("close",close);
			console.log("farId",farId);
			console.log("closeId",closeId);
			roomMessage.users[farId].score = roomMessage.users[farId].score - 2;
			roomMessage.users[closeId].score = roomMessage.users[closeId].score + roomMessage.count;
			this.room.currentTurn = this.room.currentTurn + 1;
			for (var i=0;i<roomMessage.count;i++){
				roomMessage.users[i].ifsubmit = 0;
				messageContent = messageContent + roomMessage.users[i].nickname +": "+ roomMessage.users[i].score + " || ";
			}
			//聊天消息
			//console.log(this.room.onlineUsers);
			/*if (content.type == this.room.MessageType.CHAT) {
			    messageContent = "testaddNewMessage";
			}
			//道具消息
			if (content.type == this.room.MessageType.PROP) {
			    if (content.content == this.room.Prop.ROCKET) {
			        messageContent = "送出了一枚大火箭";
			    }
			    if (content.content == this.room.Prop.HEART) {
			        messageContent = "送出了一个大大的比心";
			    }
			}*/
			//添加消息
			
			let newMessage = new Message(message.senderId, "本轮结果", messageContent);
			this.room.messages.push(newMessage);
			let newMessage1 = new Message(message.senderId, "Golden Points", "" + average);
			this.room.messages.push(newMessage1);
			console.log("currentGameTurns:");
			console.log(this.room.currentTurn);
			for (var i=0;i<roomMessage.count;i++){
				let newLog = new Log(roomMessage.users[i].nickname);
				newLog = this.room.res.series[i];
				newLog.data.push(parseFloat(roomMessage.users[i].value));
				this.room.res.series[i] = newLog
				}
			let newLog = new Log("");
			newLog = this.room.res.series[roomMessage.count];
			newLog.data.push(average);
			this.room.res.series[roomMessage.count] = newLog
			console.log("Series:");
			console.log(this.room.res.series);	
			if (this.room.currentTurn == this.room.totalTurn){
				this.room.running = 0;
				this.room.totalTurn = 0;
				this.room.currentTurn = 0;
				let newMessage = new Message(message.senderId, "黄金点提醒您", "本轮游戏结束");
				this.room.messages.push(newMessage);
			}
			//let newMessage = new Message(message.senderId, content.senderNickname, messageContent);
			//this.room.messages.push(newMessage);
		}else{
			let newMessage = new Message(message.senderId, "等待其他玩家输入中", " 还有" + countNum +"名玩家未提交");
			this.room.messages.push(newMessage);
			//let newMessage = new Message(message.senderId, content.senderNickname, "等待其他玩家输入中..  " + "还有" + countNum +"名玩家未提交");
			//this.room.messages.push(newMessage);
		}
	}else if (currentUser.id == message.senderId && flag == 0 && this.room.running == 1){
		let newMessage = new Message(message.senderId, "黄金点提醒您", "请输入0-100内的自然数");
		this.room.messages.push(newMessage);
	}
};

//监听用户上下线
ChatRoomService.prototype.listenerGroupPresence = function () {
    this.im.on(GoEasyIM.EVENT.GROUP_PRESENCE, (event) => {
        //更新在线用户数
        this.room.onlineUsers.count = event.groupOnlineCount;

        if (event.action == 'join' || event.action == 'online') {
            let userData = JSON.parse(event.userData);
            //添加新用户
            let user = new User(event.userId, userData.nickname, userData.avatar, "", 0, 0, 0);

            //添加在线用户，避免用户重复
            if (!this.room.onlineUsers.users.find(item => item.id == event.userId)) {
                this.room.onlineUsers.users.push(user);
            }

            //添加进入房间的消息
            let message = new Message(event.userId, userData.nickname, " 进入房间", this.room.MessageType.CHAT);
            this.room.messages.push(message);
        } else {
            let offlineUserIndex = this.room.onlineUsers.users.findIndex(item => item.id == event.userId);
            if (offlineUserIndex > -1) {
                //将离开的用户从onlineUsers中删掉
                let offlineUser = Object.assign(this.room.onlineUsers.users[offlineUserIndex]);
                this.room.onlineUsers.users.splice(offlineUserIndex, 1);
                //添加离开消息
                let message = new Message(offlineUser.id, offlineUser.nickname, " 离开房间", this.room.MessageType.CHAT)
                this.room.messages.push(message);
            }
        }
        this.whenOnlineUserChange(this.room.onlineUsers);
    })
};

//查询和初始化在线用户列表和在线用户数
ChatRoomService.prototype.initialOnlineUsers = function (roomId) {
    let self = this;

    //查询最新上线的用户列表
    this.im.groupHereNow(roomId)
        .then(result => {
            if (result.code == 200) {
                let users = [];
                result.content && result.content.map(function (onlineUser) {
                    let userData = JSON.parse(onlineUser.userData);
                    let user = new User(onlineUser.userId, userData.nickname, userData.avatar, "", 0, 0, 0);
                    users.push(user);
                });
                self.room.onlineUsers = {
                    users: users
                };
            }
        }).catch(e => {
        if (e.code == 401) {
            console.log("您还没有开通用户在线状态提醒，登录goeasy->我的应用->查看详情->高级功能，自助开通.");
        } else {
            console.log(e);
        }
    });
    //获取聊天室在线用户数
    this.im.groupOnlineCount(roomId)
        .then(result => {
            this.room.onlineUsers.count = result.content.onlineCount;
        }).catch(e => {
        console.log(e)
    })
};

//订阅聊天室成员上下线
ChatRoomService.prototype.subscribePresence = function (roomId) {
    this.im.subscribeGroupPresence([roomId])
        .then(() => {
            console.log('成员上下线订阅成功')
        }).catch(e => {
        console.log(e)
    })
}

//订阅聊天室消息
ChatRoomService.prototype.subscribeRoomMessage = function (roomId) {
    this.im.subscribeGroup([roomId])
        .then(result => {
            console.log('消息订阅成功')
        }).catch(e => {
        console.log(e)
    })
}

//历史消息
ChatRoomService.prototype.initialChatHistory = function (roomId) {
    var self = this;
    this.im.history({
        groupId: roomId
    }).then(res => {
        res.content.forEach(function (message) {
            self.addNewMessage(message);
        })
    }).catch(function (error) {
        if (error.code == 401) {
            console.log("您还没有开通历史消息的权限，登录goeasy->我的应用->查看详情->高级功能，自助开通.");
        } else {
            console.log(error);
        }
    })
};

//发送消息
ChatRoomService.prototype.sendMessages = function (roomId, content) {
	var contentMessage = {
		text: JSON.stringify(content)
	};
	let message = this.im.createTextMessage(contentMessage);
    this.im.sendGroupMessage(roomId, message)
        .then(() => {
            console.log('消息发送成功')
        }).catch(e => {
        console.log(e);
    })
};

//退出聊天室
ChatRoomService.prototype.quitRoom = function (roomId) {
    this.im.disconnect()
};

module.exports = ChatRoomService;
<template>
    <view>
        <view class="example">
            <view>
                <view class="example-title">基础使用方式</view>
                <button type="default" @click="bindClick('1')">打开模态弹窗</button>
                <neil-modal :auto-close="false" :show="show1" @close="closeModal('1')" title="标题" content="这里是正文内容，这里是正文内容，这里是正文内容，这里是正文内容，这里是正文内容，这里是正文内容"
                    @cancel="bindBtn('cancel')" @confirm="bindBtn('confirm')">
                </neil-modal>
            </view>
            <view>
                <view class="example-title">单个按钮</view>
                <button type="default" @click="bindClick('2')">打开模态弹窗</button>
                <neil-modal :show="show2" @close="closeModal('2')" :show-cancel="false" title="标题" content="这里是正文内容，这里是正文内容，这里是正文内容，这里是正文内容，这里是正文内容，这里是正文内容">
                </neil-modal>
            </view>
            <view>
                <view class="example-title">无标题</view>
                <button type="default" @click="bindClick('3')">打开模态弹窗</button>
                <neil-modal :show="show3" @close="closeModal('3')" content="这里是正文内容，这里是正文内容，这里是正文内容，这里是正文内容，这里是正文内容，这里是正文内容">
                </neil-modal>
            </view>
            <view>
                <view class="example-title">向 content 里插入输入框</view>
                <button type="default" @click="bindClick('4')">打开模态弹窗</button>
                <neil-modal :show="show4" @close="closeModal('4')" title="请输入用户名密码">
                    <view class="input-view">
                        <view class="input-name">
                            <view>用户名</view>
                            <input type="text" placeholder="请输入用户名" />
                        </view>
                        <view class="input-password">
                            <view>密码</view>
                            <input type="text" password placeholder="请输入密码" />
                        </view>
                    </view>
                </neil-modal>
            </view>
            <view>
                <view class="example-title">修改内容对齐方式</view>
                <button type="default" @click="bindClick('5')">打开模态弹窗</button>
                <neil-modal :show="show5" @close="closeModal('5')" align="center" content="这里是正文内容，这里是正文内容，这里是正文内容">
                </neil-modal>
            </view>
            <view>
                <view class="example-title">修改按钮颜色</view>
                <button type="default" @click="bindClick('6')">打开模态弹窗</button>
                <neil-modal :show="show6" @close="closeModal('6')" confirm-color="#CC0000" cancel-color="#99FFFF"
                    content="这里是正文内容，这里是正文内容">
                </neil-modal>
            </view>
            <view>
                <view class="example-title">更新提示</view>
                <button type="default" @click="bindClick('7')">打开模态弹窗</button>
                <neil-modal :show="show7" @close="closeModal('7')" title="更新提示" confirm-text="立即更新" cancel-text="暂不更新">
                    <view style="min-height: 90upx;padding: 32upx 24upx;">
                        <view>1. 修复标题颜色不对的问题</view>
                        <view>2. 增加支付宝支付功能</view>
                        <view>3. 增加更多示例</view>
                    </view>
                </neil-modal>
            </view>
        </view>
    </view>
</template>

<script>
    import neilModal from '@/components/neil-modal/neil-modal.vue';
    export default {
        components: {
            neilModal
        },
        data() {
            return {
                show1: false,
                show2: false,
                show3: false,
                show4: false,
                show5: false,
                show6: false,
                show7: false
            }
        },
        methods: {
            bindClick(type) {
                console.log(this[`show${type}`])
                this[`show${type}`] = true
                console.log(this[`show${type}`])
            },
            closeModal(type) {
                console.log(`监听到close`)
                this[`show${type}`] = false
            },
            bindBtn(type) {
                uni.showToast({
                    title: `点击了${type==='cancel'?'取消':'确定'}按钮`,
                    icon: 'none'
                })
            }
        }
    }
</script>

<style>
    .input-name,
    .input-password {
        height: 80upx;
        width: 100%;
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        position: relative;
        padding-left: 30upx;
        box-sizing: border-box;
    }

    .input-name::after {
        content: " ";
        position: absolute;
        left: 30upx;
        bottom: 0;
        right: 0;
        height: 1px;
        border-top: 1px solid #e5e5e5;
        transform-origin: 0 0;
        transform: scaleY(.5);
    }

    .input-name view,
    .input-password view {
        width: 120upx;
        height: 50upx;
        line-height: 50upx;
        font-size: 28upx;
        color: #333333;
    }

    .input-name input,
    .input-password input {
        flex: 1;
        height: 50upx;
        line-height: 50upx;
    }
</style>

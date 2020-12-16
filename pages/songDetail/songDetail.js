import request from '../../utils/request'

// 获取全局实例
const appInstance = getApp();

Page({
    data: {
        isPlay: false, // 音乐是否播放
        song: {}, // 歌曲详情对象
        musicId: '', // 音乐id
        musicLink: '', // 音乐的链接
        currentTime: '00:00',  // 实时时间
        durationTime: '00:00', // 总时长
        currentWidth: 0, // 实时进度条的宽度,
        musicIndex: 0
    },

    onLoad: function (options) {
        let musicId = options.musicId;
        let musicIndex = options.musicIndex>>>0;
        this.setData({
            musicId,
            musicIndex
        });

        // 获取音乐详情
        this.getMusicInfoAndPlay(musicId);

        // 判断当前页面音乐是否在播放
        if (appInstance.globalData.isMusicPlay && appInstance.globalData.musicId === musicId) {
            // 修改当前页面音乐播放状态为true
            this.changePlayState(true);
        }

        // 创建控制音乐播放的实例
        this.backgroundAudioManager = wx.getBackgroundAudioManager();

        // 监视音乐播放/暂停/停止
        this.backgroundAudioManager.onPlay(() => {
            this.changePlayState(true);
            appInstance.globalData.musicId = musicId;
        });
        this.backgroundAudioManager.onPause(() => {
            this.changePlayState(false);
        });
        this.backgroundAudioManager.onStop(() => {
            this.changePlayState(false);
        });
        // 监听音乐播放自然结束
        this.backgroundAudioManager.onEnded(() => {
            this.doSwitch('next');
        });

        // 监听音乐实时播放的进度
        this.backgroundAudioManager.onTimeUpdate(() => {
            // 格式化实时的播放时间
            let currentWidth = this.backgroundAudioManager.currentTime / this.backgroundAudioManager.duration * 450;
            this.setData({
                currentWidth
            })
        })
    },

    handleSwitch(event) {
        this.backgroundAudioManager.stop();
        let type = event.currentTarget.id;
        this.doSwitch(type);
    },

    doSwitch(type){
        // 自动切换至下一首音乐，并且自动播放
        // 将实时进度条的长度还原成 0；时间还原成 0；
        this.setData({
            currentWidth: 0,
            currentTime: '00:00'
        });

        let recommendList = wx.getStorageSync('songList');
        let musicIndex = this.data.musicIndex;
        if (type === 'pre') {
            (musicIndex === 0) && (musicIndex = recommendList.length);
            musicIndex -= 1;
        } else {
            (musicIndex === recommendList.length - 1) && (musicIndex = -1);
            musicIndex += 1;
        }

        let nextMusicId = recommendList[musicIndex].id;
        this.setData({
            musicIndex
        });
        this.getMusicInfoAndPlay(nextMusicId);
    },

    // 修改播放状态的功能函数
    changePlayState(isPlay) {
        // 修改音乐是否的状态
        this.setData({
            isPlay
        });
        // 修改全局音乐播放的状态
        appInstance.globalData.isMusicPlay = isPlay;
    },

    // 获取音乐详情的功能函数
    async getMusicInfoAndPlay(musicId) {
        let songData = await request('/song/detail', {ids: musicId});
        // songData.songs[0].dt 单位ms
        this.setData({
            song: songData.songs[0],
        })

        // 动态修改窗口标题
        wx.setNavigationBarTitle({
            title: this.data.song.name
        })

        // 获取音乐播放链接
        let musicLinkData = await request('/song/url', {id: musicId});
        let musicLink = musicLinkData.data[0].url;
        this.setData({
            musicLink
        });
        this.backgroundAudioManager.src = musicLink;
        this.backgroundAudioManager.title = this.data.song.name;
    },

    // 点击播放/暂停的回调
    handleMusicPlay() {
        let isPlay = !this.data.isPlay;

        let {musicId, musicLink} = this.data;
        this.musicControl(isPlay, musicId, musicLink);
    },

    // 控制音乐播放/暂停的功能函数
    async musicControl(isPlay, musicId, musicLink) {

        if (isPlay) { // 音乐播放
            if (musicLink) {
                this.backgroundAudioManager.play();
            }
        } else { // 暂停音乐
            this.backgroundAudioManager.pause();
        }

    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    }
})

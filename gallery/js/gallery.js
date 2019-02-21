/*
  Author 薛定谔的橘猫
  基于jquery的轮播布局插件
  兼容 >= ie9

*/

//立即执行函数 把jquery和window作为参数传进来  分隔出作用域
(function ($, window) {
    var gallery = {
        //主要入口函数
        init: function (options, el) {
            //为了统一和方便阅读  每个函数都会将this赋值为_this  防止一些函数执行上下文改变了this指向
            var _this = this;
            _this.options = $.extend({}, $.fn.gallery.options, options); //将默认参数和传入的参数合并 
            _this.$el = el; // 最外层容器
            _this.initDom();
        },
        //初始化DOM结构
        initDom: function () {
            var _this = this;
            if (_this.$el.children().length === 0) { return false }  //如果传入的对象的items为0  return false
            _this.$UserItem = _this.$el.find('.item').wrapAll('<div class=\'gallery-wrapper-outer\'></div>');   //创建gallery-wrapper-out包裹gallery-item
            _this.$el.find('.item').wrapAll('<div class=\'gallery-wrapper\'></div>').wrap('<div class=\'gallery-item\'></div>'); //创建gallery-item包裹item
            _this.$wrapperOut = _this.$el.find('.gallery-wrapper-outer');
            //所有gallery-item的jquery对象
            _this.$galleryItem = _this.$el.find('.gallery-item');
            //初始化的item数量
            _this.$itemNum = _this.$galleryItem.length;
            //将初始的item数量保存出来 避免在屏幕从小放大的时候无法更新回初始的items数量
            _this.initItem = _this.options.items;
            //当前的index
            _this.$curIndex = _this.options.initIndex;
            //wrapper的tranlate的值
            _this.translateX = 0;
            //当前是否在切换中
            _this.isTranstion = false;
            //遍历为每个item依次添加下标
            for (var i = 0; i < _this.$galleryItem.length; i++) {
                _this.$galleryItem.eq(i).attr('data-item-index', i);
            }
            //wrap元素
            _this.$wrap = _this.$el.find('.gallery-wrapper');
            //最大的值 
            _this.$maxIndex = _this.$galleryItem.length - 1;
            //最外层元素的宽度
            _this.$elWidth = _this.$el.width();
            _this.checkBrowser();
            _this.setCss();                       // 初始化css样式
            if (_this.options.needPlay) {
                _this.buildNav();
                _this.buildPaignation();              
                _this.bindClick();                   
                _this.goTo(_this.$curIndex);
                _this.autoPlayFn();    
                if(_this.options.drag){
                    _this.drag();                         
                }       
                if(_this.options.touch){
                    _this.touch();
                }
            }
        },
        //循环函数
        loop: function () {
            var _this = this;
            if (_this.options.loop && _this.options.needPlay) {
                if (_this.options.items === 1) {
                    _this.$wrap.prepend(_this.getCurEl(_this.$maxIndex).clone(false).addClass('gallery-item-duplicate'));
                    _this.$wrap.append(_this.getCurEl(0).clone(true).addClass('gallery-item-duplicate'));
                }
                else {
                    for (var i = 0; i < _this.options.items - 1; i++) {
                        _this.$wrap.prepend(_this.getCurEl(_this.$maxIndex - i).clone(true).addClass('gallery-item-duplicate'));
                        _this.$wrap.append(_this.getCurEl(i + 0).clone(true).addClass('gallery-item-duplicate'));
                    }
                }
                //更新gallery-item
                _this.$galleryItem = _this.$el.find('.gallery-item');
            }
        },
        //获取data-item-index值为target并且不是复制的元素
        getCurEl: function (target) {
            var _this = this;
            return _this.$el.find(".gallery-item[data-item-index=" + target + "]:not(.gallery-item-duplicate)");
        },
        //初始化样式
        setCss: function () {
            var _this = this;
            //设置切换速度
            _this.$wrap.css(_this.changeTransition(_this.options.speed));
            if (_this.options.items == 1 && _this.options.effect == 'fade') {
                //创建一个虚拟元素  为整个div撑起高度 
                _this.$virtual = _this.$wrap.prepend(_this.getCurEl(0).clone(true).addClass('gallery-item-virtual gallery-item-duplicate')).find('.gallery-item-virtual');
                _this.$virtual.css({
                    'visibility': 'hidden',
                    'display': 'block',
                    'z-index': '-1',
                })
                if(_this.options.responsive){
                    _this.responsiveWidthFn();
                }
                else{
                    _this.upDateItem();
                }
                _this.$galleryItem = _this.$el.find('.gallery-item:not(.gallery-item-duplicate)');
                _this.$galleryItem.css({
                    'position': 'absolute',
                    'top': '0px',
                    'left': '0px',
                    'right': '0px',
                    'bottom': '0px',
                    'opacity': '0',
                })
                _this.getCurEl(0).css({ 'opacity': '1' })
            }
            else {
                _this.loop();
                _this.$el.find('.gallery-item').addClass('gallery-item-slide');
                if(_this.options.responsive){
                    _this.responsiveWidthFn();
                }
                else{
                    _this.upDateItem();
                }
                _this.maxWidth = _this.$wrapWidth - _this.$elWidth;
            }
            //监听窗口变化  当窗口变化  调用responsiveWidthFn函数； 
            if(_this.options.responsive){
                $(window).resize(function () {
                    _this.responsiveWidthFn();
                });
            }
        },
        //判断浏览器是否支持css3 translate3D的属性
        checkBrowser:function(){
            var _this = this,
            translate3D = "translate3d(0px, 0px, 0px)",
            tempElem = document.createElement("div"),
            regex,
            asSupport,
            support3d,
            isTouch;
    
            tempElem.style.cssText = "  -moz-transform:" + translate3D +
                                "; -ms-transform:"     + translate3D +
                                "; -o-transform:"      + translate3D +
                                "; -webkit-transform:" + translate3D +
                                "; transform:"         + translate3D;
            regex = /translate3d\(0px, 0px, 0px\)/g;
            asSupport = tempElem.style.cssText.match(regex);
            support3d = (asSupport !== null && asSupport.length === 1);
        
            isTouch = "ontouchstart" in window || window.navigator.msMaxTouchPoints;
        
            _this.browser = {
                "support3d" :support3d,
                "isTouch" : isTouch
            };
        },
        //更新item的宽度
        upDateItem: function () {
            var _this = this;
            var width = _this.$el.width();
            _this.$galleryItem = _this.$el.find('.gallery-item');
            //item的宽度
            if (_this.options.items === 1 && _this.options.effect === 'fade') {
                _this.$wrapWidth = width;
            }
            else {
                _this.itemWidth = Math.floor((width - _this.options.spaceBetween * (_this.options.items - 1)) / _this.options.items);
                _this.$galleryItem.css({ 'width': _this.itemWidth, })
                //wrap的宽度
                if (_this.options.wrap) {
                    _this.$wrapWidth = _this.$el.width();
                    _this.$galleryItem.css({ 'marginBottom': _this.options.bottom, 'marginRight': _this.options.spaceBetween });
                    var i = _this.options.items;
                    while (i <= _this.$galleryItem.length) {
                        $(_this.$galleryItem[i - 1]).css({ 'marginRight': '0px' });
                        i += _this.options.items;
                    }
                }
                else {
                    _this.$galleryItem.css({ 'marginRight': _this.options.spaceBetween + 'px' });
                    _this.$galleryItem.last().css({ 'marginRight': '0px', })
                    _this.$wrapWidth = (_this.itemWidth * _this.$galleryItem.length) + (_this.options.spaceBetween * (_this.$galleryItem.length - 1));
                }
            }
            _this.$wrap.css({ 'width': _this.$wrapWidth + 'px' })
        },
        //响应式函数  动态更新宽度
        responsiveWidthFn: function () {
            var _this = this;
            if (_this.options.responsive) {
                var lastWidth, curWidth;//上一次宽度  当前宽度
                //做一个判断  只有当最外层元素的宽度改变的时候  才触发下面函数  避免每次窗口变化都触发下面函数
                lastWidth = curWidth;
                curWidth = _this.$el.width();
                if (curWidth != lastWidth) {
                    var obj = _this.options.responsiveWidth;
                    var wid = $(window).width();
                    _this.options.items = _this.initItem;
                    //如果不为空 遍历对象  
                    if (!($.isEmptyObject(obj))) {
                        //先排序 再遍历对象 解决某些浏览器对遍历对象不按照顺序的问题
                        var sortKeys = Object.keys(obj).sort(function (a, b) {
                            return b - a;
                        });
                        for (var i = 0; i < sortKeys.length; i++) {
                            if (wid <= sortKeys[i]) {
                                //更新全局的items  spaceBetween bottom 的值
                                //需要做出判断  因为有可能传过来的值是空的
                                obj[sortKeys[i]].items ?  _this.options.items = obj[sortKeys[i]].items : '';
                                obj[sortKeys[i]].spaceBetween ? _this.options.spaceBetween = obj[sortKeys[i]].spaceBetween : '';
                                obj[sortKeys[i]].bottom ? _this.options.bottom = obj[sortKeys[i]].bottom : '';
                            }
                        }
                    }
                    //更新对应宽度
                    _this.upDateItem();
                }
            }
        },
        //下一个
        next: function () {
            var _this = this;
            if(_this.isTranstion){
                return false;
            }
            //判断是滑动效果 还是fade效果
            if (_this.options.effect === 'fade' && _this.options.items === 1) {
                //fade切换实现逻辑
                var last = _this.$curIndex;
                if (_this.$curIndex >= _this.$maxIndex) {
                    _this.$curIndex = 0
                }
                else {
                    _this.$curIndex += 1;
                }
                _this.fadeMove(last,_this.$curIndex);
            }
            else {
                //滑动切换实现逻辑
                //如果是最后一个 
                if ((_this.$elWidth + _this.translateX) >= _this.$wrapWidth) {
                    //如果是loop 
                    if (_this.options.loop) {
                        if (_this.options.items == 1) {
                            _this.translateX = _this.options.spaceBetween + _this.itemWidth;
                        }
                        else {
                            _this.translateX = (_this.itemWidth + _this.options.spaceBetween) * (_this.options.items - 2);
                        }
                        _this.$wrap.css(_this.changeTransition(0));
                        _this.browser.support3d ? _this.$wrap.css(_this.doTranslate(-_this.translateX)) : _this.$wrap.stop(true,true).animate({'left':-_this.translateX},0);
                        // BUG!!   ≧ ﹏ ≦   如果删除下面这行代码循环轮播的最后一个跳转到第一个就会有问题  
                        _this.getCurTranslate();
                        _this.$wrap.css(_this.changeTransition(_this.options.speed));
                    }
                    //不是loop
                    else {
                        if(_this.options.autoPlay){
                            _this.translateX = -(_this.itemWidth + _this.options.spaceBetween);
                            _this.$curIndex = -1;
                        }
                        else{
                            return false;
                        }
                    }
                }
                var value = _this.itemWidth + _this.options.spaceBetween;
                _this.translateX += value;
                if (_this.$curIndex >= _this.$maxIndex) {
                    _this.$curIndex = 0;
                }
                else {
                    _this.$curIndex += 1;
                }
                _this.move(-_this.translateX);
            }
            _this.addActive();
        },
        //跳转到第几个
        goTo: function (target) {
            var _this = this;
            if(_this.isTranstion){
                return false;
            }
            if (_this.options.effect === 'fade' && _this.options.items === 1) {
                var last = _this.$curIndex;
                _this.$curIndex = target;
                _this.fadeMove(last,_this.$curIndex);
            }
            else {
                var index = _this.getCurEl(target).index();
                _this.translateX = (_this.itemWidth * index + (index * _this.options.spaceBetween));
                if ((_this.translateX + _this.$elWidth) > _this.$wrapWidth) {
                    _this.translateX = _this.$wrapWidth - _this.$elWidth;
                }
                _this.$curIndex = target;
                _this.move(-_this.translateX);
            }
            _this.addActive();
        },
        //fade切换实现函数
        fadeMove: function (cur, target) {
            var _this = this;
            _this.getCurEl(cur).css({ 'opacity': '0', 'z-index': '1' });
            _this.getCurEl(target).css({ 'opacity': '1', 'z-index': '2' });
            _this.upDatePagination();
        },
        //上一个
        prev: function () {
            var _this = this;
            if(_this.isTranstion){
                return false;
            }
            if (_this.options.effect === 'fade' && _this.options.items === 1) {
                var last = _this.$curIndex;
                if (_this.$curIndex <= 0) {
                    _this.$curIndex = _this.$maxIndex;
                }
                else {
                    _this.$curIndex -= 1;
                }
                _this.fadeMove(last, _this.$curIndex);
            }
            else {
                var value = _this.itemWidth + _this.options.spaceBetween;
                var curValue = _this.translateX;
                if (curValue <= 5) {
                    if (_this.options.loop) {
                        var nums = _this.$el.find('.gallery-item:not(.gallery-item-duplicate)').length;
                        _this.translateX = nums * (_this.options.spaceBetween + _this.itemWidth);
                        _this.$wrap.css(_this.changeTransition(0));
                        _this.browser.support3d ? _this.$wrap.css(_this.doTranslate(-_this.translateX)) : _this.$wrap.stop(true,true).animate({'left':-_this.translateX},0);
                        // BUG!!   ≧ ﹏ ≦   如果删除下面这行代码循环轮播的最后一个跳转到第一个就会有问题  我不知道为什么!!!
                        _this.getCurTranslate();
                        _this.$curIndex = _this.$maxIndex;
                        _this.$wrap.css(_this.changeTransition(_this.options.speed));
                    }
                    else {
                        // _this.translateX = (_this.$galleryItem.length - _this.options.items + 1) * value;
                        // _this.$curIndex = _this.$maxIndex + 1;
                        return false;
                    }
                }
                _this.translateX = _this.translateX - value;
                if (_this.$curIndex <= 0) {
                    _this.$curIndex = _this.$maxIndex;
                }
                else {
                    _this.$curIndex -= 1;
                }
                _this.move(-_this.translateX);
            }
            _this.addActive();
        },
        //获取当前translateX的值
        getCurTranslate: function () {
            var _this = this;
            //通过css方法获取translate的值 然后通过正则表达式过滤掉字母   然后通过split方法分割成一个数组  数组的第四个就是translateX的值
            var cur = _this.$wrap.css('transform').replace(/[^0-9\,]/g, '').split(',')[4];
            return cur*1;
        },
        //切换函数  所有切换最终都是通过这个函数来实现的
        move: function (value) {
            var _this = this;
            _this.isTranstion = true;
           
            //如果支持css3
            if(_this.browser.support3d === true){
                _this.$wrap.css(_this.doTranslate(value));
            }
            //否则使用css2实现
            else{
                _this.moveCss2(value);
            }
            _this.upDatePagination();
            if(_this.options.autoPlay){
                _this.stop();
                _this.play();
            }
            _this.isTranstion = false;
           
        
            //回调函数
            if (typeof _this.options.afterMove === 'function') {
                //用apply 将当前对象作为afterMove函数的调用对象；这样可以在外部调用所有当前对象的方法
                _this.options.afterMove.apply(this);
            }
        },
        //使用css2切换 用于不兼容css3的浏览器
        moveCss2:function(value){
            var _this = this;
            _this.$wrap.stop(true,true).animate({
                "left":value,
            })
        },
        //自动轮播函数
        autoPlayFn: function () {
            var _this = this;
            if (_this.options.autoPlay) {
                _this.moveTimer = setInterval(function () {
                    _this.next();
                }, _this.options.autoPlayTime);

                //是否鼠标悬停暂停轮播
                if (_this.options.stopOnHover) {
                    _this.$el.hover(function () {
                        clearInterval(_this.moveTimer);
                    },
                    function () {
                        _this.moveTimer = setInterval(function () {
                            _this.next();
                        }, _this.options.autoPlayTime);
                    })
                }
            }
        },
        play:function(){
            var _this = this;
            _this.moveTimer = setInterval(function(){
                _this.next();
            },_this.options.autoPlayTime);
        },
        stop:function(){
            var _this = this;
            clearInterval(_this.moveTimer);
        },
        //为当前元素添加active
        addActive: function () {
            var _this = this;
            var el = _this.getCurEl(_this.$curIndex);
            _this.$el.find('.gallery-item').removeClass('gallery-item-active gallery-item-prev gallery-item-next');
            el.addClass('gallery-item-active');
            el.next().addClass('gallery-item-next');
            el.prev().addClass('gallery-item-prev');
            if(_this.options.loop){
                _this.$el.find(".gallery-item[data-item-index=" + _this.$curIndex + "]").addClass('gallery-item-active');
            }
            _this.onChange();
        },
        //动画效果
        doTranslate: function (pixels) {
            return {
                "-webkit-transform": "translate3d(" + pixels + "px, 0px, 0px)",
                "-moz-transform": "translate3d(" + pixels + "px, 0px, 0px)",
                "-o-transform": "translate3d(" + pixels + "px, 0px, 0px)",
                "-ms-transform": "translate3d(" + pixels + "px, 0px, 0px)",
                "transform": "translate3d(" + pixels + "px, 0px,0px)"
            }
        },
        //改变transition-duration时间
        changeTransition: function (time) {
            return {
                "transition-duration": time + "s",
                "-moz-transition-duration": time + "s",
                "-webkit-transition-duration": time + "s",
                "-o-transition-duration": time + "s",
            }
        },
        //添加左右切换按钮
        buildNav: function () {
            var _this = this;
            if (_this.options.navigation == false || _this.$galleryItem.length <= 1) {
                return false;
            }
            _this.prevEl = $('<div class=\'gallery-prev\'></div>').appendTo(_this.$wrapperOut);
            _this.nextEl = $('<div class=\'gallery-next\'></div>').appendTo(_this.$wrapperOut);
            _this.nextEl.on('click touchend', function (e) {
                e.preventDefault();
                _this.next();
            })
            _this.prevEl.on('click touchend', function (e) {
                e.preventDefault();
                _this.prev();
            })
        },
        //添加分页器函数
        buildPaignation: function () {
            var _this = this;
            if (_this.options.pagination === false || _this.$galleryItem.length<=1) {
                return false;
            }
            _this.pagination = [];
            _this.paginationBox = $('<div class=\'gallery-pagination-box\'></div>').appendTo(_this.$el);
            // var num = Math.ceil(_this.$itemNum / _this.options.items);
            var num = _this.$itemNum - _this.options.items + 1;
            _this.paginationNum = num;
            for (var i = 0; i < num; i++) {
                _this.pagination[i] = $('<div class=\'gallery-page\'></div>').appendTo(_this.paginationBox);
                //绑定点击事件 
                _this.pagination[i].on('click touchend', (function (j) {
                    // ie9不兼容let语法  所以使用闭包的方式
                        return function () {
                            _this.goTo(j);
                        }
                    })(i)
                )
            }
        },
        //更新分页器
        upDatePagination: function () {
            var _this = this;
            if (_this.$curIndex < _this.paginationNum) {
                _this.pagination[_this.$curIndex].addClass('active').siblings().removeClass('active');
            }
        },
        //切换之后调用的函数 
        onChange: function () {
            var _this = this;
            if (_this.options.bindControl.length > 0) {
                _this.bindControlFn(_this.options.bindControl)
                for (var i = 0; i < _this.options.bindControl.length; i++) {
                    if (_this.$curIndex != _this.options.bindControl[i].$curIndex) {
                        _this.options.bindControl[i].goTo(_this.$curIndex);
                    }
                }
            }
        },
        //绑定控制  通过其他元素控制切换
        bindControlFn: function (args) {
            var _this = this;
            for (var i = 0; i < args.length; i++) {
                args[i].onChange = function () {
                    _this.$curIndex = this.$curIndex;
                    _this.goTo(_this.$curIndex);
                }
            }
        },
        //绑定点击
        bindClick: function () {
            var _this = this;
            if (_this.options.clickBind) {
                _this.$galleryItem.click(function () {
                    _this.$curIndex = $(this).attr('data-item-index') * 1;
                    _this.addActive();
                })
            }
        },
        //实现拖拽切换
        drag: function () {
            var _this = this;
            var x = 0;
            var y = 0;
            var cur = 0;
            var isDown = false;
            if (_this.options.drag === false) {
                return false;
            }
            //当鼠标按下  
            _this.$el.on('mousedown', function (event) {
                var e = event || window.event;
                e.preventDefault()
                x = e.clientX;
                y = e.clientY;
                cur = _this.translateX;
                isDown = true;
                _this.$wrap.css(_this.changeTransition(0));
            })
            //当鼠标移动
            $(window).on('mousemove', function (event) {
                var e = event || window.event;
                if (isDown === true) {
                  
                    _this.isTranstion = true;
                    var newx = e.clientX;
                    var value = 0;
                    var num = 0;
                    if (newx > x) {
                        value = newx - x;
                        num = cur - value;
                        _this.$wrap.css(_this.doTranslate(-num));
                    }
                    else {
                        value = x - newx;
                        num = cur + value;
                        _this.$wrap.css(_this.doTranslate(-num));
                    }
                }
            })
            //当松开鼠标
            $(window).on('mouseup', function (event) {
                var e = event || window.event;
                if (isDown === true) {
                    _this.$wrap.css(_this.changeTransition(_this.options.speed));
                    isDown = false;
                    _this.isTranstion = false;
                    var val = _this.getCurTranslate();
                    if (val > cur) {
                        if(((_this.$elWidth + val) >= _this.$wrapWidth) && ! _this.options.loop){
                            _this.$wrap.css(_this.doTranslate(-_this.translateX));
                        }
                        else{
                            _this.next();
                        }
                    }
                    if (val < cur) {
                        if(_this.translateX<=5 && !_this.options.loop){
                            _this.$wrap.css(_this.doTranslate(-_this.translateX));
                        }
                        else{
                            _this.prev();
                        }
                    }
                }
            })
        },
        //移动端触摸滑动函数
        touch: function () {
            var _this = this;
            var x = 0;
            var y = 0;
            var cur = 0;
            var isDown = false;
            if (_this.options.drag === false) {
                return false;
            }
            _this.$el.on('touchstart', function (event) {
                var e = event || window.event;
                e.preventDefault()
                x = e.originalEvent.touches[0].clientX;
                y = e.originalEvent.touches[0].clientY;
                cur = _this.translateX;
                isDown = true;
                _this.$wrap.css(_this.changeTransition(0));
            })
            $(window).on('touchmove', function (event) {
                var e = event || window.event;
                if (isDown === true) {
                    _this.isTranstion = true;
                    var newx = e.originalEvent.touches[0].clientX;
                    var value = 0;
                    var num = 0;
                    if (newx > x) {
                        value = newx - x;
                        num = cur - value;
                        _this.$wrap.css(_this.doTranslate(-num));
                    }
                    else {
                        value = x - newx;
                        num = cur + value;
                        _this.$wrap.css(_this.doTranslate(-num));
                    }
                }
            })
            $(window).on('touchend', function (event) {
                var e = event || window.event;
                if (isDown === true) {
                    _this.$wrap.css(_this.changeTransition(_this.options.speed));
                    isDown = false;
                    _this.isTranstion = false;
                    var val = _this.getCurTranslate();
                    if (val > cur) {
                        if(((_this.$elWidth + val) >= _this.$wrapWidth) && ! _this.options.loop){
                            _this.$wrap.css(_this.doTranslate(-_this.translateX));
                        }
                        else{
                            _this.next();
                        }
                    }
                    if (val < cur) {
                        if(_this.translateX<=5 && !_this.options.loop){
                            _this.$wrap.css(_this.doTranslate(-_this.translateX));
                        }
                        else{
                            _this.prev();
                        }
                    }
                }
            })
        }
    }

    //把调用方法挂载到jquery上
    $.fn.gallery = function (options) {
        // return this.each(function(){
            var gall = Object.create(gallery);
            gall.init(options, $(this));
            return gall;
        // })
    }

    //内容导航切换公用函数
    //相当于superslide的点击切换 三个参数  第一个是导航元素  第二个是切换的元素内容  第三个是出触发条件 一般为 mouseover  click
    // 调用方法示例 $.tabChange('div .tab li','div .cont .item','click');
    $.tabChange=function(el,cont,triger){
        $(el).eq(0).addClass('on');
        $(cont).hide().eq(0).show();
        $(el).on(triger,function(){
            if(!($(this).hasClass('on'))){
                $(this).addClass('on').siblings().removeClass('on');
                var index = $(this).index();
                $(cont).hide().eq(index).fadeIn();
            }
        })
    }

    // 二级菜单切换函数
    $.menuChange=function(el,item,triger,parent){
        $(el).on(triger,function(){
            var _this = $(this);
            if(!parent){
                parent = 0;
            }
            for(var i =0;i<parent;i++){
                _this = _this.parent();
            }
            if(!(_this.hasClass('on'))){
                _this.addClass('on').siblings().removeClass('on');
                _this.find(item).slideDown();
                _this.siblings().find(item).slideUp();
            }
            else{
                _this.find(item).slideUp();
                _this.removeClass('on');
            }
        })
    }

    // bug  
    // 1 鼠标拖拽切换循环轮播时最后一张到第一张过渡有点不协调
    // 2 绑定控制时开启循环会错乱
    // 3 手机端滑动如果内容太长会导致覆盖默认的滑动  导致无法上下滑动
    // 4 拖拽和手机端滑动当内容是第一个 不管往左还是往右  都会默认执行滑动到下一个


    //默认参数
    $.fn.gallery.options = {
        //是否需要分页按钮
        pagination:false,

        //是否需要左右切换箭头按钮
        navigation:false,

        //是否需要轮播
        needPlay: true,

        //是否换行
        wrap: false,

        //切换效果 如果items>1 则其他效果不生效 只能是滑动效果
        effect: 'slide',

        //每个item之间的间距
        spaceBetween: 0,

        //是否循环轮播
        loop: false,

        //每行展示的数量
        items: 1,

        //是否监听窗口变化动态改变item的宽度
        responsive: true,

        //可以设置指定窗口宽度的items的数量、间距
        responsiveWidth: {},

        //回调函数 每次切换会触发 并且此函数的执行上下文中的this指向当前轮播对象，也就是可以调用此对象中的所有方法
        afterMove: null,

        //绑定控制 可以监听其他的轮播变化然后让此对对象也跟随变化 接受一个数组，要求数组里面传入的都是gallery.js所构造的对象
        bindControl: [],

        //是否可以点击切换当前的元素  一般用于缩略图
        clickBind: false,

        //是否开启鼠标拖拽切换轮播
        drag: true,

        //是否开启移动端触摸滑动 因为有个小bug  默认不开启
        touch:false,

        //是否自动轮播
        autoPlay: false,

        //自动轮播时间
        autoPlayTime: 5000,

        //切换速度
        speed: 0.5,

        //鼠标悬停是否暂停轮播
        stopOnHover: false,

        //行间距 
        bottom: 30,

        //初始化时的index
        initIndex:0,
    }
})(jQuery, window)

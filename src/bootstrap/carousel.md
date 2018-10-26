## 说明
实现来源于：
1. https://github.com/twbs/bootstrap/blob/v3.3.7/js/carousel.js
2. https://github.com/twbs/bootstrap/blob/v3.3.7/less/carousel.less

基本是源码拷贝过来，改动点：
样式相关改动：
1. 将less转换为css；
2. 移除样式中关于左右翻页， icon相关样式；
3. 移除样式中的 > ，个人看着别扭而已；

js逻辑实现相关改动：
1. 移除对jquery的依赖，dom操作全部由原生js完成；
2. 简化实现，目前一个html页面只允许存在一个轮播图；
3. 自定义事件使用CustomEvent完成
4. 移除一些适配相关代码，出于精简代码考虑


## 原理介绍
使用js给dom元素动态添加/删除类方式实现控制元素变化；

关键实现：
```js
// type 为 next或者 prev
var $active = this.$element.querySelector(".item.active");
var $next = next || this.getItemForDirection(type, $active);
var direction = type == "next" ? "left" : "right";

utils.addClass($next, type);
$next.offsetWidth // force reflow
utils.addClass($active, direction);
utils.addClass($next, direction);
const that = this;
function transitionHandler () {
  utils.removeClass($next, type);
  utils.removeClass($next, direction);
  utils.addClass($next, 'active');
  utils.removeClass($active, 'active');
  utils.removeClass($active, direction);
  that.sliding = false;
  setTimeout(function () {
    $active.removeEventListener('transitionend', transitionHandler);
  }, 0)
}
$active.addEventListener('transitionend', transitionHandler);
```

举例说明:
假设第一张图片为 p1， 第二张图片为 p2，

以p1 -> p2为例：

1. $active 为 p1, $next为 p2；
2. type 为 'next'，direction 为 'left'；
3. 给$next(即p2)添加 'next' 类，其样式为：
  ```css
  {
    position: absolute;
    top: 0;
    width: 100%;
    left: 0;
    transform: translate(100%, 0);
  }
  ```
  即在p1的右边展示，left为0，然后使用translate右移自身宽度
4. $next.offsetWidth 保证当前设置生效，以防浏览器做js操作dom进行一些优化
5. 给$active(即p1)添加 'left' 类, 其样式添加：
  ```css
  {
    left: 0;
    transform: translate(-100%, 0);
  }
  ```
  即左移自身宽度

6. 给 $next(即p2) 添加 'left' 类， 其样式由：
  ```css
  {
    left: 0;
    transform: translate(100%, 0);
  }
  ```
  被覆盖为：
  ```css
  {
    left: 0;
    transform: translate(0, 0);
  }
  ```
  即左移自身宽度
7. 这样就完成了图片由p1切换为p2，然后监听`transitionend`事件，移除 'next'、'left'、'right'等中间态的class, 给 $next(即p2) 添加 'active' 类，同时移除 $active(即p1)的 'active' 类

ps：里面涉及一个关键点，切换时通过js保证下一个要激活的图片通过绝对定位放在当前图片的左边或者右边（取决于上一张、还是下一张）。另外一个点就是 切换完成后需要将绝对定位切换成相对定位。
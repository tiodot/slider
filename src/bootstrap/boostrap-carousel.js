/**
 * @file bootstrap轮播图的实现
 */
/**
 * 
 * @param {Document.Node} element 原始的dom节点
 * @param {*} options 
 */

const utils = {
  hasClass(item, className) {
    return item.classList.contains(className);
  },
  addClass(item, className) {
    item.classList.add(className);
  },
  removeClass(item, className) {
    item.classList.remove(className);
  },
  event(name, data) {
    // https://developer.mozilla.org/zh-CN/docs/Web/Guide/Events/Creating_and_triggering_events
    return new CustomEvent(name, data);
  }
}

function Carousel (element, options) {
  this.$element = element;
  this.$indicators = this.$element.querySelectorAll(".carousel-indicators");
  this.options = options;
  this.paused = null;
  this.sliding = null;
  this.interval = null;
  this.$active = null;
  this.$items = null;
};

Carousel.VERSION = "3.3.7";

Carousel.TRANSITION_DURATION = 600;

Carousel.DEFAULTS = {
  interval: 5000,
  pause: "hover",
  wrap: true,
  keyboard: true
};

Carousel.prototype.cycle = function(e) {
  e || (this.paused = false);

  this.interval && clearInterval(this.interval);

  this.options.interval &&
    !this.paused &&
    (this.interval = setInterval(
      this.next.bind(this),
      this.options.interval
    ));

  return this;
};

Carousel.prototype.getItemIndex = function(item) {
  // parentElement is same as parentNode
  // but html tag has not a null parentElement while its parentNode is document
  this.$items = item.parentNode.querySelectorAll('.item');
  return [].indexOf.call(this.$items, item);
};

Carousel.prototype.getItemForDirection = function(direction, active) {
  var activeIndex = this.getItemIndex(active);
  var willWrap =
    (direction == "prev" && activeIndex === 0) ||
    (direction == "next" && activeIndex == this.$items.length - 1);
  if (willWrap && !this.options.wrap) return active;
  var delta = direction == "prev" ? -1 : 1;
  // 保证第一张轮播图也能滚动到最后一张
  var itemIndex = (activeIndex + delta + this.$items.length) % this.$items.length;
  return this.$items[itemIndex];
};

Carousel.prototype.to = function(pos) {
  var that = this;
  var activeIndex = this.getItemIndex(
    (this.$active = this.$element.querySelector(".item.active"))
  );

  if (pos > this.$items.length - 1 || pos < 0) return;

  if (this.sliding) {
    const handler = function() {
      that.to(pos);
      that.$element.removeEventListener('slid.bs.carousel', handler);
    };
    return this.$element.addEventListener("slid.bs.carousel", handler); // yes, "slid"
  }
  if (activeIndex == pos) return this.pause().cycle();

  return this.slide(pos > activeIndex ? "next" : "prev", this.$items[pos]);
};

Carousel.prototype.pause = function(e) {
  e || (this.paused = true);

  if (this.$element.querySelectorAll(".next, .prev").length) {
    this.$element.trigger('transitionend');
    this.cycle(true);
  }

  this.interval = clearInterval(this.interval);

  return this;
};

Carousel.prototype.next = function() {
  if (this.sliding) return;
  return this.slide("next");
};

Carousel.prototype.prev = function() {
  if (this.sliding) return;
  return this.slide("prev");
};

Carousel.prototype.slideIndicator = function ($next) {
  const nextIndex = this.getItemIndex($next);
  if (this.$indicators.length) {
    this.$indicators.forEach($indicator => {
      $indicator.querySelector('.active').classList.remove('active');
      $indicator.children[nextIndex].classList.add('active');
    });
  }
}

Carousel.prototype.slide = function(type, next) {
  var $active = this.$element.querySelector(".item.active");
  var $next = next || this.getItemForDirection(type, $active);
  var isCycling = this.interval;
  var direction = type == "next" ? "left" : "right";
  var that = this;

  if (utils.hasClass($next, "active")) return (this.sliding = false);
  
  var slideEvent = utils.event("slide.bs.carousel", {
    relatedTarget: $next,
    direction: direction
  });
  this.$element.dispatchEvent(slideEvent);

  this.sliding = true;

  isCycling && this.pause();

  this.slideIndicator($next);

  var slidEvent = utils.event("slid.bs.carousel", {
    relatedTarget: $next,
    direction: direction
  }); // yes, "slid"
  if (utils.hasClass(this.$element, 'slide')) {
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
        that.$element.dispatchEvent(slidEvent)
        $active.removeEventListener('transitionend', transitionHandler);
      }, 0)
    }
    $active.addEventListener('transitionend', transitionHandler);
  } else {
    utils.removeClass($active, 'active');
    utils.addClass($next, 'active');
    this.sliding = false
    this.$element.dispatchEvent(slidEvent)
  }
  isCycling && this.cycle();

  return this;
};

// document loaded then parse if there are carousel

window.addEventListener('load', () => {
  const item = document.querySelector('[data-ride="carousel"]');

  const options = Object.assign({}, Carousel.DEFAULTS, item.dataset);
  const instance = new Carousel(item, options);
  if (options.interval) {
    instance.cycle();
  }

  // data-slide-to
  document.addEventListener('click', (e) => {
    const $target = e.target;
    const data = $target.dataset;
    if (data.slideTo === undefined && data.slide === undefined) return;
    const slideIndex = data.slideTo;
    if (slideIndex) {
      instance.to(slideIndex);
    }
    if (data.slide) {
      instance[data.slide] && instance[data.slide]();
    }
    e.preventDefault();
  })
})
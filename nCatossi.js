(function($) {

  var self = $.nCatossi = new function(){};

  $.extend(self, {
    images: [],
    rate: 100,

    loadSettings: function(callback) {
      chrome.storage.local.get(['libraries', 'selectedLibrary', 'currentRate'], function(data) {
        var lib = data.selectedLibrary;
        self.images = (data.libraries && lib && data.libraries[lib]) || [];
        self.rate = data.currentRate !== undefined ? data.currentRate : 100;
        callback();
      });
    },

    randomImage: function() {
      return self.images[Math.floor(Math.random() * self.images.length)];
    },

    isReplaced: function(item) {
      return $.inArray($(item).attr('src'), self.images) !== -1;
    },

    shuffle: function(arr) {
      for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
      }
      return arr;
    },

    replaceImage: function($item) {
      var src = self.randomImage();
      if (!src) return;
      var h = $item.height();
      var w = $item.width();
      if (h > 0 && w > 0) {
        $item.css({ width: w + 'px', height: h + 'px' }).attr('src', src);
      } else {
        $item.one('load', function() {
          if (self.isReplaced($item)) return;
          var newSrc = self.randomImage();
          if (!newSrc) return;
          $item.css({ width: $item.width() + 'px', height: $item.height() + 'px' })
               .attr('src', newSrc);
        });
      }
    },

    handleImages: function(time) {
      self.loadSettings(function() {
        if (self.images.length) {
          var $imgs = $('img');
          var total = $imgs.length;
          var replaced = 0;
          var candidates = [];

          $imgs.each(function(_, item) {
            if (self.isReplaced(item)) {
              replaced++;
            } else {
              candidates.push(item);
            }
          });

          // Rate is a TARGET fraction of all images, not a per-pass chance.
          var target = Math.round(total * self.rate / 100);
          var need = target - replaced;

          if (need > 0 && candidates.length) {
            self.shuffle(candidates).slice(0, need).forEach(function(item) {
              self.replaceImage($(item));
            });
          }
        }

        if (time > 0) {
          setTimeout(function() { self.handleImages(time); }, time);
        }
      });
    },

    handleLogo: function(time) {
      self.loadSettings(function() {
        if (!self.images.length) return;
        var $logos = $('[class*=logo],[class*=header],[id*=header],[id*=logo],' +
          '[class*=logo] span,[class*=header] span,[id*=header] span,[id*=logo] span,' +
          '[class*=logo] h1,[class*=header] h1,[id*=header] h1,[id*=logo] h1,' +
          '[class*=logo] a,[class*=header] a,[id*=header] a,[id*=logo] a')
          .filter(function() {
            var bg = $(this).css('background-image');
            return bg && bg !== 'none';
          });

        var logoTotal = $logos.length;
        var logoReplaced = 0;
        var logoCandidates = [];

        $logos.each(function(_, item) {
          var bg = $(item).css('background-image') || '';
          if (self.images.some(function(src) { return bg.indexOf(src) !== -1; })) {
            logoReplaced++;
          } else {
            logoCandidates.push(item);
          }
        });

        var logoTarget = Math.round(logoTotal * self.rate / 100);
        var logoNeed = logoTarget - logoReplaced;

        if (logoNeed > 0 && logoCandidates.length) {
          self.shuffle(logoCandidates).slice(0, logoNeed).forEach(function(item) {
            $(item).css({
              'background-image': 'url(' + self.randomImage() + ')',
              'background-position': '0 0',
              'background-repeat': 'no-repeat',
              'background-size': 'contain'
            });
          });
        }

        if (time > 0) {
          setTimeout(function() { self.handleLogo(time); }, time);
        }
      });
    }
  });

  $(function() {
    self.handleImages(3000);
    self.handleLogo(3000);
  });

})(jQuery);
